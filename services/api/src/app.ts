import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { introductionSubmissionSchema, quoteIntroduction, isTerminal, canTransition, type GatePolicy } from '@signalpass/core'
import { type Address, type Hex, isAddress } from 'viem'
import { createAuth, type Session } from './auth.js'
import { transaction } from './database.js'
import { createStore, hashDocument, profileByOwner, queueDepth, unresolvedCountFor, declineKey, type ProfileSettings, type StoredIntroduction, type Store } from './store.js'
import { evaluateIntroduction, EvaluationPolicyChangedError } from './evaluation.js'
import { ChainError, type ChainService } from './chain.js'
import { installChainRoutes } from './chain-routes.js'
import { DEFAULT_PRICING } from '@signalpass/core'
import { installAgentRoutes } from './agent-routes.js'
import type { HostedAgentOptions } from './agent-types.js'
import { installConnectionRoutes } from './connection-routes.js'

const address = z.string().refine((v) => isAddress(v, { strict: false })).transform((v) => v.toLowerCase() as Address)
const now = () => Math.floor(Date.now() / 1000)
export const jsonSafe = (value: unknown): any => JSON.parse(JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
const profileSchema = z.object({
  handle: z.string().regex(/^[a-z0-9_-]{3,32}$/),
  profile: z.object({ name: z.string().trim().min(1).max(80), bio: z.string().trim().min(1).max(600), interests: z.string().max(600), offer: z.string().trim().min(1).max(600), meet: z.string().trim().min(1).max(600) }),
  agent: z.object({ visibility: z.enum(['private', 'limited', 'public']), matching: z.boolean(), sources: z.array(z.enum(['github', 'x', 'website', 'agent'])).max(4), interests: z.array(z.string().trim().min(1).max(80)).max(12) }),
  sourceLinks: z.record(z.string().url().max(1200)).default({}),
  avatar: z.enum(['alex', 'maya', 'rohan', 'leo', 'beanie', 'none']).default('alex'),
})
const submissionSchema = introductionSubmissionSchema.omit({ sender: true }).extend({
  settlement: z.enum(['offchain', 'onchain']).default('offchain'),
  sender: address.optional(), sharedContext: z.boolean().default(false),
  profileVersion: z.string().optional(), idempotencyKey: z.string().uuid(),
})
const revisionSchema = z.object({ revision: z.number().int().positive() })

export function createApp(options: { databasePath?: string; origin: string; evaluatorUrl?: string; chain?: ChainService; agent?: HostedAgentOptions }) {
  const store = createStore(options.databasePath)
  const auth = createAuth(store.db, options.origin)
  const app = new Hono<{ Variables: { session: Session } }>()
  app.use('*', cors({ origin: options.origin, credentials: true, allowHeaders: ['Content-Type', 'X-SignalPass-CSRF'], allowMethods: ['GET', 'POST', 'OPTIONS'] }))
  app.use('*', bodyLimit({ maxSize: 64 * 1024, onError: (c) => c.json({ error: 'request_too_large' }, 413) }))
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store')
    const mutation = c.req.method !== 'GET' && c.req.method !== 'OPTIONS'
    if (mutation && !auth.sameOrigin(c)) return c.json({ error: 'origin_not_allowed' }, 403)
    const readiness = c.req.method === 'GET' && c.req.path === '/ready'
    const publicRead = readiness || c.req.method === 'GET' && (c.req.path === '/health' || c.req.path === '/chain/config' || c.req.path === '/profiles' || c.req.path.startsWith('/profiles/'))
    const authRequest = ['/auth/challenge', '/auth/verify'].includes(c.req.path)
    const session = readiness ? null : auth.session(c)
    if (session) c.set('session', session)
    if (!publicRead && !authRequest && c.req.method !== 'OPTIONS') {
      if (!session) return c.json({ error: 'authentication_required' }, 401)
      if (mutation && c.req.header('x-signalpass-csrf') !== session.csrf) return c.json({ error: 'csrf_required' }, 403)
    }
    await next()
  })
  app.onError((error, c) => { if (error instanceof ChainError) return c.json({ error: error.code }, error.status as 409 | 503); console.error('[api]', error.message); return c.json({ error: 'internal_error' }, 500) })
  const chainRoutes = installChainRoutes(app, store, options.chain)
  installAgentRoutes(app, store, options.agent)
  installConnectionRoutes(app, store)
  app.get('/health', (c) => c.json({ ok: true, service: '@signalpass/api', storage: 'sqlite', identity: 'siwe-eoa', settlement: options.chain ? 'configured_manual_review' : 'not_connected', evaluator: options.chain ? 'disabled_manual_review' : options.evaluatorUrl ? 'external' : 'mock-local' }))
  app.get('/ready', (c) => {
    try {
      store.db.prepare('SELECT 1').get()
      return c.json({ ok: true, ready: true, service: '@signalpass/api', checks: { database: 'ok' }, scope: 'database_only' })
    } catch { return c.json({ ok: false, ready: false, error: 'database_unavailable' }, 503) }
  })
  app.post('/auth/challenge', async (c) => {
    const parsed = z.object({ address, chainId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) }).safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'invalid_request' }, 400)
    const challenge = auth.challenge(parsed.data.address, parsed.data.chainId)
    return challenge ? c.json(challenge) : c.json({ error: 'too_many_challenges' }, 429)
  })
  app.post('/auth/verify', async (c) => {
    const parsed = z.object({ nonce: z.string().regex(/^[a-f0-9]{32}$/), signature: z.string().regex(/^0x[0-9a-fA-F]+$/).max(300) }).safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'invalid_request' }, 400)
    const session = await auth.verify(parsed.data.nonce, parsed.data.signature as Hex, c)
    return session ? c.json({ session }) : c.json({ error: 'invalid_or_expired_signature' }, 401)
  })
  app.post('/auth/logout', (c) => { auth.logout(c); return c.json({ ok: true }) })
  app.get('/me', (c) => {
    const session = c.get('session'), profile = profileByOwner(store, session.address)
    return c.json(jsonSafe({ session, profile: profile ?? null, settings: store.settings.get(session.address) ?? null }))
  })
  app.post('/me/profile', async (c) => {
    const parsed = profileSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'invalid_profile', issues: parsed.error.issues }, 400)
    const owner = c.get('session').address, input = parsed.data
    const existing = profileByOwner(store, owner), taken = store.profiles.get(input.handle)
    if (taken && taken.owner.toLowerCase() !== owner) return c.json({ error: 'handle_taken' }, 409)
    if (existing && existing.handle !== input.handle) return c.json({ error: 'handle_cannot_change' }, 409)
    const version = hashDocument({ profile: input.profile, interests: input.agent.interests })
    const settings: ProfileSettings = { profile: input.profile, agent: input.agent, sourceLinks: input.sourceLinks, avatar: input.avatar, version }
    const policy: GatePolicy = { version: (existing?.policyVersion ?? 0) + 1, topics: input.agent.interests, availability: 'open', desiredNextStep: input.profile.meet, baseBond: 2_000_000_000_000_000n, unresolvedLimit: 3, timeoutSeconds: 259200 }
    transaction(store.db, () => {
      store.profiles.set(input.handle, { profileId: existing?.profileId ?? BigInt(store.profiles.size + 1), owner, handle: input.handle, displayName: input.profile.name, building: input.profile.bio, wantsToMeet: input.profile.meet, canOffer: input.profile.offer, availability: 'open', policyVersion: policy.version, policyHash: hashDocument(policy), persona: null, createdAt: existing?.createdAt ?? now() })
      store.policies.set(input.handle, policy); store.settings.set(owner, settings)
    })
    return c.json(jsonSafe({ profile: store.profiles.get(input.handle), settings }))
  })
  const isVisible = (owner: Address, direct = false) => { const v = store.settings.get(owner.toLowerCase())?.agent.visibility; return v === 'public' || (direct && v === 'limited') }
  const publicProfile = (p: NonNullable<ReturnType<typeof profileByOwner>>) => ({ ...p, interests: store.settings.get(p.owner.toLowerCase())?.agent.interests ?? [], avatar: store.settings.get(p.owner.toLowerCase())?.avatar ?? 'alex', provenance: 'user_approved', registeredOnchain: options.chain ? null : false })
  app.get('/profiles', (c) => c.json(jsonSafe({ profiles: [...store.profiles.values()].filter((p) => isVisible(p.owner)).slice(0, 100).map(publicProfile) })))
  app.get('/profiles/:handle', (c) => {
    const profile = store.profiles.get(c.req.param('handle').toLowerCase())
    if (!profile || !isVisible(profile.owner, true)) return c.json({ error: 'profile_not_found' }, 404)
    return c.json(jsonSafe({ profile: publicProfile(profile) }))
  })
  app.post('/quote', async (c) => {
    const parsed = z.object({ recipientHandle: z.string(), contextChars: z.number().int().min(0).max(20000).default(0), attachmentCount: z.number().int().min(0).max(5).default(0) }).safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'invalid_request' }, 400)
    const profile = store.profiles.get(parsed.data.recipientHandle), policy = store.policies.get(parsed.data.recipientHandle)
    if (!profile || !policy || !isVisible(profile.owner, true)) return c.json({ error: 'recipient_not_found' }, 404)
    try { return c.json(jsonSafe({ quote: quoteIntroduction({ policy, ...parsed.data, unresolvedFromSender: unresolvedCountFor(store, c.get('session').address, profile.owner), recipientQueueDepth: queueDepth(store, profile.owner), priorDeclinesFromSender: store.declines.get(declineKey(c.get('session').address, profile.owner)) ?? 0, now: now() }), estimateOnly: true, settlement: 'not_connected' })) }
    catch { return c.json({ error: 'quote_unavailable' }, 409) }
  })
  app.post('/introductions', async (c) => {
    const parsed = submissionSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'invalid_request', issues: parsed.error.issues }, 400)
    const input = parsed.data, sender = c.get('session').address
    if (input.settlement === 'onchain' && !options.chain) return c.json({ error: 'chain_not_configured' }, 409)
    if (input.sender && input.sender !== sender) return c.json({ error: 'sender_mismatch' }, 403)
    const senderProfile = profileByOwner(store, sender), settings = store.settings.get(sender)
    if (!senderProfile || !settings) return c.json({ error: 'profile_required' }, 409)
    const requestHash = hashDocument(input)
    const prior = store.db.prepare('SELECT * FROM idempotency WHERE owner = ? AND key = ?').get(sender, input.idempotencyKey)
    if (prior) {
      if (prior.payload_hash !== requestHash) return c.json({ error: 'idempotency_conflict' }, 409)
      return c.json({ introduction: project(store.introductions.get(prior.introduction_id as string)!, sender) })
    }
    const recipient = store.profiles.get(input.recipientHandle), policy = store.policies.get(input.recipientHandle)
    if (!recipient || !policy || !isVisible(recipient.owner, true)) return c.json({ error: 'recipient_not_found' }, 404)
    if (recipient.owner.toLowerCase() === sender) return c.json({ error: 'cannot_introduce_yourself' }, 409)
    if (input.sharedContext && input.profileVersion !== settings.version) return c.json({ error: 'profile_changed_review_again' }, 409)
    // Third-party verified signals are unavailable in this phase. Never accept self-labelled verified facts.
    if (input.disclosedSignals.length) return c.json({ error: 'verified_signals_not_connected' }, 409)
    let quote
    try { quote = quoteIntroduction({ policy, contextChars: Object.values(input.intent).join(' ').length, attachmentCount: input.attachmentCount, unresolvedFromSender: unresolvedCountFor(store, sender, recipient.owner), recipientQueueDepth: queueDepth(store, recipient.owner), priorDeclinesFromSender: store.declines.get(declineKey(sender, recipient.owner)) ?? 0, now: now() }, input.settlement === 'onchain' ? { ...DEFAULT_PRICING, baseEvaluationFee: 0n, perKiloCharFee: 0n, perAttachmentFee: 0n } : DEFAULT_PRICING) }
    catch { return c.json({ error: 'introduction_limit_reached' }, 409) }
    const sharedProfile = input.sharedContext ? { bio: settings.profile.bio, interests: [...settings.agent.interests] } : null
    const introductionId = ('0x' + randomBytes(32).toString('hex')) as Hex
    const intro: StoredIntroduction = { id: introductionId, sender, recipient: recipient.owner, intent: input.intent, disclosedSignals: [], state: input.settlement === 'onchain' ? 'quoted' : 'submitted', policyVersion: policy.version, createdAt: now(), updatedAt: now(), revision: 1, settlement: input.settlement, senderName: senderProfile.displayName, recipientName: recipient.displayName, recipientHandle: recipient.handle, sharedProfile, question: null, reply: null, quote, payloadHash: hashDocument({ introductionId, sender, recipient: recipient.owner, intent: input.intent, sharedProfile, policyVersion: policy.version, settlement: input.settlement }), evaluationReceiptHash: null, evaluationOutcome: null, evaluationProvider: null }
    transaction(store.db, () => { store.introductions.set(intro.id, intro); store.db.prepare('INSERT INTO idempotency VALUES(?,?,?,?)').run(sender, input.idempotencyKey, requestHash, intro.id) })
    return c.json({ introduction: project(intro, sender) }, 201)
  })
  app.get('/introductions', async (c) => {
    await chainRoutes.syncAll(c.get('session').address)
    const viewer = c.get('session').address, box = c.req.query('box')
    const records = [...store.introductions.values()].filter((i) => box === 'inbox' ? i.recipient.toLowerCase() === viewer && participant(i, viewer) : box === 'outbox' ? i.sender.toLowerCase() === viewer : participant(i, viewer))
    return c.json({ introductions: records.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100).map((i) => project(i, viewer)) })
  })
  app.get('/introductions/:id', async (c) => {
    const existing = store.introductions.get(c.req.param('id')), viewer = c.get('session').address
    if (!existing || ![existing.sender.toLowerCase(), existing.recipient.toLowerCase()].includes(viewer)) return c.json({ error: 'introduction_not_found' }, 404)
    const intro = await chainRoutes.reconcile(existing.id)
    if (!intro || !participant(intro, viewer)) return c.json({ error: 'introduction_not_found' }, 404)
    return c.json({ introduction: project(intro, viewer) })
  })
  app.get('/queue/:handle', async (c) => {
    await chainRoutes.syncAll(c.get('session').address)
    const viewer = c.get('session').address, p = store.profiles.get(c.req.param('handle'))
    if (!p || p.owner.toLowerCase() !== viewer) return c.json({ error: 'queue_not_found' }, 404)
    const queue = [...store.introductions.values()].filter((i) => i.recipient.toLowerCase() === viewer && participant(i, viewer) && !isTerminal(i.state)).map((i) => project(i, viewer))
    return c.json({ handle: p.handle, depth: queue.length, queue })
  })
  app.post('/introductions/:id/transition', async (c) => {
    const input = revisionSchema.extend({ to: z.enum(['accepted', 'declined', 'withdrawn']) }).safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'invalid_request' }, 400)
    const intro = store.introductions.get(c.req.param('id')), viewer = c.get('session').address
    if (!intro || !participant(intro, viewer)) return c.json({ error: 'introduction_not_found' }, 404)
    if (intro.settlement === 'onchain') return c.json({ error: 'onchain_action_required' }, 409)
    const to = input.data.to, requiredOwner = to === 'withdrawn' ? intro.sender : intro.recipient
    if (requiredOwner.toLowerCase() !== viewer) return c.json({ error: 'actor_not_allowed' }, 403)
    if (intro.revision !== input.data.revision || !canTransition(intro.state, to)) return c.json({ error: 'state_changed_refresh' }, 409)
    const updated = { ...intro, state: to, revision: intro.revision + 1, updatedAt: now() }
    transaction(store.db, () => { store.introductions.set(intro.id, updated); if (to === 'declined') { const key = declineKey(intro.sender, intro.recipient); store.declines.set(key, (store.declines.get(key) ?? 0) + 1) } })
    return c.json({ introduction: project(updated, viewer) })
  })
  for (const action of ['context', 'reply'] as const) app.post(`/introductions/:id/${action}`, async (c) => {
    const input = revisionSchema.extend({ text: z.string().trim().min(1).max(1000) }).safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'invalid_request' }, 400)
    const intro = store.introductions.get(c.req.param('id')), viewer = c.get('session').address
    if (!intro || !participant(intro, viewer)) return c.json({ error: 'introduction_not_found' }, 404)
    if ((action === 'context' ? intro.recipient : intro.sender).toLowerCase() !== viewer) return c.json({ error: 'actor_not_allowed' }, 403)
    const bonded = intro.settlement === 'onchain'
    if (intro.revision !== input.data.revision || (bonded ? intro.state !== 'ready_for_review' || (action === 'reply' && (!intro.question || Boolean(intro.reply))) : (action === 'reply' ? intro.state !== 'needs_context' : !['submitted', 'ready_for_review'].includes(intro.state)))) return c.json({ error: 'state_changed_refresh' }, 409)
    const updated: StoredIntroduction = { ...intro, state: bonded ? intro.state : action === 'context' ? 'needs_context' : 'submitted', revision: intro.revision + 1, updatedAt: now(), ...(action === 'context' ? { question: input.data.text, reply: null } : { reply: input.data.text }) }
    store.introductions.set(intro.id, updated)
    return c.json({ introduction: project(updated, viewer) })
  })
  app.post('/introductions/:id/evaluate', async (c) => {
    const intro = store.introductions.get(c.req.param('id')), viewer = c.get('session').address
    if (!intro || intro.sender.toLowerCase() !== viewer) return c.json({ error: 'introduction_not_found' }, 404)
    if (intro.settlement === 'onchain') return c.json({ error: 'manual_review_no_ai_fee' }, 409)
    if (intro.state !== 'submitted') return c.json({ error: 'illegal_state' }, 409)
    const evaluating: StoredIntroduction = { ...intro, state: 'evaluating', updatedAt: now(), revision: intro.revision + 1 }
    store.introductions.set(intro.id, evaluating)
    try {
      const { outcome, provider } = await evaluateIntroduction(store, intro, options.evaluatorUrl)
      const updated: StoredIntroduction = { ...evaluating, state: outcome.recommendation === 'ask_for_context' ? 'needs_context' : 'ready_for_review', evaluationOutcome: outcome, evaluationProvider: provider, evaluationReceiptHash: outcome.receiptHash, updatedAt: now(), revision: evaluating.revision + 1 }
      store.introductions.set(intro.id, updated)
      return c.json({ introduction: project(updated, viewer), provider })
    } catch (error) {
      store.introductions.set(intro.id, { ...intro, revision: evaluating.revision + 1 })
      if (error instanceof EvaluationPolicyChangedError) return c.json({ error: error.message, fallback: false }, 409)
      return c.json({ error: 'evaluation_unavailable_retry', fallback: false }, 502)
    }
  })
  return { app, store, syncChain: chainRoutes.syncAll, close: () => store.db.close() }
}
function participant(intro: StoredIntroduction, address: string) { return intro.sender.toLowerCase() === address.toLowerCase() || (intro.recipient.toLowerCase() === address.toLowerCase() && (intro.settlement === 'offchain' || Boolean(intro.chain?.introductionId))) }
function project(intro: StoredIntroduction, viewer: string) {
  const role = intro.sender.toLowerCase() === viewer.toLowerCase() ? 'sender' : 'recipient'
  const { evaluationOutcome, chain, ...common } = intro
  const evaluation = !evaluationOutcome ? null : role === 'sender' ? { coachNotes: evaluationOutcome.coachNotes, missingContext: evaluationOutcome.missingContext, recommendation: evaluationOutcome.recommendation } : { recommendation: evaluationOutcome.recommendation, whyItMayMatter: evaluationOutcome.whyItMayMatter, recipientSummary: evaluationOutcome.recipientSummary, suggestedOpeningQuestion: evaluationOutcome.suggestedOpeningQuestion }
  return jsonSafe({ ...common, role, evaluationOutcome: evaluation, chain: chain ? { chainId: chain.chainId, escrow: chain.escrow, introductionId: chain.introductionId, lockTransactionHash: chain.lockTransactionHash, confirmedBlock: chain.confirmedBlock, expiresAt: chain.expiresAt, refund: chain.refund, lastCheckedAt: chain.lastCheckedAt, quoteExpiresAt: chain.quote ? Number(chain.quote.message.quoteExpiresAt) : undefined } : null, payment: { status: intro.settlement === 'offchain' ? 'not_connected' : chain?.refund ? 'refunded' : chain?.introductionId ? 'locked' : chain?.lockTransactionHash ? 'pending' : 'awaiting_wallet', charged: Boolean(chain?.introductionId), evaluationFee: intro.settlement === 'onchain' ? '0' : null, attentionBond: intro.quote.attentionBond.toString() }, evaluationAnchoredOnchain: false })
}
