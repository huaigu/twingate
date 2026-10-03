import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AgentProviderError, TokenRhythmChatAgentModel, configuredHostedAgent } from './agent-provider.js'

const secret = 'synthetic-tokenrhythm-PRIVATE-CANARY'
const modelName = 'deepseek-v4-flash'
const schema = { type: 'object', additionalProperties: false, properties: { summary: { type: 'string' } }, required: ['summary'] }
const request = { operation: 'discover' as const, instructions: 'Use the supplied fictional profiles only.', input: { goal: 'Find a collaborator.' }, schema }
const choice = (message: Record<string, unknown> = {}, extras: Record<string, unknown> = {}) => ({
  index: 0, finish_reason: 'stop',
  message: { role: 'assistant', content: '{"summary":"A supported match."}', refusal: null, ...message },
  ...extras,
})
const completed = (overrides: Record<string, unknown> = {}) => ({
  id: 'synthetic-completion', object: 'chat.completion',
  choices: [choice()], usage: { prompt_tokens: 120, completion_tokens: 30 }, ...overrides,
})
const safeFailure = (code: AgentProviderError['code']) => (error: unknown) => {
  assert(error instanceof AgentProviderError)
  assert.equal(error.code, code)
  assert.equal(error.message, 'The personal agent could not complete this request. Please try again.')
  assert(!JSON.stringify(error).includes(secret))
  assert(!error.stack?.includes(secret))
  assert.equal(error.cause, undefined)
  return true
}
const safeConfigFailure = (error: unknown) => {
  assert(error instanceof Error)
  assert.equal(error.message, 'Invalid SignalPass agent configuration. Check the server environment settings.')
  assert(!JSON.stringify(error).includes(secret))
  assert(!error.stack?.includes(secret))
  assert.equal(error.cause, undefined)
  return true
}

test('TokenRhythm sends Chat Completions with exact strict schema, separate system/user content and storage opt-out', async () => {
  const captured: Array<{ url: string; init: RequestInit }> = []
  const model = new TokenRhythmChatAgentModel({
    apiKey: secret, model: modelName,
    fetch: async (url, init) => { captured.push({ url: String(url), init: init! }); return Response.json(completed()) },
  })
  assert.equal(model.provider, 'tokenrhythm')
  assert(!JSON.stringify(model).includes(secret))
  for (const operation of ['discover', 'draft'] as const) {
    assert.deepEqual(await model.generate({ ...request, operation }), { data: { summary: 'A supported match.' }, inputTokens: 120, outputTokens: 30 })
    const wire = captured.at(-1)!
    assert.equal(wire.url, 'https://tokenrhythm.studio/v1/chat/completions')
    assert.equal(wire.init.method, 'POST')
    assert.equal(wire.init.redirect, 'error')
    assert(wire.init.signal instanceof AbortSignal)
    assert.deepEqual(wire.init.headers, { authorization: 'Bearer ' + secret, 'content-type': 'application/json' })
    assert.deepEqual(JSON.parse(String(wire.init.body)), {
      model: modelName,
      messages: [{ role: 'system', content: request.instructions }, { role: 'user', content: JSON.stringify(request.input) }],
      stream: false, store: false, max_tokens: 2400,
      response_format: { type: 'json_schema', json_schema: { name: 'signalpass_' + operation, strict: true, schema } },
    })
  }
  assert.equal(captured.length, 2)
})

test('TokenRhythm rejects incomplete, refused, tool-bearing and malformed completions without retries or content leaks', async () => {
  const payloads: unknown[] = [
    null, [], {}, completed({ error: { message: secret } }),
    completed({ choices: [] }), completed({ choices: [choice(), choice({}, { index: 1 })] }),
    completed({ choices: [null] }), completed({ choices: [choice({}, { index: 1 })] }),
    completed({ choices: [choice({}, { index: undefined })] }),
    ...['length', 'content_filter', 'tool_calls', null, undefined].map(finish_reason => completed({ choices: [choice({}, { finish_reason })] })),
    completed({ choices: [choice({ role: 'user' })] }),
    completed({ choices: [choice({ refusal: secret })] }),
    completed({ choices: [choice({ tool_calls: [{ function: { name: 'send', arguments: secret } }] })] }),
    completed({ choices: [choice({ tool_calls: [] })] }),
    completed({ choices: [choice({ function_call: { name: 'send', arguments: secret } })] }),
    completed({ choices: [choice({ content: null })] }),
    completed({ choices: [choice({ content: '' })] }),
    completed({ choices: [choice({ content: [{ type: 'text', text: secret }] })] }),
    completed({ choices: [choice({ content: secret })] }),
    completed({ choices: [choice({}, { message: null })] }),
  ]
  for (const payload of payloads) {
    let calls = 0
    const model = new TokenRhythmChatAgentModel({ apiKey: secret, model: modelName, fetch: async () => { calls++; return Response.json(payload) } })
    await assert.rejects(model.generate(request), safeFailure('agent_response_incomplete'))
    assert.equal(calls, 1)
  }
})

test('TokenRhythm ignores auxiliary reasoning and normalizes unsafe or missing usage counts', async () => {
  for (const usage of [undefined, null, { prompt_tokens: -1, completion_tokens: Number.MAX_SAFE_INTEGER + 1 }, { prompt_tokens: '4', completion_tokens: 1.5 }]) {
    const model = new TokenRhythmChatAgentModel({
      apiKey: secret, model: modelName,
      fetch: async () => Response.json(completed({ choices: [choice({ reasoning_content: secret })], usage })),
    })
    assert.deepEqual(await model.generate(request), { data: { summary: 'A supported match.' }, inputTokens: 0, outputTokens: 0 })
  }
})

test('TokenRhythm HTTP and transport failures expose only bounded categories and never retry', async () => {
  for (const status of [301, 400, 401, 429, 500, 503]) {
    let calls = 0
    const model = new TokenRhythmChatAgentModel({ apiKey: secret, model: modelName, fetch: async () => {
      calls++
      return Response.json({ error: { message: secret } }, { status })
    } })
    await assert.rejects(model.generate(request), safeFailure(status === 429 || status === 503 ? 'agent_provider_busy' : 'agent_unavailable'))
    assert.equal(calls, 1)
  }
  let calls = 0
  const model = new TokenRhythmChatAgentModel({ apiKey: secret, model: modelName, fetch: async () => { calls++; throw new Error(secret) } })
  await assert.rejects(model.generate(request), safeFailure('agent_unavailable'))
  assert.equal(calls, 1)
})

test('TokenRhythm caps response bytes, rejects invalid envelopes and aborts both stalled fetch and body reads', async () => {
  let cancelled = false
  const oversized = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(128 * 1024 + 1).fill(32)) },
    cancel() { cancelled = true },
  })
  const model = new TokenRhythmChatAgentModel({ apiKey: secret, model: modelName, fetch: async () => new Response(oversized) })
  await assert.rejects(model.generate(request), safeFailure('agent_unavailable'))
  assert.equal(cancelled, true)
  for (const response of [new Response(secret), new Response(new Uint8Array([0xff])), new Response(null)]) {
    await assert.rejects(new TokenRhythmChatAgentModel({ apiKey: secret, model: modelName, fetch: async () => response }).generate(request), safeFailure('agent_unavailable'))
  }
  for (const stall of ['fetch', 'body']) {
    let signal: AbortSignal | null | undefined
    const pending = new TokenRhythmChatAgentModel({
      apiKey: secret, model: modelName, timeoutMs: 5,
      fetch: (_url, init) => {
        signal = init?.signal
        return stall === 'fetch' ? new Promise<Response>(() => {}) : Promise.resolve(new Response(new ReadableStream<Uint8Array>({ pull: () => new Promise(() => {}) })))
      },
    })
    await assert.rejects(pending.generate(request), safeFailure('agent_timeout'))
    assert.equal(signal?.aborted, true)
  }
})

test('TokenRhythm configuration requires explicit credentials/model and shares safe endpoint rules', () => {
  assert.deepEqual(configuredHostedAgent({ TOKENRHYTHM_API_KEY: secret, OPENAI_API_KEY: secret }), {})
  const env = { SIGNALPASS_AGENT_PROVIDER: 'tokenrhythm', SIGNALPASS_AGENT_MODEL: modelName, SIGNALPASS_AGENT_API_KEY: secret }
  const configured = configuredHostedAgent(env)
  assert(configured.model instanceof TokenRhythmChatAgentModel)
  assert.equal(configured.model.model, modelName)
  assert.equal(configured.dailyUserLimit, 20)
  assert.equal(configured.dailyGlobalLimit, 200)
  assert(!JSON.stringify(configured).includes(secret))
  for (const settings of [{ ...env, SIGNALPASS_AGENT_API_KEY: '' }, { ...env, SIGNALPASS_AGENT_MODEL: '' }, { ...env, SIGNALPASS_AGENT_API_KEY: 'key\r\n' }, { ...env, SIGNALPASS_AGENT_TIMEOUT_MS: '60001' }]) assert.throws(() => configuredHostedAgent(settings), safeConfigFailure)
  for (const baseUrl of ['http://example.com/v1', 'https://user:' + secret + '@example.com/v1', 'https://example.com/v1?secret=' + secret, 'https://example.com/v1#' + secret, 'https://example.com?', 'file:///tmp/' + secret]) {
    assert.throws(() => new TokenRhythmChatAgentModel({ apiKey: secret, model: modelName, baseUrl }), safeConfigFailure)
  }
  for (const baseUrl of ['https://tokenrhythm.studio/v1/', 'http://127.0.0.1:8000/v1', 'http://localhost:8000/v1', 'http://[::1]:8000/v1']) {
    assert.doesNotThrow(() => new TokenRhythmChatAgentModel({ apiKey: secret, model: modelName, baseUrl }))
  }
})

test('TokenRhythm default deadline is 45 seconds and explicit configuration can bound it at 60 seconds', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const captured: { signal?: AbortSignal } = {}
  context.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit | undefined) => {
    captured.signal = init?.signal ?? undefined
    return await new Promise<Response>((_resolve, reject) => captured.signal!.addEventListener('abort', () => reject(new Error(secret)), { once: true }))
  })
  for (const configured of [undefined, '60000']) {
    const model = configuredHostedAgent({ SIGNALPASS_AGENT_PROVIDER: 'tokenrhythm', SIGNALPASS_AGENT_API_KEY: secret, SIGNALPASS_AGENT_MODEL: modelName, SIGNALPASS_AGENT_TIMEOUT_MS: configured }).model!
    const rejected = assert.rejects(model.generate(request), safeFailure('agent_timeout'))
    const signal = captured.signal
    assert(signal)
    context.mock.timers.tick(Number(configured ?? 45000) - 1)
    assert.equal(signal.aborted, false)
    context.mock.timers.tick(1)
    assert.equal(signal.aborted, true)
    await rejected
  }
})

test('explicit protected key files are bounded, sanitized and usable by each provider; disabled provider never reads a key file', async context => {
  const dir = mkdtempSync(join(tmpdir(), 'signalpass-key-fixture-'))
  context.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, secret + '.key')
  const env = { SIGNALPASS_AGENT_PROVIDER: 'tokenrhythm', SIGNALPASS_AGENT_MODEL: modelName, SIGNALPASS_AGENT_API_KEY_FILE: path }
  const write = (contents: string | Uint8Array, mode = 0o600) => { writeFileSync(path, contents, { mode }); chmodSync(path, mode) }
  write(secret + '\n')
  assert.deepEqual(configuredHostedAgent({ SIGNALPASS_AGENT_API_KEY_FILE: '/missing/' + secret }), {})
  // A getter that throws proves disabled configuration does not even access this setting.
  assert.deepEqual(configuredHostedAgent(Object.defineProperty({}, 'SIGNALPASS_AGENT_API_KEY_FILE', { get() { throw new Error(secret) } })), {})
  let authorization: string | null = null
  context.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit | undefined) => { authorization = new Headers(init?.headers).get('authorization'); return Response.json(completed()) })
  const configured = configuredHostedAgent({ ...env, SIGNALPASS_AGENT_API_KEY: '   ' })
  assert(!JSON.stringify(configured).includes(secret))
  await configured.model!.generate(request)
  assert.equal(authorization, 'Bearer ' + secret)
  for (const [provider, model] of [['openai', 'fixture'], ['openrouter', 'fixture/model:free'], ['tokenrhythm', modelName]]) {
    assert.equal(configuredHostedAgent({ ...env, SIGNALPASS_AGENT_PROVIDER: provider, SIGNALPASS_AGENT_MODEL: model }).model?.provider, provider)
  }
  assert.throws(() => configuredHostedAgent({ ...env, SIGNALPASS_AGENT_API_KEY: secret }), safeConfigFailure)
  assert.throws(() => configuredHostedAgent({ ...env, SIGNALPASS_AGENT_API_KEY_FILE: join(dir, 'missing-' + secret) }), safeConfigFailure)
  for (const contents of ['', ' \n', secret + '\nsecond-key', 'x'.repeat(8193), new Uint8Array([0xff])]) {
    write(contents)
    assert.throws(() => configuredHostedAgent(env), safeConfigFailure)
  }
  write('x'.repeat(8192))
  assert.doesNotThrow(() => configuredHostedAgent(env))
  write(secret, 0o644)
  assert.throws(() => configuredHostedAgent(env), safeConfigFailure)
  write(secret, 0o400)
  assert.doesNotThrow(() => configuredHostedAgent(env))
  const link = join(dir, 'symlink'), folder = join(dir, 'directory')
  symlinkSync(path, link); mkdirSync(folder, { mode: 0o700 })
  for (const badPath of [link, folder]) assert.throws(() => configuredHostedAgent({ ...env, SIGNALPASS_AGENT_API_KEY_FILE: badPath }), safeConfigFailure)
})
