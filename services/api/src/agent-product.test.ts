import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { privateKeyToAccount } from 'viem/accounts'
import type { Hex } from 'viem'
import { createApp } from './app.js'
import type { AgentModel, AgentProfile, HostedAgentOptions } from './agent-types.js'

// Contract fixtures, not a claim about live model ranking or reasoning quality.
const corpus = JSON.parse(readFileSync(new URL('../fixtures/agent-quality-cases.json', import.meta.url), 'utf8')) as {
  sender: AgentProfile
  profiles: AgentProfile[]
  cases: Array<{ id: string; goal: string; answer?: string; plausibleHandles: string[] }>
}
const origin = 'http://localhost:3004'
type Identity = { cookie: string; csrf: string }
type Request = Parameters<AgentModel['generate']>[0]
type DiscoveryInput = { goal: string; clarificationAnswers: string[]; senderProfile: AgentProfile | null; candidates: AgentProfile[] }
const intro = {
  whoAmI: 'I am building a Monad wallet onboarding prototype for first-time users.',
  whyYou: 'Your profile offers reviews of wallet connection failures.',
  whatIOffer: 'I can offer frontend prototypes and structured usability feedback.',
  nextStep: 'Would a short written exchange be useful?',
}
const suppliedProfile = (p: AgentProfile) => ({
  handle: p.handle,
  profile: { name: p.displayName, bio: p.building, interests: p.interests.join(', '), offer: p.canOffer, meet: p.wantsToMeet },
  agent: { visibility: 'public', matching: true, sources: ['github'], interests: p.interests },
  sourceLinks: { github: 'https://example.invalid/PRIVATE_PROFILE_SOURCE' }, avatar: 'none',
})
function fixture(options: Omit<HostedAgentOptions, 'model'> = {}) {
  const calls: Request[] = []
  let respond: (request: Request) => unknown = (request) => request.operation === 'draft' ? { intent: intro, notes: [] } : { matches: [], nextQuestion: null }
  const model: AgentModel = { provider: 'synthetic-contract-fixture', model: 'no-network', async generate(request) { calls.push(request); return { data: respond(request), inputTokens: 1, outputTokens: 1 } } }
  const api = createApp({ origin, agent: { model, ...options } })
  const request = async (user: Identity | null, path: string, body?: unknown) => {
    const r = await api.app.request(path, { method: body === undefined ? 'GET' : 'POST', headers: { origin, 'content-type': 'application/json', ...(user ? { cookie: user.cookie, 'x-signalpass-csrf': user.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: r.status, data: await r.json() as any, cookie: r.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  const login = async (index: number, profile?: AgentProfile) => {
    const account = privateKeyToAccount(('0x' + (801 + index).toString(16).padStart(64, '0')) as Hex)
    const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 10143 })
    const verified = await request(null, '/auth/verify', { nonce: challenge.data.nonce, signature: await account.signMessage({ message: challenge.data.message }) })
    assert.equal(verified.status, 200)
    const user = { cookie: verified.cookie, csrf: verified.data.session.csrf }
    if (profile) assert.equal((await request(user, '/me/profile', suppliedProfile(profile))).status, 200)
    return user
  }
  const select = (input: DiscoveryInput, handles: string[], field: 'canOffer' | 'interests' = 'canOffer') => ({
    matches: handles.map((handle) => {
      const profile = input.candidates.find((candidate) => candidate.handle === handle)!
      assert(profile, 'Fixture must select a profile actually supplied to inference')
      return { handle, reason: field === 'interests' ? 'An exploratory shared interest, with no stated audit qualification.' : 'The supplied offer relates to this goal.', caveat: 'Availability and willingness to collaborate remain unconfirmed.', evidence: [{ field, quote: field === 'interests' ? profile.interests.join(', ') : profile.canOffer }] }
    }), nextQuestion: null,
  })
  const all = async () => {
    const sender = await login(0, corpus.sender)
    const others: Identity[] = []
    for (const [index, profile] of corpus.profiles.entries()) others.push(await login(index + 1, profile))
    return { sender, others }
  }
  return { api, calls, request, login, select, all, setResponse(fn: typeof respond) { respond = fn }, close: () => api.close() }
}

test('synthetic multi-candidate contract exposes exact individual evidence without asserting mutual agreement', async () => {
  const h = fixture()
  try {
    const { sender } = await h.all()
    const scenario = corpus.cases.find((item) => item.id === 'multiple-plausible')!
    h.setResponse((request) => h.select(request.input as DiscoveryInput, scenario.plausibleHandles))
    const found = await h.request(sender, '/agent/discover', { goal: scenario.goal, useProfile: true })
    assert.equal(found.status, 200)
    assert.equal(found.data.run.matches.length, 2)
    assert.equal(found.data.run.modelCalled, true)
    for (const match of found.data.run.matches) {
      const source = corpus.profiles.find((candidate) => candidate.handle === match.handle)!
      assert.equal(match.connection.goal, scenario.goal)
      assert.deepEqual(match.connection.recipientEvidence, { field: 'canOffer', quote: source.canOffer })
      assert.deepEqual(match.connection.senderEvidence, { field: 'canOffer', quote: corpus.sender.canOffer })
      assert.equal(match.connection.basis, 'profile_evidence')
      assert.equal(match.connection.suggestedFirstStep, 'Would a short written exchange about this goal be useful?')
      assert.deepEqual(match.connection.sharedInterests, corpus.sender.interests.filter((interest) => source.interests.includes(interest)))
    }
    assert(!JSON.stringify(h.calls).includes('PRIVATE_PROFILE_SOURCE'))
    const anonymousContext = await h.request(sender, '/agent/discover', { goal: scenario.goal, useProfile: false })
    assert.equal(anonymousContext.status, 200)
    assert.equal((h.calls.at(-1)!.input as DiscoveryInput).senderProfile, null)
    assert.equal(anonymousContext.data.run.matches[0].connection.senderEvidence, null)
    assert.deepEqual(anonymousContext.data.run.matches[0].connection.sharedInterests, [])
    assert.equal((await h.request(sender, '/agent/workspace')).data.runs.find((run: any) => run.id === found.data.run.id).matches[0].connection.senderEvidence.quote, corpus.sender.canOffer)
    assert.equal(h.api.store.introductions.size, 0)
  } finally { h.close() }
})

test('synthetic weak-interest and no-match contracts retain uncertainty and never force recommendations', async () => {
  const h = fixture()
  try {
    const { sender } = await h.all()
    h.setResponse((request) => h.select(request.input as DiscoveryInput, ['sample-community-host'], 'interests'))
    const weak = await h.request(sender, '/agent/discover', { goal: corpus.cases.find((item) => item.id === 'weak-shared-interest')!.goal, useProfile: true })
    assert.equal(weak.status, 200)
    assert.equal(weak.data.run.matches[0].connection.basis, 'shared_interest_only')
    assert.equal(weak.data.run.matches[0].connection.recipientEvidence.field, 'interests')
    h.setResponse(() => ({ matches: [], nextQuestion: 'Would you consider expanding the search outside this community?' }))
    const absent = await h.request(sender, '/agent/discover', { goal: corpus.cases.find((item) => item.id === 'no-match')!.goal })
    assert.equal(absent.status, 200)
    assert.deepEqual(absent.data.run.matches, [])
    assert.equal(absent.data.run.modelCalled, true)
    assert.equal(absent.data.run.eligibleCandidates, 6)
    assert.equal(absent.data.run.nextQuestion, 'Would you consider expanding the search outside this community?')
  } finally { h.close() }
})

test('empty eligible pool returns an honest local result without inference, even at zero budget', async () => {
  const h = fixture({ dailyUserLimit: 0, dailyGlobalLimit: 0 })
  try {
    const sender = await h.login(0, corpus.sender)
    const response = await h.request(sender, '/agent/discover', { goal: corpus.cases[0]!.goal, useProfile: true })
    assert.equal(response.status, 200)
    assert.equal(h.calls.length, 0)
    assert.equal(response.data.provider, null)
    assert.equal(response.data.model, null)
    assert.deepEqual(response.data.run.matches, [])
    assert.equal(response.data.run.modelCalled, false)
    assert.equal(response.data.run.eligibleCandidates, 0)
    assert.equal(response.data.run.consideredCandidates, 0)
    assert.equal(response.data.run.nextQuestion, null)
    assert.equal(response.data.usage.remainingToday, 0)
    assert.equal(Number(h.api.store.db.prepare('SELECT COUNT(*) AS n FROM agent_usage').get()?.n), 0)
  } finally { h.close() }
})

test('refinement preserves original goal, is owner scoped, bounded, and passes answers without parent model text', async () => {
  const h = fixture()
  try {
    const { sender, others } = await h.all()
    const scenario = corpus.cases.find((item) => item.id === 'refinement')!
    h.setResponse((request) => {
      const input = request.input as DiscoveryInput
      return input.clarificationAnswers.length ? h.select(input, scenario.plausibleHandles) : { matches: [], nextQuestion: 'Which part of the app is blocking you? MODEL_QUESTION_CANARY' }
    })
    const first = await h.request(sender, '/agent/discover', { goal: scenario.goal, useProfile: true })
    assert.equal(first.status, 200)
    const stolen = await h.request(others[0]!, '/agent/discover', { parentRunId: first.data.run.id, answer: scenario.answer })
    assert.equal(stolen.status, 404)
    assert.equal(stolen.data.error, 'agent_run_not_found')
    assert.equal((await h.request(sender, '/agent/discover', { parentRunId: first.data.run.id, answer: scenario.answer, goal: 'Replace the original goal.' })).status, 400)
    assert.equal((await h.request(sender, '/agent/discover', { parentRunId: first.data.run.id, answer: 'x'.repeat(601) })).status, 400)
    const refined = await h.request(sender, '/agent/discover', { parentRunId: first.data.run.id, answer: scenario.answer, useProfile: false })
    assert.equal(refined.status, 200)
    assert.equal(refined.data.run.goal, scenario.goal)
    assert.equal(refined.data.run.parentRunId, first.data.run.id)
    assert.deepEqual(refined.data.run.clarifications, [{ question: first.data.run.nextQuestion, answer: scenario.answer }])
    assert.equal(refined.data.run.matches[0].handle, 'sample-indexer')
    assert.equal(refined.data.run.matches[0].connection.senderEvidence, null)
    const input = h.calls.at(-1)!.input as DiscoveryInput
    assert.equal(input.goal, scenario.goal)
    assert.deepEqual(input.clarificationAnswers, [scenario.answer])
    assert.equal(input.senderProfile, null)
    assert(!JSON.stringify(input).includes('MODEL_QUESTION_CANARY'))
    let parent = refined.data.run.id
    for (let n = 0; n < 2; n++) {
      const next = await h.request(sender, '/agent/discover', { parentRunId: parent, answer: 'More detail about indexing backfill.' })
      assert.equal(next.status, 200)
      parent = next.data.run.id
    }
    const before = h.calls.length
    const limited = await h.request(sender, '/agent/discover', { parentRunId: parent, answer: 'Another clarification beyond the limit.' })
    assert.equal(limited.status, 409)
    assert.equal(limited.data.error, 'agent_refinement_limit')
    assert.equal(h.calls.length, before)
  } finally { h.close() }
})

test('clarification changes the bounded candidate shortlist while retaining stale profile protection', async () => {
  const h = fixture()
  try {
    const sender = await h.login(0, corpus.sender)
    const recipient = await h.login(1, { ...corpus.profiles[2]!, handle: 'zz-indexer' })
    const base = h.api.store.profiles.get('zz-indexer')!, settings = h.api.store.settings.get(base.owner.toLowerCase())!
    for (let n = 0; n < 41; n++) {
      const handle = 'aaa-decoy-' + n
      const owner = ('0x' + (10000 + n).toString(16).padStart(40, '0')) as Hex
      h.api.store.profiles.set(handle, { ...base, handle, owner, building: 'People who help improve Monad app design.', canOffer: 'General product feedback.', wantsToMeet: 'People seeking app feedback.' })
      h.api.store.settings.set(owner, { ...settings, agent: { ...settings.agent, interests: ['Monad'] } })
    }
    h.setResponse(() => ({ matches: [], nextQuestion: 'What specific problem are you facing?' }))
    const scenario = corpus.cases.find((item) => item.id === 'refinement')!
    const first = await h.request(sender, '/agent/discover', { goal: scenario.goal, useProfile: true })
    assert.equal(first.status, 200)
    assert.equal((h.calls[0]!.input as DiscoveryInput).candidates.length, 40)
    assert(!(h.calls[0]!.input as DiscoveryInput).candidates.some((candidate) => candidate.handle === 'zz-indexer'))
    const next = await h.request(sender, '/agent/discover', { parentRunId: first.data.run.id, answer: scenario.answer, useProfile: true })
    assert.equal(next.status, 200)
    assert.equal((h.calls.at(-1)!.input as DiscoveryInput).candidates[0]!.handle, 'zz-indexer')
    const changed = { ...corpus.sender, canOffer: 'A changed offer requires a fresh discovery.' }
    await h.request(sender, '/me/profile', suppliedProfile(changed))
    assert.equal((await h.request(sender, '/agent/discover', { parentRunId: next.data.run.id, answer: 'More indexing help.', useProfile: true })).data.error, 'agent_draft_stale')
    assert.equal((await h.request(recipient, '/agent/workspace')).data.runs.length, 0)
  } finally { h.close() }
})

test('draft guard rejects specific invented familiarity and personal claims, while preserving supplied facts', async () => {
  const h = fixture({ dailyUserLimit: 50 })
  try {
    const sender = await h.login(0, corpus.sender); await h.login(1, corpus.profiles[0]!)
    h.setResponse((request) => h.select(request.input as DiscoveryInput, ['sample-wallet-engineer']))
    const found = await h.request(sender, '/agent/discover', { goal: corpus.cases[0]!.goal, useProfile: true })
    const input = { runId: found.data.run.id, recipientHandle: 'sample-wallet-engineer', useProfile: true }
    const invented = [
      { ...intro, whyYou: "I've been following your work for years and want to reconnect." },
      { ...intro, whyYou: 'We met at a conference and discussed wallet onboarding.' },
      { ...intro, whoAmI: 'I have 12 years of wallet engineering experience.' },
      { ...intro, whoAmI: 'I am a certified wallet security auditor.' },
      { ...intro, whoAmI: 'I worked at Google on wallet security.' },
      { ...intro, whoAmI: 'I founded an award-winning wallet startup.' },
      { ...intro, whatIOffer: 'I launched a wallet product for 2 million users.' },
    ]
    for (const intent of invented) {
      h.setResponse(() => ({ intent, notes: [] }))
      const rejected = await h.request(sender, '/agent/draft', input)
      assert.equal(rejected.status, 502, JSON.stringify(intent))
      assert.equal(rejected.data.error, 'agent_draft_ungrounded')
    }
    assert.equal((await h.request(sender, '/agent/workspace')).data.drafts.length, 0)
    h.setResponse(() => ({ intent: intro, notes: [] }))
    assert.equal((await h.request(sender, '/agent/draft', input)).status, 200)
    const sourced = { ...corpus.sender, building: 'I have 12 years of wallet engineering experience.', canOffer: 'I launched a wallet prototype and can offer structured usability feedback.' }
    await h.request(sender, '/me/profile', suppliedProfile(sourced))
    h.setResponse((request) => h.select(request.input as DiscoveryInput, ['sample-wallet-engineer']))
    const renewed = await h.request(sender, '/agent/discover', { goal: corpus.cases[0]!.goal, useProfile: true })
    h.setResponse(() => ({ intent: { ...intro, whoAmI: sourced.building, whatIOffer: sourced.canOffer }, notes: [] }))
    assert.equal((await h.request(sender, '/agent/draft', { ...input, runId: renewed.data.run.id })).status, 200)
    assert.equal(h.api.store.introductions.size, 0)
  } finally { h.close() }
})

test('achievement grounding accepts first-person rendering of exact bio fragments without adding achievements', async () => {
  const h = fixture()
  try {
    const sender = await h.login(0, corpus.sender); await h.login(1, corpus.profiles[0]!)
    const examples = [
      { building: 'Built a Monad wallet onboarding prototype.', whoAmI: 'I built a Monad wallet onboarding prototype.', status: 200 },
      { building: 'Built a Monad wallet onboarding prototype.', whoAmI: "I've built a Monad wallet onboarding prototype.", status: 200 },
      { building: 'Building a Monad wallet onboarding prototype for first-time users.', whoAmI: 'I am building a Monad wallet onboarding prototype for first-time users.', status: 200 },
      { building: 'Built a Monad wallet onboarding prototype.', whoAmI: 'I built a production Monad wallet onboarding platform.', status: 502 },
      { building: 'Have not built a Monad wallet onboarding prototype.', whoAmI: 'I built a Monad wallet onboarding prototype.', status: 502 },
    ]
    for (const example of examples) {
      await h.request(sender, '/me/profile', suppliedProfile({ ...corpus.sender, building: example.building }))
      h.setResponse((request) => h.select(request.input as DiscoveryInput, ['sample-wallet-engineer']))
      const found = await h.request(sender, '/agent/discover', { goal: corpus.cases[0]!.goal, useProfile: true })
      assert.equal(found.status, 200)
      h.setResponse(() => ({ intent: { ...intro, whoAmI: example.whoAmI }, notes: [] }))
      const result = await h.request(sender, '/agent/draft', { runId: found.data.run.id, recipientHandle: 'sample-wallet-engineer', useProfile: true })
      assert.equal(result.status, example.status, `${example.building} → ${example.whoAmI}`)
      if (example.status === 502) assert.equal(result.data.error, 'agent_draft_ungrounded')
    }
  } finally { h.close() }
})
