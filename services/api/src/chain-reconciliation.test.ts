import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encodeAbiParameters, encodeEventTopics, encodePacked, keccak256, type Address, type Hex } from 'viem'
import { introductionEscrowAbi } from '@signalpass/core'
import { ChainError, ChainService, type SignedLockQuote } from './chain.js'
import type { StoredIntroduction } from './store.js'

const sender = '0x1111111111111111111111111111111111111111' as Address
const recipient = '0x2222222222222222222222222222222222222222' as Address
const escrow = '0x3333333333333333333333333333333333333333' as Address
const hex = (value: number | bigint) => ('0x' + value.toString(16).padStart(64, '0')) as Hex
const lockHash = hex(1), refundHash = hex(2), expiresAt = 1_800_000_600n
const quote: SignedLockQuote = {
  message: { sender, recipient, recipientProfileId: 1n, policyHash: hex(3), policyVersion: 1n, payloadHash: hex(4), evaluationFee: 0n, attentionBond: 75_000_000_000_000n, ttl: 600n, quoteExpiresAt: 1_800_000_900n, nonce: 0n },
  signature: ('0x' + '11'.repeat(65)) as Hex, issuedAt: 1_800_000_000, issuedBlock: '10',
}
const introductionId = keccak256(encodePacked(['address', 'address', 'uint256', 'uint256', 'uint256'], [sender, recipient, 1n, 0n, 143n]))

function fixture(options: { lockBlock?: bigint; finalized?: bigint; confirmations?: number; refundBlock?: bigint } = {}) {
  const lockBlock = options.lockBlock ?? 50n
  let finalized = options.finalized ?? 2000n
  let terminal = options.refundBlock !== undefined
  const queries: { event: string; fromBlock: bigint; toBlock: bigint }[] = []
  const stateBlocks: bigint[] = []
  const chain = new ChainService({ chainId: 143, rpcUrl: 'http://127.0.0.1:1', registry: sender, escrow, receipt: recipient, name: 'Monad mainnet fixture', confirmations: options.confirmations ?? 1, localTtlSeconds: 60 }, hex(99), true)
  chain.ready = async () => {}
  const lockLog = {
    address: escrow,
    topics: encodeEventTopics({ abi: introductionEscrowAbi, eventName: 'IntroductionLocked', args: { id: introductionId, sender, recipient } }),
    data: encodeAbiParameters([{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint64' }], [1n, 0n, quote.message.attentionBond, expiresAt]),
  }
  const refundLog = {
    address: escrow,
    topics: encodeEventTopics({ abi: introductionEscrowAbi, eventName: 'AttentionBondRefunded', args: { id: introductionId, to: sender } }),
    data: encodeAbiParameters([{ type: 'uint256' }], [quote.message.attentionBond]),
  }
  Object.defineProperty(chain, 'client', { value: {
    getBlockNumber: async () => { throw new Error('Proposed/latest head must not confirm Monad value') },
    getBlock: async ({ blockTag, blockNumber }: { blockTag?: string; blockNumber?: bigint } = {}) => {
      if (blockTag === 'finalized') return { number: finalized, hash: hex(finalized), timestamp: 1_800_001_000n }
      assert.notEqual(blockNumber, undefined)
      return { number: blockNumber, hash: hex(blockNumber!), timestamp: 1_800_000_000n }
    },
    getTransactionReceipt: async ({ hash }: { hash: Hex }) => {
      assert([lockHash, refundHash].includes(hash))
      const blockNumber = hash === lockHash ? lockBlock : options.refundBlock!
      return { status: 'success', blockNumber, blockHash: hex(blockNumber), logs: [hash === lockHash ? lockLog : refundLog] }
    },
    getTransaction: async ({ hash }: { hash: Hex }) => {
      assert.equal(hash, lockHash)
      const transaction = chain.fundingTransaction(quote)
      return { from: sender, to: escrow, input: transaction.data, value: BigInt(transaction.value) }
    },
    readContract: async ({ functionName, blockNumber }: { functionName: string; blockNumber?: bigint }) => {
      assert.equal(functionName, 'getIntroduction')
      assert.notEqual(blockNumber, undefined)
      // Model a public node that has pruned old eth_call state.
      if (blockNumber! < finalized - 20n) throw new Error('historical state pruned')
      assert(blockNumber! <= finalized)
      stateBlocks.push(blockNumber!)
      return { ...quote.message, expiresAt, state: terminal ? 5 : 4 }
    },
    getLogs: async ({ event, fromBlock, toBlock }: { event: { name: string }; fromBlock: bigint; toBlock: bigint }) => {
      assert(toBlock >= fromBlock)
      assert(toBlock - fromBlock + 1n <= 100n, 'Monad public RPC permits at most 100 inclusive blocks')
      assert(toBlock <= finalized, 'recovery must never consume proposed logs')
      queries.push({ event: event.name, fromBlock, toBlock })
      const target = event.name === 'IntroductionLocked' ? lockBlock : options.refundBlock
      if (target === undefined || target < fromBlock || target > toBlock) return []
      return [{ transactionHash: event.name === 'IntroductionLocked' ? lockHash : refundHash, blockNumber: target, args: { id: introductionId, to: sender, amount: quote.message.attentionBond } }]
    },
  } })
  const intro = {
    id: hex(5), sender, recipient, state: 'quoted', settlement: 'onchain',
    chain: { chainId: 143, escrow, quote },
  } as StoredIntroduction
  return { chain, intro, queries, stateBlocks, setFinalized(value: bigint) { finalized = value }, setTerminal(value: boolean) { terminal = value } }
}

test('old locks recover without historical state calls, and exact approved calldata still authenticates immutable fields', async () => {
  const h = fixture({ lockBlock: 50n, finalized: 500_000n })
  const verified = await h.chain.verifyLock(quote, lockHash)
  assert.deepEqual(verified, { introductionId, confirmedBlock: '50', expiresAt: Number(expiresAt) })
  assert.deepEqual(h.stateBlocks, [])
  const synced = await h.chain.sync({ ...h.intro, chain: { ...h.intro.chain!, lockTransactionHash: lockHash } })
  assert.equal(synced!.state, 'ready_for_review')
  assert.deepEqual(h.stateBlocks, [500_000n])
  await assert.rejects(h.chain.verifyLock({ ...quote, message: { ...quote.message, payloadHash: hex(42) } }, lockHash), (error) => error instanceof ChainError && error.code === 'transaction_does_not_match_approval')
})

test('proposed receipts remain pending until finalized plus configured confirmations', async () => {
  const h = fixture({ lockBlock: 100n, finalized: 99n, confirmations: 3 })
  const pendingIntro = { ...h.intro, chain: { ...h.intro.chain!, lockTransactionHash: lockHash } }
  assert.equal(await h.chain.verifyLock(quote, lockHash), null)
  const pending = await h.chain.sync(pendingIntro)
  assert.equal(pending!.state, 'quoted')
  assert.equal(pending!.chain.introductionId, undefined)
  assert(h.queries.every(query => query.toBlock <= 97n))
  assert.deepEqual(h.stateBlocks, [])
  h.setFinalized(100n)
  assert.equal(await h.chain.verifyLock(quote, lockHash), null)
  h.setFinalized(102n)
  assert.equal((await h.chain.verifyLock(quote, lockHash))!.confirmedBlock, '100')
  const confirmed = await h.chain.sync(pendingIntro)
  assert.equal(confirmed!.state, 'ready_for_review')
  assert.equal(h.stateBlocks.at(-1), 100n)
})

test('missing funding callbacks recover in inclusive 100-block windows below finality', async () => {
  const h = fixture({ lockBlock: 450n, finalized: 500n })
  let intro: StoredIntroduction = { ...h.intro, chain: { ...h.intro.chain!, quote: { ...quote, issuedBlock: '100' } } }
  for (let page = 0; page < 4; page++) {
    const result = await h.chain.sync(intro)
    assert(result)
    intro = { ...intro, ...result }
  }
  assert.equal(intro.state, 'ready_for_review')
  assert.equal(intro.chain!.introductionId, introductionId)
  assert.deepEqual(h.queries.map(({ fromBlock, toBlock }) => [fromBlock, toBlock]), [[100n, 199n], [199n, 298n], [298n, 397n], [397n, 496n]])
})

test('refund discovery is bounded, survives restarts, and never confirms settlement without its refund proof', async () => {
  const options = { lockBlock: 50n, finalized: 2000n, refundBlock: 1050n }
  let h = fixture(options)
  let intro: StoredIntroduction = { ...h.intro, state: 'ready_for_review', chain: { ...h.intro.chain!, lockTransactionHash: lockHash } }
  const first = await h.chain.sync(intro)
  assert(first)
  assert.equal(h.queries.length, 4)
  assert.equal(first.state, 'ready_for_review')
  assert.equal(first.chain.refund, undefined)
  assert.equal(first.chain.refundPending, true)
  assert.equal(first.chain.refundScanToBlock, '1600')
  intro = { ...intro, ...first }

  // A fresh service resumes the persisted cursor instead of rescanning the tip.
  h = fixture(options)
  const second = await h.chain.sync(intro)
  assert(second)
  assert.equal(h.queries.length, 4)
  assert.equal(h.queries[0]!.toBlock, 1600n)
  assert.equal(second.chain.refundScanToBlock, '1200')
  assert.equal(second.chain.refund, undefined)
  intro = { ...intro, ...second }
  const settled = await h.chain.sync(intro)
  assert(settled)
  assert.equal(settled.state, 'accepted')
  assert.deepEqual(settled.chain.refund, { amount: quote.message.attentionBond.toString(), transactionHash: refundHash, blockNumber: '1050' })
  assert.equal(settled.chain.refundPending, false)
  assert.equal(settled.chain.refundScanToBlock, undefined)

  const action = fixture({ lockBlock: 50n, finalized: 4000n, refundBlock: 1050n })
  await assert.rejects(action.chain.prepareAction({ ...action.intro, state: 'ready_for_review', chain: { ...action.intro.chain!, lockTransactionHash: lockHash } }, recipient, 'accepted'), (error) => error instanceof ChainError && error.code === 'refund_not_confirmed')
  assert.equal(action.queries.length, 4)
})
