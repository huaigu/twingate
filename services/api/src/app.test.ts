import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import type { Hex } from 'viem'
import { createApp } from './app.js'
const origin = 'http://localhost:3004'
const accounts = [1, 2, 3].map((n) => privateKeyToAccount(('0x' + n.toString(16).padStart(64, '0')) as Hex))
const profile = (handle: string) => ({ handle, profile: { name: handle.toUpperCase(), bio: 'Building Monad developer tooling.', interests: 'Monad, developer tooling', offer: 'Contract simulation and product feedback.', meet: 'Builders who want to collaborate.' }, agent: { visibility: 'public', matching: true, sources: ['github'], interests: ['Monad', 'developer tooling'] }, sourceLinks: { github: 'https://example.com/PRIVATE_CANARY' }, avatar: 'alex' })
const intent = { whoAmI: 'I build Monad tools.', whyYou: 'Your work on developer tooling is relevant to our contract simulation project. I would like to compare our approaches to developer tests and collaborate on a shared test suite.', whatIOffer: 'Testing expertise and feedback.', nextStep: 'A short call.' }
type Identity = { cookie: string; csrf: string }
test('three signed identities: durable delivery, authorization, consent and replay', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'signalpass-auth-'))
  const options = { databasePath: join(dir, 'app.sqlite'), origin }
  let api = createApp(options)
  const request = async (who: Identity | null, path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) => {
    const res = await api.app.request(path, { method, headers: { origin, ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(who ? { cookie: who.cookie, 'x-signalpass-csrf': who.csrf } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: res.status, data: await res.json() as any, cookie: res.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  try {
    const identities: Identity[] = []
    for (const [i, account] of accounts.entries()) {
      const challenge = await request(null, '/auth/challenge', 'POST', { address: account.address, chainId: 10143 })
      assert.equal(challenge.status, 200)
      assert(challenge.data.message.includes('localhost:3004 wants you to sign in'))
      const signature = await account.signMessage({ message: challenge.data.message })
      const login = await request(null, '/auth/verify', 'POST', { nonce: challenge.data.nonce, signature })
      assert.equal(login.status, 200)
      assert(login.cookie.startsWith('signalpass_session='))
      assert.equal((await request(null, '/auth/verify', 'POST', { nonce: challenge.data.nonce, signature })).status, 401)
      identities.push({ cookie: login.cookie, csrf: login.data.session.csrf })
      assert.equal((await request(identities[i]!, '/me/profile', 'POST', profile(['alice', 'bob', 'eve'][i]!))).status, 200)
    }
    const [a, b, c] = identities as [Identity, Identity, Identity]
    assert.equal((await request(null, '/introductions')).status, 401)
    assert.equal((await request(a, '/me/profile', 'POST', profile('alice'), { 'x-signalpass-csrf': 'wrong' })).status, 403)
    assert.equal((await request(a, '/me/profile', 'POST', profile('alice'), { origin: 'https://evil.example' })).status, 403)
    assert.equal((await request(a, '/me/profile', 'POST', profile('bob'))).status, 409)
    const me = await request(a, '/me')
    const input = { recipientHandle: 'bob', intent, idempotencyKey: crypto.randomUUID(), sharedContext: true, profileVersion: me.data.settings.version }
    assert.equal((await request(a, '/introductions', 'POST', { ...input, profileVersion: 'stale' })).status, 409)
    assert.equal((await request(a, '/introductions', 'POST', { ...input, sender: accounts[1]!.address })).status, 403)
    const sent = await request(a, '/introductions', 'POST', input)
    assert.equal(sent.status, 201)
    const id = sent.data.introduction.id
    assert.equal(sent.data.introduction.state, 'submitted')
    assert.equal(sent.data.introduction.payment.charged, false)
    assert.equal((await request(a, '/introductions', 'POST', input)).data.introduction.id, id)
    assert.equal((await request(a, '/introductions', 'POST', { ...input, intent: { ...intent, nextStep: 'Changed approval.' } })).status, 409)
    assert.equal((await request(c, '/introductions/' + id)).status, 404)
    assert.equal((await request(c, '/queue/bob')).status, 404)
    const received = await request(b, '/introductions?box=inbox')
    assert.equal(received.data.introductions.length, 1)
    assert.equal(received.data.introductions[0].id, id)
    assert(!JSON.stringify(received.data).includes('PRIVATE_CANARY'))
    assert.equal((await request(a, '/introductions/' + id + '/transition', 'POST', { actor: 'recipient', to: 'accepted', revision: 1 })).status, 403)
    assert.equal((await request(c, '/introductions/' + id + '/transition', 'POST', { to: 'accepted', revision: 1 })).status, 404)
    assert.equal((await request(b, '/introductions/' + id + '/context', 'POST', { text: 'What can we build?', revision: 1 })).status, 200)
    assert.equal((await request(b, '/introductions/' + id + '/reply', 'POST', { text: 'Pretending to be sender', revision: 2 })).status, 403)
    assert.equal((await request(a, '/introductions/' + id + '/reply', 'POST', { text: 'A shared simulation harness.', revision: 2 })).status, 200)
    assert.equal((await request(b, '/introductions/' + id + '/transition', 'POST', { to: 'accepted', revision: 3 })).status, 200)
    assert.equal((await request(b, '/introductions/' + id + '/transition', 'POST', { to: 'declined', revision: 3 })).status, 409)
    api.close(); api = createApp(options)
    assert.equal((await request(a, '/introductions/' + id)).data.introduction.state, 'accepted')
    assert.equal((await request(b, '/introductions/' + id)).data.introduction.reply, 'A shared simulation harness.')
    const minimal = await request(a, '/introductions', 'POST', { ...input, sharedContext: false, idempotencyKey: crypto.randomUUID() })
    assert.equal(minimal.status, 201)
    assert.equal((await request(b, '/introductions/' + minimal.data.introduction.id)).data.introduction.sharedProfile, null)
    const evaluated = await request(a, '/introductions/' + minimal.data.introduction.id + '/evaluate', 'POST', {})
    assert.equal(evaluated.status, 200)
    assert.equal(evaluated.data.provider, 'mock-local')
    assert.equal(evaluated.data.introduction.evaluationOutcome.recipientSummary, undefined)
    assert.equal((await request(b, '/introductions/' + minimal.data.introduction.id)).data.introduction.evaluationOutcome.coachNotes, undefined)
    assert.equal((await request(a, '/introductions/' + minimal.data.introduction.id + '/evaluate', 'POST', {})).status, 409)
    const privateBob = profile('bob'); privateBob.agent.visibility = 'private'
    assert.equal((await request(b, '/me/profile', 'POST', privateBob)).status, 200)
    assert.equal((await request(null, '/profiles/bob')).status, 404)
    assert.equal((await request(a, '/introductions', 'POST', { ...input, idempotencyKey: crypto.randomUUID() })).status, 404)
    assert.equal((await request(a, '/auth/logout', 'POST', {})).status, 200)
    assert.equal((await request(a, '/me')).status, 401)
  } finally { api.close(); rmSync(dir, { recursive: true, force: true }) }
})

test('a different wallet cannot sign another address challenge', async () => {
  const api = createApp({ origin });
  try {
    const challenge = await api.app.request('/auth/challenge', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ address: accounts[0]!.address, chainId: 10143 }) });
    const data = await challenge.json() as { nonce: string; message: string };
    const signature = await accounts[1]!.signMessage({ message: data.message });
    const rejected = await api.app.request('/auth/verify', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ nonce: data.nonce, signature }) });
    assert.equal(rejected.status, 401);
    assert.equal(rejected.headers.get('set-cookie'), null);
  } finally { api.close(); }
});

test('configured evaluator failure is visible, retryable and never silently mocked', async () => {
  const { createServer } = await import('node:http');
  const service = createServer((_request, response) => { response.writeHead(503); response.end('unavailable'); });
  await new Promise<void>(resolve => service.listen(0, '127.0.0.1', resolve));
  const port = (service.address() as { port: number }).port;
  const api = createApp({ origin, evaluatorUrl: 'http://127.0.0.1:' + port });
  const users: Identity[] = [];
  const request = async (user: Identity | null, path: string, body?: unknown) => {
    const r = await api.app.request(path, { method: body === undefined ? 'GET' : 'POST', headers: { origin, 'content-type': 'application/json', ...(user ? { cookie: user.cookie, 'x-signalpass-csrf': user.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: r.status, data: await r.json() as any, cookie: r.headers.get('set-cookie')?.split(';')[0] || '' };
  };
  try {
    for (let i = 0; i < 2; i++) {
      const account = accounts[i]!;
      const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 10143 });
      const signature = await account.signMessage({ message: challenge.data.message });
      const verified = await request(null, '/auth/verify', { nonce: challenge.data.nonce, signature });
      const user = { cookie: verified.cookie, csrf: verified.data.session.csrf }; users.push(user);
      assert.equal((await request(user, '/me/profile', profile(i ? 'bob' : 'alice'))).status, 200);
    }
    const created = await request(users[0]!, '/introductions', { recipientHandle: 'bob', intent, idempotencyKey: crypto.randomUUID(), sharedContext: false });
    const id = created.data.introduction.id;
    const result = await request(users[0]!, '/introductions/' + id + '/evaluate', {});
    assert.equal(result.status, 502); assert.equal(result.data.fallback, false);
    const after = await request(users[0]!, '/introductions/' + id);
    assert.equal(after.data.introduction.state, 'submitted');
    assert.equal(after.data.introduction.evaluationOutcome, null);
    assert.equal(after.data.introduction.evaluationProvider, null);
  } finally { api.close(); await new Promise<void>(resolve => service.close(() => resolve())); }
});
