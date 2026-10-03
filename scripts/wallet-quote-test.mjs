#!/usr/bin/env node
/** Exercise the shipped wallet receipt UI without network access or a real wallet. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../apps/web/public/v4/wallet.js', import.meta.url), 'utf8');
const clientSource = readFileSync(new URL('../apps/web/public/v4/client.js', import.meta.url), 'utf8');
const address = '0x' + 'a'.repeat(40);
const escrow = '0x' + 'e'.repeat(40);
const oldBond = '10000000000000000';
const newBond = '30000000000000000';
const transactionHash = '0x' + 'b'.repeat(64);

function harness({ quoteBond = newBond, failQuote = false, failRefresh = false, rejectWallet = false, paymentStatus = 'awaiting_wallet', chainId = 10143, walletChainId = chainId, unknownNetwork = false, rejectSwitch = false, stuckNetwork = false, pilotMode = false, gasEstimate = '0x186a0', failEstimate = false } = {}) {
  const elements = [];
  const createElement = tag => {
    const element = {
      tagName: tag.toUpperCase(), children: [], dataset: {}, attributes: {}, textContent: '', disabled: false,
      append(...children) { this.children.push(...children); },
      prepend(...children) { this.children.unshift(...children); },
      setAttribute(name, value) { this.attributes[name] = value; },
    };
    elements.push(element); return element;
  };
  const body = createElement('div'); body.id = 'receipt-body';
  const calls = [], walletCalls = [];
  let walletNetwork = '0x' + walletChainId.toString(16), knownNetwork = !unknownNetwork;
  let reloads = 0;
  const record = {
    id: 'example-introduction', revision: 1, role: 'sender', settlement: 'onchain',
    payment: { status: paymentStatus, attentionBond: oldBond, charged: paymentStatus === 'refunded', evaluationFee: '0' },
    chain: paymentStatus === 'refunded' ? { refund: { amount: oldBond } } : null,
  };
  const quote = {
    summary: { attentionBond: quoteBond, evaluationFee: '0', timeoutSeconds: 3600, expiresAt: 2000000000 },
    transaction: { chainId: '0x' + chainId.toString(16), from: address, to: escrow, data: '0x1234', value: '0x' + BigInt(quoteBond).toString(16) },
  };
  const window = {
    addEventListener() {},
    ethereum: { request: async request => {
      walletCalls.push(request);
      if (request.method === 'eth_requestAccounts') return [address];
      if (request.method === 'eth_chainId') return walletNetwork;
      if (request.method === 'wallet_switchEthereumChain') {
        if (rejectSwitch) throw Object.assign(new Error('Switch cancelled'), { code: 4001 });
        if (!knownNetwork) throw Object.assign(new Error('Unknown chain'), { code: 4902 });
        if (!stuckNetwork) walletNetwork = request.params[0].chainId;
        return null;
      }
      if (request.method === 'wallet_addEthereumChain') { knownNetwork = true; return null; }
      if (request.method === 'eth_estimateGas') {
        if (failEstimate) throw new Error('Estimate failed');
        return gasEstimate;
      }
      if (request.method === 'eth_sendTransaction') {
        if (rejectWallet) throw Object.assign(new Error('Rejected'), { code: 4001 });
        return transactionHash;
      }
      if (request.method === 'eth_getTransactionReceipt') return { status: '0x1' };
      throw new Error('Unexpected wallet call: ' + request.method);
    } },
  };
  // Load the real client helpers in sample mode, without fetching or mounting a header.
  vm.runInNewContext(clientSource, {
    window, URLSearchParams, location: { search: '?demo=1' },
    sessionStorage: { getItem: () => null, setItem() {} },
    document: { getElementById: () => null, querySelector: () => null },
  });
  const api = Object.assign(window.SignalPass, {
    ready: Promise.resolve(), live: true, demo: false,
    chain: {
      enabled: true, chainId, currency: chainId === 31337 ? 'DEV' : 'MON', local: chainId === 31337, pilotMode,
      name: chainId === 143 ? 'Monad Mainnet' : chainId === 31337 ? 'Local EVM' : 'Monad Testnet',
      walletRpcUrl: chainId === 143 ? 'https://rpc.monad.xyz' : 'https://testnet-rpc.monad.xyz',
      explorerUrl: chainId === 143 ? 'https://monadvision.com' : undefined,
    },
    me: { session: { address } },
    request: async (path, body) => {
      calls.push({ path, body });
      if (path.endsWith('/funding-quote')) {
        if (failQuote) throw new Error('Could not refresh the funding quote.');
        return quote;
      }
      if (path.endsWith('/funding')) return {};
      if (path === '/introductions/' + record.id) {
        if (failRefresh) throw new Error('Could not refresh the receipt.');
        return { introduction: { revision: 2 } };
      }
      throw new Error('Unexpected API call: ' + path);
    },
  });
  vm.runInNewContext(source, {
    window, document: { createElement, body: { dataset: { page: 'receipt' } }, getElementById: id => elements.find(element => element.id === id) },
    location: { reload: () => reloads++ }, setTimeout, clearTimeout, setInterval, clearInterval,
  });
  return {
    api, record, quote, calls, walletCalls,
    get reloads() { return reloads; },
    get fund() { return elements.find(element => element.id === 'fund-introduction'); },
    get feedback() { return elements.find(element => element.id === 'chain-feedback'); },
    get networkLabel() { return elements.find(element => element.className === 'v4-chain-eyebrow')?.textContent; },
    fact(label) {
      const facts = elements.find(element => element.tagName === 'DL');
      const index = facts.children.findIndex(element => element.tagName === 'DT' && element.textContent === label);
      return facts.children[index + 1]?.textContent;
    },
  };
}

test('refreshed bond matches receipt facts, record snapshot and wallet approval; no automatic payment', async () => {
  const ui = harness();
  await ui.api.chainReceipt(ui.record);
  assert.equal(ui.fact('Refundable bond'), '0.03 MON');
  assert.equal(ui.fund.textContent, 'Lock 0.03 MON in wallet');
  assert.equal(ui.record.payment.attentionBond, newBond);
  assert.equal(ui.record.payment.status, 'awaiting_wallet');
  assert.equal(ui.record.payment.charged, false);
  assert.equal(ui.record.revision, 2);
  assert.equal(ui.fund.disabled, false);
  assert.equal(ui.walletCalls.length, 0, 'loading a quote must never open the wallet');
  assert.equal(ui.calls.some(call => call.path.endsWith('/funding')), false);
  await ui.fund.onclick();
  const send = ui.walletCalls.find(call => call.method === 'eth_sendTransaction');
  assert.equal(send.params[0].value, ui.quote.transaction.value);
  assert.equal(BigInt(send.params[0].value).toString(), ui.record.payment.attentionBond);
  assert.equal(ui.calls.filter(call => call.path.endsWith('/funding')).length, 2);
  assert.equal(ui.fund.disabled, true);
  assert.equal(ui.reloads, 1);
});

test('an unchanged valid bond quote retains the same amount and needs explicit wallet approval', async () => {
  const ui = harness({ quoteBond: oldBond });
  await ui.api.chainReceipt(ui.record);
  assert.equal(ui.fact('Refundable bond'), '0.01 MON');
  assert.equal(ui.fund.textContent, 'Lock 0.01 MON in wallet');
  assert.equal(ui.record.payment.attentionBond, oldBond);
  assert.equal(ui.walletCalls.length, 0);
});

test('quote or receipt refresh failure keeps wallet approval disabled without submitting a payment', async () => {
  for (const failure of [{ failQuote: true }, { failRefresh: true }]) {
    const ui = harness(failure);
    await ui.api.chainReceipt(ui.record);
    assert.equal(ui.fund.disabled, true);
    assert.equal(ui.fund.textContent, 'Wallet bond unavailable');
    assert.match(ui.feedback.textContent, /Could not refresh/);
    assert.equal(ui.fact('Refundable bond'), failure.failQuote ? '0.01 MON' : '0.03 MON');
    assert.equal(ui.walletCalls.length, 0);
    assert.equal(ui.calls.some(call => call.path.endsWith('/funding')), false);
  }
});

test('wallet rejection preserves the reviewed amount and permits another explicit approval', async () => {
  const ui = harness({ rejectWallet: true });
  await ui.api.chainReceipt(ui.record);
  await ui.fund.onclick();
  assert.match(ui.feedback.textContent, /Wallet request cancelled/);
  assert.equal(ui.fund.disabled, false);
  assert.equal(ui.fact('Refundable bond'), '0.03 MON');
  assert.equal(ui.fund.textContent, 'Lock 0.03 MON in wallet');
  assert.equal(ui.api.walletBusy, false);
  assert.equal(ui.calls.some(call => call.path.endsWith('/funding')), false);
  assert.equal(ui.reloads, 0);
});

test('a refunded introduction shows its settled bond without requesting a new quote', async () => {
  const ui = harness({ paymentStatus: 'refunded' });
  await ui.api.chainReceipt(ui.record);
  assert.equal(ui.fact('Refundable bond'), '0.01 MON');
  assert.equal(ui.fact('Confirmed refund'), '0.01 MON');
  assert.equal(ui.fund, undefined);
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.walletCalls.length, 0);
});

test('mainnet pilot displays real MON and the exact quote before an explicit network switch and payment', async () => {
  const ui = harness({ chainId: 143, walletChainId: 10143, pilotMode: true, quoteBond: '75000000000000' });
  await ui.api.chainReceipt(ui.record);
  assert.equal(ui.networkLabel, 'Monad Mainnet · pilot · real MON');
  assert.equal(ui.fact('Refundable bond'), '0.000075 MON');
  assert.match(ui.fact('Network gas'), /Real MON/);
  assert.equal(ui.fund.textContent, 'Lock 0.000075 MON in wallet');
  assert.equal(ui.walletCalls.length, 0);
  await ui.fund.onclick();
  const switched = ui.walletCalls.find(call => call.method === 'wallet_switchEthereumChain');
  assert.equal(switched.params[0].chainId, '0x8f');
  const sent = ui.walletCalls.find(call => call.method === 'eth_sendTransaction');
  assert.equal(BigInt(sent.params[0].value), 75000000000000n);
  assert.equal(ui.reloads, 1);
});

test('an unconfigured wallet receives the API mainnet network metadata before payment', async () => {
  const ui = harness({ chainId: 143, walletChainId: 1, unknownNetwork: true });
  await ui.api.walletTransaction(ui.quote.transaction);
  const added = ui.walletCalls.find(call => call.method === 'wallet_addEthereumChain');
  assert.deepEqual(JSON.parse(JSON.stringify(added.params[0])), {
    chainId: '0x8f', chainName: 'Monad Mainnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: ['https://rpc.monad.xyz'], blockExplorerUrls: ['https://monadvision.com'],
  });
  assert.equal(ui.walletCalls.filter(call => call.method === 'wallet_switchEthereumChain').length, 2);
  assert.equal(ui.walletCalls.filter(call => call.method === 'eth_sendTransaction').length, 1);
  assert.equal(ui.api.chainLabel(), 'Monad Mainnet · real MON');
});

test('mainnet cannot send a testnet quote or continue after a rejected or ineffective network switch', async () => {
  const wrongQuote = harness({ chainId: 143 });
  await assert.rejects(wrongQuote.api.walletTransaction({ ...wrongQuote.quote.transaction, chainId: '0x279f' }), /does not match/);
  assert.equal(wrongQuote.walletCalls.some(call => call.method === 'eth_sendTransaction'), false);
  for (const option of [{ rejectSwitch: true }, { stuckNetwork: true }]) {
    const ui = harness({ chainId: 143, walletChainId: 10143, ...option });
    await assert.rejects(ui.api.walletTransaction(ui.quote.transaction), /Switch cancelled|Switch your wallet/);
    assert.equal(ui.walletCalls.some(call => call.method === 'eth_sendTransaction'), false);
  }
});

test('local DEV stays distinct from real MON and unsupported networks cannot submit', async () => {
  const local = harness({ chainId: 31337 });
  await local.api.chainReceipt(local.record);
  assert.equal(local.networkLabel, 'Local EVM · DEV');
  assert.equal(local.fact('Refundable bond'), '0.03 DEV');
  await local.api.walletTransaction(local.quote.transaction);
  const unsupported = harness({ chainId: 1 });
  await assert.rejects(unsupported.api.walletTransaction(unsupported.quote.transaction), /Unsupported/);
  assert.equal(unsupported.walletCalls.length, 0);
});

test('mainnet estimates the exact transaction after switching and supplies a 20% buffered gas limit', async () => {
  const ui = harness({ chainId: 143, walletChainId: 10143, gasEstimate: '0x186a1' }); // 100,001 gas
  await ui.api.walletTransaction(ui.quote.transaction);
  const estimation = ui.walletCalls.find(call => call.method === 'eth_estimateGas');
  const sent = ui.walletCalls.find(call => call.method === 'eth_sendTransaction');
  const { chainId, ...expected } = ui.quote.transaction;
  assert.deepEqual(JSON.parse(JSON.stringify(estimation.params[0])), expected);
  assert.deepEqual(JSON.parse(JSON.stringify(sent.params[0])), { ...expected, gas: '0x1d4c2' }); // 120,002 gas
  const methods = ui.walletCalls.map(call => call.method);
  assert(methods.lastIndexOf('eth_chainId') < methods.indexOf('eth_estimateGas'));
  assert(methods.indexOf('eth_estimateGas') < methods.indexOf('eth_sendTransaction'));
});

test('failed, invalid and excessively expensive mainnet estimates never reach the send request', async () => {
  for (const options of [{ failEstimate: true }, { gasEstimate: '0x0' }, { gasEstimate: '100000' }, { gasEstimate: null }, { gasEstimate: '0x17d7841' }]) {
    const ui = harness({ chainId: 143, ...options });
    await assert.rejects(ui.api.walletTransaction(ui.quote.transaction), /No transaction was sent/);
    assert.equal(ui.walletCalls.some(call => call.method === 'eth_sendTransaction'), false);
  }
});

test('the 30 million mainnet ceiling is inclusive and local/testnet keep their existing wallet gas behavior', async () => {
  const mainnet = harness({ chainId: 143, gasEstimate: '0x17d7840' }); // 25 million + 20% = 30 million
  await mainnet.api.walletTransaction(mainnet.quote.transaction);
  assert.equal(mainnet.walletCalls.find(call => call.method === 'eth_sendTransaction').params[0].gas, '0x1c9c380');
  for (const chainId of [31337, 10143]) {
    const ui = harness({ chainId, failEstimate: true });
    await ui.api.walletTransaction(ui.quote.transaction);
    assert.equal(ui.walletCalls.some(call => call.method === 'eth_estimateGas'), false);
    assert.equal(ui.walletCalls.find(call => call.method === 'eth_sendTransaction').params[0].gas, undefined);
  }
});
