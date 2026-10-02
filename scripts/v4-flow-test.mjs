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

test('profile completion returns only to a fresh, same-account assistant goal', async () => {
  const check = async (search, resume, owner = address, live = true) => {
    const window = {};
    const sessionStorage = storage({ 'signalpass-assistant-return': JSON.stringify(resume) });
    vm.runInNewContext(clientSource, {
      window, sessionStorage, localStorage: storage({}), URLSearchParams,
      location: { search: search + '&demo=1', pathname: '/profile/import' },
      document: { body: { dataset: { page: 'sources' } }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    });
    await window.SignalPass.ready;
    window.SignalPass.live = live;
    window.SignalPass.me = owner ? { session: { address: owner } } : null;
    return window.SignalPass.profileReturnPath();
  };
  const resume = { owner: address, goal: 'Find a collaborator for Monad tooling', runId: 'test-run', handle: 'recipient', createdAt: Date.now() };
  assert.equal(await check('?returnTo=assistant', resume), '/assistant?resume=1');
  for (const search of ['', '?returnTo=https%3A%2F%2Fevil.example', '?returnTo=%2F%2Fevil.example', '?returnTo=%2Fassistant%3Fresume%3D1']) {
    assert.equal(await check(search, resume), null);
  }
  assert.equal(await check('?returnTo=assistant', resume, null), null);
  assert.equal(await check('?returnTo=assistant', resume, otherAddress), null);
  assert.equal(await check('?returnTo=assistant', resume, address, false), null);
  for (const unsafe of [null, {}, { ...resume, owner: null }, { ...resume, goal: '' }, { ...resume, goal: 'x'.repeat(1201) }, { ...resume, createdAt: Date.now() - 86400001 }, { ...resume, createdAt: Date.now() + 60000 }, { ...resume, createdAt: String(Date.now()) }]) {
    assert.equal(await check('?returnTo=assistant', unsafe), null);
  }
});

test('logout and wallet changes clear private return state without interrupting first sign-in', async () => {
  const mounted = async ({ authenticated = true, failLogout = false } = {}) => {
    const elements = [], handlers = {};
    const node = () => {
      const value = { dataset: {}, classList: { add() {} }, append() {}, replaceChildren() {}, setAttribute() {} };
      elements.push(value); return value;
    };
    const header = node(), slot = node();
    const sessionStorage = storage({ 'signalpass-assistant-return': 'private pending goal' });
    let reloads = 0;
    const window = { ethereum: { on: (name, listener) => { handlers[name] = listener; } } };
    vm.runInNewContext(clientSource, {
      window, sessionStorage, localStorage: storage({}), URLSearchParams, AbortSignal,
      location: { search: '', pathname: '/assistant', reload: () => reloads++ },
      document: { body: { dataset: { page: 'assistant' } }, getElementById: id => id === 'session-slot' ? slot : null, querySelector: () => header, querySelectorAll: () => [], createElement: node },
      fetch: async path => {
        let status = 200, data;
        if (path === '/api/chain/config') data = { enabled: false };
        else if (path === '/api/profiles') data = { profiles: [] };
        else if (path === '/api/me') { status = authenticated ? 200 : 401; data = authenticated ? { session: { address, csrf: 'csrf' }, profile: null } : {}; }
        else if (path === '/api/auth/logout') { status = failLogout ? 503 : 200; data = {}; }
        else throw new Error('Unexpected request: ' + path);
        return { ok: status < 400, status, json: async () => data };
      },
    });
    await window.SignalPass.ready;
    return { sessionStorage, handlers, button: elements.find(element => element.id === 'session-action'), reloads: () => reloads };
  };
  const guest = await mounted({ authenticated: false });
  await guest.handlers.accountsChanged([address]);
  assert.equal(guest.sessionStorage.getItem('signalpass-assistant-return'), 'private pending goal');
  assert.equal(guest.reloads(), 0);
  const signedIn = await mounted();
  await signedIn.handlers.accountsChanged([address]);
  assert.equal(signedIn.sessionStorage.getItem('signalpass-assistant-return'), 'private pending goal');
  await signedIn.button.onclick();
  assert.equal(signedIn.sessionStorage.getItem('signalpass-assistant-return'), null);
  assert.equal(signedIn.reloads(), 1);
  const changed = await mounted({ failLogout: true });
  await changed.handlers.accountsChanged([otherAddress]);
  assert.equal(changed.sessionStorage.getItem('signalpass-assistant-return'), null);
  assert.equal(changed.reloads(), 1);
});

for (const tags of [[], ['Monad'], ['Monad', 'Open source']]) {
  test(`compose initializes and persists a usable draft with ${tags.length} interests`, async () => {
    const elements = new Map();
    const element = selector => {
      if (!elements.has(selector)) {
        const attributes = new Map();
        elements.set(selector, {
          value: '', textContent: '', dataset: {}, disabled: false, removed: false,
          style: { setProperty() {} },
          classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {},
          setAttribute(name, value) { attributes.set(name, String(value)); },
          getAttribute(name) { return attributes.get(name) ?? null; },
          hasAttribute(name) { return attributes.has(name); },
          removeAttribute(name) { attributes.delete(name); },
          remove() { this.removed = true; },
          querySelectorAll() { return []; },
        });
      }
      return elements.get(selector);
    };
    const fields = Array.from({ length: 4 }, (_, i) => element('#intro-field-' + (i + 1)));
    const goal = element('goal'); goal.value = 'chat';
    const workspace = element('.compose-workspace');
    const loading = element('#compose-loading');
    const controls = [...fields, goal, element('[data-action=approve-introduction]'), element('[data-action=toggle-context]')];
    for (const control of controls) {
      control.disabled = true;
      control.setAttribute('data-compose-pending', '');
    }
    // Model the shipped static loading gate, rather than exposing controls before
    // account and recipient hydration finishes.
    workspace.setAttribute('inert', '');
    workspace.setAttribute('aria-busy', 'true');
    workspace.querySelectorAll = selector => selector === '[data-compose-pending]'
      ? controls.filter(control => control.hasAttribute('data-compose-pending')) : [];
    const document = {
      body: { dataset: { page: 'compose' } },
      documentElement: { clientWidth: 1200, style: { setProperty() {} } },
      querySelector: selector => selector === '.scene' ? null : selector === '[name=intro-goal]:checked' ? goal : element(selector),
      querySelectorAll: selector => selector === '.intro-field textarea' ? fields : selector === '[name=intro-goal]' ? [goal] : [],
      getElementById: id => {
        const found = elements.get('#' + id);
        return found && !found.removed ? found : null;
      },
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
    assert(controls.every(control => !control.disabled), 'Initialized compose controls become usable');
    assert.equal(workspace.getAttribute('aria-busy'), 'false');
    assert.equal(workspace.hasAttribute('inert'), false);
    assert.equal(loading.removed, true);
    const saved = JSON.parse(localStorage.getItem(walletKey)).draft;
    assert.equal(saved.person, 'recipient');
    assert.equal(saved.status, 'draft');
    assert.deepEqual(saved.fields, fields.map(field => field.value));
    if (tags.length < 2) assert.match(fields[1].value, /possible collaboration/);
  });
}


function requestClient(response = { status: 200, data: { ok: true } }) {
  const calls = [];
  const window = {};
  vm.runInNewContext(clientSource, {
    window, localStorage: storage({}), sessionStorage: storage({}), URLSearchParams,
    location: { search: '?demo=1', pathname: '/assistant' },
    document: { body: { dataset: { page: 'assistant' } }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    AbortSignal: { timeout: milliseconds => ({ milliseconds }) },
    fetch: async (path, options) => {
      calls.push({ path, ...options });
      if (response.error) throw response.error;
      return { ok: response.status < 400, status: response.status, json: async () => response.data };
    },
  });
  window.SignalPass.me = { session: { address, csrf: 'test-csrf' } };
  return { api: window.SignalPass, calls };
}

test('only hosted discover and draft mutations receive a 65-second request budget', async () => {
  const { api, calls } = requestClient();
  await api.ready;
  for (const path of ['/agent/discover', '/agent/draft']) {
    await api.request(path, { goal: 'A test request' });
    const call = calls.at(-1);
    assert.equal(call.signal.milliseconds, 65000);
    assert.equal(call.method, 'POST');
    assert.equal(call.headers['X-SignalPass-CSRF'], 'test-csrf');
    assert.equal(call.credentials, 'same-origin');
  }
  for (const [path, body] of [
    ['/agent/status'], ['/agent/workspace'], ['/agent/drafts/example'], ['/agent/discover'], ['/agent/draft'],
    ['/profiles'], ['/introductions/example'], ['/agent/history/clear', {}],
    ['/introductions', {}], ['/introductions/example/funding-quote', {}], ['/introductions/example/funding', {}],
  ]) {
    await api.request(path, body);
    assert.equal(calls.at(-1).signal.milliseconds, 18000, path);
  }
});

test('long inference requests still expose provider, budget and timeout errors to the UI', async () => {
  for (const [status, code] of [[502, 'agent_unavailable'], [429, 'agent_budget_exhausted']]) {
    const { api, calls } = requestClient({ status, data: { error: code } });
    await api.ready;
    await assert.rejects(api.request('/agent/discover', { goal: 'A test goal' }), error => {
      assert.equal(error.code, code);
      assert.equal(error.status, status);
      assert.match(error.message, /Could not complete/);
      return true;
    });
    assert.equal(calls[0].signal.milliseconds, 65000);
  }
  const timeoutError = Object.assign(new Error('The operation timed out'), { name: 'TimeoutError' });
  const { api } = requestClient({ error: timeoutError });
  await api.ready;
  await assert.rejects(api.request('/agent/draft', { runId: 'example' }), error => error === timeoutError);
});
