import assert from 'node:assert/strict'
import { test } from 'node:test'
import { liveSmokeConfiguration, main, runLiveAcceptance } from '../scripts/agent-live-smoke.js'
import { OpenRouterResponsesAgentModel } from './agent-provider.js'

const env = { SIGNALPASS_AGENT_PROVIDER: 'openrouter', SIGNALPASS_AGENT_API_KEY: 'fake-owned-test-key', SIGNALPASS_AGENT_MODEL: 'test-vendor/test-model:free' }
const response = (data: unknown) => Response.json({ status: 'completed', error: null, incomplete_details: null, output: [{ type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify(data) }] }], usage: { input_tokens: 5, output_tokens: 10 } })

test('live gate refuses missing credentials, paid or routed models, other providers and alternate endpoints', () => {
  for (const input of [
    {}, { ...env, SIGNALPASS_AGENT_API_KEY: '' }, { ...env, SIGNALPASS_AGENT_API_KEY: 'key\nheader' },
    { ...env, SIGNALPASS_AGENT_PROVIDER: 'openai' }, { ...env, SIGNALPASS_AGENT_MODEL: 'test-vendor/paid-model' },
    { ...env, SIGNALPASS_AGENT_MODEL: 'openrouter/free' }, { ...env, SIGNALPASS_AGENT_MODEL: 'openrouter/router:free' },
    { ...env, SIGNALPASS_AGENT_BASE_URL: 'https://private-key-in-url@not-openrouter.invalid/api/v1' },
  ]) {
    assert.throws(() => liveSmokeConfiguration(input), error => {
      assert(error instanceof Error)
      assert.match(error.message, /no provider request was made/i)
      assert(!error.message.includes(env.SIGNALPASS_AGENT_API_KEY))
      assert(!error.message.includes('private-key-in-url'))
      return true
    })
  }
  const config = liveSmokeConfiguration({ ...env, OPENAI_API_KEY: 'ambient-key-must-not-propagate', SIGNALPASS_DB_PATH: '/deployed/database' })
  assert.equal(config.SIGNALPASS_AGENT_DAILY_USER_LIMIT, '2')
  assert.equal(config.SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT, '2')
  assert.equal(config.OPENAI_API_KEY, undefined)
  assert.equal(config.SIGNALPASS_DB_PATH, undefined)
})

test('missing key fails before fetch and never emits a success or skip', async context => {
  let requests = 0
  context.mock.method(globalThis, 'fetch', async () => { requests++; throw new Error('network must not run') })
  const logs: string[] = []
  await assert.rejects(main({ ...env, SIGNALPASS_AGENT_API_KEY: undefined }, message => logs.push(message)), /SIGNALPASS_AGENT_API_KEY/)
  assert.equal(requests, 0)
  assert.deepEqual(logs, [])
})

test('acceptance uses actual signed application routes and two free-only provider requests without delivery', async () => {
  const logs: string[] = []
  const calls: Record<string, any>[] = []
  const rawText = 'GENERATED_TEXT_DO_NOT_LOG'
  const model = new OpenRouterResponsesAgentModel({
    apiKey: env.SIGNALPASS_AGENT_API_KEY, model: env.SIGNALPASS_AGENT_MODEL,
    fetch: async (url, init) => {
      assert.equal(url, 'https://openrouter.ai/api/v1/responses')
      const body = JSON.parse(String(init?.body)) as Record<string, any>
      calls.push(body)
      assert.equal(body.model, env.SIGNALPASS_AGENT_MODEL)
      assert.equal(body.provider.allow_fallbacks, false)
      assert.equal(body.provider.data_collection, 'deny')
      assert.deepEqual(body.provider.max_price, { prompt: 0, completion: 0, request: 0, image: 0 })
      const input = JSON.parse(body.input)
      assert.equal(input.senderProfile.handle, 'smoke-sender')
      assert(!JSON.stringify(input).includes('0x'), 'Wallet identities never reach inference')
      if (body.text.format.name === 'signalpass_discover') {
        assert.equal(input.candidates.length, 1)
        return response({ matches: [{ handle: input.candidates[0].handle, reason: rawText, caveat: 'Availability is unconfirmed.', evidence: [{ field: 'canOffer', quote: input.candidates[0].canOffer }] }], nextQuestion: null })
      }
      assert.equal(body.text.format.name, 'signalpass_draft')
      return response({ intent: { whoAmI: 'I am a prototype maker.', whyYou: rawText, whatIOffer: 'Frontend and product feedback.', nextStep: 'Would you review the onboarding?' }, notes: ['Review all details before sending.'] })
    },
  })
  assert.deepEqual(await runLiveAcceptance(model, message => logs.push(message)), { calls: 2, evidenceQuotes: 1 })
  assert.equal(calls.length, 2)
  assert(logs.some(message => message.includes('zero introductions, payments or chain calls')))
  assert(!logs.join('\n').includes(rawText))
  assert(!logs.join('\n').includes(env.SIGNALPASS_AGENT_API_KEY))
})

test('invalid live evidence fails after the first request instead of calling draft or claiming acceptance', async () => {
  let calls = 0
  const logs: string[] = []
  const model = new OpenRouterResponsesAgentModel({
    apiKey: env.SIGNALPASS_AGENT_API_KEY, model: env.SIGNALPASS_AGENT_MODEL,
    fetch: async () => {
      calls++
      return response({ matches: [{ handle: 'smoke-reviewer', reason: 'Fictional evidence.', caveat: 'Unknown availability.', evidence: [{ field: 'canOffer', quote: 'FABRICATED_UNSAFE_CANARY' }] }], nextQuestion: null })
    },
  })
  await assert.rejects(runLiveAcceptance(model, message => logs.push(message)), /Live discovery failed \(HTTP 502\)/)
  assert.equal(calls, 1)
  assert(!logs.some(message => message.includes('PASS acceptance')))
  assert(!logs.join('\n').includes('FABRICATED_UNSAFE_CANARY'))
})
