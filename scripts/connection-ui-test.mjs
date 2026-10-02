#!/usr/bin/env node
/** Production receipt UI with route-mocked API responses. No real contact is shared,
 * wallet signed, external page opened, message sent, model called, or payment made.
 * Run: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/connection-ui-test.mjs
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'apps/web/public');
const output = process.env.CONNECTION_QA_DIR || path.join(root, '.run/connection-ui-qa');
const id = '0x' + 'a'.repeat(64), address = '0x' + 'b'.repeat(40);
const receiptPath = '/introductions/' + id + '/receipt', endpoint = '/introductions/' + id + '/connection';
const time = Math.floor(Date.now() / 1000);
const makeRecord = () => ({ id, revision: 1, role: 'sender', senderName: 'Alice Example', recipientName: 'Bob Example', recipientHandle: 'bob-example', state: 'accepted', settlement: 'offchain', createdAt: time, sharedProfile: null, question: null, reply: null, intent: { whoAmI: 'I build developer tools.', whyYou: 'Your contract testing work fits my project.', whatIOffer: 'Prototype feedback.', nextStep: 'Compare our testing approaches.' }, payment: { status: 'not_requested' } });
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const target = pathname.endsWith('/receipt') ? '/v4/receipt.html' : pathname;
  const file = path.resolve(publicRoot, '.' + target);
  if (!file.startsWith(publicRoot + path.sep)) return res.writeHead(403).end();
  try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
await mkdir(output, { recursive: true });
let browser;
let passed = 0;

async function scenario(name, options, run) {
  const context = await browser.newContext({ viewport: { width: options.width || 1440, height: options.width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage(), errors = [], unexpected = [], calls = [], walletCalls = [];
  page.setDefaultTimeout(15000);
  const fixture = { record: makeRecord(), ownContact: null, otherContact: null, ...options };
  await context.exposeBinding('fixtureWallet', (_source, request) => {
    walletCalls.push(request.method);
    if (request.method === 'eth_requestAccounts') return [address];
    if (request.method === 'eth_chainId') return '0x279f';
    if (request.method === 'personal_sign') return '0x' + '1'.repeat(130);
    throw new Error('Unexpected fixture wallet call');
  });
  await context.addInitScript(() => { window.ethereum = { request: request => window.fixtureWallet(request), on() {} }; });
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== origin) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const apiPath = url.pathname.slice(4), body = request.postDataJSON();
    calls.push({ path: apiPath, method: request.method(), body, headers: request.headers() });
    let status = 200, data;
    if (apiPath === '/chain/config') data = { enabled: false };
    else if (apiPath === '/me') { status = fixture.guest ? 401 : 200; data = fixture.guest ? { error: 'authentication_required' } : { session: { address, csrf: 'connection-test-csrf' }, profile: { handle: 'alice-example', displayName: 'Alice Example' }, settings: { sourceLinks: { contact: 'https://private.example/never-autofill' } } }; }
    else if (apiPath === '/profiles') data = { profiles: [] };
    else if (apiPath === '/auth/challenge') data = { nonce: 'fixture-nonce', message: 'Fixture sign-in only' };
    else if (apiPath === '/auth/verify') { fixture.guest = false; data = { session: { address, csrf: 'connection-test-csrf' } }; }
    else if (apiPath === '/introductions/' + id) { status = fixture.guest ? 401 : fixture.stranger ? 404 : 200; data = status === 200 ? { introduction: fixture.record } : { error: fixture.guest ? 'authentication_required' : 'introduction_not_found' }; }
    else if (apiPath === endpoint || apiPath === endpoint + '/remove') {
      if (fixture.contactStatus) { status = fixture.contactStatus; data = { error: status === 401 ? 'authentication_required' : status === 404 ? 'introduction_not_found' : 'introduction_not_accepted' }; }
      else if (request.method() === 'GET' && fixture.readFailure) { status = 503; data = { error: 'service_unavailable' }; }
      else if (request.method() === 'POST' && fixture.writeFailure) { status = 503; data = { error: 'service_unavailable' }; }
      else {
        if (request.method() === 'POST') {
          if (fixture.holdWrite) await fixture.holdWrite;
          fixture.ownContact = apiPath.endsWith('/remove') ? null : { ...body, updatedAt: time };
        }
        data = { connection: { introductionId: id, ownContact: fixture.ownContact, otherContact: fixture.otherContact } };
      }
    } else { unexpected.push(apiPath); status = 500; data = { error: 'unexpected_fixture_request' }; }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  try {
    console.log('RUN', name);
    await page.goto(origin + receiptPath);
    await page.waitForFunction(() => document.querySelector('#receipt-description')?.textContent !== 'Loading your introduction…');
    if (!fixture.guest && !fixture.stranger && fixture.record.state === 'accepted') await page.waitForFunction(() => document.querySelector('#connection-panel')?.getAttribute('aria-busy') === 'false' || !document.querySelector('#receipt-access')?.hidden);
    await run({ page, context, fixture, calls, walletCalls });
    assert.deepEqual(errors, [], name + ': runtime errors'); assert.deepEqual(unexpected, [], name + ': unexpected requests');
    passed++; console.log('PASS', name);
  } finally { await context.close(); }
}
const writes = calls => calls.filter(call => call.path.startsWith(endpoint) && call.method === 'POST');
async function edit(page, contact) {
  await page.locator('#connection-edit').click();
  await page.locator('#connection-type').selectOption(contact.type);
  await page.locator('#connection-label').fill(contact.label);
  await page.locator('#connection-value').fill(contact.value);
  await page.locator('#connection-review').click();
}
async function geometry(page, width) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Receipt overflow at ' + width);
}
try {
  browser = await chromium.launch({ timeout: 20000, headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-webgl'] } : {}) });
  await scenario('accepted participant reviews exact audience and contact before one explicit share', {}, async ({ page, calls, fixture }) => {
    assert.equal(writes(calls).length, 0);
    assert.match(await page.locator('#connection-intro').innerText(), /Bob Example/);
    await page.locator('#connection-edit').click();
    assert.equal(await page.locator('#connection-value').inputValue(), '', 'Never prefill private source settings');
    await page.locator('#connection-cancel').click();
    const contact = { type: 'email', label: 'My work email', value: 'alice@example.com' };
    await edit(page, contact);
    assert.match(await page.locator('#connection-audience').innerText(), /you and Bob Example/);
    assert.equal(await page.locator('#connection-preview-value').innerText(), contact.value);
    assert.equal(await page.locator('#connection-preview-label').innerText(), contact.label);
    assert.equal(writes(calls).length, 0, 'Review must not write');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'contact-review-1440.png'), fullPage: true });
    await page.locator('#connection-share').click();
    await page.waitForFunction(() => document.querySelector('#connection-own')?.textContent.includes('alice@example.com'));
    assert.deepEqual(writes(calls).map(call => call.body), [contact]);
    assert.equal(writes(calls)[0].headers['x-signalpass-csrf'], 'connection-test-csrf');
    assert.equal(page.url(), origin + receiptPath);
    await geometry(page, 1440);
    await page.evaluate(() => window.scrollTo(0, 0));
    assert(await page.locator('.skip-link').evaluate(el => el.getBoundingClientRect().bottom <= 0), 'Skip link is offscreen unless keyboard-focused');
    await page.screenshot({ path: path.join(output, 'accepted-contact-1440.png'), fullPage: true });
    fixture.record.revision = 2;
    await page.locator('#connection-edit').click();
    await page.locator('#connection-value').fill('unsaved@example.com');
    await page.locator('#connection-title').click();
    const receiptReads = calls.filter(call => call.path === '/introductions/' + id).length;
    await page.waitForTimeout(5300);
    assert.equal(await page.locator('#connection-value').inputValue(), 'unsaved@example.com', 'Polling must preserve blurred unsaved edits');
    assert.equal(calls.filter(call => call.path === '/introductions/' + id).length, receiptReads);
  });
  await scenario('other participant contact is opt-in, safely rendered, and mobile does not overflow', { width: 390, record: { ...makeRecord(), role: 'recipient' }, otherContact: { type: 'scheduling_url', label: '<img src=x onerror=alert(1)>', value: 'https://example.com/calendar?topic=Monad', updatedAt: time } }, async ({ page, calls, context }) => {
    assert.match(await page.locator('#connection-audience').textContent(), /Alice Example/);
    assert.equal(await page.locator('#connection-other img').count(), 0);
    assert.match(await page.locator('#connection-other').innerText(), /<img src=x onerror=alert\(1\)>/);
    const link = page.locator('#connection-other-link');
    assert.equal(await link.getAttribute('href'), 'https://example.com/calendar?topic=Monad');
    assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.equal(writes(calls).length, 0); assert.equal(context.pages().length, 1);
    await geometry(page, 390);
    await page.screenshot({ path: path.join(output, 'accepted-contact-390.png'), fullPage: true });
  });
  await scenario('unsafe contact URLs never become links; malformed input cannot reach review or share', { otherContact: { type: 'contact_url', label: 'Unsafe fixture', value: 'javascript:alert(1)', updatedAt: time } }, async ({ page, calls }) => {
    assert.equal(await page.locator('#connection-other-link').count(), 0);
    for (const value of ['http://example.com/contact', 'https://name:password@example.com/contact', 'https://example.com/%0aheader', 'https://example.com/%C2%85', 'https://example.com/%E2%80%8B']) {
      await edit(page, { type: 'contact_url', label: 'My contact page', value });
      assert.equal(await page.locator('#connection-preview').isVisible(), false);
      assert.match(await page.locator('#connection-form-error').innerText(), /valid email address or HTTPS/);
      await page.locator('#connection-cancel').click();
    }
    await edit(page, { type: 'contact_url', label: 'Contact page', value: 'https://example.com/%E6%8B%9B%E5%91%BC' });
    assert.equal(await page.locator('#connection-preview').isVisible(), true, 'Valid UTF-8 URL paths can be reviewed');
    assert.equal(await page.locator('#connection-preview-value').innerText(), 'https://example.com/%E6%8B%9B%E5%91%BC');
    assert.equal(writes(calls).length, 0);
  });
  await scenario('pending share disables duplicates; own removal is explicit and preserves their contact', { otherContact: { type: 'email', label: 'Work', value: 'bob@example.com', updatedAt: time } }, async ({ page, fixture, calls }) => {
    let release; fixture.holdWrite = new Promise(resolve => { release = resolve; });
    await edit(page, { type: 'contact_url', label: 'Contact me here', value: 'https://example.com/contact' });
    await page.locator('#connection-share').click();
    await page.waitForFunction(() => document.querySelector('#connection-share').disabled);
    assert.equal(writes(calls).length, 1);
    release(); fixture.holdWrite = null;
    await page.waitForFunction(() => document.querySelector('#connection-own')?.textContent.includes('https://example.com/contact'));
    await page.locator('#connection-remove').click();
    await page.waitForFunction(() => document.querySelector('#connection-own')?.textContent.includes('not shared'));
    assert.equal(fixture.ownContact, null); assert.equal(fixture.otherContact.value, 'bob@example.com');
    assert.equal(await page.locator('#connection-other-link').getAttribute('href'), 'mailto:bob%40example.com');
    assert.equal(writes(calls).filter(call => call.path.endsWith('/remove')).length, 1);
  });
  await scenario('read and write failures expose explicit retry; refresh clears stale links', { readFailure: true }, async ({ page, fixture, calls }) => {
    assert.match(await page.locator('#connection-feedback').innerText(), /Could not check/);
    fixture.readFailure = false;
    await page.locator('#connection-refresh').click();
    await page.locator('#connection-edit').waitFor({ state: 'visible' });
    await edit(page, { type: 'scheduling_url', label: 'Book a short call', value: 'https://example.com/calendar' });
    fixture.writeFailure = true;
    await page.locator('#connection-share').click();
    await page.waitForFunction(() => document.querySelector('#connection-share-error')?.textContent.includes('could not confirm'));
    assert.equal(writes(calls).length, 1);
    fixture.writeFailure = false;
    await page.locator('#connection-share').click();
    await page.waitForFunction(() => document.querySelector('#connection-own')?.textContent.includes('https://example.com/calendar'));
    assert.equal(writes(calls).length, 2);
    fixture.otherContact = { type: 'contact_url', label: 'Public contact', value: 'https://example.com/bob', updatedAt: time };
    await page.locator('#connection-refresh').click();
    await page.locator('#connection-other-link').waitFor();
    fixture.readFailure = true;
    await page.locator('#connection-refresh').click();
    await page.waitForFunction(() => document.querySelector('#connection-feedback')?.textContent.includes('Could not check'));
    assert.equal(await page.locator('#connection-other-link').count(), 0);
  });
  for (const state of ['submitted', 'declined']) await scenario(state + ' has no contact exchange UI or contact requests', { record: { ...makeRecord(), state } }, async ({ page, calls }) => {
    assert.equal(await page.locator('#connection-panel').count(), 0);
    assert.equal(calls.some(call => call.path.startsWith(endpoint)), false);
  });
  await scenario('signed-out receipt connects in place without disclosing contact before sign-in', { guest: true }, async ({ page, calls, walletCalls }) => {
    assert.equal(await page.locator('#receipt-body').isVisible(), false);
    assert.equal(calls.some(call => call.path.startsWith(endpoint)), false);
    assert.match(await page.locator('#receipt-description').innerText(), /same receipt/);
    await page.locator('#receipt-reconnect').click();
    await page.locator('#connection-edit').waitFor();
    assert.equal(page.url(), origin + receiptPath);
    assert.deepEqual(walletCalls, ['eth_requestAccounts', 'eth_chainId', 'personal_sign']);
    assert.equal(writes(calls).length, 0);
  });
  await scenario('unrelated account cannot see receipt or contact UI', { stranger: true }, async ({ page, calls }) => {
    assert.equal(await page.locator('#receipt-body').isVisible(), false);
    assert.equal(await page.locator('#connection-panel').count(), 0);
    assert.equal(calls.some(call => call.path.startsWith(endpoint)), false);
    assert.match(await page.locator('#receipt-title').innerText(), /not available to this account/);
  });
  await scenario('session expiry clears private contact details and offers reconnect', { otherContact: { type: 'email', label: 'Work', value: 'bob@example.com', updatedAt: time } }, async ({ page, fixture }) => {
    assert.equal(await page.locator('#connection-other-link').count(), 1);
    fixture.contactStatus = 401;
    await page.locator('#connection-refresh').click();
    await page.locator('#receipt-reconnect').waitFor();
    assert.equal(await page.locator('#receipt-body').isVisible(), false);
    assert.equal(await page.locator('#connection-other-link').count(), 0);
    assert.equal(await page.locator('#receipt-reconnect').innerText(), 'Connect wallet to continue');
  });
  console.log(`${passed} contact-sharing UI scenarios passed. API responses were fixtures; no real share or external communication occurred.`);
} finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
