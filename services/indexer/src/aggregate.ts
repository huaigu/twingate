/**
 * Derived, aggregated read models built from raw contract events.
 *
 * These exist for two reasons:
 *  1. They are the "non-trivial derived entities" the Envio bounty scores for.
 *  2. More importantly, `pressureIndex` and `priorDeclines` are the real inputs
 *     to the pricing curve in @signalpass/core. The indexer is not decoration:
 *     it supplies the numbers the quote is computed from.
 *
 * Kept as pure functions so they can be tested without an indexing runtime.
 */

export type IntroductionEventKind = 'locked' | 'accepted' | 'declined' | 'expired' | 'withdrawn'

export interface IntroductionEventRecord {
  readonly introductionId: string
  readonly sender: string
  readonly recipient: string
  readonly kind: IntroductionEventKind
  readonly timestamp: number
}

export interface QueueHealth {
  readonly recipient: string
  /** Introductions still holding funds. */
  readonly pending: number
  readonly accepted: number
  readonly declined: number
  readonly expired: number
  readonly withdrawn: number
  /** declined / (accepted + declined), 0 when nothing has been decided. */
  readonly declineRate: number
  /** Mean seconds from lock to a recipient decision. */
  readonly avgResponseSeconds: number
  /** Recent inbound introductions per hour. Feeds the congestion multiplier. */
  readonly pressureIndex: number
}

export interface SenderStanding {
  readonly sender: string
  readonly total: number
  readonly accepted: number
  readonly declined: number
  /** accepted / (accepted + declined), 0 when nothing has been decided. */
  readonly passRate: number
}

const TERMINAL: readonly IntroductionEventKind[] = ['accepted', 'declined', 'expired', 'withdrawn']

function round(value: number, digits = 4): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function groupByIntroduction(
  events: readonly IntroductionEventRecord[],
): Map<string, IntroductionEventRecord[]> {
  const grouped = new Map<string, IntroductionEventRecord[]>()
  for (const event of events) {
    const bucket = grouped.get(event.introductionId)
    if (bucket) bucket.push(event)
    else grouped.set(event.introductionId, [event])
  }
  return grouped
}

/**
 * @param windowSeconds how far back `pressureIndex` looks. Defaults to 24h so
 *        the number reflects today's inbound load rather than all history.
 */
export function buildQueueHealth(
  events: readonly IntroductionEventRecord[],
  recipient: string,
  windowSeconds = 24 * 60 * 60,
): QueueHealth {
  const target = recipient.toLowerCase()
  const mine = events.filter((e) => e.recipient.toLowerCase() === target)

  const latest = (kind: IntroductionEventKind): number =>
    mine.filter((e) => e.kind === kind).length

  const byIntroduction = groupByIntroduction(mine)
  let pending = 0
  const responseTimes: number[] = []

  for (const records of byIntroduction.values()) {
    const lock = records.find((r) => r.kind === 'locked')
    if (!lock) continue

    const decision = records
      .filter((r) => r.kind === 'accepted' || r.kind === 'declined')
      .sort((a, b) => a.timestamp - b.timestamp)[0]

    const terminalEvent = records
      .filter((r) => TERMINAL.includes(r.kind))
      .sort((a, b) => a.timestamp - b.timestamp)[0]

    if (decision) responseTimes.push(decision.timestamp - lock.timestamp)
    if (!terminalEvent) pending += 1
  }

  const accepted = latest('accepted')
  const declined = latest('declined')
  const decided = accepted + declined

  const newest = mine.reduce((max, e) => Math.max(max, e.timestamp), 0)
  const windowStart = newest - windowSeconds
  const recentLocked = mine.filter((e) => e.kind === 'locked' && e.timestamp >= windowStart).length

  return {
    recipient,
    pending,
    accepted,
    declined,
    expired: latest('expired'),
    withdrawn: latest('withdrawn'),
    declineRate: decided === 0 ? 0 : round(declined / decided),
    avgResponseSeconds:
      responseTimes.length === 0
        ? 0
        : Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length),
    pressureIndex: round(recentLocked / (windowSeconds / 3600)),
  }
}

export function buildSenderStanding(
  events: readonly IntroductionEventRecord[],
  sender: string,
): SenderStanding {
  const target = sender.toLowerCase()
  const mine = events.filter((e) => e.sender.toLowerCase() === target)

  const accepted = mine.filter((e) => e.kind === 'accepted').length
  const declined = mine.filter((e) => e.kind === 'declined').length
  const decided = accepted + declined

  return {
    sender,
    total: groupByIntroduction(mine).size,
    accepted,
    declined,
    passRate: decided === 0 ? 0 : round(accepted / decided),
  }
}

/** Convenience: the two numbers `quoteIntroduction` actually consumes. */
export function pricingInputs(
  events: readonly IntroductionEventRecord[],
  sender: string,
  recipient: string,
): { recipientQueueDepth: number; priorDeclinesFromSender: number } {
  const health = buildQueueHealth(events, recipient)
  const targetSender = sender.toLowerCase()
  const targetRecipient = recipient.toLowerCase()

  const priorDeclinesFromSender = events.filter(
    (e) =>
      e.kind === 'declined' &&
      e.sender.toLowerCase() === targetSender &&
      e.recipient.toLowerCase() === targetRecipient,
  ).length

  return { recipientQueueDepth: health.pending, priorDeclinesFromSender }
}
