import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import {
  type Actor,
  type EvaluationOutcome,
  type IntroductionState,
  assertTransition,
  canActorAdvance,
  introductionSubmissionSchema,
  quoteIntroduction,
  quoteRequestSchema,
} from '@signalpass/core'
import { keccak256, toHex, type Address, type Hex } from 'viem'
import {
  createStore,
  declineKey,
  hashDocument,
  profileByHandle,
  profileByOwner,
  queueDepth,
  reviewQueue,
  seedDemoData,
  unresolvedCountFor,
  type Store,
  type StoredIntroduction,
} from './store.js'

const store: Store = createStore()
seedDemoData(store)

/** BigInt does not survive JSON.stringify, and every amount here is a BigInt. */
function jsonSafe(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(jsonSafe)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, jsonSafe(v)]))
  }
  return value
}

/**
 * MVP stand-in for the evaluator service. It produces the same shape the
 * Hunyuan-backed evaluator will return, so swapping it is a one-line change.
 */
function mockEvaluate(
  intro: StoredIntroduction,
  topics: readonly string[],
): EvaluationOutcome {
  const body = `${intro.intent.whoAmI} ${intro.intent.whyYou} ${intro.intent.whatIOffer}`.toLowerCase()
  const hits = topics.filter((t) => body.includes(t.split(' ')[0] ?? ''))
  const hasDetail = intro.intent.whyYou.length > 80
  const recommendation: EvaluationOutcome['recommendation'] =
    hits.length > 0 && hasDetail ? 'review' : hits.length > 0 ? 'ask_for_context' : 'not_now'

  const receiptBody = {
    introductionId: intro.id,
    policyVersion: intro.policyVersion,
    modelVersion: 'mock-evaluator-v0',
    recommendation,
    signals: intro.disclosedSignals.length,
  }

  return {
    recommendation,
    whyItMayMatter:
      hits.length > 0
        ? `Shares an interest in ${hits.join(', ')}, which is on your published list.`
        : 'Nothing in the request maps to your published topics yet.',
    recipientSummary: [
      `${intro.intent.whoAmI.slice(0, 140)}`,
      `Wants: ${intro.intent.nextStep.slice(0, 140)}`,
      `Offers: ${intro.intent.whatIOffer.slice(0, 140)}`,
    ],
    suggestedOpeningQuestion: 'What does your current build look like in production?',
    coachNotes: hasDetail
      ? ['The request already states a concrete reason for reaching out.']
      : ['Add one sentence about why this specific person, not the category they belong to.'],
    missingContext: hasDetail ? [] : ['whyYou'],
    receiptHash: hashDocument(receiptBody),
  }
}

const app = new Hono()
app.use('*', logger())
app.use('*', cors())

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: '@signalpass/api',
    profiles: store.profiles.size,
    introductions: store.introductions.size,
    evaluator: process.env.EVALUATOR_MODE ?? 'mock',
  }),
)

app.get('/profiles', (c) =>
  c.json(jsonSafe({ profiles: [...store.profiles.values()] })),
)

app.get('/profiles/:handle', (c) => {
  const profile = profileByHandle(store, c.req.param('handle'))
  if (!profile) return c.json({ error: 'profile_not_found' }, 404)
  const policy = store.policies.get(profile.handle)
  return c.json(jsonSafe({ profile, policy: policy ?? null }))
})

app.post('/quote', async (c) => {
  const parsed = quoteRequestSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'invalid_request', issues: parsed.error.issues }, 400)

  const { sender, recipientHandle, contextChars, attachmentCount } = parsed.data
  const profile = profileByHandle(store, recipientHandle)
  const policy = store.policies.get(recipientHandle.toLowerCase())
  if (!profile || !policy) return c.json({ error: 'recipient_not_found' }, 404)

  try {
    const quote = quoteIntroduction({
      policy,
      contextChars,
      attachmentCount,
      unresolvedFromSender: unresolvedCountFor(store, sender as Address, profile.owner),
      recipientQueueDepth: queueDepth(store, profile.owner),
      priorDeclinesFromSender: store.declines.get(declineKey(sender as Address, profile.owner)) ?? 0,
      now: Math.floor(Date.now() / 1000),
    })
    return c.json(jsonSafe({ recipient: profile.handle, policyVersion: policy.version, quote }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'quote_rejected'
    return c.json({ error: 'quote_rejected', message }, 409)
  }
})

app.post('/introductions', async (c) => {
  const parsed = introductionSubmissionSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'invalid_request', issues: parsed.error.issues }, 400)

  const { sender, recipientHandle, intent, disclosedSignals, attachmentCount } = parsed.data
  const profile = profileByHandle(store, recipientHandle)
  const policy = store.policies.get(recipientHandle.toLowerCase())
  if (!profile || !policy) return c.json({ error: 'recipient_not_found' }, 404)

  const now = Math.floor(Date.now() / 1000)
  const contextChars = Object.values(intent).join(' ').length

  let quote
  try {
    quote = quoteIntroduction({
      policy,
      contextChars,
      attachmentCount,
      unresolvedFromSender: unresolvedCountFor(store, sender as Address, profile.owner),
      recipientQueueDepth: queueDepth(store, profile.owner),
      priorDeclinesFromSender: store.declines.get(declineKey(sender as Address, profile.owner)) ?? 0,
      now,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'quote_rejected'
    return c.json({ error: 'quote_rejected', message }, 409)
  }

  const id = keccak256(
    toHex(`${sender}:${profile.owner}:${store.introductions.size}:${now}`),
  ) as Hex

  const stored: StoredIntroduction = {
    id,
    sender: sender as Address,
    recipient: profile.owner,
    intent,
    disclosedSignals,
    state: 'locked',
    policyVersion: policy.version,
    createdAt: now,
    updatedAt: now,
    quote,
    payloadHash: hashDocument(intent),
    evaluationReceiptHash: null,
    evaluationOutcome: null,
    evaluationProvider: null,
  }

  store.introductions.set(id, stored)
  return c.json(jsonSafe({ introduction: stored }), 201)
})

app.get('/introductions/:id', (c) => {
  const intro = store.introductions.get(c.req.param('id') as Hex)
  if (!intro) return c.json({ error: 'introduction_not_found' }, 404)
  return c.json(jsonSafe({ introduction: intro }))
})

app.get('/queue/:handle', (c) => {
  const handle = c.req.param('handle')
  const profile = profileByHandle(store, handle)
  if (!profile) return c.json({ error: 'profile_not_found' }, 404)
  return c.json(
    jsonSafe({
      handle,
      depth: queueDepth(store, profile.owner),
      queue: reviewQueue(store, handle),
    }),
  )
})

type EvaluatorHalf = Omit<EvaluationOutcome, 'receiptHash'>

/**
 * Runs the bilateral evaluation. Prefers the dedicated evaluator service when
 * EVALUATOR_URL is configured, and falls back to the local mock so the demo
 * works from a single process during development.
 */
async function runEvaluation(
  intro: StoredIntroduction,
  recipientHandle: string,
): Promise<{ outcome: EvaluationOutcome; provider: string }> {
  const url = process.env.EVALUATOR_URL
  const policy = store.policies.get(recipientHandle)

  if (url && policy) {
    try {
      const response = await fetch(`${url.replace(/\/$/, '')}/evaluate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // jsonSafe, not JSON.stringify: the policy carries wei-denominated
        // bigints and a bare stringify throws on them.
        body: JSON.stringify(
          jsonSafe({
            introductionId: intro.id,
            senderHandle: profileByOwner(store, intro.sender)?.handle ?? 'unknown',
            recipientHandle,
            intent: intro.intent,
            recipientPolicy: policy,
            disclosedSignals: intro.disclosedSignals,
          }),
        ),
      })

      if (response.ok) {
        const body = (await response.json()) as { outcome: EvaluatorHalf; provider: string }
        return {
          provider: body.provider,
          outcome: {
            ...body.outcome,
            receiptHash: hashDocument({
              introductionId: intro.id,
              policyVersion: intro.policyVersion,
              provider: body.provider,
              outcome: body.outcome,
            }),
          },
        }
      }

      console.warn(
        `[evaluator] ${url} answered ${response.status}; falling back to the in-process mock`,
      )
    } catch (error) {
      // Evaluator unreachable: fall through to the local mock rather than
      // failing the sender's request. Log it — a silent fallback hides real
      // wiring bugs.
      console.warn(
        `[evaluator] ${url} unreachable (${error instanceof Error ? error.message : 'unknown error'}); falling back to the in-process mock`,
      )
    }
  }

  return { outcome: mockEvaluate(intro, policy?.topics ?? []), provider: 'mock-local' }
}

app.post('/introductions/:id/evaluate', async (c) => {
  const id = c.req.param('id') as Hex
  const intro = store.introductions.get(id)
  if (!intro) return c.json({ error: 'introduction_not_found' }, 404)
  if (intro.state !== 'locked') return c.json({ error: 'illegal_state', state: intro.state }, 409)

  const recipientHandle = profileByOwner(store, intro.recipient)?.handle ?? ''
  const { outcome, provider } = await runEvaluation(intro, recipientHandle)

  const nextState: IntroductionState =
    outcome.recommendation === 'ask_for_context' ? 'needs_context' : 'ready_for_review'

  const updated: StoredIntroduction = {
    ...intro,
    state: nextState,
    updatedAt: Math.floor(Date.now() / 1000),
    evaluationReceiptHash: outcome.receiptHash,
    evaluationOutcome: outcome,
    evaluationProvider: provider,
  }
  store.introductions.set(id, updated)

  return c.json(jsonSafe({ introduction: updated, outcome, provider }))
})

app.post('/introductions/:id/transition', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { actor?: Actor; to?: IntroductionState } | null
  if (!body?.actor || !body.to) return c.json({ error: 'invalid_request' }, 400)

  const id = c.req.param('id') as Hex
  const intro = store.introductions.get(id)
  if (!intro) return c.json({ error: 'introduction_not_found' }, 404)

  if (!canActorAdvance(body.actor, body.to)) {
    return c.json({ error: 'actor_not_allowed', actor: body.actor, to: body.to }, 403)
  }

  try {
    assertTransition(intro.state, body.to)
  } catch (error) {
    return c.json(
      { error: 'illegal_transition', from: intro.state, to: body.to, message: (error as Error).message },
      409,
    )
  }

  const updated: StoredIntroduction = {
    ...intro,
    state: body.to,
    updatedAt: Math.floor(Date.now() / 1000),
  }
  store.introductions.set(id, updated)

  if (body.to === 'declined' || body.to === 'expired') {
    const key = declineKey(intro.sender, intro.recipient)
    store.declines.set(key, (store.declines.get(key) ?? 0) + 1)
  }

  return c.json(jsonSafe({ introduction: updated }))
})

const port = Number(process.env.API_PORT ?? 8787)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`@signalpass/api listening on http://localhost:${info.port}`)
})
