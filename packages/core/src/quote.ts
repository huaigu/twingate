import type { Availability, GatePolicy } from './domain.js'

/**
 * Pricing has one social job: make bulk contact expensive while keeping a
 * single genuine introduction cheap. It never becomes a price on attention
 * itself — the bond is refundable and the fee only ever covers evaluation cost.
 */
export interface PricingParams {
  /** Base cost of running both the Intro Coach and the recipient Gatekeeper. */
  readonly baseEvaluationFee: bigint
  readonly perKiloCharFee: bigint
  readonly perAttachmentFee: bigint
  /** Congestion slope, in basis points, over log2(queue depth). */
  readonly congestionAlphaBps: number
  /** Multiplier applied per prior decline from the same sender, in bps. */
  readonly repeatPenaltyBaseBps: number
  /** How long a quote stays valid before it must be recomputed. */
  readonly quoteTtlSeconds: number
}

export const DEFAULT_PRICING: PricingParams = {
  baseEvaluationFee: 500_000_000_000_000n, // 0.0005 MON
  perKiloCharFee: 50_000_000_000_000n,
  perAttachmentFee: 200_000_000_000_000n,
  congestionAlphaBps: 2_500, // +25% per doubling of queue depth
  repeatPenaltyBaseBps: 12_000, // 1.2x per prior decline
  quoteTtlSeconds: 900,
}

const BPS = 10_000n

const AVAILABILITY_BPS: Readonly<Record<Availability, number>> = {
  open: 7_500,
  selective: 10_000,
  closed: 15_000,
}

export interface QuoteInput {
  readonly policy: GatePolicy
  readonly contextChars: number
  readonly attachmentCount: number
  /** Introductions this sender currently holds unresolved against the recipient. */
  readonly unresolvedFromSender: number
  /** Unresolved introductions across the recipient's whole queue. */
  readonly recipientQueueDepth: number
  /** Prior declines from this sender to this recipient, within the lookback window. */
  readonly priorDeclinesFromSender: number
  readonly now: number
}

export interface QuoteLine {
  readonly label: string
  readonly amount: bigint
}

export interface Quote {
  /** Non-refundable. Covers evaluation of this request. */
  readonly evaluationFee: bigint
  /** Refundable unless a published, deterministic rule is violated. */
  readonly attentionBond: bigint
  readonly lines: readonly QuoteLine[]
  readonly computedAt: number
  readonly expiresAt: number
}

export class QuoteRejectedError extends Error {
  readonly code: 'queue_limit' | 'sender_limit'

  constructor(code: 'queue_limit' | 'sender_limit', message: string) {
    super(message)
    this.name = 'QuoteRejectedError'
    this.code = code
  }
}

function applyBps(amount: bigint, bps: number): bigint {
  if (bps <= 0) return 0n
  return (amount * BigInt(Math.round(bps))) / BPS
}

function congestionBps(queueDepth: number, alphaBps: number): number {
  const depth = Math.max(0, Math.floor(queueDepth))
  if (depth === 0) return Number(BPS)
  return Number(BPS) + alphaBps * Math.log2(1 + depth)
}

function repeatBps(priorDeclines: number, baseBps: number): number {
  const n = Math.max(0, Math.floor(priorDeclines))
  if (n === 0) return Number(BPS)
  return Math.pow(baseBps / Number(BPS), n) * Number(BPS)
}

/**
 * Quoting is pure and deterministic for a given input, so a sender can verify
 * the number they were shown and a reviewer can recompute it from public data.
 */
export function quoteIntroduction(
  input: QuoteInput,
  params: PricingParams = DEFAULT_PRICING,
): Quote {
  const { policy } = input

  if (input.unresolvedFromSender >= policy.unresolvedLimit) {
    throw new QuoteRejectedError(
      'sender_limit',
      `Sender already holds ${input.unresolvedFromSender} unresolved introductions; limit is ${policy.unresolvedLimit}.`,
    )
  }

  const contextUnits = BigInt(Math.ceil(Math.max(0, input.contextChars) / 1000))
  const attachments = BigInt(Math.max(0, Math.floor(input.attachmentCount)))

  const contextCost = contextUnits * params.perKiloCharFee
  const attachmentCost = attachments * params.perAttachmentFee
  const evaluationFee = params.baseEvaluationFee + contextCost + attachmentCost

  const congestion = congestionBps(input.recipientQueueDepth, params.congestionAlphaBps)
  const repeat = repeatBps(input.priorDeclinesFromSender, params.repeatPenaltyBaseBps)
  const availability = AVAILABILITY_BPS[policy.availability]

  const congestionDelta = applyBps(policy.baseBond, congestion) - policy.baseBond
  const availabilityDelta = applyBps(policy.baseBond, availability) - policy.baseBond
  const repeatDelta = applyBps(policy.baseBond, repeat) - policy.baseBond
  const attentionBond = policy.baseBond + congestionDelta + availabilityDelta + repeatDelta

  const lines: QuoteLine[] = [
    { label: 'Base evaluation (both agents)', amount: params.baseEvaluationFee },
    { label: `Context (${contextUnits} x 1k chars)`, amount: contextCost },
    { label: `Attachments (${attachments})`, amount: attachmentCost },
    { label: 'Attention bond (refundable, base)', amount: policy.baseBond },
    { label: 'Bond adjustment: queue congestion', amount: congestionDelta },
    { label: 'Bond adjustment: availability', amount: availabilityDelta },
    { label: 'Bond adjustment: prior declines', amount: repeatDelta },
  ]

  return {
    evaluationFee,
    attentionBond,
    lines,
    computedAt: input.now,
    expiresAt: input.now + params.quoteTtlSeconds,
  }
}

export function quoteTotal(quote: Quote): bigint {
  return quote.evaluationFee + quote.attentionBond
}
