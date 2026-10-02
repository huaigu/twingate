import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeFunctionData, verifyTypedData, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { escrowDomain, introductionEscrowAbi, LOCK_INTRODUCTION_TYPES, type BuilderProfile, type GatePolicy } from '@signalpass/core'
import { createApp } from './app.js'
import { ChainService } from './chain.js'
import { declineKey, type StoredIntroduction } from './store.js'

const origin = 'http://localhost:3004'
const key = ('0x' + '99'.padStart(64, '0')) as Hex
const accounts = [1, 2].map((n) => privateKeyToAccount(('0x' + n.toString(16).padStart(64, '0')) as Hex))
const intent = { whoAmI: 'I build Monad tools.', whyYou: 'Your simulations complement our testing.', whatIOffer: 'Contract test fixtures.', nextStep: 'Compare test cases?' }
const profile = (handle: string) => ({ handle, profile: { name: handle, bio: 'Building Monad tools.', interests: 'Monad', offer: 'Simulation tooling.', meet: 'Other builders.' }, agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad'] } })

/** Real EIP-712 signing and calldata, with read-only chain observations supplied locally. */
class QuoteChain extends ChainService {
  timestamp = 1_800_000_000n
  signatures = 0
  constructor() {
    super({ chainId: 31337, rpcUrl: 'http://127.0.0.1:1', registry: '0x1111111111111111111111111111111111111111', escrow: '0x2222222222222222222222222222222222222222', receipt: '0x3333333333333333333333333333333333333333', name: 'Test observations', confirmations: 1, localTtlSeconds: 60 }, key)
    Object.defineProperty(this, 'client', { value: {
      readContract: async ({ functionName }: { functionName: string }) => functionName === 'unresolvedLimitFor' ? 3n : 0n,
      getBlock: async () => ({ timestamp: this.timestamp, number: 1n }),
    } })
  }
  override async ready() {}
  override async profileStatus(p: BuilderProfile, policy: GatePolicy, _open: boolean) {
    return { registered: true, synced: true, profileId: p.profileId.toString(), policyVersion: policy.version, expected: this.hashes(p, policy), transactions: [] }
  }
  override async quote(intro: StoredIntroduction, recipient: BuilderProfile, policy: GatePolicy) {
    this.signatures++
    return super.quote(intro, recipient, policy)
  }
  override async sync(_intro: StoredIntroduction) { return null }
}

async function harness() {
  const chain = new QuoteChain(), api = createApp({ origin, chain })
  type Identity = { cookie: string; csrf: string }
  const request = async (identity: Identity | null, path: string, body?: unknown) => {
    const response = await api.app.request(path, { method: body === undefined ? 'GET' : 'POST', headers: { origin, 'content-type': 'application/json', ...(identity ? { cookie: identity.cookie, 'x-signalpass-csrf': identity.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, data: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  const identities: Identity[] = []
  for (const [index, account] of accounts.entries()) {
    const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 31337 })
    const signature = await account.signMessage({ message: challenge.data.message })
    const login = await request(null, '/auth/verify', { nonce: challenge.data.nonce, signature })
    const identity = { cookie: login.cookie, csrf: login.data.session.csrf }; identities.push(identity)
    assert.equal((await request(identity, '/me/profile', profile(index ? 'bob' : 'alice'))).status, 200)
  }
  const sender = identities[0]!
  const draft = async () => {
    const response = await request(sender, '/introductions', { recipientHandle: 'bob', settlement: 'onchain', intent, idempotencyKey: crypto.randomUUID() })
    assert.equal(response.status, 201)
    return response.data.introduction.id as string
  }
  return { api, chain, request, sender, draft }
}

test('fresh funding signatures reprice current declines and congestion, while valid approvals stay unchanged', async () => {
  const h = await harness()
  try {
    const firstId = await h.draft(), secondId = await h.draft()
    const first = h.api.store.introductions.get(firstId)!, second = h.api.store.introductions.get(secondId)!
    assert.equal(second.quote.attentionBond, 1_500_000_000_000_000n)
    // Simulate the already-confirmed outcome recorded by reconciliation; no wallet transaction is sent.
    h.api.store.introductions.set(firstId, { ...first, state: 'declined' })
    const decline = declineKey(second.sender, second.recipient)
    h.api.store.declines.set(decline, 1)
    const fresh = await h.request(h.sender, `/introductions/${secondId}/funding-quote`, {})
    assert.equal(fresh.status, 200)
    assert.equal(fresh.data.summary.attentionBond, '1900000000000000')
    assert.equal(fresh.data.summary.evaluationFee, '0')
    const saved = h.api.store.introductions.get(secondId)!, signed = saved.chain!.quote!
    assert.equal(saved.quote.attentionBond, signed.message.attentionBond)
    assert.equal(saved.quote.evaluationFee, 0n)
    const calldata = decodeFunctionData({ abi: introductionEscrowAbi, data: fresh.data.transaction.data })
    assert.equal(calldata.functionName, 'lockIntroduction')
    if (calldata.functionName !== 'lockIntroduction') assert.fail('Wrong function')
    assert.equal(calldata.args[0].attentionBond, saved.quote.attentionBond)
    assert.equal(BigInt(fresh.data.transaction.value), saved.quote.attentionBond)
    assert(await verifyTypedData({ address: privateKeyToAccount(key).address, domain: escrowDomain(31337, h.chain.config.escrow), types: LOCK_INTRODUCTION_TYPES, primaryType: 'LockIntroduction', message: signed.message, signature: signed.signature }))
    assert.equal((await h.request(h.sender, `/introductions/${secondId}`)).data.introduction.payment.attentionBond, fresh.data.summary.attentionBond)

    // Current pricing changes after approval, but the still-valid signature is immutable.
    h.api.store.introductions.set(firstId, { ...first, state: 'ready_for_review' })
    h.api.store.declines.set(decline, 2)
    h.chain.timestamp = signed.message.quoteExpiresAt
    const valid = await h.request(h.sender, `/introductions/${secondId}/funding-quote`, {})
    assert.equal(valid.status, 200)
    assert.deepEqual(valid.data, fresh.data)
    assert.equal(h.chain.signatures, 1)

    h.chain.timestamp++
    const refreshed = await h.request(h.sender, `/introductions/${secondId}/funding-quote`, {})
    assert.equal(refreshed.status, 200)
    assert.equal(refreshed.data.summary.attentionBond, '2880000000000000')
    assert.notEqual(refreshed.data.transaction.data, fresh.data.transaction.data)
    assert.equal(h.chain.signatures, 2)
    assert.equal((await h.request(h.sender, `/introductions/${secondId}`)).data.introduction.payment.attentionBond, refreshed.data.summary.attentionBond)
    assert.equal(h.api.store.introductions.get(secondId)!.payloadHash, second.payloadHash)
  } finally { h.api.close() }
})

test('a saved unfunded draft cannot get a fresh signature after the sender reaches the unresolved limit', async () => {
  const h = await harness()
  try {
    const id = await h.draft(), intro = h.api.store.introductions.get(id)!
    for (let index = 0; index < 3; index++) {
      const unresolvedId = ('0x' + (index + 10).toString(16).padStart(64, '0')) as Hex
      h.api.store.introductions.set(unresolvedId, { ...intro, id: unresolvedId, state: 'submitted', settlement: 'offchain' })
    }
    const result = await h.request(h.sender, `/introductions/${id}/funding-quote`, {})
    assert.equal(result.status, 409)
    assert.equal(result.data.error, 'introduction_limit_reached')
    assert.equal(h.chain.signatures, 0)
    assert.equal(h.api.store.introductions.get(id)!.chain, undefined)
  } finally { h.api.close() }
})
