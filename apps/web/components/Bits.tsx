'use client'

import type { ApiError, Availability, QuoteDto } from '@/lib/api'
import { API_BASE } from '@/lib/api'
import { formatMon, formatTimestamp } from '@/lib/format'

/* -------------------------------------------------------------- atoms */

export function AvailabilityPill({ value }: { readonly value: Availability }) {
  const label =
    value === 'open' ? 'open to introductions' : value === 'selective' ? 'selective' : 'rarely available'
  return (
    <span className="pill" data-tone={value}>
      <span className="pill-dot" />
      {label}
    </span>
  )
}

export function Loading({ lines = 3 }: { readonly lines?: number }) {
  return (
    <div className="stack-sm" aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width: `${[92, 74, 58, 84, 66][i % 5]}%` }}
        />
      ))}
    </div>
  )
}

/**
 * The single most important piece of framing in the product: the evaluation fee
 * is spent, the attention bond comes back. They are never shown as one number.
 */
export function QuotePanel({
  quote,
  pending = false,
  title = 'What this costs',
}: {
  readonly quote: QuoteDto | null
  readonly pending?: boolean
  readonly title?: string
}) {
  if (!quote) {
    return (
      <div className="card">
        <div className="eyebrow">{title}</div>
        <div className="section-tight">
          <Loading lines={4} />
        </div>
      </div>
    )
  }

  const fee = BigInt(quote.evaluationFee)
  const bond = BigInt(quote.attentionBond)
  const total = fee + bond
  const feeShare = total === 0n ? 0 : Number((fee * 1000n) / total) / 10

  return (
    <div className="card">
      <div className="eyebrow">{title}</div>

      <div className="row-between" style={{ marginTop: 10, alignItems: 'baseline' }}>
        <div className="quote-total">{formatMon(total)} MON</div>
        {pending ? <span className="pill" data-tone="accent">recomputing…</span> : null}
      </div>

      <div className="quote-split" role="img" aria-label={`Fee ${feeShare.toFixed(0)}% of the total`}>
        <div className="quote-split-fee" style={{ width: `${feeShare}%` }} />
        <div className="quote-split-bond" style={{ width: `${100 - feeShare}%` }} />
      </div>

      <div className="stack-sm" style={{ marginBottom: 18 }}>
        <div className="row-between small">
          <span className="row">
            <span className="pill" data-tone="fee">spent</span>
            <span className="muted">Evaluation fee</span>
          </span>
          <span className="mono">{formatMon(fee)} MON</span>
        </div>
        <div className="row-between small">
          <span className="row">
            <span className="pill" data-tone="bond">refundable</span>
            <span className="muted">Attention bond</span>
          </span>
          <span className="mono">{formatMon(bond)} MON</span>
        </div>
      </div>

      <ul className="quote-lines">
        {quote.lines.map((line) => {
          const amount = BigInt(line.amount)
          return (
            <li key={line.label} className="quote-line">
              <span className="muted">{line.label}</span>
              <span
                className="quote-line-amount"
                data-sign={amount < 0n ? 'negative' : 'positive'}
              >
                {amount > 0n ? '+' : ''}
                {formatMon(amount)} MON
              </span>
            </li>
          )
        })}
      </ul>

      <p className="tiny dim" style={{ marginTop: 12 }}>
        Quote valid until {formatTimestamp(quote.expiresAt)}. Recomputed on every change — the
        number you are shown is the number you pay.
      </p>
    </div>
  )
}

/* --------------------------------------------------------- state machine */

const MILESTONES: readonly { key: string; label: string; note: string }[] = [
  {
    key: 'locked',
    label: 'Funds locked in the escrow contract',
    note: 'Fee and bond are split onchain. Neither is held by SignalPass.',
  },
  {
    key: 'evaluating',
    label: 'Both agents read the request',
    note: 'The Intro Coach improves the card; the recipient’s Gatekeeper reads it against their published policy.',
  },
  {
    key: 'ready_for_review',
    label: 'Waiting in the recipient’s queue',
    note: 'It is only visible to them. Nobody else can open an introduction addressed to someone else.',
  },
  {
    key: 'decision',
    label: 'The recipient decides',
    note: 'Accept or decline. Either way the bond goes back to the sender — that is enforced by the contract, not by us.',
  },
]

const RANK: Readonly<Record<string, number>> = {
  locked: 0,
  evaluating: 1,
  needs_context: 2,
  ready_for_review: 2,
  accepted: 3,
  declined: 3,
  expired: 3,
  withdrawn: 3,
}

export function StateTimeline({
  state,
  terminalLabel,
}: {
  readonly state: string
  readonly terminalLabel?: string
}) {
  const current = RANK[state] ?? 0
  const stopped = state === 'withdrawn' || state === 'expired'

  const items = MILESTONES.map((milestone, index) => ({ ...milestone, index }))

  if (state === 'needs_context') {
    items.splice(2, 0, {
      key: 'needs_context',
      label: 'Sent back for one more piece of context',
      note: 'The Gatekeeper asked a specific question. The sender can answer, or withdraw and take the bond back.',
      index: 2,
    })
  }

  return (
    <ol className="timeline">
      {items.map((item) => {
        const status =
          stopped && item.index === current
            ? 'current'
            : item.index < current
              ? 'done'
              : item.index === current
                ? 'current'
                : 'upcoming'

        const label =
          item.key === 'decision' && terminalLabel && status !== 'upcoming' ? terminalLabel : item.label

        return (
          <li key={item.key} className="timeline-item" data-state={status}>
            <span className="timeline-node">{status === 'done' ? '✓' : ''}</span>
            <div>
              <div className="timeline-label">{label}</div>
              <div className="timeline-note">{item.note}</div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function stateLabel(state: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    quoted: 'Quoted',
    locked: 'Funds locked',
    evaluating: 'Evaluating',
    needs_context: 'Needs more context',
    ready_for_review: 'In review queue',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
    withdrawn: 'Withdrawn',
  }
  return labels[state] ?? state
}

export function stateTone(state: string): string {
  if (state === 'accepted') return 'bond'
  if (state === 'declined') return 'danger'
  if (state === 'ready_for_review') return 'accent'
  if (state === 'needs_context') return 'fee'
  return 'accent'
}

/* ------------------------------------------------------------- failures */

/**
 * The API is a separate process. When it is down this says exactly that and
 * exactly how to start it, instead of showing an empty page or a stack trace.
 */
export function ApiDown({ error, retry }: { readonly error: ApiError; readonly retry?: () => void }) {
  const unreachable = error.isUnreachable

  return (
    <div className="notice" data-tone="danger">
      <div className="row-between">
        <div>
          <div className="strong">
            {unreachable ? 'The SignalPass API is not running' : `Request failed: ${error.code}`}
          </div>
          <p className="small muted" style={{ marginTop: 6 }}>
            {unreachable ? (
              <>
                This page reads from <span className="mono">{API_BASE}</span>. Start it in another
                terminal with <span className="mono">pnpm api:dev</span>, then reload.
              </>
            ) : (
              <>The API answered with {error.status}. Reload to try again.</>
            )}
          </p>
        </div>
        {retry ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={retry}>
            Retry
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function EmptyState({ title, body }: { readonly title: string; readonly body: string }) {
  return (
    <div className="card-quiet">
      <div className="strong">{title}</div>
      <p className="small muted" style={{ marginTop: 6 }}>
        {body}
      </p>
    </div>
  )
}
