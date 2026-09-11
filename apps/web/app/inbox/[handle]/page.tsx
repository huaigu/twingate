'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ApiDown, EmptyState, Loading } from '@/components/Bits'
import {
  ApiError,
  getProfile,
  getQueue,
  transitionIntroduction,
  type BuilderProfileDto,
  type GatePolicyDto,
  type IntroductionDto,
} from '@/lib/api'
import { formatMon, formatRelative, shortHash } from '@/lib/format'

interface Loaded {
  profile: BuilderProfileDto
  policy: GatePolicyDto | null
  queue: IntroductionDto[]
}

export default function InboxPage() {
  const params = useParams<{ handle: string }>()
  const handle = typeof params?.handle === 'string' ? params.handle : ''

  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [resolved, setResolved] = useState<Record<string, 'accepted' | 'declined'>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (handle.length === 0) return
    setError(null)
    Promise.all([getProfile(handle), getQueue(handle)])
      .then(([profile, queue]) => {
        setData({ profile: profile.profile, policy: profile.policy, queue: queue.queue })
      })
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause : new ApiError(0, 'unknown_error', cause))
      })
  }, [handle])

  useEffect(load, [load])

  async function decide(introduction: IntroductionDto, decision: 'accepted' | 'declined') {
    setBusyId(introduction.id)
    setActionError(null)
    try {
      await transitionIntroduction(introduction.id, 'recipient', decision)
      setResolved((current) => ({ ...current, [introduction.id]: decision }))
    } catch {
      setActionError('The decision did not go through. Nothing changed.')
    } finally {
      setBusyId(null)
    }
  }

  if (error) {
    return (
      <div className="wrap">
        <ApiDown error={error} retry={load} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="wrap">
        <div className="card">
          <Loading lines={5} />
        </div>
      </div>
    )
  }

  const open = data.queue.filter((item) => resolved[item.id] === undefined)

  return (
    <div className="wrap">
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Protected queue</div>
          <h1 className="h2" style={{ marginTop: 8 }}>
            @{data.profile.handle}’s introductions
          </h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill" data-tone={open.length > 0 ? 'accent' : 'bond'}>
            <span className="pill-dot" />
            {open.length} waiting
          </span>
          {data.policy ? (
            <span className="pill">limit {data.policy.unresolvedLimit} per sender</span>
          ) : null}
        </div>
      </div>

      <p className="lede" style={{ marginTop: 14 }}>
        This is the only place these exist. Nobody can browse them, nobody can search them, and the sender
        cannot see this page. Accept and decline are equally free — the bond goes back either way, so there
        is no price for saying no.
      </p>

      {actionError ? (
        <div className="notice section-tight" data-tone="danger">
          <div className="strong">{actionError}</div>
        </div>
      ) : null}

      {Object.keys(resolved).length > 0 ? (
        <div className="notice section-tight" data-tone="bond">
          <div className="strong">Decided — bonds refunded</div>
          <ul className="bullets" style={{ marginTop: 10 }}>
            {Object.entries(resolved).map(([id, decision]) => (
              <li key={id}>
                <span className="mono tiny">{shortHash(id, 10, 6)}</span> → {decision}. The sender keeps the
                full bond; only the evaluation fee was spent.
              </li>
            ))}
          </ul>
          <p className="tiny dim" style={{ marginTop: 8 }}>
            In the onchain build this is a single transaction that refunds the bond and consumes the fee. The
            demo store applies the same rule.
          </p>
        </div>
      ) : null}

      <div className="section-tight stack">
        {open.length === 0 ? (
          <EmptyState
            title="Nobody is waiting on you."
            body="That is the point of the whole design. A quiet queue is the normal state, not a failure — and it is what the bond is there to protect."
          />
        ) : (
          open.map((introduction) => (
            <article className="intro-card fade-in" key={introduction.id}>
              <div className="intro-card-head">
                <div>
                  <div className="eyebrow">From</div>
                  <div className="strong mono" style={{ marginTop: 2 }}>
                    {shortHash(introduction.sender, 8, 6)}
                  </div>
                </div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="pill">
                    locked {formatRelative(introduction.createdAt)}
                  </span>
                  <span className="pill" data-tone="bond">
                    {formatMon(introduction.quote.attentionBond)} MON bond held
                  </span>
                </div>
              </div>

              <div className="intro-card-body">
                {introduction.evaluationOutcome ? (
                  <div className="stack" style={{ paddingTop: 16 }}>
                    <div>
                      <div className="tiny dim">Why it may matter to you</div>
                      <p style={{ marginTop: 4 }}>{introduction.evaluationOutcome.whyItMayMatter}</p>
                    </div>

                    {introduction.evaluationOutcome.recipientSummary.length > 0 ? (
                      <div>
                        <div className="tiny dim">In three lines</div>
                        <ul className="bullets" style={{ marginTop: 4 }}>
                          {introduction.evaluationOutcome.recipientSummary.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="small muted" style={{ paddingTop: 16 }}>
                    No evaluation summary is attached to this introduction.
                  </p>
                )}

                {introduction.disclosedSignals.length > 0 ? (
                  <div style={{ marginTop: 18 }}>
                    <div className="tiny dim">Context they chose to disclose</div>
                    <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {introduction.disclosedSignals.map((signal) => (
                        <span className="pill" data-tone="accent" key={signal.kind}>
                          {signal.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <hr className="divider" style={{ margin: '20px 0 18px' }} />

                <div className="intro-q" style={{ paddingTop: 0 }}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="intro-q-num">01</span>
                    <span className="tiny strong">Who I am</span>
                  </div>
                  <p className="intro-q-text">{introduction.intent.whoAmI}</p>
                </div>
                <div className="intro-q">
                  <div className="row" style={{ gap: 10 }}>
                    <span className="intro-q-num">02</span>
                    <span className="tiny strong">Why you</span>
                  </div>
                  <p className="intro-q-text">{introduction.intent.whyYou}</p>
                </div>
                <div className="intro-q">
                  <div className="row" style={{ gap: 10 }}>
                    <span className="intro-q-num">03</span>
                    <span className="tiny strong">What I offer</span>
                  </div>
                  <p className="intro-q-text">{introduction.intent.whatIOffer}</p>
                </div>
                <div className="intro-q">
                  <div className="row" style={{ gap: 10 }}>
                    <span className="intro-q-num">04</span>
                    <span className="tiny strong">Next step</span>
                  </div>
                  <p className="intro-q-text">{introduction.intent.nextStep}</p>
                </div>

                {introduction.evaluationOutcome?.suggestedOpeningQuestion ? (
                  <div className="card-quiet" style={{ marginTop: 18 }}>
                    <div className="tiny dim">If you do reply, here is one way in — ignore it if it is wrong</div>
                    <p className="small" style={{ marginTop: 6 }}>
                      “{introduction.evaluationOutcome.suggestedOpeningQuestion}”
                    </p>
                  </div>
                ) : null}

                <div className="row" style={{ gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={busyId === introduction.id}
                    onClick={() => decide(introduction, 'accepted')}
                  >
                    {busyId === introduction.id ? <span className="spin" /> : null}
                    Meet them
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busyId === introduction.id}
                    onClick={() => decide(introduction, 'declined')}
                  >
                    Not now
                  </button>
                  <Link
                    href={`/introductions/${introduction.id}`}
                    className="btn-link"
                    style={{ marginLeft: 'auto', alignSelf: 'center' }}
                  >
                    See the full receipt
                  </Link>
                </div>

                <p className="tiny dim" style={{ marginTop: 12 }}>
                  Declining refunds the bond in full. It is recorded as a decline for this sender only, which
                  is what makes repeat cold approaches to the same person get more expensive.
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="card-quiet section">
        <div className="eyebrow">What you did not see</div>
        <p className="small muted" style={{ marginTop: 10 }}>
          The sender’s coaching notes, their agent’s reasoning, their wallet balance, and every introduction
          addressed to anyone else. The first two are private by design; the third is never used as a
          measure of a person; the fourth is simply not addressed to you.
        </p>
      </div>
    </div>
  )
}
