'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ApiDown, Loading, StateTimeline, stateLabel, stateTone } from '@/components/Bits'
import {
  ApiError,
  getIntroduction,
  getProfiles,
  transitionIntroduction,
  type BuilderProfileDto,
  type EvaluationOutcomeDto,
  type IntroductionDto,
} from '@/lib/api'
import { formatMon, formatRelative, formatTimestamp, shortHash } from '@/lib/format'

const QUESTION_LABELS: readonly { key: keyof IntroductionDto['intent']; label: string }[] = [
  { key: 'whoAmI', label: 'Who I am' },
  { key: 'whyYou', label: 'Why you' },
  { key: 'whatIOffer', label: 'What I offer' },
  { key: 'nextStep', label: 'Next step' },
]

function terminalLabel(state: string): string | undefined {
  if (state === 'accepted') return 'Accepted — the bond was refunded'
  if (state === 'declined') return 'Declined — the bond was refunded anyway'
  if (state === 'expired') return 'Expired — the bond was refunded'
  if (state === 'withdrawn') return 'Withdrawn by the sender — everything refunded'
  return undefined
}

export default function IntroductionPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [intro, setIntro] = useState<IntroductionDto | null>(null)
  const [profiles, setProfiles] = useState<BuilderProfileDto[]>([])
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (id.length === 0) return
    setError(null)
    Promise.all([getIntroduction(id), getProfiles()])
      .then(([introduction, list]) => {
        setIntro(introduction)
        setProfiles(list)
      })
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause : new ApiError(0, 'unknown_error', cause))
      })
  }, [id])

  useEffect(load, [load])

  const handle = useCallback(
    (address: string) => profiles.find((p) => p.owner.toLowerCase() === address.toLowerCase())?.handle,
    [profiles],
  )

  async function withdraw() {
    if (!intro) return
    setBusy(true)
    try {
      const updated = await transitionIntroduction(intro.id, 'sender', 'withdrawn')
      setIntro(updated)
    } catch {
      setError(new ApiError(0, 'withdraw_failed', null))
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <div className="wrap v2-page">
        <ApiDown error={error} retry={load} />
      </div>
    )
  }

  if (!intro) {
    return (
      <div className="wrap v2-page">
        <div className="card">
          <Loading lines={6} />
        </div>
      </div>
    )
  }

  const senderHandle = handle(intro.sender) ?? shortHash(intro.sender, 6, 4)
  const recipientHandle = handle(intro.recipient) ?? shortHash(intro.recipient, 6, 4)
  const recipientProfile = profiles.find(
    (p) => p.owner.toLowerCase() === intro.recipient.toLowerCase(),
  )
  const outcome: EvaluationOutcomeDto | null = intro.evaluationOutcome

  const feeSpent = intro.state !== 'withdrawn' && intro.state !== 'expired' && intro.state !== 'locked'
  const canWithdraw = intro.state === 'needs_context' || intro.state === 'locked'
  const money = {
    fee: BigInt(intro.quote.evaluationFee),
    bond: BigInt(intro.quote.attentionBond),
  }

  return (
    <div className="wrap v2-page v2-receipt-page">
      <Link href="/builders" className="btn-link tiny">
        ← Directory
      </Link>

      <div className="row-between" style={{ marginTop: 18, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Introduction</div>
          <h1 className="h2" style={{ marginTop: 8 }}>
            @{senderHandle} → @{recipientHandle}
          </h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill" data-tone={stateTone(intro.state)}>
            <span className="pill-dot" />
            {stateLabel(intro.state)}
          </span>
          <span className="pill">
            policy v{intro.policyVersion}
          </span>
        </div>
      </div>

      <div className="split" style={{ marginTop: 28 }}>
        <div className="stack">
          <div className="intro-card">
            <div className="intro-card-head">
              <div>
                <div className="eyebrow">The card as it was signed</div>
                <div className="small dim" style={{ marginTop: 2 }}>
                  locked {formatRelative(intro.createdAt)} · payload hash{' '}
                  <span className="mono">{shortHash(intro.payloadHash, 8, 6)}</span>
                </div>
              </div>
              <span className="pill">
                {intro.disclosedSignals.length} signal{intro.disclosedSignals.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="intro-card-body">
              {QUESTION_LABELS.map((question, index) => (
                <div className="intro-q" key={question.key}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="intro-q-num">{String(index + 1).padStart(2, '0')}</span>
                    <span className="tiny strong">{question.label}</span>
                  </div>
                  <p className="intro-q-text">{intro.intent[question.key]}</p>
                </div>
              ))}

              {intro.disclosedSignals.length > 0 ? (
                <div className="intro-q">
                  <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                    {intro.disclosedSignals.map((signal) => (
                      <span className="pill" data-tone="accent" key={signal.kind}>
                        {signal.label}
                      </span>
                    ))}
                  </div>
                  <p className="tiny dim" style={{ marginTop: 10 }}>
                    Consented at the moment of sending. Consent is recorded per signal, per introduction.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {outcome ? (
            <div className="section">
              <div className="eyebrow">What each side was told</div>
              <p className="small muted" style={{ marginTop: 10, maxWidth: '64ch' }}>
                In the running product these two halves are delivered separately: one to the sender, one to
                the recipient. They are shown together here so the mechanism is visible — and so it is
                obvious that neither half carries the other person’s reasoning, private policy text, or any
                wallet data used as a score.
              </p>

              <div className="grid-2 section-tight">
                <div className="verdict" data-side="recipient">
                  <div className="verdict-head">Kept by the recipient</div>
                  <div className="verdict-body">
                    <div>
                      <div className="tiny dim">Why it may matter</div>
                      <p className="small">{outcome.whyItMayMatter}</p>
                    </div>
                    {outcome.recipientSummary.length > 0 ? (
                      <div>
                        <div className="tiny dim">The three-line summary they saw</div>
                        <ul className="bullets">
                          {outcome.recipientSummary.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div>
                      <div className="tiny dim">A suggested opening question — ignorable</div>
                      <p className="small">“{outcome.suggestedOpeningQuestion}”</p>
                    </div>
                  </div>
                </div>

                <div className="verdict" data-side="sender">
                  <div className="verdict-head">Sent back to the sender</div>
                  <div className="verdict-body">
                    {outcome.coachNotes.length > 0 ? (
                      <div>
                        <div className="tiny dim">Coaching notes</div>
                        <ul className="bullets">
                          {outcome.coachNotes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div>
                      <div className="tiny dim">Still unanswered</div>
                      {outcome.missingContext.length > 0 ? (
                        <ul className="bullets">
                          {outcome.missingContext.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="small muted">
                          Nothing — the card answered all four questions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row" style={{ marginTop: 16, gap: 8, flexWrap: 'wrap' }}>
                <span className="pill" data-tone="accent">
                  <span className="pill-dot" />
                  agents recommended: {outcome.recommendation.replace(/_/g, ' ')}
                </span>
                <span className="pill">provider: {intro.evaluationProvider ?? 'unknown'}</span>
                <span className="pill tiny">a recommendation, never a decision</span>
              </div>

              {intro.evaluationReceiptHash ? (
                <div className="tiny dim" style={{ marginTop: 14 }}>
                  Evaluation receipt anchored onchain:{' '}
                  <span className="mono" style={{ wordBreak: 'break-all' }}>
                    {intro.evaluationReceiptHash}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="section">
            <div className="eyebrow">Where it stands</div>
            <div className="card section-tight">
              <StateTimeline state={intro.state} terminalLabel={terminalLabel(intro.state)} />
            </div>
          </div>

          {intro.state === 'ready_for_review' && recipientProfile ? (
            <div className="notice" data-tone="accent">
              <div className="row-between" style={{ flexWrap: 'wrap' }}>
                <div>
                  <div className="strong">
                    It is now in @{recipientProfile.handle}’s queue — and nowhere else.
                  </div>
                  <p className="small muted" style={{ marginTop: 6 }}>
                    Open their view to make the decision. Accept and decline are equally free.
                  </p>
                </div>
                <Link href={`/inbox/${recipientProfile.handle}`} className="btn btn-accent">
                  Open the recipient’s inbox
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="stack">
          <div className="card">
            <div className="eyebrow">Money, explicitly</div>
            <div className="stack-sm" style={{ marginTop: 14 }}>
              <div className="row-between small">
                <span className="muted">Evaluation fee</span>
                <span className="mono">
                  {formatMon(money.fee)} MON {feeSpent ? '· spent' : '· held'}
                </span>
              </div>
              <div className="row-between small">
                <span className="muted">Attention bond</span>
                <span className="mono">{formatMon(money.bond)} MON · refundable</span>
              </div>
            </div>
            <hr className="divider" style={{ margin: '16px 0' }} />
            <dl className="kv">
              <dt>Locked at</dt>
              <dd>{formatTimestamp(intro.createdAt)}</dd>
              <dt>Last change</dt>
              <dd>{formatTimestamp(intro.updatedAt)}</dd>
              <dt>Introduction id</dt>
              <dd className="hash">{shortHash(intro.id, 12, 8)}</dd>
            </dl>
            <hr className="divider" style={{ margin: '16px 0' }} />
            <p className="tiny dim">
              The bond is held by the escrow contract. There is no code path — and no agent verdict — that
              lets anyone take it.
            </p>
          </div>

          {canWithdraw ? (
            <div className="card">
              <div className="eyebrow">Change your mind</div>
              <p className="small muted" style={{ marginTop: 10 }}>
                Before the recipient decides, the sender can withdraw and recover the bond. The evaluation
                fee is already spent, because the evaluation already happened.
              </p>
              <button
                type="button"
                className="btn btn-danger btn-block"
                style={{ marginTop: 16 }}
                disabled={busy}
                onClick={withdraw}
              >
                {busy ? <span className="spin" /> : null}
                Withdraw and refund the bond
              </button>
            </div>
          ) : null}

          <div className="card-quiet">
            <div className="eyebrow">Read next</div>
            <ul className="bullets" style={{ marginTop: 12 }}>
              <li>
                <Link href={`/builders/${recipientHandle}`} className="btn-link">
                  @{recipientHandle}’s published policy
                </Link>
              </li>
              <li>
                <Link href="/status" className="btn-link">
                  What is real in this build
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
