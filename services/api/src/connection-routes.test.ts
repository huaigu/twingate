import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import type { Hex } from 'viem'
import { createApp } from './app.js'
import type { AgentModel } from './agent-types.js'

const origin = 'http://localhost:3004'
const accounts = [51, 52, 53].map((n) => privateKeyToAccount(('0x' + n.toString(16).padStart(64, '0')) as Hex))
const profile = (handle: string) => ({ handle, profile: { name: handle, bio: 'Building Monad tools.', interests: 'Monad', offer: 'Simulation tooling.', meet: 'Other builders.' }, agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad'] } })
const intent = { whoAmI: 'I build Monad tools.', whyYou: 'Your simulations complement our contract testing.', whatIOffer: 'Contract test fixtures.', nextStep: 'Compare test cases?' }
const email = { type: 'email', label: 'My collaboration email', value: 'private-contact-canary@example.com' }
const scheduling = { type: 'scheduling_url', label: 'Book a short chat', value: 'https://example.com/private-scheduling-canary' }
type Identity = { cookie: string; csrf: string }

async function harness(databasePath?: string, model?: AgentModel) {
  const options = { origin, databasePath, agent: model ? { model } : undefined }
  let api = createApp(options)
  const request = async (identity: Identity | null, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const response = await api.app.request(path, { method: body === undefined ? 'GET' : 'POST', headers: { origin, 'content-type': 'application/json', ...(identity ? { cookie: identity.cookie, 'x-signalpass-csrf': identity.csrf } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, data: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  const identities: Identity[] = []
  for (const [index, account] of accounts.entries()) {
    const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 10143 })
    const signature = await account.signMessage({ message: challenge.data.message })
    const login = await request(null, '/auth/verify', { nonce: challenge.data.nonce, signature })
    const identity = { cookie: login.cookie, csrf: login.data.session.csrf }; identities.push(identity)
    assert.equal((await request(identity, '/me/profile', profile(['alice', 'bob', 'eve'][index]!))).status, 200)
  }
  const [sender, recipient, stranger] = identities as [Identity, Identity, Identity]
  const introduce = async (accept = true) => {
    const created = await request(sender, '/introductions', { recipientHandle: 'bob', intent, idempotencyKey: crypto.randomUUID() })
    assert.equal(created.status, 201)
    const intro = created.data.introduction
    if (accept) assert.equal((await request(recipient, `/introductions/${intro.id}/transition`, { to: 'accepted', revision: intro.revision })).status, 200)
    return intro.id as string
  }
  return { request, sender, recipient, stranger, introduce, get api() { return api }, restart() { api.close(); api = createApp(options) }, close() { api.close() } }
}

test('accepted participants explicitly share one channel each; contacts persist and each owner can replace or revoke only their own', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'signalpass-connections-'))
  const h = await harness(join(dir, 'app.sqlite'))
  try {
    const id = await h.introduce(), path = `/introductions/${id}/connection`
    const original = h.api.store.introductions.get(id)!
    assert.deepEqual((await h.request(h.sender, path)).data, { connection: { introductionId: id, ownContact: null, otherContact: null } })
    const shared = await h.request(h.sender, path, email)
    assert.equal(shared.status, 200)
    assert.deepEqual(shared.data.connection.ownContact, { ...email, updatedAt: shared.data.connection.ownContact.updatedAt })
    assert(Number.isInteger(shared.data.connection.ownContact.updatedAt))
    assert.equal(shared.data.connection.otherContact, null)
    const counterpart = await h.request(h.recipient, path)
    assert.deepEqual(counterpart.data.connection.otherContact, shared.data.connection.ownContact)
    assert.equal(counterpart.data.connection.ownContact, null)
    assert.equal((await h.request(h.recipient, path, scheduling)).status, 200)
    h.restart()
    const restored = await h.request(h.sender, path)
    assert.equal(restored.data.connection.ownContact.value, email.value)
    assert.equal(restored.data.connection.otherContact.value, scheduling.value)
    // Profile privacy or an archived receipt must not erase the existing participant relationship.
    const hidden = profile('bob'); hidden.agent.visibility = 'private'
    assert.equal((await h.request(h.recipient, '/me/profile', hidden)).status, 200)
    assert.equal((await h.request(null, '/profiles/bob')).status, 404)
    assert.equal((await h.request(h.sender, `/introductions/${id}`)).status, 200)
    assert.equal((await h.request(h.sender, path)).status, 200)
    assert.equal((await h.request(h.sender, path, { ...email, value: 'replacement@example.com' })).status, 200)
    assert.equal((await h.request(h.sender, `${path}/remove`, { owner: accounts[1]!.address })).status, 400)
    const removed = await h.request(h.sender, `${path}/remove`, {})
    assert.equal(removed.status, 200)
    assert.equal(removed.data.connection.ownContact, null)
    assert.equal(removed.data.connection.otherContact.value, scheduling.value)
    assert.equal((await h.request(h.recipient, path)).data.connection.otherContact, null)
    assert.equal((await h.request(h.sender, `${path}/remove`, {})).status, 200)
    h.restart()
    assert.equal((await h.request(h.sender, path)).data.connection.ownContact, null)
    assert.equal((await h.request(h.recipient, `${path}/remove`, {})).data.connection.otherContact, null)
    const after = h.api.store.introductions.get(id)!
    assert.equal(after.state, 'accepted')
    assert.equal(after.revision, original.revision)
    assert.equal(after.payloadHash, original.payloadHash)
    assert.equal(after.evaluationReceiptHash, original.evaluationReceiptHash)
  } finally { h.close(); rmSync(dir, { recursive: true, force: true }) }
})

test('only parties of accepted introductions can read, share, or remove; authentication and CSRF remain required', async () => {
  const h = await harness()
  try {
    const id = await h.introduce(), path = `/introductions/${id}/connection`
    assert.equal((await h.request(null, path)).status, 401)
    assert.equal((await h.request(h.sender, path, email, { 'x-signalpass-csrf': 'wrong' })).status, 403)
    assert.equal((await h.request(h.sender, `${path}/remove`, {}, { origin: 'https://evil.example' })).status, 403)
    for (const [suffix, body] of [['', undefined], ['', email], ['/remove', {}], ['', { owner: 'invalid' }]] as const) {
      const rejected = await h.request(h.stranger, path + suffix, body)
      assert.equal(rejected.status, 404)
      assert.deepEqual(rejected.data, { error: 'introduction_not_found' })
    }
    const unknown = await h.request(h.sender, '/introductions/unknown/connection')
    assert.equal(unknown.status, 404)
    assert.equal((await h.request(h.sender, path)).data.connection.ownContact, null)
    const pending = await h.introduce(false), pendingPath = `/introductions/${pending}/connection`
    for (const state of ['submitted', 'quoted', 'ready_for_review', 'declined', 'expired', 'withdrawn'] as const) {
      h.api.store.introductions.set(pending, { ...h.api.store.introductions.get(pending)!, state })
      for (const [suffix, body] of [['', undefined], ['', email], ['/remove', {}]] as const) {
        const result = await h.request(h.sender, pendingPath + suffix, body)
        assert.equal(result.status, 409)
        assert.equal(result.data.error, 'introduction_not_accepted')
      }
    }
    assert.equal((await h.request(h.stranger, `/introductions/${id}`)).status, 404)
  } finally { h.close() }
})

test('channel validation rejects unsafe schemes, URL credentials, controls, invalid emails, extra fields, and unbounded text', async () => {
  const h = await harness()
  try {
    const id = await h.introduce(), path = `/introductions/${id}/connection`
    const badLinks = ['javascript:alert(1)', 'http://example.com', 'data:text/html,<script>alert(1)</script>', '//example.com', 'https://user:pass@example.com', 'https://user@example.com', 'https:\\example.com', 'https://example.com/space here', 'https://example.com/\npath', 'https://example.com/%0aheader', 'https://example.com/\u202epath', 'https://']
    for (const value of badLinks) assert.equal((await h.request(h.sender, path, { type: 'contact_url', label: 'My link', value })).status, 400, value)
    for (const value of ['https://example.com/%E2%80%AEpath', 'https://example.com/%C2%80path', 'https://example.com/%ZZ']) assert.equal((await h.request(h.sender, path, { type: 'contact_url', label: 'My link', value })).status, 400, value)
    for (const value of ['not-an-email', 'mailto:person@example.com', 'person@example.com\r\nBcc:someone@example.com', 'person\u200b@example.com', 'person%0a@example.com', 'x'.repeat(255) + '@example.com']) assert.equal((await h.request(h.sender, path, { ...email, value })).status, 400)
    for (const body of [{ ...email, type: 'phone' }, { ...email, label: '' }, { ...email, label: 'x'.repeat(61) }, { ...email, label: 'label\u0000' }, { ...email, value: 'x'.repeat(1201) }, { ...email, owner: accounts[1]!.address }, { ...email, updatedAt: 1 }, null]) assert.equal((await h.request(h.sender, path, body)).status, 400)
    assert.equal((await h.request(h.sender, path)).data.connection.ownContact, null)
    const normalized = await h.request(h.sender, path, { type: 'contact_url', label: '  Project contact  ', value: 'HTTPS://EXAMPLE.COM/contact' })
    assert.equal(normalized.status, 200)
    assert.equal(normalized.data.connection.ownContact.label, 'Project contact')
    assert.equal(normalized.data.connection.ownContact.value, 'https://example.com/contact')
    const unicodeUrl = 'https://example.com/%E6%8B%9B%E5%91%BC'
    assert.equal((await h.request(h.sender, path, { type: 'contact_url', label: 'Contact page', value: unicodeUrl })).status, 200)
    assert.equal((await h.request(h.sender, path, { ...email, value: 'alice+project@example.com' })).status, 200)
  } finally { h.close() }
})

test('contact consent is per introduction and contacts never enter public profiles, archived receipts, or hosted-model input', async () => {
  const modelRequests: unknown[] = []
  const model: AgentModel = { provider: 'fixture', model: 'fixture', generate: async (request) => {
    modelRequests.push(request.input)
    return { data: request.operation === 'discover' ? { matches: [{ handle: 'bob', reason: 'Simulation tooling.', caveat: 'Check availability.', evidence: [{ field: 'canOffer', quote: 'Simulation tooling.' }] }], nextQuestion: null } : { intent, notes: [] }, inputTokens: 1, outputTokens: 1 }
  } }
  const h = await harness(undefined, model)
  try {
    const id = await h.introduce(), path = `/introductions/${id}/connection`
    await h.request(h.sender, path, email); await h.request(h.recipient, path, scheduling)
    const secondId = await h.introduce()
    assert.deepEqual((await h.request(h.sender, `/introductions/${secondId}/connection`)).data.connection, { introductionId: secondId, ownContact: null, otherContact: null })
    for (const [who, route] of [[null, '/profiles'], [null, '/profiles/alice'], [h.sender, `/introductions/${id}`], [h.recipient, '/introductions?box=inbox'], [h.sender, '/me']] as const) {
      const response = await h.request(who, route)
      assert.equal(response.status, 200)
      assert(!JSON.stringify(response.data).includes(email.value))
      assert(!JSON.stringify(response.data).includes(scheduling.value))
    }
    const discovered = await h.request(h.sender, '/agent/discover', { goal: 'Find someone for Monad simulation testing.', useProfile: true })
    assert.equal(discovered.status, 200)
    assert.equal((await h.request(h.sender, '/agent/draft', { runId: discovered.data.run.id, recipientHandle: 'bob', useProfile: true })).status, 200)
    assert.equal(modelRequests.length, 2)
    assert(!JSON.stringify(modelRequests).includes(email.value))
    assert(!JSON.stringify(modelRequests).includes(scheduling.value))
    assert.equal(h.api.store.introductions.size, 2)
  } finally { h.close() }
})
