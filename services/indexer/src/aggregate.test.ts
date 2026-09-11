import assert from 'node:assert/strict'
import { test } from 'node:test'
import { quoteIntroduction, type GatePolicy } from '@signalpass/core'
import {
  buildQueueHealth,
  buildSenderStanding,
  pricingInputs,
  type IntroductionEventRecord,
} from './aggregate.js'

const T = 1_800_000_000
const HOUR = 3600

const SENDER = '0x1111111111111111111111111111111111111111'
const OTHER = '0x3333333333333333333333333333333333333333'
const RECIPIENT = '0x2222222222222222222222222222222222222222'

function ev(
  id: string,
  kind: IntroductionEventRecord['kind'],
  timestamp: number,
  sender = SENDER,
): IntroductionEventRecord {
  return { introductionId: id, sender, recipient: RECIPIENT, kind, timestamp }
}

const EMPTY_POLICY: GatePolicy = {
  version: 1,
  topics: ['monad'],
  availability: 'selective',
  desiredNextStep: 'a call',
  baseBond: 2_000_000_000_000_000n,
  unresolvedLimit: 3,
  timeoutSeconds: 86_400,
}

test('pending counts introductions with no terminal event', () => {
  const events = [ev('a', 'locked', T), ev('b', 'locked', T + 10), ev('c', 'locked', T + 20), ev('c', 'accepted', T + 30)]

  const health = buildQueueHealth(events, RECIPIENT)
  assert.equal(health.pending, 2)
  assert.equal(health.accepted, 1)
})

test('declineRate ignores undecided introductions', () => {
  const events = [
    ev('a', 'locked', T),
    ev('a', 'declined', T + 5),
    ev('b', 'locked', T),
    ev('b', 'accepted', T + 5),
    ev('c', 'locked', T),
  ]

  const health = buildQueueHealth(events, RECIPIENT)
  assert.equal(health.declineRate, 0.5)
})

test('avgResponseSeconds measures lock to decision only', () => {
  const events = [
    ev('a', 'locked', T),
    ev('a', 'accepted', T + 100),
    ev('b', 'locked', T),
    ev('b', 'declined', T + 300),
    ev('c', 'locked', T),
    ev('c', 'expired', T + 5000),
  ]

  const health = buildQueueHealth(events, RECIPIENT)
  assert.equal(health.avgResponseSeconds, 200)
  assert.equal(health.expired, 1)
})

test('pressureIndex reflects only the recent window', () => {
  const events = [
    ev('old-1', 'locked', T - 48 * HOUR),
    ev('old-2', 'locked', T - 48 * HOUR),
    ev('new-1', 'locked', T - 2 * HOUR),
    ev('new-2', 'locked', T - 1 * HOUR),
  ]

  const health = buildQueueHealth(events, RECIPIENT, 24 * HOUR)
  assert.equal(health.pressureIndex, 0.0833)
})

test('queue health is scoped to the recipient', () => {
  const events = [
    ev('a', 'locked', T),
    { introductionId: 'b', sender: SENDER, recipient: OTHER, kind: 'locked' as const, timestamp: T },
  ]

  const health = buildQueueHealth(events, RECIPIENT)
  assert.equal(health.pending, 1)
})

test('sender standing tracks pass rate', () => {
  const events = [
    ev('a', 'locked', T),
    ev('a', 'accepted', T + 1),
    ev('b', 'locked', T),
    ev('b', 'accepted', T + 1),
    ev('c', 'locked', T),
    ev('c', 'declined', T + 1),
    ev('d', 'locked', T, OTHER),
    ev('d', 'declined', T + 1, OTHER),
  ]

  const standing = buildSenderStanding(events, SENDER)
  assert.equal(standing.total, 3)
  assert.equal(standing.accepted, 2)
  assert.equal(standing.passRate, 0.6667)
})

test('pricingInputs only counts declines from this sender to this recipient', () => {
  const events = [
    // SENDER -> RECIPIENT, declined: this is the one repeat penalty that counts.
    ev('a', 'locked', T),
    ev('a', 'declined', T + 1),
    // OTHER -> RECIPIENT, declined: must never be charged to SENDER.
    ev('b', 'locked', T, OTHER),
    ev('b', 'declined', T + 1, OTHER),
    // Two introductions to RECIPIENT still holding funds.
    ev('c', 'locked', T + 2),
    ev('d', 'locked', T + 3),
  ]

  const inputs = pricingInputs(events, SENDER, RECIPIENT)
  assert.equal(inputs.priorDeclinesFromSender, 1)
  assert.equal(inputs.recipientQueueDepth, 2)
})

test('indexer output actually moves the quote', () => {
  const quiet = buildQueueHealth([ev('a', 'locked', T)], RECIPIENT)
  const busy = buildQueueHealth(
    Array.from({ length: 32 }, (_, i) => ev(`x${i}`, 'locked', T - i)),
    RECIPIENT,
  )

  const base = {
    policy: EMPTY_POLICY,
    contextChars: 400,
    attachmentCount: 0,
    unresolvedFromSender: 0,
    priorDeclinesFromSender: 0,
    now: T,
  }

  const quietQuote = quoteIntroduction({ ...base, recipientQueueDepth: quiet.pending })
  const busyQuote = quoteIntroduction({ ...base, recipientQueueDepth: busy.pending })

  assert.ok(
    busyQuote.attentionBond > quietQuote.attentionBond,
    'a busier queue must raise the refundable bond',
  )
  assert.equal(
    busyQuote.evaluationFee,
    quietQuote.evaluationFee,
    'congestion must never change the evaluation fee',
  )
})
