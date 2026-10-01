#!/usr/bin/env node
/**
 * Browser regressions for the hosted Personal Agent, using native production
 * pages and route-mocked HTTP responses. No wallet, model or message is sent.
 * Run: node scripts/agent-ui-test.mjs
 * Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium
 * Screenshots: AGENT_QA_DIR (defaults to .run/agent-ui-qa).
 * Existing bitmap illustrations are intentionally omitted from this checkout
 * and aborted here. This verifies the assistant, not all existing site artwork.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(repo, 'apps/web/public');
const output = process.env.AGENT_QA_DIR || path.join(repo, '.run/agent-ui-qa');
const address = '0x' + 'a'.repeat(40);
const recipientAddress = '0x' + 'b'.repeat(40);
const runId = 'b58bde8a-dd11-44a7-9239-6bd5b8375edb';
const draftId = 'd6901020-5e90-40c5-9910-907f53ca6064';
const goal = 'I am building a Monad analytics tool and need feedback on wallet onboarding. I can review a prototype in return.';
const timestamp = Math.floor(Date.now() / 1000);
const profile = {
  owner: address, handle: 'alex-qa', displayName: 'Alex Chen', building: 'A Monad analytics tool',
  canOffer: 'Product feedback and frontend prototypes', wantsToMeet: 'People who test onboarding',
  interests: ['Monad', 'Product design'], avatar: 'none', availability: 'open',
};
const recipient = {
  owner: recipientAddress, handle: 'maya-qa', displayName: 'Maya Patel', building: 'Making wallets easier to use',
  canOffer: 'Usability testing and wallet onboarding feedback', wantsToMeet: 'People shipping useful onchain tools',
  interests: ['Monad', 'Wallet UX'], avatar: 'none', availability: 'open',
};
const settings = {
  profile: { name: profile.displayName, bio: profile.building, offer: profile.canOffer, meet: profile.wantsToMeet, interests: profile.interests.join(', ') },
  agent: { visibility: 'public', matching: true, interests: profile.interests, sources: [] },
  version: 'sender-version-1', sourceLinks: {},
};
const match = {
  ...recipient,
  reason: 'Maya offers wallet onboarding feedback, which directly relates to your prototype.',
  caveat: 'Her profile does not confirm availability or experience with your specific analytics tool.',
  evidence: [{ field: 'canOffer', quote: recipient.canOffer }],
};
const makeRun = (matches = [match]) => ({
  id: runId, goal, createdAt: timestamp, usedProfile: false, profileVersion: null, matches,
  nextQuestion: 'Which part of onboarding do you want to test first?',
  eligibleCandidates: 1, consideredCandidates: 1, candidateLimit: 40,
});
const makeDraft = () => ({
  id: draftId, recipientHandle: recipient.handle, recipientName: recipient.displayName, goal,
  intent: {
    whoAmI: 'I’m Alex, building a Monad analytics tool.',
    whyYou: 'Your profile mentions usability testing and wallet onboarding feedback.',
    whatIOffer: 'I can review one of your prototypes and share product feedback in return.',
    nextStep: 'Would you be open to a short walkthrough of the onboarding flow?',
  },
  notes: ['Check that the proposed walkthrough fits your schedule.'],
  createdAt: timestamp, expiresAt: timestamp + 1800, usedProfile: true,
  profileVersion: settings.version, recipientVersion: 'recipient-version-1',
});

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const rewritten = pathname === '/assistant' ? '/v4/assistant.html'
    : pathname.startsWith('/introductions/new/') ? '/v4/compose.html'
    : pathname.endsWith('/receipt') ? '/v4/receipt.html'
    : pathname === '/discover' ? '/v4/discover.html' : pathname;
  const file = path.resolve(publicRoot, '.' + rewritten);
  if (!file.startsWith(publicRoot + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const content = await readFile(file);
    const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' }).end(content);
  } catch { res.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
await mkdir(output, { recursive: true });
let browser;
const passed = [];

async function scenario(name, options, run) {
  const context = await browser.newContext({ viewport: { width: options.width || 1440, height: options.width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [], calls = [], unexpected = [];
  const fixture = { runs: [], drafts: [], ...options };
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== origin || /\/assets\/|\.(?:webp|png|jpe?g)$/.test(url.pathname)) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const apiPath = url.pathname.slice(4);
    const body = request.postDataJSON();
    calls.push({ path: apiPath, method: request.method(), body, headers: request.headers() });
    let status = 200, data;
    if (apiPath === '/chain/config') data = { enabled: false };
    else if (apiPath === '/me') {
      status = fixture.guest ? 401 : 200;
      data = fixture.guest ? { error: 'authentication_required' } : { session: { address, csrf: 'fixture-csrf' }, profile: fixture.noProfile ? null : profile, settings: fixture.noProfile ? null : settings };
    } else if (apiPath === '/profiles') data = { profiles: [profile, recipient] };
    else if (apiPath === '/profiles/' + recipient.handle) data = { profile: recipient };
    else if (apiPath.startsWith('/agent/') && fixture.guest) { status = 401; data = { error: 'authentication_required' }; }
    else if (apiPath === '/agent/status') data = { enabled: !fixture.unconfigured, provider: fixture.unconfigured ? null : 'test-fixture', model: fixture.unconfigured ? null : 'fixture-model', remainingToday: fixture.exhausted ? 0 : 18, limit: 20, capabilities: ['discover', 'draft'] };
    else if (apiPath === '/agent/workspace') data = { runs: fixture.runs, drafts: fixture.drafts };
    else if (apiPath === '/agent/discover') {
      if (fixture.failure) { status = 502; data = { error: 'agent_unavailable' }; }
      else {
        const found = makeRun(fixture.empty ? [] : fixture.matches || [match]);
        found.usedProfile = body.useProfile;
        found.profileVersion = body.useProfile ? settings.version : null;
        fixture.runs = [found];
        data = { run: found, usage: { remainingToday: 17 }, provider: 'test-fixture', model: 'fixture-model' };
      }
    } else if (apiPath === '/agent/draft') {
      fixture.drafts = [fixture.draft || makeDraft()];
      data = { draft: fixture.drafts[0], usage: { remainingToday: 16 }, provider: 'test-fixture', model: 'fixture-model' };
    } else if (apiPath.startsWith('/agent/drafts/')) {
      status = fixture.stale ? 409 : 200;
      data = fixture.stale ? { error: 'agent_draft_stale' } : { draft: fixture.drafts.find(draft => draft.id === apiPath.split('/').at(-1)) || fixture.draft || makeDraft() };
    } else if (apiPath === '/agent/history/clear') {
      fixture.runs = []; fixture.drafts = []; data = { ok: true };
    } else if (apiPath === '/introductions' && request.method() === 'POST') {
      // Deliberately stop at a recoverable response after capturing the one
      // user-approved send. No real service sees any request in this test.
      status = 503; data = { error: 'fixture_delivery_stopped' };
    } else {
      unexpected.push(`${request.method()} ${apiPath}`);
      status = 500; data = { error: 'unexpected_fixture_request' };
    }
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  try {
    await page.goto(origin + '/assistant');
    await page.waitForFunction(() => window.SignalPass && document.querySelector('#agent-state')?.textContent !== 'Checking availability…');
    await run({ page, fixture, calls, context });
    assert.deepEqual(errors, [], `${name}: browser script errors`);
    assert.deepEqual(unexpected, [], `${name}: unexpected API requests`);
    passed.push(name); console.log('PASS', name);
  } finally { await context.close(); }
}

const sends = calls => calls.filter(call => call.path === '/introductions' && call.method === 'POST');
async function discover(page) {
  await page.locator('#agent-goal').fill(goal);
  await page.locator('#agent-submit').click();
  await page.locator('#agent-results').waitFor({ state: 'visible' });
}
async function geometry(page, width) {
  const result = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, main: document.querySelector('main').getBoundingClientRect().width }));
  assert(result.scroll <= width + 1, `Horizontal overflow at ${width}: ${JSON.stringify(result)}`);
  assert(result.main > 200, 'Main content has a usable width');
}

try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-webgl'] } : {}) });
  console.log('Browser:', browser.version());

  await scenario('goal → evidence → draft → editable composer → explicit confirmation', { draft: { ...makeDraft(), notes: [] } }, async ({ page, calls }) => {
    assert.equal(await page.locator('#agent-use-profile').isChecked(), false);
    await discover(page);
    assert.equal(calls.find(call => call.path === '/agent/discover').body.useProfile, false, 'Search defaults to goal-only consent');
    assert.match(await page.locator('#agent-matches').innerText(), /wallet onboarding feedback/);
    assert.match(await page.locator('#agent-matches').innerText(), /does not confirm availability/);
    assert.equal(sends(calls).length, 0);
    await geometry(page, 1440);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'assistant-recommendations-1440.png'), fullPage: true });
    await page.locator('#agent-use-profile').check();
    await page.locator('.assistant-prepare-draft').first().click();
    await page.locator('#agent-draft-panel').waitFor({ state: 'visible' });
    assert.match(await page.locator('.assistant-draft-caption').innerText(), /Check personal claims.*untrue suggestion.*know them or follow their work/);
    assert.equal(await page.locator('#agent-draft-notes').innerText(), '', 'The review reminder is product-owned even without model notes');
    await geometry(page, 1440);
    await page.screenshot({ path: path.join(output, 'assistant-draft-1440.png'), fullPage: true });
    const draftCall = calls.find(call => call.path === '/agent/draft');
    assert.equal(draftCall.body.recipientHandle, recipient.handle);
    assert.equal(draftCall.body.useProfile, true);
    assert.equal(draftCall.headers['x-signalpass-csrf'], 'fixture-csrf');
    assert.equal(sends(calls).length, 0, 'Generating the draft never sends an introduction');
    await page.locator('#agent-draft-handoff').click();
    await page.waitForURL('**/introductions/new/**');
    await page.waitForFunction(() => document.querySelector('#intro-field-1')?.value.includes('I’m Alex'));
    assert.equal(await page.locator('#intro-field-2').inputValue(), makeDraft().intent.whyYou);
    assert.match(await page.locator('.sp-draft-readiness[role=note]').innerText(), /Check personal claims.*untrue suggestion.*know them or follow their work/);
    await geometry(page, 1440);
    await page.screenshot({ path: path.join(output, 'agent-composer-1440.png'), fullPage: true });
    assert.equal(sends(calls).length, 0, 'Handoff never sends an introduction');
    const edit = 'I am Alex. I revised this introduction myself after reading Maya’s profile.';
    await page.locator('#intro-field-1').fill(edit);
    const key = 'signalpass-v4-draft-' + address;
    const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft, key);
    await page.reload();
    await page.waitForFunction(expected => document.querySelector('#intro-field-1')?.value === expected, edit);
    const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft, key);
    assert.equal(after.id, before.id, 'Reload preserves idempotency identity');
    assert.equal(after.agentDraftId, draftId, 'Reload retains the assistant draft identity');
    await page.locator('[data-action=approve-introduction]').click();
    await page.locator('#dialog-confirm').waitFor({ state: 'visible' });
    assert.equal(sends(calls).length, 0, 'Opening review requires a separate confirmation');
    assert.match(await page.locator('#dialog-content').innerText(), /I revised this introduction myself/);
    await page.locator('#dialog-confirm').click();
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent.includes('Could not complete'));
    assert.equal(sends(calls).length, 1, 'Only the explicit confirmation requests delivery');
    assert.equal(sends(calls)[0].body.intent.whoAmI, edit);
  });

  await scenario('mobile recommendations and draft review reminders have no horizontal overflow', { width: 390, draft: { ...makeDraft(), notes: [] } }, async ({ page, calls }) => {
    await discover(page);
    await geometry(page, 390);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'assistant-recommendations-390.png'), fullPage: true });
    await page.locator('#agent-use-profile').check();
    await page.locator('.assistant-prepare-draft').first().click();
    await page.locator('#agent-draft-panel').waitFor({ state: 'visible' });
    assert.match(await page.locator('.assistant-draft-caption').innerText(), /Check personal claims.*untrue suggestion.*know them or follow their work/);
    assert.equal(await page.locator('#agent-draft-notes').innerText(), '');
    await geometry(page, 390);
    await page.screenshot({ path: path.join(output, 'assistant-draft-390.png'), fullPage: true });
    await page.locator('#agent-draft-handoff').click();
    await page.waitForURL('**/introductions/new/**');
    await page.waitForFunction(() => document.querySelector('#intro-field-1')?.value.includes('I’m Alex'));
    assert.match(await page.locator('.sp-draft-readiness[role=note]').innerText(), /Check personal claims.*untrue suggestion.*know them or follow their work/);
    await geometry(page, 390);
    const contextLayout = await page.evaluate(() => {
      const copy = document.querySelector('.verified-context-inner > p').getBoundingClientRect();
      const button = document.querySelector('.verified-context-inner .context-button').getBoundingClientRect();
      return { copyWidth: copy.width, copyBottom: copy.bottom, buttonTop: button.top };
    });
    assert(contextLayout.copyWidth > 180 && contextLayout.copyBottom <= contextLayout.buttonTop, 'Mobile profile-sharing explanation remains readable above its separate control');
    await page.screenshot({ path: path.join(output, 'agent-composer-390.png'), fullPage: true });
    assert.equal(sends(calls).length, 0);
  });

  await scenario('guest cannot invoke hosted generation', { guest: true }, async ({ page, calls }) => {
    assert.equal(await page.locator('#agent-submit').isDisabled(), true);
    assert.match(await page.locator('#agent-notice').innerText(), /wallet|sign in/i);
    assert.equal(calls.some(call => call.path.startsWith('/agent/')), false);
    assert.equal(sends(calls).length, 0);
  });

  await scenario('unconfigured provider has an honest disabled state', { unconfigured: true }, async ({ page, calls }) => {
    assert.equal(await page.locator('#agent-submit').isDisabled(), true);
    assert.match(await page.locator('#agent-notice').innerText(), /isn’t available|not connected|not configured|not enabled|not available|not set up/i);
    assert.equal(calls.some(call => call.path === '/agent/discover'), false);
  });

  await scenario('daily quota disables new generation without hiding existing work', { exhausted: true, runs: [makeRun()] }, async ({ page, calls }) => {
    assert.equal(await page.locator('#agent-submit').isDisabled(), true);
    assert.match(await page.locator('#agent-budget').innerText(), /0 of 20/);
    await page.locator('.assistant-history-entry button').click();
    await page.locator('#agent-results').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.assistant-prepare-draft').isDisabled(), true);
    assert.equal(calls.some(call => call.path === '/agent/discover' || call.path === '/agent/draft'), false);
  });

  await scenario('drafting requires current explicit profile consent', {}, async ({ page, calls }) => {
    await discover(page);
    await page.locator('.assistant-prepare-draft').click();
    await page.locator('#agent-error').waitFor({ state: 'visible' });
    assert.match(await page.locator('#agent-error').innerText(), /approved profile/);
    assert.equal(calls.some(call => call.path === '/agent/draft'), false);
    assert.equal(sends(calls).length, 0);
  });

  await scenario('provider failure preserves the goal and permits retry', { failure: true }, async ({ page, calls }) => {
    await page.locator('#agent-goal').fill(goal);
    await page.locator('#agent-submit').click();
    await page.locator('#agent-error').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#agent-goal').inputValue(), goal);
    assert.equal(await page.locator('#agent-submit').isDisabled(), false);
    assert.equal(await page.locator('.assistant-prepare-draft').count(), 0);
    assert.equal(sends(calls).length, 0);
  });

  await scenario('no relevant matches avoids invented recommendations', { empty: true }, async ({ page }) => {
    await discover(page);
    assert.equal(await page.locator('.assistant-prepare-draft').count(), 0);
    assert.match(await page.locator('#agent-matches').innerText(), /no |couldn’t|could not|not find/i);
    assert.equal(await page.locator('#agent-next-question').isVisible(), true);
  });

  await scenario('profile and generated text render as text, not executable HTML', {
    matches: [{ ...match, displayName: '<img src=x onerror="window.__agentXss=1">', reason: '<script>window.__agentXss=2</script>', evidence: [{ field: 'canOffer', quote: '<svg onload="window.__agentXss=3">' }] }],
  }, async ({ page }) => {
    await discover(page);
    assert.match(await page.locator('#agent-matches').innerText(), /<img src=x/);
    assert.match(await page.locator('#agent-matches').innerText(), /<script>/);
    assert.equal(await page.locator('#agent-matches script, #agent-matches img, #agent-matches svg').count(), 0);
    assert.equal(await page.evaluate(() => window.__agentXss), undefined);
  });

  await scenario('history deletion requires a separate confirmation', { runs: [makeRun()] }, async ({ page, calls }) => {
    await page.locator('#agent-clear-history').click();
    assert.equal(calls.some(call => call.path === '/agent/history/clear'), false);
    await page.locator('#agent-cancel-clear').click();
    assert.equal(calls.some(call => call.path === '/agent/history/clear'), false);
    await page.locator('#agent-clear-history').click();
    await page.locator('#agent-confirm-clear').click();
    await page.waitForFunction(() => document.querySelector('#agent-clear-history').hidden);
    assert.equal(calls.filter(call => call.path === '/agent/history/clear').length, 1);
  });

  await scenario('a new agent draft replaces the prior draft and preserves deliberate blank edits', {}, async ({ page, calls, fixture }) => {
    const newDraft = { ...makeDraft(), id: 'dd39f964-7ce7-4a9f-a81b-cdc636d178c7' };
    fixture.drafts = [newDraft];
    const key = 'signalpass-v4-draft-' + address;
    await page.evaluate(({ key, recipient, oldDraftId }) => localStorage.setItem(key, JSON.stringify({ draft: { person: recipient, recipientHandle: recipient, id: 'c20e4e89-53e2-45a8-bb3c-fe114e052e50', agentDraftId: oldDraftId, fields: ['Old message', 'Old reason', 'Old offer', 'Old next step'], status: 'draft', goal: 'chat' }, sharedContext: true })), { key, recipient: recipient.handle, oldDraftId: draftId });
    await page.goto(origin + '/introductions/new/' + recipient.handle + '?agentDraft=' + newDraft.id);
    await page.waitForFunction(expected => document.querySelector('#intro-field-1')?.value === expected, newDraft.intent.whoAmI);
    const imported = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    assert.notEqual(imported.draft.id, 'c20e4e89-53e2-45a8-bb3c-fe114e052e50');
    assert.equal(imported.draft.agentDraftId, newDraft.id);
    assert.equal(imported.sharedContext, false, 'A new generated draft does not inherit sharing consent');
    await page.locator('#intro-field-1').fill('');
    await page.reload();
    await page.waitForFunction(expected => document.querySelector('#intro-field-4')?.value === expected, newDraft.intent.nextStep);
    assert.equal(await page.locator('#intro-field-1').inputValue(), '', 'An intentionally cleared field must not refill after reload');
    assert.equal(sends(calls).length, 0);
  });

  for (const [name, options] of [
    ['server rejects an expired or changed draft', { stale: true }],
    ['mismatched recipient is refused', { draft: { ...makeDraft(), recipientHandle: 'someone-else' } }],
    ['expired payload is refused even on HTTP success', { draft: { ...makeDraft(), expiresAt: timestamp - 1 } }],
  ]) {
    await scenario(name, options, async ({ page, calls }) => {
      await page.goto(origin + '/introductions/new/' + recipient.handle + '?agentDraft=' + draftId);
      await page.getByRole('heading', { name: 'Let’s refresh this introduction.' }).waitFor();
      assert.equal(await page.locator('.compose-workspace textarea,.compose-workspace [data-action=approve-introduction]').count(), 0);
      assert.match(await page.locator('.compose-workspace').innerText(), /Nothing has been sent/);
      assert.equal(sends(calls).length, 0);
    });
  }

  console.log(`Passed ${passed.length} hosted-agent browser scenarios. Screenshots: ${output}`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
