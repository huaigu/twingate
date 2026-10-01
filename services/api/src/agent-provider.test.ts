import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { OpenAIResponsesAgentModel, OpenRouterResponsesAgentModel, configuredHostedAgent } from './agent-provider.js'

const secret = 'test-key-PRIVATE-CANARY'
const schema = { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'], additionalProperties: false }
const request = { operation: 'discover' as const, instructions: 'Use supplied profiles only.', input: { goal: 'Find a collaborator.' }, schema }
const completed = (overrides: Record<string, unknown> = {}) => ({
  status: 'completed',
  output: [
    { type: 'reasoning', summary: [] },
    { type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: '{"summary":"A grounded match."}' }] },
  ],
  usage: { input_tokens: 120, output_tokens: 30 },
  ...overrides,
})
const modelWithPayload = (payload: unknown) => new OpenAIResponsesAgentModel({
  apiKey: secret,
  model: 'fixture-model',
  fetch: async () => Response.json(payload),
})
const safeFailure = (error: unknown) => {
  assert(error instanceof Error)
  assert.equal(error.message, 'The personal agent could not complete this request. Please try again.')
  assert(!JSON.stringify(error).includes(secret))
  assert(!error.stack?.includes(secret))
  assert.equal(error.cause, undefined)
  return true
}

test('hosted agent is explicitly enabled and does not reuse ambient model credentials', () => {
  assert.deepEqual(configuredHostedAgent({ OPENAI_API_KEY: secret }), {})
  assert.throws(() => configuredHostedAgent({ SIGNALPASS_AGENT_PROVIDER: 'openai', OPENAI_API_KEY: secret, SIGNALPASS_AGENT_MODEL: 'fixture-model' }), /Invalid SignalPass agent configuration/)
  assert.throws(() => configuredHostedAgent({ SIGNALPASS_AGENT_PROVIDER: 'openai', SIGNALPASS_AGENT_API_KEY: secret }), /Invalid SignalPass agent configuration/)
  assert.throws(() => configuredHostedAgent({ SIGNALPASS_AGENT_PROVIDER: 'mock' }), /Invalid SignalPass agent configuration/)
  const env = { SIGNALPASS_AGENT_PROVIDER: 'openai', SIGNALPASS_AGENT_API_KEY: secret, SIGNALPASS_AGENT_MODEL: 'fixture-model' }
  const config = configuredHostedAgent(env)
  assert.equal(config.model?.provider, 'openai')
  assert.equal(config.model?.model, 'fixture-model')
  assert.equal(config.dailyUserLimit, 20)
  assert.equal(config.dailyGlobalLimit, 200)
  assert(!JSON.stringify(config).includes(secret))
  assert.equal(configuredHostedAgent({ ...env, SIGNALPASS_AGENT_DAILY_USER_LIMIT: '3', SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT: '17' }).dailyGlobalLimit, 17)
  for (const limit of ['-1', '0', '1.5', 'Infinity', '1e9', '', '1001', '9007199254740992']) {
    assert.throws(() => configuredHostedAgent({ ...env, SIGNALPASS_AGENT_DAILY_USER_LIMIT: limit }), /Invalid SignalPass agent configuration/)
  }
  assert.throws(() => configuredHostedAgent({ ...env, SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT: '10001' }), /Invalid SignalPass agent configuration/)
  const largest = configuredHostedAgent({ ...env, SIGNALPASS_AGENT_DAILY_USER_LIMIT: '1000', SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT: '10000' })
  assert.equal(largest.dailyUserLimit, 1000)
  assert.equal(largest.dailyGlobalLimit, 10000)
})

test('provider endpoint requires TLS except loopback and rejects URL credentials and query parameters', () => {
  const make = (baseUrl: string) => new OpenAIResponsesAgentModel({ apiKey: secret, model: 'fixture-model', baseUrl })
  for (const baseUrl of ['https://api.openai.com/v1', 'http://127.0.0.1:8000/v1', 'http://localhost:8000', 'http://[::1]:8000']) assert.doesNotThrow(() => make(baseUrl))
  for (const baseUrl of ['http://example.com', 'https://user:pass@example.com', 'https://example.com?v=1', 'https://example.com#key', 'https://example.com?', 'https://example.com#', 'file:///tmp/model', secret]) {
    assert.throws(() => make(baseUrl), (error: unknown) => {
      assert(error instanceof Error)
      assert.equal(error.message, 'Invalid SignalPass agent configuration. Check the server environment settings.')
      return true
    })
  }
})

test('Responses wire request carries a server key, strict schema, and storage opt-out', async (t) => {
  let captured: { path?: string; authorization?: string; contentType?: string; body?: Record<string, unknown> } = {}
  const service = createServer(async (req, res) => {
    let raw = ''
    for await (const chunk of req) raw += chunk
    captured = { path: req.url, authorization: req.headers.authorization, contentType: req.headers['content-type'], body: JSON.parse(raw) as Record<string, unknown> }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(completed()))
  })
  service.listen(0, '127.0.0.1')
  await once(service, 'listening')
  t.after(() => { service.closeAllConnections(); service.close() })
  const address = service.address()
  assert(address && typeof address === 'object')
  const model = new OpenAIResponsesAgentModel({ apiKey: secret, model: 'fixture-model', baseUrl: `http://127.0.0.1:${address.port}/v1/` })
  assert.deepEqual(await model.generate(request), { data: { summary: 'A grounded match.' }, inputTokens: 120, outputTokens: 30 })
  assert.equal(captured.path, '/v1/responses')
  assert.equal(captured.authorization, `Bearer ${secret}`)
  assert.equal(captured.contentType, 'application/json')
  assert.deepEqual(captured.body, {
    model: 'fixture-model', instructions: request.instructions, input: JSON.stringify(request.input), store: false, max_output_tokens: 2400,
    text: { format: { type: 'json_schema', name: 'signalpass_discover', strict: true, schema } },
  })
})

test('Responses parsing joins answer text after reasoning and handles missing or unsafe usage counts', async () => {
  const model = modelWithPayload(completed({
    output: [{ type: 'reasoning', summary: [] }, { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '{"summary":' }, { type: 'output_text', text: '"Two parts."}' }] }],
    usage: { input_tokens: -3, output_tokens: Number.MAX_SAFE_INTEGER + 1 },
  }))
  assert.deepEqual(await model.generate(request), { data: { summary: 'Two parts.' }, inputTokens: 0, outputTokens: 0 })
  for (const usage of [undefined, null, { input_tokens: '4', output_tokens: 2.5 }]) {
    const result = await modelWithPayload(completed({ usage })).generate(request)
    assert.equal(result.inputTokens, 0)
    assert.equal(result.outputTokens, 0)
  }
})

test('incomplete, refused, and malformed Responses results are rejected without leaking provider content', async () => {
  const message = (content: unknown, extras = {}) => ({ type: 'message', role: 'assistant', content, ...extras })
  const text = [{ type: 'output_text', text: '{"summary":"valid"}' }]
  const payloads = [
    completed({ status: 'incomplete', incomplete_details: { reason: secret } }),
    completed({ status: 'failed', error: { message: secret } }),
    completed({ error: { message: secret } }),
    completed({ incomplete_details: { reason: secret } }),
    completed({ output: [message([{ type: 'refusal', refusal: secret }])] }),
    completed({ output: [message([...text, { type: 'refusal', refusal: secret }])] }),
    completed({ output: [message([{ type: 'output_text', text: secret }])] }),
    completed({ output: [message(text, { status: 'incomplete' })] }),
    completed({ output: [message(text, { role: 'user' })] }),
    completed({ output: [message(null)] }),
    completed({ output: [message([{ type: 'output_text', text: 42 }])] }),
    completed({ output: [null] }),
    completed({ output: [] }),
    { output_text: '{"summary":"SDK helper is not raw HTTP output"}' },
    null,
  ]
  for (const payload of payloads) await assert.rejects(modelWithPayload(payload).generate(request), safeFailure)
})

test('HTTP, invalid JSON, and transport errors are sanitized and redirects are forbidden', async () => {
  for (const status of [302, 401, 429, 500]) {
    let cancelled = false
    const model = new OpenAIResponsesAgentModel({
      apiKey: secret, model: 'fixture-model',
      fetch: async (_url, init) => {
        assert.equal(init?.redirect, 'error')
        return new Response(new ReadableStream({ cancel: () => { cancelled = true } }), { status })
      },
    })
    await assert.rejects(model.generate(request), safeFailure)
    assert.equal(cancelled, true)
  }
  const malformed = new OpenAIResponsesAgentModel({ apiKey: secret, model: 'fixture-model', fetch: async () => new Response(secret) })
  await assert.rejects(malformed.generate(request), safeFailure)
  const transport = new OpenAIResponsesAgentModel({ apiKey: secret, model: 'fixture-model', fetch: async () => { throw new Error(secret) } })
  await assert.rejects(transport.generate(request), safeFailure)
})

test('oversized streamed provider output is cancelled before it can be parsed', async () => {
  let cancelled = false
  const model = new OpenAIResponsesAgentModel({
    apiKey: secret, model: 'fixture-model',
    fetch: async () => new Response(new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(128 * 1024 + 1)) },
      cancel() { cancelled = true },
    })),
  })
  await assert.rejects(model.generate(request), safeFailure)
  assert.equal(cancelled, true)
})

test('deadline aborts stalled fetch and body reads with a sanitized error', async () => {
  for (const stallBody of [false, true]) {
    let signal: AbortSignal | undefined
    const model = new OpenAIResponsesAgentModel({
      apiKey: secret, model: 'fixture-model', timeoutMs: 20,
      fetch: async (_url, init) => {
        signal = init?.signal ?? undefined
        assert(signal)
        if (stallBody) {
          return new Response(new ReadableStream({
            start(controller) { signal!.addEventListener('abort', () => controller.error(new Error(secret)), { once: true }) },
          }))
        }
        return await new Promise<Response>((_resolve, reject) => {
          signal!.addEventListener('abort', () => reject(new Error(secret)), { once: true })
        })
      },
    })
    await assert.rejects(model.generate(request), safeFailure)
    assert.equal(signal?.aborted, true)
  }
})

test('OpenRouter configuration only accepts explicitly selected free catalog models with an explicit key', () => {
  const env = { SIGNALPASS_AGENT_PROVIDER: 'openrouter', SIGNALPASS_AGENT_API_KEY: secret, SIGNALPASS_AGENT_MODEL: 'example/fixture-model:free' }
  const configured = configuredHostedAgent(env)
  assert.equal(configured.model?.provider, 'openrouter')
  assert.equal(configured.model?.model, 'example/fixture-model:free')
  assert.equal(configured.dailyUserLimit, 20)
  assert.equal(configured.dailyGlobalLimit, 200)
  assert(!JSON.stringify(configured).includes(secret))
  assert.deepEqual(configuredHostedAgent({ OPENROUTER_API_KEY: secret }), {})
  assert.throws(() => configuredHostedAgent({ ...env, SIGNALPASS_AGENT_API_KEY: undefined, OPENROUTER_API_KEY: secret }), /Invalid SignalPass agent configuration/)
  for (const model of ['', 'example/paid-model', 'example/fixture:free:online', 'example/fixture:nitro', 'example/fixture:free?paid=true', 'openrouter/auto', 'openrouter/free', 'openrouter/fixture:free']) {
    assert.throws(() => configuredHostedAgent({ ...env, SIGNALPASS_AGENT_MODEL: model }), /Invalid SignalPass agent configuration/)
  }
})

test('OpenRouter wire request preserves Responses schema and requires zero-price, non-collecting providers', async () => {
  let calls = 0
  const model = new OpenRouterResponsesAgentModel({
    apiKey: secret, model: 'example/fixture-model:free',
    fetch: async (url, init) => {
      calls++
      assert.equal(url, 'https://openrouter.ai/api/v1/responses')
      assert.equal(init?.redirect, 'error')
      assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${secret}`)
      assert.equal(init?.signal?.aborted, false)
      assert.deepEqual(JSON.parse(String(init?.body)), {
        model: 'example/fixture-model:free', instructions: request.instructions, input: JSON.stringify(request.input), store: false, max_output_tokens: 2400,
        text: { format: { type: 'json_schema', name: 'signalpass_draft', strict: true, schema } },
        provider: { require_parameters: true, allow_fallbacks: false, data_collection: 'deny', max_price: { prompt: 0, completion: 0, request: 0, image: 0 } },
      })
      return Response.json(completed())
    },
  })
  assert.deepEqual(await model.generate({ ...request, operation: 'draft' }), { data: { summary: 'A grounded match.' }, inputTokens: 120, outputTokens: 30 })
  assert.equal(calls, 1)
})

test('OpenRouter fails closed on unavailable eligible free providers without retrying or falling back', async () => {
  for (const status of [400, 402, 404, 429, 503]) {
    let calls = 0
    const model = new OpenRouterResponsesAgentModel({
      apiKey: secret, model: 'example/fixture-model:free',
      fetch: async () => {
        calls++
        return Response.json({ error: { message: secret } }, { status })
      },
    })
    await assert.rejects(model.generate(request), safeFailure)
    assert.equal(calls, 1)
  }
})

test('OpenRouter shares refusal validation, response bounds, and abort deadlines', async () => {
  for (const payload of [completed({ status: 'incomplete' }), completed({ output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: secret }] }] })]) {
    const model = new OpenRouterResponsesAgentModel({ apiKey: secret, model: 'example/fixture-model:free', fetch: async () => Response.json(payload) })
    await assert.rejects(model.generate(request), safeFailure)
  }
  const oversized = new OpenRouterResponsesAgentModel({ apiKey: secret, model: 'example/fixture-model:free', fetch: async () => new Response(new Uint8Array(128 * 1024 + 1)) })
  await assert.rejects(oversized.generate(request), safeFailure)
  let signal: AbortSignal | undefined
  const stalled = new OpenRouterResponsesAgentModel({
    apiKey: secret, model: 'example/fixture-model:free', timeoutMs: 20,
    fetch: async (_url, init) => {
      signal = init?.signal ?? undefined
      return await new Promise<Response>((_resolve, reject) => signal!.addEventListener('abort', () => reject(new Error(secret)), { once: true }))
    },
  })
  await assert.rejects(stalled.generate(request), safeFailure)
  assert.equal(signal?.aborted, true)
})
