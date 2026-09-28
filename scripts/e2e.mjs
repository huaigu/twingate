#!/usr/bin/env node
/** Real HTTP + V4 + SQLite. Wallet keys below are deterministic TEST identities only. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const apiRequire = createRequire(new URL('../services/api/package.json', import.meta.url));
const { chromium } = require('playwright');
const { privateKeyToAccount } = apiRequire('viem/accounts');
const { hexToString } = apiRequire('viem');
const API_PORT = Number(process.env.E2E_API_PORT || 8797);
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 3094);
const origin = 'http://localhost:' + WEB_PORT;
const dir = mkdtempSync(join(tmpdir(), 'signalpass-live-e2e-'));
const screenshots = process.env.E2E_SCREENSHOTS || '.run/live-e2e';
mkdirSync(screenshots, { recursive: true });
const processes = [];
const errors = [];
let browser;
function boot(args, env) {
  const child = spawn('pnpm', args, { env: { ...process.env, ...env }, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  child.logs = '';
  child.stdout.on('data', (s) => { child.logs += s; }); child.stderr.on('data', (s) => { child.logs += s; });
  processes.push(child); return child;
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  try { process.platform === 'win32' ? child.kill('SIGTERM') : process.kill(-child.pid, 'SIGTERM'); } catch {}
  for (let i = 0; i < 40 && child.exitCode === null; i++) await delay(100);
}
async function health(url, child) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    if (child.exitCode !== null) throw new Error(child.logs);
    await delay(300);
  }
  throw new Error('Server did not start: ' + child.logs);
}
const apiEnv = { API_PORT: String(API_PORT), APP_ORIGIN: origin, SIGNALPASS_DB_PATH: join(dir, 'app.sqlite'), EVALUATOR_URL: '' };
const createProfile = (handle) => ({ handle, profile: { name: handle === 'bob' ? 'Bob Builder' : 'Eve Builder', bio: 'Building tools for Monad communities.', interests: 'Monad, developer tooling', offer: 'Infrastructure and contract testing.', meet: 'Builders working on useful tools.' }, agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad', 'developer tooling'] }, sourceLinks: {}, avatar: 'rohan' });
try {
  let api = boot(['--filter', '@signalpass/api', 'start'], apiEnv);
  await health('http://127.0.0.1:' + API_PORT + '/health', api);
  const web = boot(['--filter', '@signalpass/web', 'exec', 'next', 'dev', '-p', String(WEB_PORT)], { SIGNALPASS_API_ORIGIN: 'http://127.0.0.1:' + API_PORT });
  await health(origin + '/api/health', web);
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const pages = [];
  for (let i = 1; i <= 3; i++) {
    const account = privateKeyToAccount('0x' + i.toString(16).padStart(64, '0'));
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await context.exposeBinding('signTestLogin', async (_source, message) => account.signMessage({ message: hexToString(message) }));
    // Only the test browser has this EIP-1193 provider. The API still verifies real signatures.
    await context.addInitScript(({ address }) => {
      window.ethereum = { request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') return [address];
        if (method === 'eth_chainId') return '0x279f';
        if (method === 'personal_sign') return window.signTestLogin(params[0]);
        throw new Error('Unsupported test wallet method');
      }, on() {} };
    }, { address: account.address });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin + '/profile/import', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
    assert(!(await page.evaluate(() => document.cookie)).includes('signalpass_session'));
    pages.push(page);
  }
  const [a, b, c] = pages;
  for (const [page, handle] of [[b, 'bob'], [c, 'eve']]) await page.evaluate(async (input) => { await window.SignalPass.ready; await window.SignalPass.request('/me/profile', input); }, createProfile(handle));
  console.log('PASS: three independent wallet signatures and HttpOnly sessions');
  for (const [section, fields] of [['profile', { name: 'Alice Builder', bio: 'Building Monad simulation tools.' }], ['interests', { interests: 'Monad, developer tooling' }], ['offer', { offer: 'Simulation tools and product feedback.' }], ['meet', { meet: 'Protocol and community builders.' }]]) {
    await a.locator('[data-edit=' + section + ']').click();
    for (const [key, value] of Object.entries(fields)) await a.locator('#edit-' + key).fill(value);
    await a.getByRole('button', { name: 'Save changes', exact: true }).click();
  }
  await a.locator('[data-action=review-draft]').click(); await a.locator('[data-action=approve-profile]').click();
  await a.locator('#account-handle').fill('alice'); await a.getByRole('button', { name: 'Save profile', exact: true }).click();
  await a.waitForURL('**/agent');
  await a.locator('[name=visibility][value=public]').check(); await a.locator('[data-action=save-agent]').click();
  await a.getByRole('link', { name: 'Discover people →', exact: true }).click();
  await a.waitForURL('**/discover'); await a.locator('[data-person=bob]').click();
  await a.getByRole('link', { name: 'Draft an introduction', exact: false }).click();
  await a.waitForURL('**/introductions/new/bob');
  await a.locator('#intro-field-1').fill('I build a simulation harness for Monad builders.');
  await a.locator('[data-action=approve-introduction]').click(); await a.locator('#dialog-confirm').click();
  await a.waitForURL('**/receipt'); await a.locator('#receipt-body').waitFor();
  const receipt = a.url(); const id = new URL(receipt).pathname.split('/')[2];
  assert.equal(await a.locator('#receipt-status').innerText(), 'Awaiting a response');
  console.log('PASS: profile approval and live introduction from the default V4 route');
  await b.goto(origin + '/inbox/' + id, { waitUntil: 'networkidle' });
  assert((await b.locator('.v4-result-message').innerText()).includes('simulation harness'));
  await c.goto(receipt, { waitUntil: 'networkidle' });
  assert.equal(await c.locator('#receipt-body').isVisible(), false);
  assert((await c.locator('#receipt-title').innerText()).includes('not available'));
  const forged = await a.evaluate(async (id) => { try { await window.SignalPass.request('/introductions/' + id + '/transition', { actor: 'recipient', to: 'accepted', revision: 1 }); return 200; } catch (e) { return e.status; } }, id);
  assert.equal(forged, 403);
  console.log('PASS: delivery across browsers; stranger read and sender impersonation blocked');
  await b.locator('[data-action=ask-context]').click(); await b.locator('#context-question').fill('What could we build together?');
  await b.getByRole('button', { name: 'Save context request', exact: true }).click();
  await b.waitForFunction(() => window.SignalPass?.inbox?.some((i) => i.status === 'context_requested'));
  await a.reload({ waitUntil: 'networkidle' }); await a.locator('#reply-context').fill('An open-source simulation harness for community contracts.');
  await a.getByRole('button', { name: 'Approve and add context', exact: true }).click();
  await a.waitForFunction(() => document.querySelector('#receipt-status')?.textContent === 'Awaiting a response');
  await b.reload({ waitUntil: 'networkidle' }); await b.locator('[data-action=accept-introduction]').click(); await b.locator('#dialog-confirm').click();
  await b.waitForFunction(() => window.SignalPass?.inbox?.some((i) => i.status === 'accepted'));
  await a.reload({ waitUntil: 'networkidle' }); assert.equal(await a.locator('#receipt-status').innerText(), 'Accepted');
  assert(await b.locator('[data-action=decline-introduction]').isDisabled());
  console.log('PASS: authorized context request, sender reply, recipient acceptance and terminal state');
  await stop(api); api = boot(['--filter', '@signalpass/api', 'start'], apiEnv); await health('http://127.0.0.1:' + API_PORT + '/health', api);
  await a.reload({ waitUntil: 'networkidle' }); assert.equal(await a.locator('#receipt-status').innerText(), 'Accepted');
  await b.reload({ waitUntil: 'networkidle' }); assert((await b.locator('.v4-result-message').innerText()).includes('community contracts'));
  console.log('PASS: complete API process restart preserves sessions, delivery and approved context');
  for (const width of [1440, 390]) {
    await a.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [name, route] of [['profile','/profile/import'],['discover','/discover'],['compose','/introductions/new/bob'],['receipt', new URL(receipt).pathname]]) {
      await a.goto(origin + route, { waitUntil: 'networkidle' });
      assert(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Overflow: ' + route + ' at ' + width);
      assert.deepEqual(await a.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src)), []);
      await a.screenshot({ path: join(screenshots, name + '-' + width + '.png'), fullPage: true });
    }
  }
  assert.deepEqual(errors, []);
  await a.goto(origin + '/inbox', { waitUntil: 'networkidle' });
  assert(await a.getByRole('link', { name: 'To Bob Builder · accepted', exact: true }).isVisible());
  await a.goto(origin + '/widget/create', { waitUntil: 'networkidle' });
  assert((await a.locator('#embed-code').innerText()).includes('alice'));
  await a.goto(origin + '/widget/preview', { waitUntil: 'networkidle' });
  assert.equal(await a.locator('#signalpass-widget h2').innerText(), 'Alice Builder');
  assert((await a.locator('#signalpass-widget a').getAttribute('href')).endsWith('/introductions/new/alice'));
  console.log('PASS: live sent history and profile-specific widget link');
  console.log('PASS: default live V4, desktop/mobile layouts and browser runtime errors');
  const demo = spawn(process.execPath, ['scripts/v4-verify.mjs'], { env: { ...process.env, V4_BASE_URL: origin, V4_QA_DIR: join(screenshots, 'demo') }, stdio: ['ignore', 'pipe', 'pipe'] });
  let demoLog = ''; demo.stdout.on('data', s => { demoLog += s; }); demo.stderr.on('data', s => { demoLog += s; });
  const demoCode = await new Promise(resolve => demo.on('exit', resolve));
  assert.equal(demoCode, 0, demoLog);
  console.log('PASS: explicit demo-mode interaction and responsive regression');
} catch (error) {
  console.error(error);
  for (const process of processes) if (process.exitCode && process.exitCode !== 143) console.error(process.logs.slice(-2000));
  process.exitCode = 1;
} finally {
  await browser?.close(); for (const process of processes.reverse()) await stop(process);
  rmSync(dir, { recursive: true, force: true });
}
