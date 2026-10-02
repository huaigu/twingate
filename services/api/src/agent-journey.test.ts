import assert from 'node:assert/strict'
import { test } from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import type { Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { privateKeyToAccount } from 'viem/accounts'
import type { Hex } from 'viem'
import type { IntroductionIntent } from '@signalpass/core'
import { createApp } from './app.js'
import type { AgentDraft, AgentModel, AgentProfile, AgentRun } from './agent-types.js'

type Identity = { cookie: string; csrf: string }
type Receipt = {
  id: string; role: 'sender' | 'recipient'; intent: IntroductionIntent; state: string; revision: number;
  settlement: string; sharedProfile: unknown | null; payment: { status: string; charged: boolean };
}
const origin = 'http://localhost:3004'
const originalModelText = 'MODEL_ORIGINAL_WORDING_CANARY: I build Monad onboarding prototypes.'
const privateSource = 'PRIVATE_SOURCE_CANARY'
const privateGoal = 'PRIVATE_GOAL_CANARY'
const privateNote = 'PRIVATE_AGENT_NOTE_CANARY'
const privateContext = 'SENDER_PROFILE_CONTEXT_CANARY'

/**
 * Joins hosted drafting to real offchain delivery over localhost HTTP.
 * Inference alone is injected: no external model, chain or deployed account.
 * The explicit POST below stands for user approval; UI confirmation is covered
 * independently by agent-ui-test.mjs, not impersonated by this API test.
 */
test('two-person local journey: hosted draft → edited approval → same receipt → recipient decision → restart', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'signalpass-agent-journey-'))
  const operations: string[] = []
  const model: AgentModel = {
    provider: 'deterministic-journey-fixture', model: 'no-network',
    async generate(request) {
      operations.push(request.operation)
      const input = request.input as { senderProfile: AgentProfile; candidates?: AgentProfile[]; recipientProfile?: AgentProfile }
      assert.equal(input.senderProfile.handle, 'journey-sender')
      assert(input.senderProfile.building.includes(privateContext), 'The explicitly consented profile reaches inference')
      assert(!JSON.stringify(input).includes(privateSource), 'Private source links never reach inference')
      if (request.operation === 'discover') {
        assert.equal(input.candidates?.length, 1)
        const candidate = input.candidates![0]!
        return { data: { matches: [{ handle: candidate.handle, reason: 'This person offers the requested onboarding review.', caveat: 'Availability still needs a conversation.', evidence: [{ field: 'canOffer', quote: candidate.canOffer }] }], nextQuestion: null }, inputTokens: 1, outputTokens: 1 }
      }
      assert.equal(input.recipientProfile?.handle, 'journey-recipient')
      return {
        data: { intent: { whoAmI: originalModelText, whyYou: 'Your profile mentions wallet onboarding reviews.', whatIOffer: 'I can help prototype an interface in return.', nextStep: 'Would you review my prototype?' }, notes: [privateNote] },
        inputTokens: 1, outputTokens: 1,
      }
    },
  }
  const options = { origin, databasePath: join(dir, 'journey.sqlite'), agent: { model } }
  let api = createApp(options)
  let server: Server | undefined
  let base = ''
  const start = async () => {
    server = serve({ fetch: api.app.fetch, hostname: '127.0.0.1', port: 0 }) as Server
    await once(server, 'listening')
    const address = server.address()
    assert(address && typeof address === 'object')
    base = `http://127.0.0.1:${address.port}`
  }
  const stop = async () => {
    if (!server) return
    const closing = new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()))
    server.closeAllConnections()
    await closing
    server = undefined
  }
  const request = async <T>(identity: Identity | null, path: string, body?: unknown) => {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { origin, 'content-type': 'application/json', ...(identity ? { cookie: identity.cookie, 'x-signalpass-csrf': identity.csrf } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(5000),
    })
    return { status: response.status, data: await response.json() as T, headers: response.headers }
  }
  const login = async (number: number, handle: string): Promise<Identity> => {
    // Known TEST-only keys are used solely to sign local SIWE challenges.
    const account = privateKeyToAccount(('0x' + number.toString(16).padStart(64, '0')) as Hex)
    const challenge = await request<{ message: string; nonce: string }>(null, '/auth/challenge', { address: account.address, chainId: 10143 })
    assert.equal(challenge.status, 200)
    const signature = await account.signMessage({ message: challenge.data.message })
    const verified = await request<{ session: { csrf: string } }>(null, '/auth/verify', { nonce: challenge.data.nonce, signature })
    assert.equal(verified.status, 200)
    const setCookie = verified.headers.get('set-cookie')!
    assert.match(setCookie, /HttpOnly/i)
    const identity = { cookie: setCookie.split(';')[0]!, csrf: verified.data.session.csrf }
    const isSender = handle === 'journey-sender'
    const approved = await request(identity, '/me/profile', {
      handle,
      profile: {
        name: isSender ? 'Synthetic prototype maker' : 'Synthetic usability reviewer',
        bio: isSender ? `${privateContext}: Building Monad wallet onboarding prototypes.` : 'Testing how people get started with Monad wallets.',
        interests: 'Monad, wallet onboarding',
        offer: isSender ? 'Frontend prototyping and product feedback.' : 'Usability reviews of Monad wallet onboarding prototypes.',
        meet: isSender ? 'People who review wallet onboarding.' : 'Prototype makers who can exchange product feedback.',
      },
      agent: { visibility: 'public', matching: true, sources: ['github'], interests: ['Monad', 'Wallet onboarding'] },
      sourceLinks: { github: `https://example.invalid/${privateSource}` }, avatar: 'none',
    })
    assert.equal(approved.status, 200)
    return identity
  }
  try {
    await start()
    const sender = await login(71, 'journey-sender')
    const recipient = await login(72, 'journey-recipient')
    const discovered = await request<{ run: AgentRun }>(sender, '/agent/discover', { goal: `Find a reviewer for my Monad wallet onboarding prototype. ${privateGoal}`, useProfile: true })
    assert.equal(discovered.status, 200)
    assert.equal(discovered.data.run.matches[0]?.handle, 'journey-recipient')
    const prepared = await request<{ draft: AgentDraft }>(sender, '/agent/draft', { runId: discovered.data.run.id, recipientHandle: discovered.data.run.matches[0]!.handle, useProfile: true })
    assert.equal(prepared.status, 200)
    const draft = prepared.data.draft
    assert.equal(draft.intent.whoAmI, originalModelText)
    assert.equal((await request(sender, '/agent/drafts/' + draft.id)).status, 200)
    assert.equal((await request(recipient, '/agent/drafts/' + draft.id)).status, 404)
    assert.deepEqual((await request<{ introductions: Receipt[] }>(recipient, '/introductions?box=inbox')).data.introductions, [])
    assert.deepEqual((await request<{ introductions: Receipt[] }>(sender, '/introductions?box=outbox')).data.introductions, [])

    // Human edits replace the original model text. Consent to inference does
    // not imply consent to attach an approved profile to the sent introduction.
    const edited: IntroductionIntent = { ...draft.intent, whoAmI: 'I built a wallet onboarding prototype and would value your feedback.', nextStep: 'Would a ten-minute walkthrough next week work for you?' }
    const approved = { recipientHandle: draft.recipientHandle, intent: edited, idempotencyKey: randomUUID(), settlement: 'offchain', sharedContext: false }
    const submitted = await request<{ introduction: Receipt }>(sender, '/introductions', approved)
    assert.equal(submitted.status, 201)
    const id = submitted.data.introduction.id
    assert.notEqual(id, draft.id)
    assert.deepEqual(submitted.data.introduction.intent, edited)
    const received = await request<{ introductions: Receipt[] }>(recipient, '/introductions?box=inbox')
    assert.equal(received.status, 200)
    assert.equal(received.data.introductions.length, 1)
    const delivered = received.data.introductions[0]!
    assert.equal(delivered.id, id)
    assert.deepEqual(delivered.intent, edited)
    assert.equal(delivered.role, 'recipient')
    assert.equal(delivered.sharedProfile, null)
    for (const marker of [originalModelText, privateGoal, privateSource, privateNote, privateContext]) assert(!JSON.stringify(received.data).includes(marker), `Private or superseded text reached the recipient: ${marker}`)

    for (const [identity, role] of [[sender, 'sender'], [recipient, 'recipient']] as const) {
      const receipt = await request<{ introduction: Receipt }>(identity, '/introductions/' + id)
      assert.equal(receipt.status, 200)
      assert.equal(receipt.headers.get('cache-control'), 'no-store')
      assert.equal(receipt.data.introduction.id, id)
      assert.equal(receipt.data.introduction.role, role)
      assert.deepEqual(receipt.data.introduction.intent, edited)
      assert.equal(receipt.data.introduction.settlement, 'offchain')
      assert.equal(receipt.data.introduction.payment.charged, false)
      assert.equal(receipt.data.introduction.payment.status, 'not_connected')
    }
    const accepted = await request<{ introduction: Receipt }>(recipient, '/introductions/' + id + '/transition', { revision: delivered.revision, to: 'accepted' })
    assert.equal(accepted.status, 200)
    assert.equal(accepted.data.introduction.id, id)
    assert.equal(accepted.data.introduction.state, 'accepted')

    await stop()
    api.close()
    api = createApp(options)
    await start()
    for (const identity of [sender, recipient]) {
      const persisted = await request<{ introduction: Receipt }>(identity, '/introductions/' + id)
      assert.equal(persisted.status, 200, 'Original signed sessions survive application restart')
      assert.equal(persisted.data.introduction.state, 'accepted')
      assert.deepEqual(persisted.data.introduction.intent, edited)
      assert.equal(persisted.data.introduction.sharedProfile, null)
    }
    assert.equal((await request(sender, '/agent/drafts/' + draft.id)).status, 200)
    assert.equal((await request(sender, '/agent/history/clear', {})).status, 200)
    assert.equal((await request(sender, '/agent/drafts/' + draft.id)).status, 404)
    const afterClear = await request<{ introduction: Receipt }>(recipient, '/introductions/' + id)
    assert.equal(afterClear.status, 200, 'Clearing private assistant history does not erase delivered messages')
    assert.deepEqual(afterClear.data.introduction.intent, edited)
    assert.deepEqual(operations, ['discover', 'draft'], 'Delivery, receipt and restart never invoke inference again')
  } finally {
    await stop()
    api.close()
    rmSync(dir, { recursive: true, force: true })
  }
})
