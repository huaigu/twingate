#!/usr/bin/env node
/** Asset-independent regressions for the shipped V4 scripts. No network or wallet is used. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';

const clientSource = readFileSync(new URL('../apps/web/public/v4/client.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../apps/web/public/v4/app.js', import.meta.url), 'utf8');
const address = '0x' + 'a'.repeat(40);
const otherAddress = '0x' + 'b'.repeat(40);
const guestKey = 'signalpass-v4-draft-guest';
const walletKey = 'signalpass-v4-draft-' + address;
const draft = {
  profile: { name: 'Guest Builder', bio: 'Building community tools.', interests: 'Monad', offer: 'Testing and feedback.', meet: 'Community builders.' },
  sources: ['github'], sourceLinks: { github: 'https://github.com/example' },
  widget: { name: 'Guest Builder' }, profileApproved: true,
  // Authentication must not import old identity or action state.
  introductions: [{ id: 'unrelated' }], agent: { visibility: 'public' },
};
const storage = entries => {
  const values = new Map(Object.entries(entries));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
};

async function login({ stored = {}, profile = null, sessionAddress = address, rejectSignature = false, rejectVerify = false } = {}) {
  const localStorage = storage(stored);
  let authenticated = false, reloads = 0;
  const calls = [];
  const window = { ethereum: { request: async ({ method }) => {
    if (method === 'eth_requestAccounts') return [address];
    if (method === 'eth_chainId') return '0x279f';
    if (method === 'personal_sign') {
      if (rejectSignature) throw new Error('Signature cancelled');
      return 'test-signature';
    }
    throw new Error('Unexpected wallet method: ' + method);
  } } };
  const context = vm.createContext({
    window, localStorage, sessionStorage: storage({}), URLSearchParams, AbortSignal, TextEncoder,
    location: { search: '', pathname: '/profile/import', reload: () => reloads++ },
    document: { body: { dataset: { page: 'sources' } }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    fetch: async (path, options) => {
      calls.push([path, options.method]);
      let status = 200, data;
      if (path === '/api/chain/config') data = { enabled: false };
      else if (path === '/api/profiles') data = { profiles: [] };
      else if (path === '/api/me') {
        status = authenticated ? 200 : 401;
        data = authenticated ? { session: { address: sessionAddress }, profile } : { error: 'authentication_required' };
      } else if (path === '/api/auth/challenge') data = { message: 'Sign in to the test fixture', nonce: 'test-nonce' };
      else if (path === '/api/auth/verify') {
        status = rejectVerify ? 401 : 200;
        authenticated = !rejectVerify;
        data = rejectVerify ? { error: 'authentication_required' } : {};
      } else throw new Error('Unexpected API request: ' + path);
      return { ok: status < 400, status, json: async () => data };
    },
  });
  vm.runInContext(clientSource, context);
  await window.SignalPass.ready;
  let error;
  try { await window.SignalPass.connect(); } catch (caught) { error = caught; }
  return { localStorage, reloads, calls, error };
}

test('guest profile and source links survive verified wallet sign-in without publishing', async () => {
  const result = await login({ stored: { [guestKey]: JSON.stringify(draft) } });
  assert.equal(result.error, undefined);
  const saved = JSON.parse(result.localStorage.getItem(walletKey));
  assert.deepEqual(saved.profile, draft.profile);
  assert.deepEqual(saved.sourceLinks, draft.sourceLinks);
  assert.equal(saved.profileApproved, false);
  assert.equal(saved.introductions, undefined);
  assert.equal(saved.agent, undefined);
  assert.equal(result.localStorage.getItem(guestKey), null);
  assert.equal(result.reloads, 1);
  assert.deepEqual(result.calls.filter(([, method]) => method === 'POST').map(([path]) => path), ['/api/auth/challenge', '/api/auth/verify']);
});

test('existing wallet draft and approved account profile are never overwritten', async () => {
  const existing = JSON.stringify({ profile: { name: 'Existing owner' } });
  const withDraft = await login({ stored: { [guestKey]: JSON.stringify(draft), [walletKey]: existing } });
  assert.equal(withDraft.localStorage.getItem(walletKey), existing);
  const withProfile = await login({ stored: { [guestKey]: JSON.stringify(draft) }, profile: { handle: 'existing-owner' } });
  assert.equal(withProfile.localStorage.getItem(walletKey), null);
});

test('cancelled or rejected authentication preserves the guest draft', async () => {
  for (const failure of [{ rejectSignature: true }, { rejectVerify: true }]) {
    const result = await login({ stored: { [guestKey]: JSON.stringify(draft) }, ...failure });
    assert(result.error);
    assert.equal(result.localStorage.getItem(guestKey), JSON.stringify(draft));
    assert.equal(result.localStorage.getItem(walletKey), null);
    assert.equal(result.reloads, 0);
  }
});

test('an unrelated account session or another wallet draft cannot seed this account', async () => {
  const mismatched = await login({ stored: { [guestKey]: JSON.stringify(draft) }, sessionAddress: otherAddress });
  assert.equal(mismatched.localStorage.getItem('signalpass-v4-draft-' + otherAddress), null);
  assert.equal(mismatched.localStorage.getItem(guestKey), JSON.stringify(draft));
  const otherKey = 'signalpass-v4-draft-' + otherAddress;
  const isolated = await login({ stored: { [otherKey]: JSON.stringify(draft) } });
  assert.equal(isolated.localStorage.getItem(walletKey), null);
  assert.equal(isolated.localStorage.getItem(otherKey), JSON.stringify(draft));
});

test('invalid guest storage does not prevent successful sign-in', async () => {
  for (const value of ['{invalid-json', 'null', '[]']) {
    const result = await login({ stored: { [guestKey]: value } });
    assert.equal(result.error, undefined);
    assert.equal(result.reloads, 1);
    assert.equal(result.localStorage.getItem(walletKey), null);
    assert.equal(result.localStorage.getItem(guestKey), value);
  }
});

for (const tags of [[], ['Monad'], ['Monad', 'Open source']]) {
  test(`compose initializes and persists a usable draft with ${tags.length} interests`, async () => {
    const elements = new Map();
    const element = selector => {
      if (!elements.has(selector)) elements.set(selector, {
        value: '', textContent: '', dataset: {}, style: { setProperty() {} },
        classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {},
      });
      return elements.get(selector);
    };
    const fields = Array.from({ length: 4 }, (_, i) => element('#intro-field-' + (i + 1)));
    const goal = element('goal'); goal.value = 'chat';
    const document = {
      body: { dataset: { page: 'compose' } },
      documentElement: { clientWidth: 1200, style: { setProperty() {} } },
      querySelector: selector => selector === '.scene' ? null : selector === '[name=intro-goal]:checked' ? goal : element(selector),
      querySelectorAll: selector => selector === '.intro-field textarea' ? fields : selector === '[name=intro-goal]' ? [goal] : [],
      addEventListener() {},
    };
    const localStorage = storage({ [walletKey]: JSON.stringify({ ...draft, profileApproved: false }) });
    const window = {
      SignalPass: { ready: Promise.resolve(), live: true, demo: false, me: { session: { address } }, inbox: [], directory: [{ name: 'recipient', handle: 'recipient', tags, avatar: 'alex', role: 'Builder' }] },
      addEventListener() {},
    };
    const context = vm.createContext({ window, document, localStorage, URLSearchParams, crypto: { randomUUID },
      location: { pathname: '/introductions/new/recipient', search: '' },
      requestAnimationFrame() {}, cancelAnimationFrame() {}, ResizeObserver: class { observe() {} },
    });
    await vm.runInContext(appSource, context);
    assert.equal(window.SignalPassView.mode, 'live');
    assert(fields.every(field => field.value.trim() && !field.value.includes('undefined')));
    const saved = JSON.parse(localStorage.getItem(walletKey)).draft;
    assert.equal(saved.person, 'recipient');
    assert.equal(saved.status, 'draft');
    assert.deepEqual(saved.fields, fields.map(field => field.value));
    if (tags.length < 2) assert.match(fields[1].value, /possible collaboration/);
  });
}
