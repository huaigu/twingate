import { closeSync, constants, fstatSync, openSync, readSync } from 'node:fs'
import type { AgentModel, HostedAgentOptions } from './agent-types.js'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const TOKENRHYTHM_BASE_URL = 'https://tokenrhythm.studio/v1'
const MAX_RESPONSE_BYTES = 128 * 1024
const MAX_KEY_FILE_BYTES = 8192
const PROVIDER_ERROR = 'The personal agent could not complete this request. Please try again.'
const CONFIG_ERROR = 'Invalid SignalPass agent configuration. Check the server environment settings.'

export type AgentProviderErrorCode = 'agent_timeout' | 'agent_provider_busy' | 'agent_response_incomplete' | 'agent_unavailable'

/** A bounded public category, never the provider's response, reason or private input. */
export class AgentProviderError extends Error {
  constructor(readonly code: AgentProviderErrorCode) { super(PROVIDER_ERROR) }
}

type GenerationRequest = Parameters<AgentModel['generate']>[0]
type Fetch = typeof globalThis.fetch

export interface OpenAIResponsesAgentModelOptions {
  apiKey: string
  model: string
  baseUrl?: string
  /** Injectable for offline tests; never supplied by an API client. */
  fetch?: Fetch
  timeoutMs?: number
}

export type OpenRouterResponsesAgentModelOptions = OpenAIResponsesAgentModelOptions
export type TokenRhythmChatAgentModelOptions = OpenAIResponsesAgentModelOptions

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function responseEndpoint(baseUrl: string, operation = 'responses'): string {
  try {
    const url = new URL(baseUrl)
    const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
        url.username || url.password || /[?#]/.test(baseUrl)) throw new Error(CONFIG_ERROR)
    url.pathname = url.pathname.replace(/\/+$/, '') + '/' + operation
    return url.href
  } catch {
    // Do not put URLs (which might contain credentials) into errors.
    throw new Error(CONFIG_ERROR)
  }
}

async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error(PROVIDER_ERROR)
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let bytes = 0
  let body = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > MAX_RESPONSE_BYTES) throw new Error(PROVIDER_ERROR)
      body += decoder.decode(value, { stream: true })
    }
    body += decoder.decode()
    return JSON.parse(body) as unknown
  } catch {
    await reader.cancel().catch(() => {})
    throw new Error(PROVIDER_ERROR)
  } finally {
    reader.releaseLock()
  }
}

function tokenCount(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}

/** Shared server-only transport. The caller also validates the resulting data. */
class ResponsesAgentModel implements AgentModel {
  readonly provider: 'openai' | 'openrouter'
  readonly model: string
  readonly #apiKey: string
  readonly #endpoint: string
  readonly #fetch: Fetch
  readonly #timeoutMs: number

  constructor(options: OpenAIResponsesAgentModelOptions, provider: 'openai' | 'openrouter') {
    if (!options.apiKey.trim() || !options.model.trim() || /[\r\n]/.test(options.apiKey)) throw new Error(CONFIG_ERROR)
    this.provider = provider
    this.#apiKey = options.apiKey.trim()
    this.model = options.model.trim()
    this.#endpoint = responseEndpoint(options.baseUrl ?? (provider === 'openrouter' ? OPENROUTER_BASE_URL : DEFAULT_BASE_URL))
    this.#fetch = options.fetch ?? globalThis.fetch
    this.#timeoutMs = options.timeoutMs ?? (provider === 'openrouter' ? 45_000 : 15_000)
    if (!Number.isSafeInteger(this.#timeoutMs) || this.#timeoutMs < 1) throw new Error(CONFIG_ERROR)
  }

  async generate(request: GenerationRequest): Promise<{ data: unknown; inputTokens: number; outputTokens: number }> {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let timedOut = false
    try {
      const deadline = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          timedOut = true
          controller.abort()
          reject(new AgentProviderError('agent_timeout'))
        }, this.#timeoutMs)
      })
      return await Promise.race([this.#request(request, controller.signal), deadline])
    } catch (error) {
      // Raw provider errors can echo input, API keys, or private context. Never forward them.
      controller.abort()
      throw new AgentProviderError(timedOut ? 'agent_timeout' : error instanceof AgentProviderError ? error.code : 'agent_unavailable')
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  async #request(request: GenerationRequest, signal: AbortSignal) {
    const response = await this.#fetch(this.#endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.#apiKey}`, 'content-type': 'application/json' },
      redirect: 'error',
      signal,
      body: JSON.stringify({
        model: this.model,
        instructions: request.instructions,
        input: JSON.stringify(request.input),
        store: false,
        max_output_tokens: 2400,
        text: { format: { type: 'json_schema', name: `signalpass_${request.operation}`, strict: true, schema: request.schema } },
        ...(this.provider === 'openrouter' ? {
          // Keep free-model tests free even if routing availability or prices change.
          // Never weaken schema/data policies or retry against paid models/providers.
          provider: {
            require_parameters: true,
            allow_fallbacks: false,
            data_collection: 'deny',
            max_price: { prompt: 0, completion: 0, request: 0, image: 0 },
          },
        } : {}),
      }),
    })
    if (!response.ok) {
      await response.body?.cancel().catch(() => {})
      throw new AgentProviderError([429, 503].includes(response.status) ? 'agent_provider_busy' : 'agent_unavailable')
    }
    const payload = await boundedJson(response)
    if (!object(payload) || payload.status !== 'completed' || payload.error != null ||
        payload.incomplete_details != null || !Array.isArray(payload.output)) throw new AgentProviderError('agent_response_incomplete')
    const texts: string[] = []
    // Reasoning items can precede the answer. Do not assume output[0] is a message.
    for (const item of payload.output) {
      if (!object(item)) throw new AgentProviderError('agent_response_incomplete')
      if (item.type !== 'message') continue
      if (item.role !== 'assistant' || (item.status !== undefined && item.status !== 'completed') ||
          !Array.isArray(item.content)) throw new AgentProviderError('agent_response_incomplete')
      for (const part of item.content) {
        if (!object(part) || part.type !== 'output_text' || typeof part.text !== 'string') throw new AgentProviderError('agent_response_incomplete')
        texts.push(part.text)
      }
    }
    if (!texts.length) throw new AgentProviderError('agent_response_incomplete')
    const usage = object(payload.usage) ? payload.usage : {}
    let data: unknown
    try { data = JSON.parse(texts.join('')) as unknown }
    catch { throw new AgentProviderError('agent_response_incomplete') }
    return {
      data,
      inputTokens: tokenCount(usage.input_tokens),
      outputTokens: tokenCount(usage.output_tokens),
    }
  }
}

/** OpenAI's existing explicit, stateless Responses integration. */
export class OpenAIResponsesAgentModel extends ResponsesAgentModel {
  constructor(options: OpenAIResponsesAgentModelOptions) {
    super(options, 'openai')
  }
}

/** Explicit free catalog entries only; no random router or paid fallback path. */
export class OpenRouterResponsesAgentModel extends ResponsesAgentModel {
  constructor(options: OpenRouterResponsesAgentModelOptions) {
    const model = options.model.trim()
    if (!/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*:free$/i.test(model) || /^openrouter\//i.test(model)) {
      throw new Error(CONFIG_ERROR)
    }
    super(options, 'openrouter')
  }
}

/** Explicit Chat Completions integration; no tool execution, retries or fallback. */
export class TokenRhythmChatAgentModel implements AgentModel {
  readonly provider = 'tokenrhythm'
  readonly model: string
  readonly #apiKey: string
  readonly #endpoint: string
  readonly #fetch: Fetch
  readonly #timeoutMs: number

  constructor(options: TokenRhythmChatAgentModelOptions) {
    if (!options.apiKey.trim() || !options.model.trim() || /[\r\n]/.test(options.apiKey)) throw new Error(CONFIG_ERROR)
    this.#apiKey = options.apiKey.trim()
    this.model = options.model.trim()
    this.#endpoint = responseEndpoint(options.baseUrl ?? TOKENRHYTHM_BASE_URL, 'chat/completions')
    this.#fetch = options.fetch ?? globalThis.fetch
    this.#timeoutMs = options.timeoutMs ?? 45_000
    if (!Number.isSafeInteger(this.#timeoutMs) || this.#timeoutMs < 1) throw new Error(CONFIG_ERROR)
  }

  async generate(request: GenerationRequest): Promise<{ data: unknown; inputTokens: number; outputTokens: number }> {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let timedOut = false
    try {
      const deadline = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          timedOut = true
          controller.abort()
          reject(new AgentProviderError('agent_timeout'))
        }, this.#timeoutMs)
      })
      return await Promise.race([this.#request(request, controller.signal), deadline])
    } catch (error) {
      controller.abort()
      throw new AgentProviderError(timedOut ? 'agent_timeout' : error instanceof AgentProviderError ? error.code : 'agent_unavailable')
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  async #request(request: GenerationRequest, signal: AbortSignal) {
    const response = await this.#fetch(this.#endpoint, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + this.#apiKey, 'content-type': 'application/json' },
      redirect: 'error',
      signal,
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: request.instructions },
          { role: 'user', content: JSON.stringify(request.input) },
        ],
        stream: false,
        store: false,
        max_tokens: 2400,
        response_format: { type: 'json_schema', json_schema: { name: 'signalpass_' + request.operation, strict: true, schema: request.schema } },
      }),
    })
    if (!response.ok) {
      await response.body?.cancel().catch(() => {})
      throw new AgentProviderError([429, 503].includes(response.status) ? 'agent_provider_busy' : 'agent_unavailable')
    }
    const payload = await boundedJson(response)
    if (!object(payload) || payload.error != null || !Array.isArray(payload.choices) || payload.choices.length !== 1) throw new AgentProviderError('agent_response_incomplete')
    const choice = payload.choices[0]
    if (!object(choice) || choice.index !== 0 || choice.finish_reason !== 'stop' || !object(choice.message)) throw new AgentProviderError('agent_response_incomplete')
    const message = choice.message
    if (message.role !== 'assistant' || typeof message.content !== 'string' || !message.content.trim() ||
        message.refusal != null || message.tool_calls != null || message.function_call != null) throw new AgentProviderError('agent_response_incomplete')
    let data: unknown
    try { data = JSON.parse(message.content) as unknown }
    catch { throw new AgentProviderError('agent_response_incomplete') }
    const usage = object(payload.usage) ? payload.usage : {}
    return { data, inputTokens: tokenCount(usage.prompt_tokens), outputTokens: tokenCount(usage.completion_tokens) }
  }
}

/** Read only an explicitly configured, owner-protected regular file, with bounded allocation. */
function configuredApiKey(env: Record<string, string | undefined>): string {
  const direct = env.SIGNALPASS_AGENT_API_KEY ?? ''
  const path = env.SIGNALPASS_AGENT_API_KEY_FILE?.trim()
  if (!path) return direct
  if (direct.trim()) throw new Error(CONFIG_ERROR)
  let fd: number | undefined
  try {
    // NOFOLLOW prevents a swapped symlink; NONBLOCK avoids hanging on a FIFO.
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
    const info = fstatSync(fd)
    const uid = process.getuid?.()
    if (!info.isFile() || info.size > MAX_KEY_FILE_BYTES ||
        (info.mode & 0o077) !== 0 || (uid !== undefined && info.uid !== uid && info.uid !== 0)) throw new Error(CONFIG_ERROR)
    const buffer = Buffer.alloc(MAX_KEY_FILE_BYTES + 1)
    let bytes = 0
    while (bytes < buffer.length) {
      const count = readSync(fd, buffer, bytes, buffer.length - bytes, null)
      if (!count) break
      bytes += count
    }
    if (bytes > MAX_KEY_FILE_BYTES) throw new Error(CONFIG_ERROR)
    const key = new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytes)).trim()
    if (!key || /[\r\n]/.test(key)) throw new Error(CONFIG_ERROR)
    return key
  } catch {
    // Neither the filesystem path nor key material belongs in diagnostics.
    throw new Error(CONFIG_ERROR)
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}

function dailyLimit(value: string | undefined, fallback: number, max: number): number {
  if (value === undefined) return fallback
  if (!/^\d+$/.test(value.trim())) throw new Error(CONFIG_ERROR)
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) throw new Error(CONFIG_ERROR)
  return parsed
}

function configuredTimeout(value: string | undefined): number | undefined {
  if (value === undefined || !value.trim()) return undefined
  if (!/^\d+$/.test(value.trim())) throw new Error(CONFIG_ERROR)
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1000 || parsed > 60_000) throw new Error(CONFIG_ERROR)
  return parsed
}

/** Explicit opt-in only. No ambient key reuse, paid OpenRouter routing, or mock fallback. */
export function configuredHostedAgent(env: Record<string, string | undefined> = process.env): HostedAgentOptions {
  const provider = env.SIGNALPASS_AGENT_PROVIDER?.trim()
  if (!provider) return {}
  if (provider !== 'openai' && provider !== 'openrouter' && provider !== 'tokenrhythm') throw new Error(CONFIG_ERROR)
  const options = {
    apiKey: configuredApiKey(env),
    model: env.SIGNALPASS_AGENT_MODEL ?? '',
    baseUrl: env.SIGNALPASS_AGENT_BASE_URL?.trim() || undefined,
    timeoutMs: configuredTimeout(env.SIGNALPASS_AGENT_TIMEOUT_MS),
  }
  return {
    model: provider === 'openrouter' ? new OpenRouterResponsesAgentModel(options) : provider === 'tokenrhythm' ? new TokenRhythmChatAgentModel(options) : new OpenAIResponsesAgentModel(options),
    dailyUserLimit: dailyLimit(env.SIGNALPASS_AGENT_DAILY_USER_LIMIT, 20, 1000),
    dailyGlobalLimit: dailyLimit(env.SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT, 200, 10_000),
  }
}
