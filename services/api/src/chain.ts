import { readFileSync } from 'node:fs'
import { z } from 'zod'
import {
  createPublicClient, http, encodeFunctionData, keccak256, toHex, encodePacked,
  decodeEventLog, parseAbiItem, formatEther, type Address, type Hex, type PublicClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { profileRegistryAbi, introductionEscrowAbi, LOCK_INTRODUCTION_TYPES, escrowDomain, type LockIntroductionMessage, type BuilderProfile, type GatePolicy, type IntroductionState } from '@signalpass/core'
import { hashDocument, type StoredIntroduction } from './store.js'
import { profilePolicyDefaults } from './pilot.js'

export class ChainError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code) }
}
const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/).transform(v => v as Address)
export const chainConfigSchema = z.object({
  chainId: z.union([z.literal(31337), z.literal(10143), z.literal(143)]),
  rpcUrl: z.string().url(), walletRpcUrl: z.string().url().optional(),
  registry: addressSchema, escrow: addressSchema, receipt: addressSchema,
  name: z.string().min(1).max(80), explorerUrl: z.string().url().optional(),
  confirmations: z.number().int().min(1).max(20).default(1),
  localTtlSeconds: z.number().int().min(30).max(3600).default(60),
})
export type ChainConfig = z.infer<typeof chainConfigSchema>
export interface WalletTransaction { from: Address; to: Address; data: Hex; value: Hex; chainId: Hex; label: string }
export interface SignedLockQuote { message: LockIntroductionMessage; signature: Hex; issuedAt: number; issuedBlock: string }
export interface ChainAttachment {
  chainId: number; escrow: Address; quote?: SignedLockQuote;
  lockTransactionHash?: Hex; introductionId?: Hex; confirmedBlock?: string;
  expiresAt?: number; actionTransactionHash?: Hex;
  refund?: { amount: string; transactionHash: Hex; blockNumber: string };
  lastCheckedAt?: number; scanFromBlock?: string;
  refundScanToBlock?: string; refundPending?: boolean;
}
const terminalStates = new Set(['accepted', 'declined', 'expired', 'withdrawn'])
const chainStates: IntroductionState[] = ['quoted', 'locked', 'evaluating', 'needs_context', 'ready_for_review', 'accepted', 'declined', 'expired', 'withdrawn']
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** Owns chain verification and transaction preparation; never broadcasts user transactions. */
export class ChainService {
  readonly client: PublicClient
  private readonly signer
  constructor(readonly config: ChainConfig, quoteSignerKey: Hex, readonly pilotMode = false) {
    this.client = createPublicClient({ transport: http(config.rpcUrl, { timeout: 8000, retryCount: 0 }), cacheTime: 0 })
    this.signer = privateKeyToAccount(quoteSignerKey)
  }
  publicConfig() {
    const defaults = profilePolicyDefaults(this.pilotMode)
    return { enabled: true, chainId: this.config.chainId, name: this.config.name,
      currency: this.config.chainId === 31337 ? 'DEV' : 'MON', local: this.config.chainId === 31337,
      registry: this.config.registry, escrow: this.config.escrow, receipt: this.config.receipt,
      walletRpcUrl: this.config.walletRpcUrl, explorerUrl: this.config.explorerUrl,
      evaluationMode: 'manual', evaluationFee: '0', confirmations: this.config.confirmations,
      pilotMode: this.pilotMode, newProfileDefaults: { baseBond: defaults.baseBond.toString(), timeoutSeconds: defaults.timeoutSeconds } }
  }
  async ready() {
    if (await this.client.getChainId() !== this.config.chainId) throw new ChainError('wrong_rpc_network', 503)
    const [signer, registry] = await Promise.all([
      this.client.readContract({ address: this.config.escrow, abi: introductionEscrowAbi, functionName: 'quoteSigner' }),
      this.client.readContract({ address: this.config.escrow, abi: introductionEscrowAbi, functionName: 'registry' }),
    ])
    if (!same(signer, this.signer.address) || !same(registry, this.config.registry)) throw new ChainError('chain_configuration_mismatch', 503)
  }
  private transaction(owner: Address, to: Address, data: Hex, label: string, value = 0n): WalletTransaction {
    return { from: owner, to, data, value: toHex(value), chainId: toHex(this.config.chainId), label }
  }
  hashes(profile: BuilderProfile, policy: GatePolicy) {
    const { version: _version, ...policyContent } = policy
    return { profileHash: hashDocument({ handle: profile.handle, name: profile.displayName, building: profile.building, wantsToMeet: profile.wantsToMeet, canOffer: profile.canOffer }), policyHash: hashDocument(policyContent) }
  }
  async profileStatus(profile: BuilderProfile, policy: GatePolicy, open: boolean) {
    await this.ready()
    const expected = this.hashes(profile, policy)
    const id = await this.client.readContract({ address: this.config.registry, abi: profileRegistryAbi, functionName: 'profileIdByOwner', args: [profile.owner] })
    if (!id) return { registered: false, synced: false, profileId: '0', expected, transactions: [this.transaction(profile.owner, this.config.registry, encodeFunctionData({ abi: profileRegistryAbi, functionName: 'registerProfile', args: [keccak256(toHex(profile.handle)), expected.profileHash, expected.policyHash] }), 'Register approved profile')] }
    const onchain = await this.client.readContract({ address: this.config.registry, abi: profileRegistryAbi, functionName: 'getProfile', args: [id] })
    const transactions: WalletTransaction[] = []
    if (!same(onchain.profileHash, expected.profileHash)) transactions.push(this.transaction(profile.owner, this.config.registry, encodeFunctionData({ abi: profileRegistryAbi, functionName: 'updateProfileDocument', args: [id, expected.profileHash] }), 'Update approved profile hash'))
    if (!same(onchain.policyHash, expected.policyHash)) transactions.push(this.transaction(profile.owner, this.config.registry, encodeFunctionData({ abi: profileRegistryAbi, functionName: 'updatePolicy', args: [id, expected.policyHash] }), 'Update introduction policy'))
    if (onchain.acceptsIntroductions !== open) transactions.push(this.transaction(profile.owner, this.config.registry, encodeFunctionData({ abi: profileRegistryAbi, functionName: 'setAcceptsIntroductions', args: [id, open] }), open ? 'Open introductions on chain' : 'Close introductions on chain'))
    return { registered: true, synced: transactions.length === 0, profileId: id.toString(), policyVersion: onchain.policyVersion, expected, transactions }
  }
  async quote(intro: StoredIntroduction, recipient: BuilderProfile, policy: GatePolicy): Promise<SignedLockQuote> {
    await this.ready()
    const status = await this.profileStatus(recipient, policy, true)
    if (!status.registered || !status.synced) throw new ChainError('recipient_profile_not_synced')
    const [nonce, unresolved, limit, block] = await Promise.all([
      this.client.readContract({ address: this.config.escrow, abi: introductionEscrowAbi, functionName: 'nonces', args: [intro.sender] }),
      this.client.readContract({ address: this.config.escrow, abi: introductionEscrowAbi, functionName: 'unresolvedCount', args: [intro.sender, intro.recipient] }),
      this.client.readContract({ address: this.config.escrow, abi: introductionEscrowAbi, functionName: 'unresolvedLimitFor', args: [intro.recipient] }),
      this.client.getBlock(),
    ])
    if (unresolved >= limit) throw new ChainError('introduction_limit_reached')
    const message: LockIntroductionMessage = {
      sender: intro.sender, recipient: intro.recipient, recipientProfileId: BigInt(status.profileId),
      policyHash: status.expected.policyHash, policyVersion: BigInt(status.policyVersion!), payloadHash: intro.payloadHash,
      evaluationFee: 0n, attentionBond: intro.quote.attentionBond,
      ttl: BigInt(this.config.chainId === 31337 ? this.config.localTtlSeconds : policy.timeoutSeconds),
      quoteExpiresAt: block.timestamp + 900n, nonce,
    }
    const signature = await this.signer.signTypedData({ domain: escrowDomain(this.config.chainId, this.config.escrow), types: LOCK_INTRODUCTION_TYPES, primaryType: 'LockIntroduction', message })
    return { message, signature, issuedAt: Number(block.timestamp), issuedBlock: block.number.toString() }
  }
  fundingTransaction(quote: SignedLockQuote) {
    return this.transaction(quote.message.sender, this.config.escrow, encodeFunctionData({ abi: introductionEscrowAbi, functionName: 'lockIntroduction', args: [quote.message, quote.signature] }), 'Lock refundable attention bond', quote.message.evaluationFee + quote.message.attentionBond)
  }
  quoteSummary(quote: SignedLockQuote) {
    return { evaluationFee: '0', attentionBond: quote.message.attentionBond.toString(), amount: formatEther(quote.message.attentionBond), expiresAt: Number(quote.message.quoteExpiresAt), timeoutSeconds: Number(quote.message.ttl), currency: this.config.chainId === 31337 ? 'DEV' : 'MON', mode: 'manual', payloadHash: quote.message.payloadHash }
  }
  private async confirmedHead() {
    // Monad's latest head is proposed. Value is credited only below finality;
    // configured confirmations add a further delay to that finalized head.
    const head = this.config.chainId === 31337
      ? await this.client.getBlockNumber()
      : (await this.client.getBlock({ blockTag: 'finalized' })).number
    if (head === null) throw new ChainError('chain_unavailable', 503)
    const confirmed = head + 1n - BigInt(this.config.confirmations)
    return confirmed > 0n ? confirmed : 0n
  }
  private get logPageSize() { return this.config.chainId === 31337 ? 1000n : 100n }
  private async receipt(hash: Hex) {
    try {
      const receipt = await this.client.getTransactionReceipt({ hash })
      if (receipt.status !== 'success') throw new ChainError('transaction_reverted')
      const [block, confirmedHead] = await Promise.all([this.client.getBlock({ blockNumber: receipt.blockNumber }), this.confirmedHead()])
      if (block.hash !== receipt.blockHash) throw new ChainError('transaction_not_canonical')
      if (receipt.blockNumber > confirmedHead) return null
      return receipt
    } catch (error) {
      if (error instanceof ChainError) throw error
      if ((error as { name?: string }).name === 'TransactionReceiptNotFoundError') return null
      throw new ChainError('chain_unavailable', 503)
    }
  }
  async verifyLock(quote: SignedLockQuote, hash: Hex) {
    await this.ready()
    const receipt = await this.receipt(hash)
    if (!receipt) return null
    const tx = await this.client.getTransaction({ hash })
    const expected = this.fundingTransaction(quote)
    if (!same(tx.from, quote.message.sender) || !tx.to || !same(tx.to, this.config.escrow) || tx.input !== expected.data || tx.value !== BigInt(expected.value)) throw new ChainError('transaction_does_not_match_approval')
    const id = keccak256(encodePacked(['address', 'address', 'uint256', 'uint256', 'uint256'], [quote.message.sender, quote.message.recipient, quote.message.recipientProfileId, quote.message.nonce, BigInt(this.config.chainId)]))
    let expiresAt: bigint | undefined
    const matched = receipt.logs.some(log => {
      if (!same(log.address, this.config.escrow)) return false
      try {
        const event = decodeEventLog({ abi: introductionEscrowAbi, data: log.data, topics: log.topics, eventName: 'IntroductionLocked' })
        if (event.args.id !== id || !same(event.args.sender, quote.message.sender) || !same(event.args.recipient, quote.message.recipient) || event.args.recipientProfileId !== quote.message.recipientProfileId || event.args.attentionBond !== quote.message.attentionBond || event.args.evaluationFee !== 0n) return false
        expiresAt = event.args.expiresAt
        return true
      } catch { return false }
    })
    if (!matched || expiresAt === undefined) throw new ChainError('lock_event_missing')
    // Exact successful calldata authenticates the immutable payload/policy;
    // its escrow event supplies the deadline. Old state may already be pruned.
    return { introductionId: id, confirmedBlock: receipt.blockNumber.toString(), expiresAt: Number(expiresAt) }
  }
  async sync(intro: StoredIntroduction): Promise<{ chain: ChainAttachment; state: IntroductionState } | null> {
    const current = intro.chain
    if (!current?.quote) return null
    if (current.chainId !== this.config.chainId || !same(current.escrow, this.config.escrow)) throw new ChainError('introduction_network_mismatch')
    let hash = current.lockTransactionHash
    let verified = null
    if (hash) {
      try { verified = await this.verifyLock(current.quote, hash) }
      catch (error) {
        if (!(error instanceof ChainError) || !['transaction_reverted', 'transaction_does_not_match_approval', 'lock_event_missing', 'chain_payload_mismatch'].includes(error.code)) throw error
        // A rejected/replaced transaction must not strand a valid signed quote.
        hash = undefined
      }
    }
    let scanFromBlock = current.scanFromBlock
    if (!verified) {
      const q = current.quote.message
      const expectedId = keccak256(encodePacked(['address', 'address', 'uint256', 'uint256', 'uint256'], [q.sender, q.recipient, q.recipientProfileId, q.nonce, BigInt(this.config.chainId)]))
      const latest = await this.confirmedHead()
      const from = BigInt(scanFromBlock ?? current.quote.issuedBlock)
      if (from <= latest) {
        const last = from + this.logPageSize - 1n
        const to = last < latest ? last : latest
        const events = await this.client.getLogs({ address: this.config.escrow, event: parseAbiItem('event IntroductionLocked(bytes32 indexed id,address indexed sender,address indexed recipient,uint256 recipientProfileId,uint256 evaluationFee,uint256 attentionBond,uint64 expiresAt)'), args: { id: expectedId }, fromBlock: from, toBlock: to, strict: true })
        if (events[0]) {
          hash = events[0].transactionHash
          try { verified = await this.verifyLock(current.quote, hash) }
          catch (error) {
            if (!(error instanceof ChainError) || !['transaction_does_not_match_approval', 'chain_payload_mismatch'].includes(error.code)) throw error
            // Parallel drafts can share a sender nonce. The other draft's event
            // is not payment for this record; leave it visible and unfunded.
            hash = undefined
          }
        }
        // Keep the last block in the next scan until a confirmed receipt is found.
        scanFromBlock = to.toString()
      }
      if (!verified) return { chain: { ...current, lockTransactionHash: hash, scanFromBlock, lastCheckedAt: Date.now() }, state: intro.state }
    }
    const confirmedBlock = await this.confirmedHead()
    const record = await this.client.readContract({ address: this.config.escrow, abi: introductionEscrowAbi, functionName: 'getIntroduction', args: [verified.introductionId], blockNumber: confirmedBlock })
    const state = chainStates[record.state]
    if (!state || record.state === 0) throw new ChainError('unknown_chain_state')
    const chain: ChainAttachment = { ...current, ...verified, lockTransactionHash: hash!, scanFromBlock, lastCheckedAt: Date.now() }
    if (terminalStates.has(state)) {
      let refund: { amount: bigint; transactionHash: Hex; blockNumber: bigint } | undefined
      const knownHash = current.refund?.transactionHash ?? current.actionTransactionHash
      if (knownHash) {
        const actionReceipt = await this.receipt(knownHash)
        for (const log of actionReceipt?.logs ?? []) {
          if (!same(log.address, this.config.escrow)) continue
          try {
            const event = decodeEventLog({ abi: introductionEscrowAbi, data: log.data, topics: log.topics, eventName: 'AttentionBondRefunded' })
            if (event.args.id === verified.introductionId && same(event.args.to, intro.sender) && event.args.amount === current.quote.message.attentionBond) refund = { amount: event.args.amount, transactionHash: knownHash, blockNumber: actionReceipt!.blockNumber }
          } catch { /* Ignore unrelated logs in the same transaction. */ }
        }
      }
      // Public RPCs cap event-query ranges. Search newest blocks first so a
      // refund after a multi-day response period doesn't query the entire TTL.
      const first = BigInt(verified.confirmedBlock)
      let to = current.refundScanToBlock === undefined ? confirmedBlock : BigInt(current.refundScanToBlock)
      if (to > confirmedBlock) to = confirmedBlock
      // Persist progress between bounded batches, including after API restarts.
      for (let page = 0; !refund && to >= first && page < 4; page++) {
        const start = to - this.logPageSize + 1n
        const from = start > first ? start : first
        const events = await this.client.getLogs({ address: this.config.escrow, event: parseAbiItem('event AttentionBondRefunded(bytes32 indexed id,address indexed to,uint256 amount)'), args: { id: verified.introductionId }, fromBlock: from, toBlock: to, strict: true })
        const found = events.find(log => same(log.args.to, intro.sender) && log.args.amount === current.quote!.message.attentionBond)
        if (found) refund = { amount: found.args.amount, transactionHash: found.transactionHash, blockNumber: found.blockNumber }
        to = from - 1n
      }
      if (!refund) {
        chain.refundScanToBlock = to >= first ? to.toString() : undefined
        chain.refundPending = true
        return { chain, state: intro.state === 'quoted' ? 'ready_for_review' : intro.state }
      }
      if (!(await this.receipt(refund.transactionHash))) throw new ChainError('refund_not_confirmed', 503)
      chain.refund = { amount: refund.amount.toString(), transactionHash: refund.transactionHash, blockNumber: refund.blockNumber.toString() }
      chain.refundPending = false
      chain.refundScanToBlock = undefined
    }
    return { chain, state }
  }
  async prepareAction(intro: StoredIntroduction, actor: Address, action: 'accepted' | 'declined' | 'expired' | 'withdrawn') {
    const synced = await this.sync(intro)
    if (!synced) throw new ChainError('funding_not_confirmed')
    if (synced.chain.refundPending) throw new ChainError('refund_not_confirmed', 503)
    if (terminalStates.has(synced.state)) throw new ChainError('introduction_already_resolved')
    if (action === 'expired') {
      if ((await this.client.getBlock()).timestamp < BigInt(synced.chain.expiresAt!)) throw new ChainError('not_expired')
    } else if (action === 'withdrawn') {
      if (!same(actor, intro.sender) || !['locked', 'needs_context'].includes(synced.state)) throw new ChainError('action_not_allowed', 403)
    } else if (!same(actor, intro.recipient) || synced.state !== 'ready_for_review') throw new ChainError('action_not_allowed', 403)
    const method = ({ accepted: 'accept', declined: 'decline', expired: 'expire', withdrawn: 'withdraw' } as const)[action]
    return this.transaction(actor, this.config.escrow, encodeFunctionData({ abi: introductionEscrowAbi, functionName: method, args: [synced.chain.introductionId!] }), action === 'expired' ? 'Return expired attention bond' : action)
  }
  async verifyAction(intro: StoredIntroduction, actor: Address, action: 'accepted' | 'declined' | 'expired' | 'withdrawn', hash: Hex) {
    const receipt = await this.receipt(hash)
    if (!receipt) return false
    const tx = await this.client.getTransaction({ hash })
    const method = ({ accepted: 'accept', declined: 'decline', expired: 'expire', withdrawn: 'withdraw' } as const)[action]
    const data = encodeFunctionData({ abi: introductionEscrowAbi, functionName: method, args: [intro.chain!.introductionId!] })
    if (!same(tx.from, actor) || !tx.to || !same(tx.to, this.config.escrow) || tx.input !== data || tx.value !== 0n) throw new ChainError('transaction_does_not_match_action')
    return true
  }
  async faucet(owner: Address) {
    if (this.config.chainId !== 31337 || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(this.config.rpcUrl).hostname)) throw new ChainError('local_faucet_only', 403)
    await this.ready()
    if (await this.client.getBalance({ address: owner }) >= 10n ** 18n) return
    const response = await fetch(this.config.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'anvil_setBalance', params: [owner, toHex(10n ** 18n)] }) })
    if (!response.ok || (await response.json() as { error?: unknown }).error) throw new ChainError('local_faucet_unavailable', 503)
  }
}
export function configuredChain(pilotMode = false): ChainService | undefined {
  if (!process.env.SIGNALPASS_CHAIN_CONFIG) return undefined
  const config = chainConfigSchema.parse(JSON.parse(readFileSync(process.env.SIGNALPASS_CHAIN_CONFIG, 'utf8')))
  const raw = process.env.SIGNALPASS_QUOTE_SIGNER_PRIVATE_KEY || (process.env.SIGNALPASS_QUOTE_SIGNER_KEY_FILE ? readFileSync(process.env.SIGNALPASS_QUOTE_SIGNER_KEY_FILE, 'utf8').trim() : '')
  if (!/^0x[0-9a-fA-F]{64}$/.test(raw)) throw new Error('Configure a quote signing key locally; never put it in browser configuration.')
  return new ChainService(config, raw as Hex, pilotMode)
}
