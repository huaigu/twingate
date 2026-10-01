import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { disclosedSignalSchema, gatePolicySchema, introductionIntentSchema } from '@signalpass/core'
import { z } from 'zod'
import type { Hex } from 'viem'
import { HunyuanEvaluator, HunyuanPersonaProvider } from './hunyuan.js'
import { MockEvaluator, MockPersonaProvider } from './mock.js'
import { enforceRecommendationPolicy, type EvaluatorProvider, type PersonaProvider } from './types.js'

function buildEvaluator(): EvaluatorProvider {
  const mode = process.env.EVALUATOR_MODE ?? 'mock'
  const apiKey = process.env.HUNYUAN_API_KEY
  const baseUrl = process.env.HUNYUAN_BASE_URL

  if (mode === 'hunyuan' && apiKey && baseUrl) {
    console.log('[evaluator] using Hunyuan for bilateral evaluation')
    return new HunyuanEvaluator(apiKey, baseUrl, process.env.HUNYUAN_MODEL ?? 'hunyuan-turbos-latest')
  }

  if (mode === 'hunyuan') {
    console.warn('[evaluator] EVALUATOR_MODE=hunyuan but HUNYUAN_API_KEY/HUNYUAN_BASE_URL missing; falling back to mock')
  }
  return new MockEvaluator()
}

function buildPersona(): PersonaProvider {
  const apiKey = process.env.HUNYUAN_API_KEY
  const endpoint = process.env.HUNYUAN_3D_ENDPOINT

  if (apiKey && endpoint) {
    console.log('[evaluator] using Hunyuan 3D for agent personas')
    return new HunyuanPersonaProvider(apiKey, endpoint)
  }
  return new MockPersonaProvider()
}

/**
 * Introduction ids are keccak256 anchors produced by the API, so the wire
 * format is a 0x-prefixed hex string. Validating here keeps the provider
 * interface honest (it declares `Hex`, not `string`).
 */
const hexIdSchema = z.custom<Hex>(
  (value) => typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value),
  { message: 'expected a 0x-prefixed hex string' },
)

const evaluateRequestSchema = z.object({
  introductionId: hexIdSchema,
  senderHandle: z.string().min(1),
  recipientHandle: z.string().min(1),
  intent: introductionIntentSchema,
  context: z.object({
    sharedProfile: z.object({ bio: z.string().max(600), interests: z.array(z.string().max(80)).max(12) }).nullable(),
    question: z.string().max(1000).nullable(),
    reply: z.string().max(1000).nullable(),
  }).optional(),
  recipientPolicy: gatePolicySchema,
  disclosedSignals: z.array(disclosedSignalSchema).max(3).default([]),
})

const personaRequestSchema = z.object({
  handle: z.string().min(3).max(32),
  sourceKind: z.enum(['image', 'text']),
  source: z.string().min(1).max(2000),
})

const evaluator = buildEvaluator()
const persona = buildPersona()

const app = new Hono()
app.use('*', logger())
app.use('*', cors())

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: '@signalpass/evaluator',
    evaluator: evaluator.name,
    persona: persona.name,
  }),
)

/**
 * Bilateral evaluation. One call produces both halves: sender-facing coaching
 * and a recipient-facing summary. The guardrail runs on every path, including
 * the model-backed one, so a provider can only ever recommend, never decide.
 */
app.post('/evaluate', async (c) => {
  const parsed = evaluateRequestSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'invalid_request', issues: parsed.error.issues }, 400)

  try {
    const raw = await evaluator.evaluate(parsed.data)
    const outcome = enforceRecommendationPolicy(raw)
    return c.json({
      outcome,
      provider: evaluator.name,
      policyVersion: parsed.data.recipientPolicy.version,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'evaluation_failed'
    return c.json({ error: 'evaluation_failed', message }, 502)
  }
})

app.post('/persona', async (c) => {
  const parsed = personaRequestSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'invalid_request', issues: parsed.error.issues }, 400)

  const result = await persona.generate(parsed.data)
  return c.json({ persona: result, provider: persona.name })
})

const port = Number(process.env.EVALUATOR_PORT ?? 8788)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`@signalpass/evaluator listening on http://localhost:${info.port}`)
  console.log(`  evaluator: ${evaluator.name}`)
  console.log(`  persona:   ${persona.name}`)
})
