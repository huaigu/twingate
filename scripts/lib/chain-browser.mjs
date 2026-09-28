import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { boot, healthy, available, viem } from './chain-fixture.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
export async function browserCheck({ chain, origin, base, users, processes }) {
  await available(3095);
  const web = boot('pnpm', ['--filter', '@signalpass/web', 'exec', 'next', 'dev', '-p', '3095'], { SIGNALPASS_API_ORIGIN: base, SIGNALPASS_NEXT_DIST: '.next-chain-test' });
  processes.push(web); await healthy(origin + '/api/health', web);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [], sent = []; mkdirSync('.run/chain-e2e', { recursive: true });
  try {
    const pages = [];
    for (const user of [users[0], users[2]]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      await context.exposeBinding('testWalletRequest', async (_source, { method, params }) => {
        if (method === 'personal_sign') return user.account.signMessage({ message: viem.hexToString(params[0]) });
        if (method === 'eth_sendTransaction') {
          const tx = params[0]; assert.equal(tx.from.toLowerCase(), user.account.address.toLowerCase());
          const hash = await user.wallet.sendTransaction({ chain: null, to: tx.to, data: tx.data, value: BigInt(tx.value) }); sent.push(hash); return hash;
        }
        if (method === 'eth_getTransactionReceipt') return chain.rpc(method, params);
        throw new Error('Unsupported test wallet method: ' + method);
      });
      await context.addInitScript(({ address }) => {
        let currentChain = '0x279f';
        window.ethereum = { request: async ({ method, params }) => {
          if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [address];
          if (method === 'eth_chainId') return currentChain;
          if (method === 'wallet_switchEthereumChain') { currentChain = params[0].chainId; return null; }
          if (method === 'eth_sendTransaction' && window.rejectNextWalletRequest) { window.rejectNextWalletRequest = false; const error = new Error('User rejected wallet request.'); error.code = 4001; throw error; }
          return window.testWalletRequest({ method, params });
        }, on() {} };
      }, { address: user.account.address });
      const page = await context.newPage(); page.setDefaultTimeout(25000); page.on('pageerror', e => errors.push(e.message));
      await page.goto(origin + '/agent', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
      await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor(); pages.push(page);
    }
    const [a, c] = pages;
    await c.locator('#local-test-balance').click();
    await c.locator('#sync-chain-profile').click(); await c.locator('#confirm-profile-sync').click();
    await c.waitForFunction(() => document.querySelector('#profile-chain-status')?.textContent.includes('confirmed on chain'));
    assert.equal(await c.evaluate(() => window.ethereum.request({ method: 'eth_chainId' })), '0x7a69');
    console.log('PASS: browser wallet network switch, profile registration and honest Local EVM labels');
    async function draft() {
      await a.goto(origin + '/introductions/new/eve', { waitUntil: 'networkidle' });
      const fields = ['I build contract simulation tools.', 'Your work on community tools overlaps with my project. I would like to compare our testing approaches and collaborate on a shared simulation harness for Monad developers.', 'Contract testing and product feedback.', 'A short call about a shared test suite.'];
      for (let i = 0; i < fields.length; i++) await a.locator('#intro-field-' + (i + 1)).fill(fields[i]);
      await a.locator('[data-action=approve-introduction]').click();
      await a.locator('[name=settlement][value=onchain]').check(); await a.locator('#dialog-confirm').click();
      await a.waitForURL('**/receipt'); await a.locator('#fund-introduction:enabled').waitFor();
      return a.url();
    }
    const first = await draft();
    assert.equal(await a.locator('#receipt-status').innerText(), 'Awaiting wallet payment');
    assert((await a.locator('#chain-receipt').innerText()).includes('0 · manual review'));
    const count = sent.length;
    await a.evaluate(() => { window.rejectNextWalletRequest = true; }); await a.locator('#fund-introduction').click();
    await a.waitForFunction(() => document.querySelector('#chain-feedback')?.textContent.includes('cancelled'));
    assert.equal(sent.length, count);
    const fund = async () => { await a.locator('#fund-introduction').click(); await a.waitForFunction(() => document.querySelector('#chain-receipt h2')?.textContent === 'A hello, backed by a bond.'); };
    await fund();
    const id = new URL(first).pathname.split('/')[2];
    await c.goto(origin + '/inbox/' + id, { waitUntil: 'networkidle' });
    assert((await c.locator('.v4-result-message').innerText()).includes('Bond locked'));
    await c.locator('[data-action=ask-context]').click(); await c.locator('#context-question').fill('What should we build first?'); await c.getByRole('button', { name: 'Save context request', exact: true }).click();
    await a.reload({ waitUntil: 'networkidle' }); await a.locator('#reply-context').fill('A shared test suite for community contracts.');
    await a.getByRole('button', { name: 'Approve and add context', exact: true }).click();
    await a.waitForFunction(() => document.querySelector('#receipt-status')?.textContent === 'Awaiting a response');
    await c.reload({ waitUntil: 'networkidle' }); await c.locator('[data-action=accept-introduction]').click(); await c.locator('#dialog-confirm').click();
    await c.waitForFunction(() => window.SignalPass?.inbox?.some(r => r.status === 'accepted' && r.payment?.status === 'refunded'));
    await a.reload({ waitUntil: 'networkidle' }); assert.equal(await a.locator('#chain-receipt h2').innerText(), 'Your attention bond is back.');
    console.log('PASS: wallet cancellation sends nothing; real bond lock, context exchange, acceptance and refund in two browsers');
    for (const width of [1440, 390]) {
      await a.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      assert(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Receipt overflow at ' + width);
      assert.deepEqual(await a.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src)), []);
      await a.screenshot({ path: '.run/chain-e2e/refund-' + width + '.png', fullPage: true });
    }
    await a.setViewportSize({ width: 1440, height: 1000 });
    const second = await draft(); await fund();
    await c.goto(origin + '/inbox/' + new URL(second).pathname.split('/')[2], { waitUntil: 'networkidle' });
    await c.locator('[data-action=decline-introduction]').click(); await c.locator('#dialog-confirm').click();
    await c.waitForFunction(() => window.SignalPass?.inbox?.some(r => r.status === 'declined' && r.payment?.status === 'refunded'));
    await draft(); await fund(); await chain.rpc('evm_increaseTime', [65]); await chain.rpc('evm_mine', []);
    // Browser countdown uses wall time; the test advances only the chain clock.
    await a.evaluate(async () => {
      const id = location.pathname.split('/')[2];
      const record = (await window.SignalPass.request('/introductions/' + id)).introduction;
      const afterDeadline = record.chain.expiresAt * 1000 + 1000;
      Date.now = () => afterDeadline;
    });
    await a.locator('#claim-bond:enabled').waitFor(); await a.locator('#claim-bond').click();
    await a.waitForFunction(() => document.querySelector('#receipt-status')?.textContent === 'Expired · bond returned');
    assert.equal(await a.locator('#chain-receipt h2').innerText(), 'Your attention bond is back.');
    assert.deepEqual(errors, []);
    console.log('PASS: browser decline and expiry claims refund; desktop/mobile layout, assets and JavaScript checks pass');
  } finally { await browser.close(); }
}
