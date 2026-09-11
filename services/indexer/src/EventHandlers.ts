// @ts-nocheck -- this file depends on types produced by `envio codegen`.
// Run `pnpm --filter @signalpass/indexer codegen` before typechecking it; the
// package tsconfig excludes it so the rest of the monorepo stays clean.
//
// The aggregation logic itself lives in ./aggregate.ts as pure, tested functions.
// These handlers only translate contract events into entity writes.
import { IntroductionEscrow, IntroductionReceipt, ProfileRegistry } from 'generated'
import { buildQueueHealth, buildSenderStanding } from './aggregate.js'

// Mirrors IntroductionEscrow.State
const STATE_ACCEPTED = 5
const STATE_DECLINED = 6
const STATE_EXPIRED = 7
const STATE_WITHDRAWN = 8
const STATE_READY_FOR_REVIEW = 4

ProfileRegistry.ProfileRegistered.handler(async ({ event, context }) => {
  context.Builder.set({
    id: event.params.profileId.toString(),
    address: event.params.owner,
    profileId: event.params.profileId,
    handleHash: event.params.handleHash,
    profileHash: event.params.profileHash,
    policyHash: '',
    policyVersion: 0,
    acceptsIntroductions: true,
    registeredAt: BigInt(event.block.timestamp),
    updatedAt: BigInt(event.block.timestamp),
  })
})

ProfileRegistry.PolicyUpdated.handler(async ({ event, context }) => {
  const builder = await context.Builder.get(event.params.profileId.toString())
  if (!builder) return

  context.Builder.set({
    ...builder,
    policyHash: event.params.policyHash,
    policyVersion: Number(event.params.policyVersion),
    updatedAt: BigInt(event.block.timestamp),
  })
})

ProfileRegistry.AvailabilityChanged.handler(async ({ event, context }) => {
  const builder = await context.Builder.get(event.params.profileId.toString())
  if (!builder) return

  context.Builder.set({
    ...builder,
    acceptsIntroductions: event.params.acceptsIntroductions,
    updatedAt: BigInt(event.block.timestamp),
  })
})

IntroductionEscrow.IntroductionLocked.handler(async ({ event, context }) => {
  const id = event.params.id

  context.Introduction.set({
    id,
    sender: event.params.sender,
    recipient: event.params.recipient,
    recipientProfileId: event.params.recipientProfileId,
    policyVersion: 0,
    evaluationFee: event.params.evaluationFee,
    attentionBond: event.params.attentionBond,
    lockedAt: BigInt(event.block.timestamp),
    expiresAt: event.params.expiresAt,
    state: 1, // Locked
  })

  await refreshQueueHealth(context, event.params.recipient, event.block.timestamp)
})

IntroductionEscrow.IntroductionStateChanged.handler(async ({ event, context }) => {
  const intro = await context.Introduction.get(event.params.id)
  if (!intro) return

  const state = Number(event.params.state)
  const resolved = [
    STATE_ACCEPTED,
    STATE_DECLINED,
    STATE_EXPIRED,
    STATE_WITHDRAWN,
  ].includes(state)

  context.Introduction.set({
    ...intro,
    state,
    resolvedAt: resolved ? BigInt(event.block.timestamp) : intro.resolvedAt,
  })

  await refreshQueueHealth(context, intro.recipient, event.block.timestamp)
  await refreshSenderStanding(context, intro.sender, event.block.timestamp)
})

IntroductionReceipt.ReceiptAnchor.handler(async ({ event, context }) => {
  const intro = await context.Introduction.get(event.params.introductionId)
  if (!intro) return

  context.Introduction.set({
    ...intro,
    receiptHash: event.params.receiptHash,
    recommendation: Number(event.params.recommendation),
    modelVersion: event.params.modelVersion,
    policyVersion: Number(event.params.policyVersion),
  })
})

/**
 * Recompute the recipient's aggregated queue health from the introductions we
 * have already indexed. `pending` doubles as the congestion input to the
 * pricing curve, so this entity is load-bearing rather than cosmetic.
 */
async function refreshQueueHealth(context, recipient, timestamp) {
  const introductions = await context.Introduction.getWhere({ recipient })
  const events = introductions.flatMap((intro) => {
    const base = {
      introductionId: intro.id,
      sender: intro.sender,
      recipient: intro.recipient,
      timestamp: Number(intro.lockedAt),
    }
    const rows = [{ ...base, kind: 'locked' }]

    if (intro.resolvedAt) {
      const kind =
        intro.state === STATE_ACCEPTED
          ? 'accepted'
          : intro.state === STATE_DECLINED
            ? 'declined'
            : intro.state === STATE_EXPIRED
              ? 'expired'
              : 'withdrawn'
      rows.push({ ...base, kind, timestamp: Number(intro.resolvedAt) })
    }
    return rows
  })

  const health = buildQueueHealth(events, recipient)

  context.QueueHealth.set({
    id: recipient,
    recipient,
    pending: health.pending,
    accepted: health.accepted,
    declined: health.declined,
    expired: health.expired,
    declinedRate: health.declineRate,
    avgResponseSeconds: health.avgResponseSeconds,
    pressureIndex: health.pressureIndex,
    updatedAt: BigInt(timestamp),
  })
}

async function refreshSenderStanding(context, sender, timestamp) {
  const introductions = await context.Introduction.getWhere({ sender })
  const events = introductions.flatMap((intro) => {
    const base = {
      introductionId: intro.id,
      sender: intro.sender,
      recipient: intro.recipient,
      timestamp: Number(intro.lockedAt),
    }
    const rows = [{ ...base, kind: 'locked' }]

    if (intro.resolvedAt) {
      const kind =
        intro.state === STATE_ACCEPTED
          ? 'accepted'
          : intro.state === STATE_DECLINED
            ? 'declined'
            : intro.state === STATE_EXPIRED
              ? 'expired'
              : 'withdrawn'
      rows.push({ ...base, kind, timestamp: Number(intro.resolvedAt) })
    }
    return rows
  })

  const standing = buildSenderStanding(events, sender)

  context.SenderStanding.set({
    id: sender,
    sender,
    total: standing.total,
    accepted: standing.accepted,
    declined: standing.declined,
    passRate: standing.passRate,
    updatedAt: BigInt(timestamp),
  })
}

export { STATE_READY_FOR_REVIEW }
