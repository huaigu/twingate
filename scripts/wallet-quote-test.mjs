#!/usr/bin/env node
/** Exercise the shipped wallet receipt UI without network access or a real wallet. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../apps/web/public/v4/wallet.js', import.meta.url), 'utf8');
const address = '0x' + 'a'.repeat(40);
const escrow = '0x' + 'e'.repeat(40);
const oldBond = '10000000000000000';
const newBond = '30000000000000000';
const transactionHash = '0x' + 'b'.repeat(64);

function harness({ quoteBond = newBond, failQuote = false, failRefresh = false, rejectWallet = false, paymentStatus = 'awaiting_wallet' } = {}) {
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
  let reloads = 0;
  const record = {
    id: 'example-introduction', revision: 1, role: 'sender', settlement: 'onchain',
    payment: { status: paymentStatus, attentionBond: oldBond, charged: paymentStatus === 'refunded', evaluationFee: '0' },
    chain: paymentStatus === 'refunded' ? { refund: { amount: oldBond } } : null,
  };
  const quote = {
    summary: { attentionBond: quoteBond, evaluationFee: '0', timeoutSeconds: 3600, expiresAt: 2000000000 },
    transaction: { chainId: '0x279f', from: address, to: escrow, data: '0x1234', value: '0x' + BigInt(quoteBond).toString(16) },
  };
  const api = {
    ready: Promise.resolve(), live: true, demo: false,
    chain: { enabled: true, chainId: 10143, currency: 'MON', name: 'Monad Testnet' },
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
  };
  const window = {
    SignalPass: api, addEventListener() {},
    ethereum: { request: async request => {
      walletCalls.push(request);
      if (request.method === 'eth_requestAccounts') return [address];
      if (request.method === 'eth_chainId') return '0x279f';
      if (request.method === 'eth_sendTransaction') {
        if (rejectWallet) throw Object.assign(new Error('Rejected'), { code: 4001 });
        return transactionHash;
      }
      if (request.method === 'eth_getTransactionReceipt') return { status: '0x1' };
      throw new Error('Unexpected wallet call: ' + request.method);
    } },
  };
  vm.runInNewContext(source, {
    window, document: { createElement, body: { dataset: { page: 'receipt' } }, getElementById: id => elements.find(element => element.id === id) },
    location: { reload: () => reloads++ }, setTimeout, clearTimeout, setInterval, clearInterval,
  });
  return {
    api, record, quote, calls, walletCalls,
    get reloads() { return reloads; },
    get fund() { return elements.find(element => element.id === 'fund-introduction'); },
    get feedback() { return elements.find(element => element.id === 'chain-feedback'); },
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
