#!/usr/bin/env node
/**
 * Explicit, isolated live acceptance: discovery -> clarification -> draft.
 * Uses fictional profiles, ephemeral SIWE identities and a temporary SQLite DB.
 * At most three explicitly configured OpenRouter-free or TokenRhythm calls;
 * no deployed API, production DB, introduction, evaluator, contract or RPC
 * calls. No retries or model fallback.
 * Does not load .env files. Never prints generated text, keys, cookies or input.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createApp } from '../src/app.js'
import { configuredHostedAgent } from '../src/agent-provider.js'
import type { AgentDraft, AgentModel, AgentProfile, AgentRun } from '../src/agent-types.js'
import { liveSmokeConfiguration } from './agent-live-smoke.js'

type Environment = Record<string, string | undefined>
type Reporter = (message: string) => void
type Identity = { cookie: string; csrf: string; address: string }
type Workspace = { runs: AgentRun[]; drafts: AgentDraft[] }
type Status = { enabled: boolean; provider: string; model: string; remainingToday: number; limit: number }
const ORIGIN = 'http://localhost:3004'
const FREE_MODEL = /^(?!openrouter\/)[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*:free$/i
const CALL_LIMIT = 3
const PRIVATE_SOURCE = 'PRIVATE_PERSISTENCE_SMOKE_SOURCE'
const goal = 'I am building a Monad wallet onboarding prototype and want a reviewer. I can offer frontend prototyping and product feedback in return.'
const answer = 'Prioritize usability testing of first-time wallet setup and confusing approval screens, rather than contract security auditing.'
const profiles = [
  {
    handle: 'persistence-smoke-sender',
    profile: { name: 'Synthetic private prototype maker', bio: 'Building a Monad wallet onboarding prototype.', interests: 'Monad, wallet onboarding', offer: 'Frontend prototyping and product feedback.', meet: 'A usability reviewer who can test wallet onboarding.' },
    agent: { visibility: 'private', matching: false, sources: ['website'], interests: ['Monad', 'Wallet onboarding'] },
    sourceLinks: { website: `https://example.invalid/${PRIVATE_SOURCE}` }, avatar: 'none',
  },
  {
    handle: 'persistence-smoke-reviewer',
    profile: { name: 'Synthetic public onboarding reviewer', bio: 'Testing how people get started with Monad wallets.', interests: 'Monad, wallet onboarding', offer: 'Usability reviews and tests of Monad wallet onboarding prototypes.', meet: 'Prototype makers who can exchange frontend and product feedback.' },
    agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad', 'Wallet onboarding'] },
    sourceLinks: {}, avatar: 'none',
  },
] as const

class PersistenceSmokeError extends Error {}
function requireCheck(condition: unknown, message: string): asserts condition {
  if (!condition) throw new PersistenceSmokeError(message)
}

/** Injection is solely for offline script-contract tests. main uses the strict configuration gate. */
export async function runPersistenceAcceptance(model: AgentModel, report: Reporter = console.log): Promise<{ calls: number; evidenceQuotes: number }> {
  requireCheck(model.provider === 'openrouter' && FREE_MODEL.test(model.model) || model.provider === 'tokenrhythm' && model.model === 'deepseek-v4-flash', 'The persistence gate requires an explicit supported test provider and model.')
  let calls = 0
  let evidenceQuotes = 0
  const countedModel: AgentModel = {
    provider: model.provider, model: model.model,
    async generate(request) {
      requireCheck(calls < CALL_LIMIT, 'The three-request budget was exceeded; no extra provider request was made.')
      requireCheck(request.operation === (calls < 2 ? 'discover' : 'draft'), 'The provider operation sequence was unexpected; no extra request was made.')
      const input = request.input as { goal?: string; clarificationAnswers?: string[]; senderProfile?: AgentProfile; candidates?: AgentProfile[]; recipientProfile?: AgentProfile }
      requireCheck(input.goal === goal && input.senderProfile?.handle === profiles[0].handle, 'The consented fictional sender context was not preserved.')
      requireCheck(JSON.stringify(input.clarificationAnswers) === JSON.stringify(calls === 0 ? [] : [answer]), 'The original goal and clarification input were not preserved.')
      requireCheck(!JSON.stringify(request.input).includes(PRIVATE_SOURCE), 'A private profile source reached the provider input; the request was blocked.')
      const suppliedProfiles = request.operation === 'discover' ? input.candidates : [input.recipientProfile]
      requireCheck(suppliedProfiles?.length === 1 && suppliedProfiles[0]?.handle === profiles[1].handle, 'Provider input contained an unexpected candidate; the request was blocked.')
      const permittedFields = ['handle', 'displayName', 'building', 'canOffer', 'wantsToMeet', 'interests'].sort().join(',')
      requireCheck([input.senderProfile, ...suppliedProfiles].every(profile => profile && Object.keys(profile).sort().join(',') === permittedFields), 'Provider input exceeded the approved profile projection; the request was blocked.')
      calls++
      return model.generate(request)
    },
  }
  const directory = mkdtempSync(join(tmpdir(), 'signalpass-agent-persistence-'))
  const options = { origin: ORIGIN, databasePath: join(directory, 'smoke.sqlite'), agent: { model: countedModel, dailyUserLimit: CALL_LIMIT, dailyGlobalLimit: CALL_LIMIT, maxConcurrent: 1 } }
  let api: ReturnType<typeof createApp> | undefined
  const request = async <T>(identity: Identity | null, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    requireCheck(api, 'The isolated API was not available.')
    const response = await api.app.request(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { origin: ORIGIN, 'content-type': 'application/json', ...(identity ? { cookie: identity.cookie, 'x-signalpass-csrf': identity.csrf } : {}), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    return { status: response.status, data: await response.json() as T, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  const success = async <T>(label: string, identity: Identity | null, path: string, body?: unknown): Promise<T> => {
    const result = await request<T>(identity, path, body)
    const category = (result.data as { error?: unknown } | null)?.error
    const safeCategory = typeof category === 'string' && /^[a-z][a-z_]{0,60}$/.test(category) ? `, ${category}` : ''
    requireCheck(result.status === 200, `${label} failed (HTTP ${result.status}${safeCategory}). No introduction was sent; raw response details are withheld.`)
    return result.data
  }
  const timed = async <T>(label: string, work: () => Promise<T>): Promise<T> => {
    const started = performance.now()
    const result = await work()
    report(`PASS ${label} (${Math.round(performance.now() - started)} ms)`)
    return result
  }
  const checkEvidence = (run: AgentRun, publicProfile: AgentProfile) => {
    requireCheck(run.modelCalled && run.usedProfile && run.matches.length === 1 && run.matches[0]?.handle === profiles[1].handle, 'Live discovery did not return the single relevant fictional recipient.')
    const match = run.matches[0]!
    requireCheck(match.evidence.length > 0, 'The recommendation had no supporting public-profile evidence.')
    for (const evidence of match.evidence) {
      const source = evidence.field === 'interests' ? publicProfile.interests.join(', ') : publicProfile[evidence.field]
      requireCheck(typeof source === 'string' && evidence.quote.length >= 3 && source.includes(evidence.quote), 'A recommendation quote did not match the approved public profile.')
      evidenceQuotes++
    }
  }
  try {
    api = createApp(options)
    const identities = await timed('two signed sessions; private sender and public opted-in fictional recipient', async () => {
      const result: Identity[] = []
      for (const input of profiles) {
        const account = privateKeyToAccount(generatePrivateKey())
        const challenge = await success<{ message: string; nonce: string }>('SIWE challenge', null, '/auth/challenge', { address: account.address, chainId: 10143 })
        const signature = await account.signMessage({ message: challenge.message })
        const verified = await request<{ session: { csrf: string; address: string } }>(null, '/auth/verify', { nonce: challenge.nonce, signature })
        requireCheck(verified.status === 200 && verified.cookie.startsWith('signalpass_session=') && verified.data.session?.csrf, 'The ephemeral signed session was not established.')
        const identity = { cookie: verified.cookie, csrf: verified.data.session.csrf, address: verified.data.session.address }
        await success('Synthetic profile approval', identity, '/me/profile', input)
        result.push(identity)
      }
      return result
    })
    const sender = identities[0]!, recipient = identities[1]!
    const publicProfile = (await success<{ profile: AgentProfile }>('Public recipient lookup', null, '/profiles/' + profiles[1].handle)).profile
    await timed('authentication, origin, CSRF and private-profile boundaries before inference', async () => {
      const input = { goal, useProfile: true }
      requireCheck((await request(null, '/agent/discover', input)).status === 401, 'Anonymous discovery was not blocked.')
      requireCheck((await request(sender, '/agent/discover', input, { 'x-signalpass-csrf': '' })).status === 403, 'Discovery without CSRF was not blocked.')
      requireCheck((await request(sender, '/agent/discover', input, { origin: 'https://example.invalid' })).status === 403, 'Cross-origin discovery was not blocked.')
      requireCheck((await request(null, '/profiles/' + profiles[0].handle)).status === 404, 'The private sender profile was publicly accessible.')
      const directory = await success<{ profiles: AgentProfile[] }>('Public profile list', null, '/profiles')
      requireCheck(directory.profiles.length === 1 && directory.profiles[0]?.handle === recipientHandle(), 'The isolated public candidate directory was unexpected.')
      const status = await success<Status>('Agent status', sender, '/agent/status')
      requireCheck(status.enabled && status.provider === model.provider && status.model === model.model && status.remainingToday === CALL_LIMIT, 'The isolated model or budget was not configured correctly.')
      requireCheck(calls === 0, 'A rejected preflight request reached inference.')
    })
    const initial = await timed('live discovery with explicit private-profile consent', () => success<{ run: AgentRun }>('Live discovery', sender, '/agent/discover', { goal, useProfile: true }))
    checkEvidence(initial.run, publicProfile)
    const draftBody = { runId: initial.run.id, recipientHandle: recipientHandle(), useProfile: false }
    const denied = await request<{ error: string }>(sender, '/agent/draft', draftBody)
    requireCheck(denied.status === 409 && denied.data.error === 'agent_profile_consent_required', 'Drafting without profile consent was not blocked.')
    requireCheck((await request(recipient, '/agent/discover', { parentRunId: initial.run.id, answer, useProfile: true })).status === 404 && Number(calls) === 1, 'Cross-account refinement or missing consent reached inference.')
    const refined = await timed('live clarification preserving the original goal', () => success<{ run: AgentRun }>('Live clarification', sender, '/agent/discover', { parentRunId: initial.run.id, answer, useProfile: true }))
    checkEvidence(refined.run, publicProfile)
    requireCheck(refined.run.goal === goal && refined.run.parentRunId === initial.run.id && refined.run.clarifications?.length === 1 && refined.run.clarifications[0]?.answer === answer, 'The clarification history did not preserve the original goal and answer.')
    const prepared = await timed('live private draft with explicit consent', () => success<{ draft: AgentDraft }>('Live draft', sender, '/agent/draft', { runId: refined.run.id, recipientHandle: recipientHandle(), useProfile: true }))
    const draft = prepared.draft
    requireCheck(draft.usedProfile && draft.recipientHandle === recipientHandle() && draft.expiresAt > Date.now() / 1000 && draft.expiresAt - draft.createdAt === 1800, 'The draft did not pass recipient, consent or expiry checks.')
    requireCheck(['whoAmI', 'whyYou', 'whatIOffer', 'nextStep'].every(key => typeof draft.intent[key as keyof typeof draft.intent] === 'string' && draft.intent[key as keyof typeof draft.intent].trim()), 'The generated draft was incomplete.')
    requireCheck(calls === CALL_LIMIT && api.store.introductions.size === 0, 'The three-call or no-delivery boundary was violated.')
    await timed('owner-only history and draft retrieval', async () => {
      const workspace = await success<Workspace>('Sender history', sender, '/agent/workspace')
      requireCheck(workspace.runs.length === 2 && workspace.drafts.length === 1 && workspace.drafts[0]?.id === draft.id, 'The sender history was not saved.')
      const own = await success<{ draft: AgentDraft }>('Owned draft retrieval', sender, '/agent/drafts/' + draft.id)
      requireCheck(JSON.stringify(own.draft) === JSON.stringify(draft), 'The stored private draft changed.')
      requireCheck((await request(recipient, '/agent/drafts/' + draft.id)).status === 404, 'Another account could retrieve the sender draft.')
      const other = await success<Workspace>('Recipient history', recipient, '/agent/workspace')
      requireCheck(other.runs.length === 0 && other.drafts.length === 0, 'Private history appeared in another account.')
    })
    await timed('API re-instantiation on the same SQLite database preserves sessions, history and quota', async () => {
      api!.close(); api = undefined
      api = createApp(options)
      for (const identity of identities) {
        const me = await success<{ session: { address: string; csrf: string } }>('Restored signed session', identity, '/me')
        requireCheck(me.session.address === identity.address && me.session.csrf === identity.csrf, 'The signed session did not survive API re-instantiation.')
      }
      const workspace = await success<Workspace>('Restored sender history', sender, '/agent/workspace')
      requireCheck(workspace.runs.length === 2 && workspace.drafts.length === 1 && workspace.runs.some(run => JSON.stringify(run) === JSON.stringify(refined.run)), 'The persisted clarification history changed or disappeared.')
      const restored = await success<{ draft: AgentDraft }>('Restored private draft', sender, '/agent/drafts/' + draft.id)
      requireCheck(JSON.stringify(restored.draft) === JSON.stringify(draft), 'The private draft did not survive API re-instantiation.')
      const status = await success<Status>('Restored usage', sender, '/agent/status')
      requireCheck(status.remainingToday === 0 && status.limit === CALL_LIMIT, 'API re-instantiation reset the consumed daily budget.')
      requireCheck((await request(recipient, '/agent/drafts/' + draft.id)).status === 404, 'API re-instantiation widened access to the private draft.')
    })
    await timed('history clear revokes draft access without resetting quota', async () => {
      await success('History clear', sender, '/agent/history/clear', {})
      const empty = await success<Workspace>('Cleared history', sender, '/agent/workspace')
      requireCheck(empty.runs.length === 0 && empty.drafts.length === 0, 'Private history was not cleared.')
      requireCheck((await request(sender, '/agent/drafts/' + draft.id)).status === 404, 'The cleared draft remained accessible.')
      requireCheck((await request(sender, '/agent/discover', { parentRunId: refined.run.id, answer, useProfile: true })).status === 404, 'A cleared run remained available for refinement.')
      const exhausted = await request<{ error: string }>(sender, '/agent/discover', { goal, useProfile: true })
      requireCheck(exhausted.status === 429 && exhausted.data.error === 'agent_budget_exhausted', 'Clearing history reset the consumed budget.')
      requireCheck((await success<Status>('Usage after clear', sender, '/agent/status')).remainingToday === 0, 'The consumed budget changed after history clearing.')
      requireCheck(calls === CALL_LIMIT && api!.store.introductions.size === 0, 'Cleanup made another provider call or created an introduction.')
    })
    report(`PASS acceptance: three provider calls; ${evidenceQuotes} exact public-profile quote(s); API re-instantiation and history deletion verified; zero introductions, payments or chain calls. Generated text was not printed.`)
    return { calls, evidenceQuotes }
  } finally {
    try { api?.close() } finally { rmSync(directory, { recursive: true, force: true }) }
  }
}

function recipientHandle(): string { return profiles[1].handle }

export async function main(env: Environment = process.env, report: Reporter = console.log): Promise<void> {
  // Retain the free-only OpenRouter gate; TokenRhythm is a separate explicit opt-in.
  let providerConfig: Environment
  if (env.SIGNALPASS_AGENT_PROVIDER?.trim() === 'tokenrhythm') {
    const base = env.SIGNALPASS_AGENT_BASE_URL?.trim().replace(/\/+$/, '') || 'https://tokenrhythm.studio/v1'
    requireCheck(base === 'https://tokenrhythm.studio/v1' && env.SIGNALPASS_AGENT_MODEL?.trim() === 'deepseek-v4-flash', 'The TokenRhythm test requires its official endpoint and explicit deepseek-v4-flash model. No provider request was made.')
    providerConfig = { SIGNALPASS_AGENT_PROVIDER: 'tokenrhythm', SIGNALPASS_AGENT_MODEL: 'deepseek-v4-flash', SIGNALPASS_AGENT_BASE_URL: base, SIGNALPASS_AGENT_API_KEY: env.SIGNALPASS_AGENT_API_KEY, SIGNALPASS_AGENT_API_KEY_FILE: env.SIGNALPASS_AGENT_API_KEY_FILE, SIGNALPASS_AGENT_TIMEOUT_MS: env.SIGNALPASS_AGENT_TIMEOUT_MS }
  } else providerConfig = liveSmokeConfiguration(env)
  const config = { ...providerConfig, SIGNALPASS_AGENT_DAILY_USER_LIMIT: String(CALL_LIMIT), SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT: String(CALL_LIMIT) }
  const agent = configuredHostedAgent(config)
  requireCheck(agent.model, 'The explicit test provider was not configured. No provider request was made.')
  report('Live persistence acceptance: temporary SQLite, fictional profiles, explicit provider/model, at most three provider calls; delivery disabled.')
  await runPersistenceAcceptance(agent.model, report)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(`FAIL ${error instanceof PersistenceSmokeError ? error.message : 'The isolated persistence check could not complete. Inspect configuration and free-model availability; raw error details are withheld.'}`)
    process.exitCode = 1
  })
}
