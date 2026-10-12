#!/usr/bin/env node
// Exercise the shipped composer with mocked API and wallet calls. No live send,
// sign-in, AI inference, or transaction is performed.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.SIGNALPASS_QA_BASE;
if (!base) throw new Error('Set SIGNALPASS_QA_BASE to the staged server URL.');
const out = process.env.SIGNALPASS_QA_OUTPUT;
if (out) await mkdir(out, { recursive: true });
const address = '0x' + 'a'.repeat(40);
const profile = { name: 'Alice Example', bio: 'Building a wallet prototype.', interests: 'Wallet UX', offer: 'Prototype feedback.', meet: 'Usability reviewers.' };
const recipient = { owner: '0x' + 'b'.repeat(40), handle: 'bob-example', displayName: 'Bob Example', avatar: 'rohan', building: 'Wallet usability reviews', interests: ['Wallet UX'], canOffer: 'Usability feedback', wantsToMeet: 'Wallet builders' };
const result = { startedAt: new Date().toISOString(), base, checks: [], failures: [], scope: 'Mocked API and wallet; no live mutations or hosted AI calls.' };
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
async function scenario(name, { width = 1280, chain = true, chooseBond = false, cancelBond = false, retry = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage(), calls = [], walletCalls = [], errors = [], unexpected = [];
  page.setDefaultTimeout(15000);
  await context.exposeBinding('testWalletRequest', (_source, request) => { walletCalls.push(request.method); throw new Error('Unexpected wallet request'); });
  await context.addInitScript(() => { window.ethereum = { on() {}, request: request => window.testWalletRequest(request) }; });
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== new URL(base).origin) return route.abort();
    // Stop at the navigation boundary; the receipt's separate payment flow is unchanged.
    if (url.pathname.endsWith('/receipt')) return route.fulfill({ contentType: 'text/html', body: '<h1>Fixture receipt</h1>' });
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const p = url.pathname;
    let data, status = 200;
    if (p === '/api/chain/config') data = { enabled: chain, chainId: 143, name: 'Monad Mainnet', pilotMode: true };
    else if (p === '/api/me') data = { session: { address, csrf: 'test-csrf' }, profile: { handle: 'alice-example', displayName: profile.name }, settings: { version: 1, profile, sourceLinks: {}, agent: { visibility: 'public', matching: true, sources: [], interests: ['Wallet UX'] } } };
    else if (p === '/api/profiles') data = { profiles: [recipient] };
    else if (p === '/api/introductions' && request.method() === 'POST') {
      const body = request.postDataJSON(); calls.push(body);
      if (retry && calls.length === 1) { status = 503; data = { error: 'service_unavailable' }; }
      else data = { introduction: { id: body.idempotencyKey, revision: 1, role: 'sender', recipientName: recipient.displayName, recipientHandle: recipient.handle, senderName: profile.name, intent: body.intent, createdAt: Math.floor(Date.now() / 1000), state: 'submitted', settlement: body.settlement, payment: { status: body.settlement === 'offchain' ? 'not_requested' : 'awaiting_funding' } } };
    } else { unexpected.push(p); status = 500; data = { error: 'unexpected_test_request' }; }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  try {
    await page.goto(base + '/introductions/new/bob-example?demo=0', { waitUntil: 'domcontentloaded' });
    const review = page.locator('[data-action="approve-introduction"]');
    await review.click();
    const offchain = page.locator('input[name="settlement"][value="offchain"]');
    const onchain = page.locator('input[name="settlement"][value="onchain"]');
    if (chain) {
      assert.equal(await offchain.isChecked(), true, 'No-payment option must be the default');
      assert.equal(await onchain.isChecked(), false, 'Bond must require opt-in');
      assert.equal(await page.locator('input[name="settlement"]').first().inputValue(), 'offchain');
      if (chooseBond || cancelBond) await onchain.check();
      if (cancelBond) {
        await page.locator('#app-dialog [data-close-dialog]').click();
        assert.equal(calls.length, 0, 'Cancel cannot send');
        await review.click();
        assert.equal(await offchain.isChecked(), true, 'Reopened review starts without a bond');
      }
    } else assert.equal(await offchain.count(), 0);
    assert.equal(calls.length, 0, 'Review must not send');
    assert.deepEqual(walletCalls, [], 'Review must not touch wallet');
    const geometry = await page.locator('#app-dialog').evaluate(el => ({ left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert(geometry.left >= -1 && geometry.right <= width + 1 && geometry.scroll <= width + 1, 'Review fits viewport');
    if (out && !chooseBond && !cancelBond && !retry && chain) await page.screenshot({ path: resolve(out, 'no-bond-review-' + width + '.png'), fullPage: true });
    await page.locator('#dialog-confirm').click();
    if (retry) {
      await page.waitForFunction(() => !document.querySelector('#dialog-confirm').disabled);
      assert.equal(await offchain.isChecked(), true, 'Failure preserves no-bond choice');
      await page.locator('#dialog-confirm').click();
    }
    await page.waitForURL('**/receipt');
    assert.equal(calls.length, retry ? 2 : 1);
    assert(calls.every(call => call.settlement === (chooseBond ? 'onchain' : 'offchain')));
    if (retry) assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
    assert.deepEqual(walletCalls, [], 'Send review never requests a signature or transaction');
    assert.deepEqual(unexpected, []);
    assert.deepEqual(errors, []);
    result.checks.push(name); console.log('PASS ' + name);
  } catch (error) { result.failures.push({ name, error: error.message }); console.log('FAIL ' + name + ': ' + error.message); }
  finally { await context.close(); }
}
try {
  await scenario('Default no-bond review and delivery at desktop');
  await scenario('Default no-bond review and delivery at 390px', { width: 390 });
  await scenario('Explicit optional bond selection remains available', { chooseBond: true });
  await scenario('Cancelled bond choice resets to no bond on new review', { cancelBond: true });
  await scenario('Failed send retries without switching to a bond', { retry: true });
  await scenario('Deployment with bonds disabled still sends without payment', { chain: false });
} finally { await browser.close(); }
result.finishedAt = new Date().toISOString();
if (out) await writeFile(resolve(out, 'report.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ passed: result.checks.length, failed: result.failures.length }));
if (result.failures.length) process.exitCode = 1;
