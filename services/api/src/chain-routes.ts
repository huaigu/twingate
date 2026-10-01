import type { Hono, Context } from 'hono'
import { z } from 'zod'
import type { Hex } from 'viem'
import { DEFAULT_PRICING, QuoteRejectedError, quoteIntroduction } from '@signalpass/core'
import type { Session } from './auth.js'
import { ChainError, type ChainService } from './chain.js'
import { profileByOwner, declineKey, queueDepth, unresolvedCountFor, type Store } from './store.js'
import { transaction } from './database.js'

type Env = { Variables: { session: Session } }
const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/).transform(s => s as Hex)
const actionSchema = z.enum(['accepted', 'declined', 'expired', 'withdrawn'])
export function installChainRoutes(app: Hono<Env>, store: Store, chain?: ChainService) {
  const locks = new Map<string, Promise<void>>()
  async function serial<T>(id: string, work: () => Promise<T>): Promise<T> {
    const previous = locks.get(id) ?? Promise.resolve()
    let release!: () => void
    const next = new Promise<void>(resolve => { release = resolve })
    locks.set(id, next)
    try { await previous; return await work() }
    finally { release(); if (locks.get(id) === next) locks.delete(id) }
  }
  async function reconcileUnlocked(id: string) {
    const before = store.introductions.get(id)
    if (!before || before.settlement !== 'onchain' || !chain) return before
    let result
    try { result = await chain.sync(before) }
    catch (error) { throw error instanceof ChainError ? error : new ChainError('chain_unavailable', 503) }
    if (!result) return before
    const current = store.introductions.get(id)!
    const changed = current.state !== result.state || current.chain?.introductionId !== result.chain.introductionId || current.chain?.refund?.transactionHash !== result.chain.refund?.transactionHash
    const updated = { ...current, chain: result.chain, state: result.state, revision: current.revision + Number(changed), updatedAt: changed ? Math.floor(Date.now() / 1000) : current.updatedAt }
    transaction(store.db, () => {
      if (result.chain.introductionId) {
        const key = result.chain.chainId + ':' + result.chain.escrow.toLowerCase() + ':' + result.chain.introductionId
        const linked = store.db.prepare("SELECT value FROM documents WHERE collection = 'chain-bindings' AND key = ?").get(key)
        if (linked && linked.value !== id) throw new ChainError('chain_event_already_assigned')
        store.db.prepare("INSERT OR IGNORE INTO documents(collection,key,value) VALUES('chain-bindings',?,?)").run(key, id)
      }
      store.introductions.set(id, updated)
      if (current.state !== 'declined' && updated.state === 'declined') {
        const key = declineKey(updated.sender, updated.recipient)
        store.declines.set(key, (store.declines.get(key) ?? 0) + 1)
      }
    })
    return updated
  }
  const reconcile = (id: string) => serial(id, () => reconcileUnlocked(id))
  async function guarded(c: Context<Env>, work: (service: ChainService) => Promise<Response>) {
    if (!chain) return c.json({ error: 'chain_not_configured' }, 409)
    try { return await work(chain) }
    catch (error) {
      const code = error instanceof ChainError ? error.code : 'chain_unavailable'
      const status = error instanceof ChainError ? error.status : 503
      return c.json({ error: code }, status as 400 | 403 | 404 | 409 | 503)
    }
  }
  app.get('/chain/config', c => c.json(chain?.publicConfig() ?? { enabled: false, evaluationMode: 'manual' }))
  for (const [method, path] of [['get', '/chain/profile'], ['post', '/chain/profile/prepare']] as const) {
    app[method](path, c => guarded(c, async service => {
      const profile = profileByOwner(store, c.get('session').address)
      const settings = profile && store.settings.get(profile.owner.toLowerCase())
      if (!profile || !settings) return c.json({ error: 'profile_required' }, 409)
      const policy = store.policies.get(profile.handle)!
      const status = await service.profileStatus(profile, policy, settings.agent.visibility !== 'private')
      if (!status.registered && settings.agent.visibility === 'private') return c.json({ ...status, transactions: [], reason: 'publish_before_registering' })
      return c.json(status)
    }))
  }
  app.post('/chain/faucet', c => guarded(c, async service => { await service.faucet(c.get('session').address); return c.json({ ok: true, localTestBalanceOnly: true }) }))
  app.post('/introductions/:id/funding-quote', c => guarded(c, service => serial(c.req.param('id'), async () => {
    let intro = store.introductions.get(c.req.param('id'))
    const owner = c.get('session').address
    if (!intro || intro.sender.toLowerCase() !== owner) return c.json({ error: 'introduction_not_found' }, 404)
    if (intro.settlement !== 'onchain') return c.json({ error: 'not_a_bonded_introduction' }, 409)
    intro = (await reconcileUnlocked(intro.id))!
    if (intro.state !== 'quoted' || intro.chain?.introductionId) return c.json({ error: 'funding_already_confirmed' }, 409)
    const recipient = profileByOwner(store, intro.recipient), policy = recipient && store.policies.get(recipient.handle)
    if (!recipient || !policy || store.settings.get(recipient.owner.toLowerCase())?.agent.visibility === 'private') return c.json({ error: 'recipient_not_found' }, 404)
    if (intro.policyVersion !== policy.version) return c.json({ error: 'recipient_policy_changed_start_new' }, 409)
    let quote = intro.chain?.quote
    if (quote) {
      const [nonce, block] = await Promise.all([
        service.client.readContract({ address: service.config.escrow, abi: (await import('@signalpass/core')).introductionEscrowAbi, functionName: 'nonces', args: [owner] }),
        service.client.getBlock(),
      ])
      if (nonce !== quote.message.nonce) return c.json({ error: 'nonce_changed_sync_or_start_new' }, 409)
      if (block.timestamp > quote.message.quoteExpiresAt) quote = undefined
    }
    if (!quote) {
      // Draft estimates are not approvals. Reprice only when issuing a new
      // signature; an unexpired signed quote above keeps its approved amount.
      let pricing
      try {
        pricing = quoteIntroduction({
          policy, contextChars: Object.values(intro.intent).join(' ').length, attachmentCount: 0,
          unresolvedFromSender: unresolvedCountFor(store, intro.sender, intro.recipient),
          recipientQueueDepth: queueDepth(store, intro.recipient),
          priorDeclinesFromSender: store.declines.get(declineKey(intro.sender, intro.recipient)) ?? 0,
          now: Math.floor(Date.now() / 1000),
        }, { ...DEFAULT_PRICING, baseEvaluationFee: 0n, perKiloCharFee: 0n, perAttachmentFee: 0n })
      } catch (error) {
        if (error instanceof QuoteRejectedError) throw new ChainError('introduction_limit_reached')
        throw error
      }
      quote = await service.quote({ ...intro, quote: pricing }, recipient, policy)
      store.introductions.set(intro.id, { ...intro, quote: pricing, chain: { chainId: service.config.chainId, escrow: service.config.escrow, quote }, revision: intro.revision + 1 })
    }
    return c.json({ summary: service.quoteSummary(quote), transaction: service.fundingTransaction(quote), network: service.publicConfig() })
  })))
  app.post('/introductions/:id/funding', async c => {
    const input = z.object({ transactionHash: hash }).safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'invalid_request' }, 400)
    return guarded(c, service => serial(c.req.param('id'), async () => {
      const intro = store.introductions.get(c.req.param('id'))
      if (!intro || intro.sender.toLowerCase() !== c.get('session').address) return c.json({ error: 'introduction_not_found' }, 404)
      if (intro.settlement !== 'onchain' || !intro.chain?.quote) return c.json({ error: 'quote_required' }, 409)
      if (intro.chain.introductionId) return c.json({ confirmed: true, state: intro.state })
      await service.verifyLock(intro.chain.quote, input.data.transactionHash)
      store.introductions.set(intro.id, { ...intro, chain: { ...intro.chain, lockTransactionHash: input.data.transactionHash } })
      const updated = (await reconcileUnlocked(intro.id))!
      const confirmed = Boolean(updated.chain?.introductionId)
      return c.json({ confirmed, state: updated.state }, confirmed ? 200 : 202)
    }))
  })
  app.post('/introductions/:id/settlement/prepare', async c => {
    const input = z.object({ action: actionSchema }).safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'invalid_request' }, 400)
    return guarded(c, service => serial(c.req.param('id'), async () => {
      const intro = store.introductions.get(c.req.param('id')), owner = c.get('session').address
      if (!intro || ![intro.sender.toLowerCase(), intro.recipient.toLowerCase()].includes(owner)) return c.json({ error: 'introduction_not_found' }, 404)
      if (intro.settlement !== 'onchain' || !intro.chain?.introductionId) return c.json({ error: 'funding_not_confirmed' }, 409)
      return c.json({ transaction: await service.prepareAction(intro, owner, input.data.action), network: service.publicConfig() })
    }))
  })
  app.post('/introductions/:id/settlement/confirm', async c => {
    const input = z.object({ action: actionSchema, transactionHash: hash }).safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'invalid_request' }, 400)
    return guarded(c, service => serial(c.req.param('id'), async () => {
      const intro = store.introductions.get(c.req.param('id')), owner = c.get('session').address
      if (!intro || ![intro.sender.toLowerCase(), intro.recipient.toLowerCase()].includes(owner) || !intro.chain?.introductionId) return c.json({ error: 'introduction_not_found' }, 404)
      const confirmed = await service.verifyAction(intro, owner, input.data.action, input.data.transactionHash)
      if (!confirmed) return c.json({ confirmed: false }, 202)
      store.introductions.set(intro.id, { ...intro, chain: { ...intro.chain, actionTransactionHash: input.data.transactionHash } })
      const updated = (await reconcileUnlocked(intro.id))!
      return c.json({ confirmed: true, state: updated.state, refund: updated.chain?.refund })
    }))
  })
  let syncing = false
  async function syncAll(owner?: string) {
    if (!chain || syncing) return
    syncing = true
    try {
      for (const intro of store.introductions.values()) {
        if (intro.settlement !== 'onchain' || !intro.chain?.quote || intro.chain.refund) continue
        if (owner && ![intro.sender.toLowerCase(), intro.recipient.toLowerCase()].includes(owner)) continue
        try { await reconcile(intro.id) } catch { /* Preserve the last confirmed state; GET/action paths report failures. */ }
      }
    } finally { syncing = false }
  }
  return { reconcile, syncAll }
}
