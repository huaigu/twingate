import type {
  BuilderProfile,
  GatePolicy,
  Introduction,
  Quote,
} from '@signalpass/core'
import { keccak256, toHex, type Address, type Hex } from 'viem'

export interface StoredIntroduction extends Introduction {
  readonly quote: Quote
  readonly payloadHash: Hex
  readonly evaluationReceiptHash: Hex | null
}

/**
 * In-memory read model for the MVP. The authoritative record is the chain; this
 * is what the demo UI reads from so the flow works without an indexer running.
 * Swapping this for the Envio-backed reader is a single interface change.
 */
export interface Store {
  readonly profiles: Map<string, BuilderProfile>
  readonly policies: Map<string, GatePolicy>
  readonly introductions: Map<Hex, StoredIntroduction>
  /** `${sender}:${recipient}` -> declines inside the lookback window. */
  readonly declines: Map<string, number>
}

/** Deterministic document hash. BigInt amounts are stringified so anything
 *  containing wei-denominated values can still be hashed. */
export function hashDocument(value: unknown): Hex {
  return keccak256(
    toHex(JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v))),
  )
}

export function declineKey(sender: Address, recipient: Address): string {
  return `${sender.toLowerCase()}:${recipient.toLowerCase()}`
}

export function createStore(): Store {
  return {
    profiles: new Map(),
    policies: new Map(),
    introductions: new Map(),
    declines: new Map(),
  }
}

export function profileByHandle(store: Store, handle: string): BuilderProfile | undefined {
  return store.profiles.get(handle.toLowerCase())
}

export function profileByOwner(store: Store, owner: Address): BuilderProfile | undefined {
  const target = owner.toLowerCase()
  for (const profile of store.profiles.values()) {
    if (profile.owner.toLowerCase() === target) return profile
  }
  return undefined
}

/** A recipient's protected queue: everything that reached review, newest first. */
export function reviewQueue(store: Store, recipientHandle: string): StoredIntroduction[] {
  const profile = profileByHandle(store, recipientHandle)
  if (!profile) return []
  const recipient = profile.owner.toLowerCase()
  return [...store.introductions.values()]
    .filter((i) => i.recipient.toLowerCase() === recipient && i.state === 'ready_for_review')
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function unresolvedCountFor(store: Store, sender: Address, recipient: Address): number {
  const s = sender.toLowerCase()
  const r = recipient.toLowerCase()
  let count = 0
  for (const intro of store.introductions.values()) {
    if (intro.sender.toLowerCase() !== s || intro.recipient.toLowerCase() !== r) continue
    if (
      intro.state === 'locked' ||
      intro.state === 'evaluating' ||
      intro.state === 'needs_context' ||
      intro.state === 'ready_for_review'
    ) {
      count += 1
    }
  }
  return count
}

export function queueDepth(store: Store, recipient: Address): number {
  const r = recipient.toLowerCase()
  let count = 0
  for (const intro of store.introductions.values()) {
    if (intro.recipient.toLowerCase() === r && intro.state === 'ready_for_review') count += 1
  }
  return count
}

const ALICE: Address = '0x1111111111111111111111111111111111111111'
const BOB: Address = '0x2222222222222222222222222222222222222222'

const SEED_POLICY: Omit<GatePolicy, 'version'> = {
  topics: ['monad infrastructure', 'developer tooling', 'consumer social'],
  availability: 'selective',
  desiredNextStep: 'A 20-minute call, or a written exchange if async is easier.',
  baseBond: 2_000_000_000_000_000n, // 0.002 MON
  unresolvedLimit: 3,
  timeoutSeconds: 3 * 24 * 60 * 60,
}

/**
 * Two demo builders so the flow can be exercised before any wallet is wired up.
 */
export function seedDemoData(store: Store): void {
  const now = Math.floor(Date.now() / 1000)

  const aliceDoc = {
    handle: 'alice',
    displayName: 'Alice',
    building: 'A deterministic simulation harness for Monad contracts.',
    wantsToMeet: 'Protocol engineers who have shipped to production.',
    canOffer: 'Simulation tooling and honest feedback on protocol design.',
    availability: 'open' as const,
  }
  const bobDoc = {
    handle: 'bob',
    displayName: 'Bob',
    building: 'Indexing infrastructure for onchain social graphs.',
    wantsToMeet: 'Builders solving discovery and attention problems.',
    canOffer: 'Indexing expertise and Monad event pipeline design.',
    availability: 'selective' as const,
  }

  const bobPolicy: GatePolicy = { ...SEED_POLICY, version: 1 }

  store.profiles.set('alice', {
    profileId: 1n,
    owner: ALICE,
    handle: 'alice',
    displayName: aliceDoc.displayName,
    building: aliceDoc.building,
    wantsToMeet: aliceDoc.wantsToMeet,
    canOffer: aliceDoc.canOffer,
    availability: aliceDoc.availability,
    policyVersion: 1,
    policyHash: hashDocument(aliceDoc),
    persona: null,
    createdAt: now,
  })

  store.profiles.set('bob', {
    profileId: 2n,
    owner: BOB,
    handle: 'bob',
    displayName: bobDoc.displayName,
    building: bobDoc.building,
    wantsToMeet: bobDoc.wantsToMeet,
    canOffer: bobDoc.canOffer,
    availability: bobDoc.availability,
    policyVersion: 1,
    policyHash: hashDocument(bobPolicy),
    persona: null,
    createdAt: now,
  })

  store.policies.set('bob', bobPolicy)
  store.policies.set('alice', { ...SEED_POLICY, version: 1, availability: 'open' })
}

export const DEMO_SENDER: Address = ALICE
export const DEMO_RECIPIENT: Address = BOB
