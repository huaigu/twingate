import type { Address, Hex } from 'viem'

/**
 * How reachable a builder currently is. Availability is social signal, not a
 * credential gate: a `closed` builder can still receive introductions, they are
 * simply routed to a longer review path with a higher bond.
 */
export type Availability = 'open' | 'selective' | 'closed'

/** Optional Hunyuan-generated digital presence. Never an identity proof. */
export interface PersonaRef {
  readonly status: 'pending' | 'ready' | 'failed'
  readonly assetUrl: string | null
  readonly sourceKind: 'image' | 'text'
}

/** A builder's public, self-published presence in the network. */
export interface BuilderProfile {
  readonly profileId: bigint
  readonly owner: Address
  readonly handle: string
  readonly displayName: string
  /** What they are building right now. */
  readonly building: string
  /** Who they want to meet. */
  readonly wantsToMeet: string
  /** What they can offer in return. */
  readonly canOffer: string
  readonly availability: Availability
  readonly policyVersion: number
  readonly policyHash: Hex
  readonly persona: PersonaRef | null
  readonly createdAt: number
}

/**
 * The recipient's published preferences. The Gatekeeper maps a request onto
 * this policy; the policy is versioned and hashed onchain so an evaluation
 * receipt can prove which policy produced a verdict.
 */
export interface GatePolicy {
  readonly version: number
  readonly topics: readonly string[]
  readonly availability: Availability
  readonly desiredNextStep: string
  /** Base attention bond before context and congestion multipliers. */
  readonly baseBond: bigint
  /** Max unresolved introductions one sender may hold against this recipient. */
  readonly unresolvedLimit: number
  /** Seconds before an unresolved introduction expires and the bond refunds. */
  readonly timeoutSeconds: number
}

/** The four questions an Introduction Card must answer. */
export interface IntroductionIntent {
  readonly whoAmI: string
  readonly whyYou: string
  readonly whatIOffer: string
  readonly nextStep: string
}

/**
 * Verified context a sender may choose to disclose. Opt-in per introduction;
 * never a wealth score and never used alone to decide access.
 */
export interface DisclosedSignal {
  readonly kind: 'monad_activity' | 'deployed_contract' | 'ecosystem_membership'
  readonly label: string
  readonly evidenceUrl: string | null
  readonly consentedAt: number
}

export const INTRODUCTION_STATES = [
  'draft',
  'quoted',
  'locked',
  'evaluating',
  'needs_context',
  'ready_for_review',
  'accepted',
  'declined',
  'expired',
  'withdrawn',
] as const

export type IntroductionState = (typeof INTRODUCTION_STATES)[number]

/**
 * Legal state machine. The chain only stores the states it must settle on
 * (`locked` onward); `draft` and `quoted` live offchain.
 *
 * Only the recipient can leave `ready_for_review`, and only the sender can
 * withdraw before evaluation begins. AI can move a request into
 * `needs_context` but can never reach `accepted` or trigger a forfeit.
 */
const TRANSITIONS: Readonly<Record<IntroductionState, readonly IntroductionState[]>> = {
  draft: ['quoted', 'withdrawn'],
  quoted: ['locked', 'withdrawn', 'expired'],
  locked: ['evaluating', 'withdrawn'],
  evaluating: ['needs_context', 'ready_for_review'],
  needs_context: ['evaluating', 'withdrawn'],
  ready_for_review: ['accepted', 'declined', 'expired'],
  accepted: [],
  declined: [],
  expired: [],
  withdrawn: [],
}

const TERMINAL: ReadonlySet<IntroductionState> = new Set<IntroductionState>([
  'accepted',
  'declined',
  'expired',
  'withdrawn',
])

export function canTransition(from: IntroductionState, to: IntroductionState): boolean {
  return TRANSITIONS[from].includes(to)
}

export function nextStates(from: IntroductionState): readonly IntroductionState[] {
  return TRANSITIONS[from]
}

export function isTerminal(state: IntroductionState): boolean {
  return TERMINAL.has(state)
}

/** States in which the sender's funds are held by the escrow contract. */
export function holdsFunds(state: IntroductionState): boolean {
  return state === 'locked' || state === 'evaluating' || state === 'needs_context' || state === 'ready_for_review'
}

export class InvalidTransitionError extends Error {
  readonly from: IntroductionState
  readonly to: IntroductionState

  constructor(from: IntroductionState, to: IntroductionState) {
    super(`Illegal introduction transition: ${from} -> ${to}`)
    this.name = 'InvalidTransitionError'
    this.from = from
    this.to = to
  }
}

export function assertTransition(from: IntroductionState, to: IntroductionState): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to)
}

/** Who is allowed to drive a given transition. */
export type Actor = 'sender' | 'recipient' | 'evaluator' | 'system'

const TRANSITION_ACTOR: Readonly<Record<IntroductionState, Actor>> = {
  draft: 'sender',
  quoted: 'sender',
  locked: 'sender',
  evaluating: 'evaluator',
  needs_context: 'evaluator',
  ready_for_review: 'evaluator',
  accepted: 'recipient',
  declined: 'recipient',
  expired: 'system',
  withdrawn: 'sender',
}

export function canActorAdvance(actor: Actor, to: IntroductionState): boolean {
  return TRANSITION_ACTOR[to] === actor
}

/** A full introduction request as held by the application layer. */
export interface Introduction {
  readonly id: Hex
  readonly sender: Address
  readonly recipient: Address
  readonly intent: IntroductionIntent
  readonly disclosedSignals: readonly DisclosedSignal[]
  readonly state: IntroductionState
  readonly policyVersion: number
  readonly createdAt: number
  readonly updatedAt: number
}

/**
 * What the two humans are allowed to see. Raw agent transcripts, private policy
 * text, prompts, internal scores and unauthorised wallet data never appear here.
 */
export interface EvaluationOutcome {
  readonly recommendation: 'review' | 'ask_for_context' | 'not_now'
  readonly whyItMayMatter: string
  readonly recipientSummary: readonly string[]
  readonly suggestedOpeningQuestion: string
  readonly coachNotes: readonly string[]
  readonly missingContext: readonly string[]
  /** Hash of this receipt, anchored onchain by IntroductionReceipt. */
  readonly receiptHash: Hex
}
