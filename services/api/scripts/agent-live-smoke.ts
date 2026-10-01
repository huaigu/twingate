#!/usr/bin/env node
/**
 * Explicit live acceptance gate for a named, free OpenRouter model.
 * Uses an isolated in-memory API with synthetic profiles and ephemeral SIWE
 * identities. At most two provider calls; no delivery, contract or RPC calls.
 * No .env loader, ambient provider keys, retries or paid fallback.
 */
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createApp } from '../src/app.js'
import { configuredHostedAgent } from '../src/agent-provider.js'
import type { AgentDraft, AgentModel, AgentProfile, AgentRun } from '../src/agent-types.js'

type Environment = Record<string, string | undefined>
type Identity = { cookie: string; csrf: string }
type Reporter = (message: string) => void
const ORIGIN = 'http://localhost:3004'
const FREE_MODEL = /^(?!openrouter\/)[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*:free$/i
const BASE_URL = 'https://openrouter.ai/api/v1'
const goal = 'I am building a Monad wallet onboarding prototype and want a usability reviewer to test it. I can offer frontend prototyping and product feedback in return.'

class SmokeError extends Error {}
function requireCheck(condition: unknown, message: string): asserts condition {
  if (!condition) throw new SmokeError(message)
}

/** Preflight is pure: rejected or missing settings cannot make a network call. */
export function liveSmokeConfiguration(env: Environment): Environment {
  requireCheck(env.SIGNALPASS_AGENT_PROVIDER?.trim() === 'openrouter', 'Set SIGNALPASS_AGENT_PROVIDER=openrouter. This acceptance check refuses OpenAI and other providers; no provider request was made.')
  const apiKey = env.SIGNALPASS_AGENT_API_KEY?.trim()
  requireCheck(apiKey && !/[\r\n]/.test(apiKey), 'Set SIGNALPASS_AGENT_API_KEY to your own OpenRouter API key. No provider request was made.')
  const model = env.SIGNALPASS_AGENT_MODEL?.trim()
  requireCheck(model && model.length <= 160 && FREE_MODEL.test(model), 'Set SIGNALPASS_AGENT_MODEL to an explicit vendor/model:free identifier. Paid models and automatic routers are refused; no provider request was made.')
  const baseUrl = env.SIGNALPASS_AGENT_BASE_URL?.trim().replace(/\/+$/, '') || BASE_URL
  requireCheck(baseUrl === BASE_URL, 'Unset SIGNALPASS_AGENT_BASE_URL or use the official OpenRouter API URL. Custom endpoints are refused; no provider request was made.')
  return {
    SIGNALPASS_AGENT_PROVIDER: 'openrouter', SIGNALPASS_AGENT_API_KEY: apiKey,
    SIGNALPASS_AGENT_MODEL: model, SIGNALPASS_AGENT_BASE_URL: BASE_URL,
    SIGNALPASS_AGENT_DAILY_USER_LIMIT: '2', SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT: '2',
  }
}

const profiles = [
  {
    handle: 'smoke-sender',
    profile: { name: 'Synthetic prototype maker', bio: 'Building a Monad wallet onboarding prototype.', interests: 'Monad, wallet onboarding', offer: 'Frontend prototyping and product feedback.', meet: 'A usability reviewer who can test wallet onboarding.' },
    agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad', 'Wallet onboarding'] },
    sourceLinks: {}, avatar: 'none',
  },
  {
    handle: 'smoke-reviewer',
    profile: { name: 'Synthetic onboarding reviewer', bio: 'Testing how people get started with Monad wallets.', interests: 'Monad, wallet onboarding', offer: 'Usability reviews and tests of Monad wallet onboarding prototypes.', meet: 'Prototype makers who can exchange frontend and product feedback.' },
    agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad', 'Wallet onboarding'] },
    sourceLinks: {}, avatar: 'none',
  },
] as const

/** Runs real application routes; model injection exists solely for offline gate tests. */
export async function runLiveAcceptance(model: AgentModel, report: Reporter = console.log): Promise<{ calls: number; evidenceQuotes: number }> {
  requireCheck(model.provider === 'openrouter' && FREE_MODEL.test(model.model), 'The acceptance gate requires the free-only OpenRouter adapter.')
  let calls = 0
  const countedModel: AgentModel = {
    provider: model.provider, model: model.model,
    async generate(request) {
      requireCheck(calls < 2, 'The two-request acceptance budget was exceeded; no extra provider request was made.')
      calls++
      return model.generate(request)
    },
  }
  // Never reads the deployed database, chain config or evaluator settings.
  const api = createApp({ origin: ORIGIN, databasePath: ':memory:', agent: { model: countedModel, dailyUserLimit: 2, dailyGlobalLimit: 2, maxConcurrent: 1 } })
  const request = async <T>(label: string, identity: Identity | null, path: string, body?: unknown): Promise<{ data: T; cookie: string }> => {
    const response = await api.app.request(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { origin: ORIGIN, 'content-type': 'application/json', ...(identity ? { cookie: identity.cookie, 'x-signalpass-csrf': identity.csrf } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    // Do not log the body, error details, headers, signatures or account keys.
    requireCheck(response.ok, `${label} failed (HTTP ${response.status}). Check the configured key, free-model availability and support for strict structured output. No introduction was sent.`)
    const data = await response.json() as T
    return { data, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  const timed = async <T>(label: string, work: () => Promise<T>): Promise<T> => {
    const started = performance.now()
    const value = await work()
    report(`PASS ${label} (${Math.round(performance.now() - started)} ms)`)
    return value
  }
  try {
    const identities = await timed('signed sessions and two approved synthetic public profiles', async () => {
      const result: Identity[] = []
      for (const input of profiles) {
        const account = privateKeyToAccount(generatePrivateKey())
        const challenge = await request<{ message: string; nonce: string }>('SIWE challenge', null, '/auth/challenge', { address: account.address, chainId: 10143 })
        const signature = await account.signMessage({ message: challenge.data.message })
        const verified = await request<{ session: { csrf: string } }>('SIWE verification', null, '/auth/verify', { nonce: challenge.data.nonce, signature })
        const identity = { cookie: verified.cookie, csrf: verified.data.session.csrf }
        requireCheck(identity.cookie.startsWith('signalpass_session=') && identity.csrf, 'The signed session was not established; no provider request was made.')
        await request('Profile approval', identity, '/me/profile', input)
        result.push(identity)
      }
      return result
    })
    const sender = identities[0]!
    const recipient = identities[1]!
    const publicProfile = (await request<{ profile: AgentProfile }>('Public profile lookup', null, '/profiles/smoke-reviewer')).data.profile
    const discovered = await timed('live discovery with explicit profile consent', () => request<{ run: AgentRun }>('Live discovery', sender, '/agent/discover', { goal, useProfile: true }))
    requireCheck(discovered.data.run.usedProfile && discovered.data.run.matches.length === 1, 'Live discovery did not return the single clearly relevant synthetic profile. Acceptance failed; no draft or introduction was sent.')
    const match = discovered.data.run.matches[0]!
    requireCheck(match.handle === 'smoke-reviewer' && match.evidence.length > 0, 'Live discovery returned an unexpected person or no supporting evidence. No introduction was sent.')
    for (const evidence of match.evidence) {
      const source = evidence.field === 'interests' ? publicProfile.interests.join(', ') : publicProfile[evidence.field]
      requireCheck(typeof source === 'string' && evidence.quote.length >= 3 && source.includes(evidence.quote), 'A recommendation quote did not match the approved public profile. No introduction was sent.')
    }
    report(`PASS evidence: ${match.evidence.length} exact public-profile quote(s), one known recipient`)
    const prepared = await timed('live draft for human review', () => request<{ draft: AgentDraft }>('Live draft', sender, '/agent/draft', { runId: discovered.data.run.id, recipientHandle: match.handle, useProfile: true }))
    const draft = prepared.data.draft
    requireCheck(draft.recipientHandle === match.handle && draft.usedProfile && draft.expiresAt > Date.now() / 1000, 'The generated draft did not pass recipient, consent or expiry checks. No introduction was sent.')
    requireCheck(['whoAmI', 'whyYou', 'whatIOffer', 'nextStep'].every(key => typeof draft.intent[key as keyof typeof draft.intent] === 'string' && draft.intent[key as keyof typeof draft.intent].trim()), 'The generated draft was incomplete. No introduction was sent.')
    await timed('private draft retrieval and delivery boundary', async () => {
      const retrieved = await request<{ draft: AgentDraft }>('Private draft retrieval', sender, '/agent/drafts/' + draft.id)
      requireCheck(retrieved.data.draft.id === draft.id, 'The private draft could not be retrieved consistently.')
      const unauthorized = await api.app.request('/agent/drafts/' + draft.id, { headers: { cookie: recipient.cookie } })
      requireCheck(unauthorized.status === 404, 'A synthetic recipient could access the sender’s private draft.')
      requireCheck(api.store.introductions.size === 0 && calls === 2, 'The no-delivery or two-provider-request boundary was violated.')
    })
    report('PASS acceptance: two real provider calls; evidence checked; four draft fields; zero introductions, payments or chain calls. Generated text was not printed.')
    return { calls, evidenceQuotes: match.evidence.length }
  } finally { api.close() }
}

export async function main(env: Environment = process.env, report: Reporter = console.log): Promise<void> {
  const config = liveSmokeConfiguration(env)
  const agent = configuredHostedAgent(config)
  requireCheck(agent.model, 'The free OpenRouter model was not configured. No provider request was made.')
  report('Live acceptance: synthetic profiles only, explicit free model, at most two provider calls; delivery disabled.')
  await runLiveAcceptance(agent.model, report)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(`FAIL ${error instanceof SmokeError ? error.message : 'The live acceptance check could not complete. Inspect the server configuration and provider availability; raw error details are withheld.'}`)
    process.exitCode = 1
  })
}
