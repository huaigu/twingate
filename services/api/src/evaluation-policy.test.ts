import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type ServerResponse } from 'node:http'
import { once } from 'node:events'
import { privateKeyToAccount } from 'viem/accounts'
import type { Hex } from 'viem'
import { createApp } from './app.js'
import { hashDocument } from './store.js'

const origin = 'http://localhost:3004'
const accounts = [3, 4].map((n) => privateKeyToAccount(('0x' + n.toString(16).padStart(64, '0')) as Hex))
const profile = (handle: string) => ({ handle, profile: { name: handle, bio: 'Building Monad tools.', interests: 'Monad', offer: 'Simulation tooling.', meet: 'Other builders.' }, agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad'] } })
const intent = { whoAmI: 'I build Monad tools.', whyYou: 'Your work on simulations complements our contract testing project. I would like to compare fixtures and build a shared integration.', whatIOffer: 'Contract test fixtures and feedback.', nextStep: 'Compare test cases?' }
const outcome = { recommendation: 'review', whyItMayMatter: 'Related work.', recipientSummary: ['Monad tooling.'], suggestedOpeningQuestion: 'Compare test cases?', coachNotes: [], missingContext: [] }
const provider = 'policy-capture'
const respond = (response: ServerResponse) => { response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify({ provider, outcome })) }

async function harness(evaluatorUrl?: string) {
  const api = createApp({ origin, evaluatorUrl })
  type Identity = { cookie: string; csrf: string }
  const request = async (identity: Identity | null, path: string, body?: unknown) => {
    const response = await api.app.request(path, { method: body === undefined ? 'GET' : 'POST', headers: { origin, 'content-type': 'application/json', ...(identity ? { cookie: identity.cookie, 'x-signalpass-csrf': identity.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, data: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  const identities: Identity[] = []
  for (const [index, account] of accounts.entries()) {
    const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 10143 })
    const signature = await account.signMessage({ message: challenge.data.message })
    const login = await request(null, '/auth/verify', { nonce: challenge.data.nonce, signature })
    const identity = { cookie: login.cookie, csrf: login.data.session.csrf }; identities.push(identity)
    assert.equal((await request(identity, '/me/profile', profile(index ? 'bob' : 'alice'))).status, 200)
  }
  const [sender, recipient] = identities as [Identity, Identity]
  const submit = async () => {
    const result = await request(sender, '/introductions', { recipientHandle: 'bob', intent, idempotencyKey: crypto.randomUUID() })
    assert.equal(result.status, 201)
    return result.data.introduction.id as string
  }
  return { api, request, sender, recipient, submit }
}

test('a policy edited after submission rejects evaluation explicitly without provider work or a mislabeled receipt', async () => {
  let calls = 0
  const service = createServer((_request, response) => { calls++; respond(response) })
  service.listen(0, '127.0.0.1'); await once(service, 'listening')
  const address = service.address(); assert(address && typeof address === 'object')
  try {
    for (const evaluatorUrl of [undefined, `http://127.0.0.1:${address.port}`]) {
      const h = await harness(evaluatorUrl)
      try {
        const id = await h.submit()
        const edited = profile('bob'); edited.agent.interests = ['Consumer social']
        assert.equal((await h.request(h.recipient, '/me/profile', edited)).status, 200)
        const beforeCalls = calls
        const result = await h.request(h.sender, `/introductions/${id}/evaluate`, {})
        assert.equal(result.status, 409)
        assert.equal(result.data.error, 'recipient_policy_changed_start_new')
        assert.equal(result.data.fallback, false)
        assert.equal(calls, beforeCalls)
        const after = h.api.store.introductions.get(id)!
        assert.equal(after.state, 'submitted')
        assert.equal(after.policyVersion, 1)
        assert.equal(after.evaluationOutcome, null)
        assert.equal(after.evaluationReceiptHash, null)
        assert.equal(after.evaluationProvider, null)
        // A newly reviewed introduction binds the current version and remains usable.
        const freshId = await h.submit()
        assert.equal((await h.request(h.sender, `/introductions/${freshId}/evaluate`, {})).status, 200)
        assert.equal(h.api.store.introductions.get(freshId)!.policyVersion, 2)
      } finally { h.api.close() }
    }
  } finally { service.closeAllConnections(); await new Promise<void>((resolve) => service.close(() => resolve())) }
})

test('an edit during inference does not rewrite the captured policy or the policy hash in its receipt', async () => {
  let captured: any, pendingResponse: ServerResponse | undefined
  let received!: () => void
  const requestReceived = new Promise<void>((resolve) => { received = resolve })
  const service = createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk
    captured = JSON.parse(body); pendingResponse = response; received()
  })
  service.listen(0, '127.0.0.1'); await once(service, 'listening')
  const address = service.address(); assert(address && typeof address === 'object')
  const h = await harness(`http://127.0.0.1:${address.port}`)
  try {
    const id = await h.submit(), intro = h.api.store.introductions.get(id)!
    const approvedPolicy = h.api.store.policies.get('bob')!
    const evaluating = h.request(h.sender, `/introductions/${id}/evaluate`, {})
    await requestReceived
    const edited = profile('bob'); edited.agent.interests = ['Consumer social']
    assert.equal((await h.request(h.recipient, '/me/profile', edited)).status, 200)
    assert.equal(captured.recipientPolicy.version, 1)
    assert.deepEqual(captured.recipientPolicy.topics, approvedPolicy.topics)
    respond(pendingResponse!)
    const result = await evaluating
    assert.equal(result.status, 200)
    const context = { sharedProfile: intro.sharedProfile, question: intro.question, reply: intro.reply }
    const expected = hashDocument({ introductionId: intro.id, payloadHash: intro.payloadHash, context, policyVersion: approvedPolicy.version, policyHash: hashDocument(approvedPolicy), provider, outcome })
    assert.equal(result.data.introduction.evaluationReceiptHash, expected)
    assert.equal(h.api.store.introductions.get(id)!.policyVersion, 1)
    assert.equal(h.api.store.policies.get('bob')!.version, 2)
  } finally { pendingResponse?.end(); service.closeAllConnections(); await new Promise<void>((resolve) => service.close(() => resolve())); h.api.close() }
})
