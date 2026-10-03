import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import type { Hex } from 'viem'
import { createApp } from './app.js'
import { collection } from './database.js'
import type { AgentDraft, AgentModel, AgentProfile, HostedAgentOptions } from './agent-types.js'

const origin = 'http://localhost:3004'
const accounts = [11, 12, 13, 14, 15, 16, 17].map((n) => privateKeyToAccount(('0x' + n.toString(16).padStart(64, '0')) as Hex))
const goal = 'Find collaborators for Monad developer tooling and contract simulations.'
const profile = (handle: string) => ({ handle, profile: { name: handle.toUpperCase(), bio: `${handle} builds Monad developer tooling.`, interests: 'Monad, tooling', offer: 'Contract simulation and product feedback.', meet: 'People interested in testing wallet onboarding.' }, agent: { visibility: 'public', matching: true, sources: ['github'], interests: ['Monad', 'developer tooling'] }, sourceLinks: { github: 'https://example.com/PRIVATE_SOURCE_CANARY' }, avatar: 'alex' })
const intent = { whoAmI: 'I build Monad developer tooling.', whyYou: 'Your contract simulation work relates to my goal.', whatIOffer: 'Product feedback on developer tooling.', nextStep: 'Would a short written exchange be useful?' }
type Request = Parameters<AgentModel['generate']>[0]
type Identity = { cookie: string; csrf: string }
class TestModel implements AgentModel {
  readonly provider = 'test-provider'
  readonly model = 'test-model'
  readonly requests: Request[] = []
  respond: (request: Request) => unknown | Promise<unknown> = (request) => {
    if (request.operation === 'draft') return { intent, notes: ['Review the wording before sending.'] }
    const candidates = (request.input as { candidates: AgentProfile[] }).candidates
    return { matches: candidates.slice(0, 1).map((candidate) => ({ handle: candidate.handle, reason: 'Their self-reported offer includes contract simulation.', caveat: 'Their availability has not been confirmed.', evidence: [{ field: 'canOffer', quote: candidate.canOffer }] })), nextQuestion: null }
  }
  async generate(request: Request) {
    this.requests.push(request)
    return { data: await this.respond(request), inputTokens: 10, outputTokens: 20 }
  }
}
function harness(agent?: HostedAgentOptions, databasePath?: string) {
  let api = createApp({ origin, agent, databasePath })
  const request = async (user: Identity | null, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const response = await api.app.request(path, { method: body === undefined ? 'GET' : 'POST', headers: { origin, 'content-type': 'application/json', ...(user ? { cookie: user.cookie, 'x-signalpass-csrf': user.csrf } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, data: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  const login = async (index: number, handle?: string) => {
    const account = accounts[index]!
    const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 10143 })
    const signature = await account.signMessage({ message: challenge.data.message })
    const verified = await request(null, '/auth/verify', { nonce: challenge.data.nonce, signature })
    assert.equal(verified.status, 200)
    const user = { cookie: verified.cookie, csrf: verified.data.session.csrf }
    if (handle) assert.equal((await request(user, '/me/profile', profile(handle))).status, 200)
    return user
  }
  return { request, login, get api() { return api }, restart() { api.close(); api = createApp({ origin, agent, databasePath }) }, close() { api.close() } }
}

test('hosted agent routes require signed auth and CSRF; disabled provider is explicit', async () => {
  const h = harness()
  try {
    assert.equal((await h.request(null, '/agent/status')).status, 401)
    assert.equal((await h.request(null, '/agent/workspace')).status, 401)
    assert.equal((await h.request(null, '/agent/discover', { goal })).status, 401)
    const alice = await h.login(0)
    const status = await h.request(alice, '/agent/status')
    assert.equal(status.data.enabled, false)
    assert.equal(status.data.provider, null)
    assert.equal(status.data.remainingToday, 20)
    assert.deepEqual(status.data.capabilities, ['discover', 'draft'])
    assert.equal((await h.request(alice, '/agent/discover', { goal }, { 'x-signalpass-csrf': 'wrong' })).status, 403)
    assert.equal((await h.request(alice, '/agent/discover', { goal }, { origin: 'https://evil.example' })).status, 403)
    const disabled = await h.request(alice, '/agent/discover', { goal })
    assert.equal(disabled.status, 503)
    assert.equal(disabled.data.error, 'agent_not_configured')
    assert.equal((await h.request(alice, '/agent/status')).data.remainingToday, 20)
    assert.deepEqual((await h.request(alice, '/agent/workspace')).data, { runs: [], drafts: [] })
  } finally { h.close() }
})

test('discovery sends only public opted-in candidates and consented approved sender fields; draft stays private', async () => {
  const model = new TestModel()
  const h = harness({ model })
  try {
    const alice = await h.login(0, 'alice')
    await h.login(1, 'bob')
    const eve = await h.login(2, 'eve')
    const dora = await h.login(3, 'dora')
    const fred = await h.login(4, 'fred')
    await h.login(5, 'george')
    const privateProfile = profile('eve'); privateProfile.agent.visibility = 'private'
    const unlistedProfile = profile('dora'); unlistedProfile.agent.visibility = 'limited'
    const optedOut = profile('fred'); optedOut.agent.matching = false
    await h.request(eve, '/me/profile', privateProfile)
    await h.request(dora, '/me/profile', unlistedProfile)
    await h.request(fred, '/me/profile', optedOut)
    const closed = h.api.store.profiles.get('george')!
    h.api.store.profiles.set('george', { ...closed, availability: 'closed' })
    h.api.store.profiles.set('unapproved', { ...closed, handle: 'unapproved', owner: accounts[6]!.address, availability: 'open' })
    const discovered = await h.request(alice, '/agent/discover', { goal })
    assert.equal(discovered.status, 200)
    assert.equal(discovered.data.run.usedProfile, false)
    assert.equal(discovered.data.run.profileVersion, null)
    assert.equal(discovered.data.run.matches[0].handle, 'bob')
    const payload = model.requests[0]!.input as any
    assert.equal(payload.senderProfile, null)
    assert.deepEqual(payload.candidates.map((candidate: AgentProfile) => candidate.handle), ['bob'])
    const serialized = JSON.stringify(payload)
    assert(!serialized.includes('PRIVATE_SOURCE_CANARY'))
    assert(!serialized.includes('owner'))
    assert(!serialized.includes('alice builds'))
    for (const account of accounts) assert(!serialized.toLowerCase().includes(account.address.toLowerCase()))
    const runId = discovered.data.run.id
    const missingConsent = await h.request(alice, '/agent/draft', { runId, recipientHandle: 'bob' })
    assert.equal(missingConsent.status, 409)
    assert.equal(missingConsent.data.error, 'agent_profile_consent_required')
    assert.equal((await h.request(eve, '/agent/draft', { runId, recipientHandle: 'bob', useProfile: true })).data.error, 'agent_run_not_found')
    const drafted = await h.request(alice, '/agent/draft', { runId, recipientHandle: 'bob', useProfile: true })
    assert.equal(drafted.status, 200)
    assert.deepEqual(drafted.data.draft.intent, intent)
    assert.equal(drafted.data.draft.usedProfile, true)
    assert.equal(drafted.data.draft.expiresAt - drafted.data.draft.createdAt, 1800)
    assert.equal((model.requests[1]!.input as any).senderProfile.handle, 'alice')
    assert(!JSON.stringify(model.requests[1]!.input).includes('PRIVATE_SOURCE_CANARY'))
    const id = drafted.data.draft.id
    assert.equal((await h.request(alice, '/agent/drafts/' + id)).status, 200)
    assert.equal((await h.request(eve, '/agent/drafts/' + id)).data.error, 'agent_draft_not_found')
    assert.deepEqual((await h.request(eve, '/agent/workspace')).data, { runs: [], drafts: [] })
    assert.equal(h.api.store.introductions.size, 0)
    const consented = await h.request(alice, '/agent/discover', { goal, useProfile: true })
    assert.equal(consented.data.run.usedProfile, true)
    assert.equal((model.requests.at(-1)!.input as any).senderProfile.handle, 'alice')
    assert.equal((await h.request(alice, '/agent/draft', { runId: consented.data.run.id, recipientHandle: 'bob', useProfile: false })).data.error, 'agent_profile_consent_required')
    await h.request(eve, '/agent/history/clear', {})
    assert.equal((await h.request(alice, '/agent/workspace')).data.drafts.length, 1)
    await h.request(alice, '/agent/history/clear', {})
    assert.equal((await h.request(alice, '/agent/drafts/' + id)).status, 404)
    assert.deepEqual((await h.request(alice, '/agent/workspace')).data, { runs: [], drafts: [] })
    assert.equal((await h.request(alice, '/agent/status')).data.remainingToday, 17)
  } finally { h.close() }
})

test('malicious or malformed model output fails closed, including unknown handles and fabricated evidence', async () => {
  const model = new TestModel(), h = harness({ model })
  try {
    const alice = await h.login(0, 'alice'); await h.login(1, 'bob')
    const good = { handle: 'bob', reason: 'Can help with simulation.', caveat: 'Availability is unconfirmed.', evidence: [{ field: 'canOffer', quote: 'Contract simulation' }] }
    for (const matches of [[{ ...good, handle: 'invented' }], [good, good], [{ ...good, evidence: [{ field: 'canOffer', quote: 'Invented expertise' }] }], [{ ...good, evidence: [] }], [{ ...good, sourceLinks: 'unexpected' }]]) {
      model.respond = () => ({ matches, nextQuestion: null })
      const result = await h.request(alice, '/agent/discover', { goal })
      assert.equal(result.status, 502)
      assert.equal(result.data.error, 'agent_unavailable')
    }
    assert.equal((await h.request(alice, '/agent/workspace')).data.runs.length, 0)
    model.respond = () => ({ matches: [good], nextQuestion: null })
    const discovered = await h.request(alice, '/agent/discover', { goal, useProfile: true })
    assert.equal(discovered.status, 200)
    model.respond = () => ({ intent: { ...intent, whoAmI: 'x'.repeat(601) }, notes: [] })
    assert.equal((await h.request(alice, '/agent/draft', { runId: discovered.data.run.id, recipientHandle: 'bob' })).status, 502)
    model.respond = () => ({ intent: { ...intent, nextStep: '   ' }, notes: [] })
    assert.equal((await h.request(alice, '/agent/draft', { runId: discovered.data.run.id, recipientHandle: 'bob' })).status, 502)
    assert.equal((await h.request(alice, '/agent/workspace')).data.drafts.length, 0)
    assert.equal(h.api.store.introductions.size, 0)
  } finally { h.close() }
})

test('drafts reject changed profiles, revoked matching, expiry, and stale discovery snapshots', async () => {
  const h = harness({ model: new TestModel() })
  try {
    const alice = await h.login(0, 'alice'), bob = await h.login(1, 'bob')
    const discover = async () => (await h.request(alice, '/agent/discover', { goal, useProfile: true })).data.run.id
    const draft = async (runId: string) => h.request(alice, '/agent/draft', { runId, recipientHandle: 'bob' })
    const initialRun = await discover()
    const first = await draft(initialRun)
    assert.equal(first.status, 200)
    const changed = profile('bob'); changed.agent.matching = false
    await h.request(bob, '/me/profile', changed)
    assert.equal((await draft(initialRun)).data.error, 'agent_candidate_unavailable')
    assert.equal((await h.request(alice, '/agent/drafts/' + first.data.draft.id)).data.error, 'agent_draft_stale')
    assert.deepEqual((await h.request(alice, '/agent/workspace')).data.runs[0].matches, [])
    assert.deepEqual((await h.request(alice, '/agent/workspace')).data.drafts, [])
    await h.request(bob, '/me/profile', profile('bob'))
    const senderRun = await discover()
    const senderChanged = profile('alice'); senderChanged.profile.offer = 'A new offer not used in the discovery.'
    await h.request(alice, '/me/profile', senderChanged)
    assert.equal((await draft(senderRun)).data.error, 'agent_draft_stale')
    const currentRun = await discover()
    const currentDraft = (await draft(currentRun)).data.draft as AgentDraft
    const stored = collection<{ owner: string; draft: AgentDraft; generation: number }>(h.api.store.db, 'agent_drafts')
    const record = stored.get(currentDraft.id)!
    stored.set(currentDraft.id, { ...record, draft: { ...record.draft, expiresAt: Math.floor(Date.now() / 1000) - 1 } })
    assert.equal((await h.request(alice, '/agent/drafts/' + currentDraft.id)).data.error, 'agent_draft_stale')
    const changedRecipient = profile('bob'); changedRecipient.profile.bio = 'Changed recipient context.'
    await h.request(bob, '/me/profile', changedRecipient)
    assert.equal((await draft(currentRun)).data.error, 'agent_candidate_unavailable')
  } finally { h.close() }
})

test('approved sender profile is required for consented discovery and drafting', async () => {
  const model = new TestModel(), h = harness({ model })
  try {
    const alice = await h.login(0); await h.login(1, 'bob')
    assert.equal((await h.request(alice, '/agent/discover', { goal, useProfile: true })).data.error, 'profile_required')
    assert.equal(model.requests.length, 0)
    const discovery = await h.request(alice, '/agent/discover', { goal })
    assert.equal(discovery.status, 200)
    assert.equal((await h.request(alice, '/agent/draft', { runId: discovery.data.run.id, recipientHandle: 'bob', useProfile: true })).data.error, 'profile_required')
    assert.equal(model.requests.length, 1)
  } finally { h.close() }
})

test('persistent user/global budgets count failures and cannot be reset by clearing history or restarting', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'signalpass-agent-budget-'))
  const model = new TestModel(), h = harness({ model, dailyUserLimit: 2, dailyGlobalLimit: 3 }, join(dir, 'agent.sqlite'))
  try {
    const alice = await h.login(0, 'alice'), bob = await h.login(1, 'bob')
    assert.equal((await h.request(alice, '/agent/discover', { goal })).status, 200)
    model.respond = () => { throw new Error('provider unavailable PRIVATE_ERROR_CANARY') }
    const failed = await h.request(alice, '/agent/discover', { goal })
    assert.equal(failed.status, 502)
    assert.equal(JSON.stringify(failed.data).includes('PRIVATE_ERROR_CANARY'), false)
    await h.request(alice, '/agent/history/clear', {})
    h.restart()
    assert.equal((await h.request(alice, '/agent/status')).data.remainingToday, 0)
    assert.equal((await h.request(alice, '/agent/discover', { goal })).data.error, 'agent_budget_exhausted')
    assert.equal((await h.request(bob, '/agent/status')).data.remainingToday, 1)
    assert.equal((await h.request(bob, '/agent/discover', { goal })).status, 502)
    assert.equal((await h.request(bob, '/agent/discover', { goal })).data.error, 'agent_budget_exhausted')
    assert.equal(model.requests.length, 3)
    h.api.store.db.prepare("UPDATE agent_usage SET day = '2000-01-01'").run()
    assert.equal((await h.request(alice, '/agent/status')).data.remainingToday, 2)
  } finally { h.close(); rmSync(dir, { recursive: true, force: true }) }
})

for (const exhausted of ['account', 'site'] as const) {
  test(`UTC midnight cannot check tomorrow's ${exhausted} budget while charging yesterday`, async context => {
    context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-02T23:59:59.999Z') })
    const model = new TestModel(), h = harness({ model, dailyUserLimit: 2, dailyGlobalLimit: 3 })
    try {
      const alice = await h.login(0, 'alice')
      await h.login(1, 'bob')
      const owner = accounts[0]!.address.toLowerCase()
      const ownerAttempts = exhausted === 'account' ? 2 : 0
      const globalAttempts = exhausted === 'site' ? 3 : 1
      const db = h.api.store.db
      db.prepare('INSERT INTO agent_usage(day,owner,attempts) VALUES(?,?,?)').run('2026-10-02', owner, ownerAttempts)
      db.prepare('INSERT INTO agent_usage(day,owner,attempts) VALUES(?,?,?)').run('2026-10-02', '*', globalAttempts)
      const prepare = db.prepare
      let crossedMidnight = false
      context.mock.method(db, 'prepare', function (sql: string) {
        // Advance after reserve captures its UTC day, before either usage lookup.
        if (!crossedMidnight && sql === 'DELETE FROM agent_inflight WHERE expires_at <= ?') {
          context.mock.timers.tick(1)
          crossedMidnight = true
        }
        return prepare.call(db, sql)
      })

      const rejected = await h.request(alice, '/agent/discover', { goal })
      assert.equal(crossedMidnight, true)
      assert.equal(new Date().toISOString(), '2026-10-03T00:00:00.000Z')
      assert.equal(rejected.status, 429)
      assert.equal(rejected.data.error, 'agent_budget_exhausted')
      assert.equal(model.requests.length, 0)
      const usage = (day: string, key: string) => Number(db.prepare('SELECT attempts FROM agent_usage WHERE day = ? AND owner = ?').get(day, key)?.attempts ?? 0)
      assert.equal(usage('2026-10-02', owner), ownerAttempts)
      assert.equal(usage('2026-10-02', '*'), globalAttempts)
      assert.equal(usage('2026-10-03', owner), 0)
      assert.equal(usage('2026-10-03', '*'), 0)

      // A new request legitimately uses the fresh UTC-day allowance.
      assert.equal((await h.request(alice, '/agent/discover', { goal })).status, 200)
      assert.equal(model.requests.length, 1)
      assert.equal(usage('2026-10-03', owner), 1)
      assert.equal(usage('2026-10-03', '*'), 1)
      assert.equal((await h.request(alice, '/agent/status')).data.remainingToday, 1)
    } finally { context.mock.restoreAll(); context.mock.timers.reset(); h.close() }
  })
}

test('concurrent model work reserves durable quota before awaiting, with per-user and global limits', async () => {
  const model = new TestModel(), h = harness({ model, maxConcurrent: 2 })
  const pending: Array<(data: unknown) => void> = []
  model.respond = () => new Promise((resolve) => pending.push(resolve))
  const waitFor = async (count: number) => { for (let i = 0; i < 50 && pending.length < count; i++) await new Promise<void>((resolve) => setImmediate(resolve)); assert.equal(pending.length, count) }
  try {
    const alice = await h.login(0, 'alice'), bob = await h.login(1, 'bob'), eve = await h.login(2, 'eve')
    const first = h.request(alice, '/agent/discover', { goal }); await waitFor(1)
    assert.equal((await h.request(alice, '/agent/status')).data.remainingToday, 19)
    assert.equal((await h.request(alice, '/agent/discover', { goal })).data.error, 'agent_busy')
    assert.equal((await h.request(alice, '/agent/status')).data.remainingToday, 19)
    const second = h.request(bob, '/agent/discover', { goal }); await waitFor(2)
    assert.equal((await h.request(eve, '/agent/discover', { goal })).data.error, 'agent_busy')
    assert.equal((await h.request(eve, '/agent/status')).data.remainingToday, 20)
    pending.forEach((resolve) => resolve({ matches: [], nextQuestion: 'What kind of collaboration would help?' }))
    assert.equal((await first).status, 200)
    assert.equal((await second).status, 200)
    assert.equal(Number(h.api.store.db.prepare('SELECT count(*) AS n FROM agent_inflight').get()?.n), 0)
  } finally { pending.forEach((resolve) => resolve({ matches: [], nextQuestion: null })); h.close() }
})

test('profile changes and history clearing during inference cannot publish stale private results', async () => {
  const model = new TestModel(), h = harness({ model })
  let resolve: ((data: unknown) => void) | undefined
  model.respond = () => new Promise((done) => { resolve = done })
  const waitFor = async () => { for (let i = 0; i < 50 && !resolve; i++) await new Promise<void>((done) => setImmediate(done)); assert(resolve) }
  try {
    const alice = await h.login(0, 'alice'), bob = await h.login(1, 'bob')
    const first = h.request(alice, '/agent/discover', { goal }); await waitFor()
    const hidden = profile('bob'); hidden.agent.visibility = 'private'
    await h.request(bob, '/me/profile', hidden)
    resolve!({ matches: [{ handle: 'bob', reason: 'Contract simulation.', caveat: 'Unconfirmed.', evidence: [{ field: 'canOffer', quote: 'Contract simulation' }] }], nextQuestion: null })
    assert.equal((await first).data.error, 'agent_candidate_unavailable')
    await h.request(bob, '/me/profile', profile('bob'))
    resolve = undefined
    const second = h.request(alice, '/agent/discover', { goal }); await waitFor()
    await h.request(alice, '/agent/history/clear', {})
    resolve!({ matches: [], nextQuestion: null })
    assert.equal((await second).data.error, 'agent_history_cleared')
    assert.deepEqual((await h.request(alice, '/agent/workspace')).data, { runs: [], drafts: [] })
  } finally { resolve?.({ matches: [], nextQuestion: null }); h.close() }
})

test('candidate context and durable history are bounded, with seven-day pruning', async () => {
  const model = new TestModel(), h = harness({ model, dailyUserLimit: 100, dailyGlobalLimit: 100 })
  try {
    const alice = await h.login(0, 'alice'); await h.login(1, 'bob')
    const sample = h.api.store.profiles.get('bob')!, settings = h.api.store.settings.get(sample.owner.toLowerCase())!
    for (let n = 0; n < 50; n++) {
      const owner = ('0x' + (1000 + n).toString(16).padStart(40, '0')) as Hex
      const handle = 'candidate' + n
      h.api.store.profiles.set(handle, { ...sample, owner, handle })
      h.api.store.settings.set(owner, settings)
    }
    let latestId = ''
    for (let n = 0; n < 52; n++) {
      const result = await h.request(alice, '/agent/discover', { goal })
      assert.equal(result.status, 200)
      latestId = result.data.run.id
      assert.equal(result.data.run.consideredCandidates, 40)
      assert.equal(result.data.run.eligibleCandidates, 51)
      assert.equal((model.requests.at(-1)!.input as any).candidates.length, 40)
    }
    const workspace = (await h.request(alice, '/agent/workspace')).data
    assert.equal(workspace.runs.length, 50)
    assert(workspace.runs.some((run: any) => run.id === latestId))
    h.api.store.db.prepare("UPDATE documents SET value = json_set(value, '$.run.createdAt', 0) WHERE collection = 'agent_runs'").run()
    assert.equal((await h.request(alice, '/agent/workspace')).data.runs.length, 0)
  } finally { h.close() }
})
