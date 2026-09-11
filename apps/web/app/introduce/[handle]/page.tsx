'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiDown, AvailabilityPill, Loading, QuotePanel } from '@/components/Bits'
import {
  ApiError,
  DEMO_SENDER_HANDLE,
  evaluateIntroduction,
  getProfile,
  getProfiles,
  getQuote,
  submitIntroduction,
  type BuilderProfileDto,
  type DisclosedSignalDto,
  type GatePolicyDto,
  type IntroductionIntentDto,
  type QuoteDto,
} from '@/lib/api'

const FIELDS = [
  {
    key: 'whoAmI',
    label: 'Who I am',
    hint: 'One or two sentences. Not a CV — the thing you would say first.',
    limit: 600,
    placeholder: 'I build a deterministic simulation harness for Monad contracts…',
  },
  {
    key: 'whyYou',
    label: 'Why you specifically',
    hint: 'The hardest one, and the one that decides this. Name something only they could have done.',
    limit: 600,
    placeholder: 'You wrote the event pipeline I keep going back to…',
  },
  {
    key: 'whatIOffer',
    label: 'What I can offer',
    hint: 'Concrete. What will they actually get out of thirty minutes?',
    limit: 600,
    placeholder: 'Simulation tooling, and honest feedback on protocol design…',
  },
  {
    key: 'nextStep',
    label: 'What I want next',
    hint: 'Small commitments are easier to accept than vague ones.',
    limit: 300,
    placeholder: 'A 20-minute call, or a written exchange if async is easier.',
  },
] as const

const DISCLOSURES: readonly { kind: DisclosedSignalDto['kind']; label: string; detail: string }[] = [
  {
    kind: 'monad_activity',
    label: 'Onchain activity on Monad',
    detail: 'Shown as “active on Monad”. Never as a balance, and never as a score.',
  },
  {
    kind: 'deployed_contract',
    label: 'A contract I deployed',
    detail: 'Shown as “has shipped to Monad”. It does not imply the recipient should care.',
  },
  {
    kind: 'ecosystem_membership',
    label: 'A Monad ecosystem programme',
    detail: 'Shown as a membership. Useful context, not a credential gate.',
  },
]

const EMPTY_INTENT: IntroductionIntentDto = { whoAmI: '', whyYou: '', whatIOffer: '', nextStep: '' }

export default function IntroducePage() {
  const params = useParams<{ handle: string }>()
  const router = useRouter()
  const recipientHandle = typeof params?.handle === 'string' ? params.handle : ''

  const [recipient, setRecipient] = useState<{ profile: BuilderProfileDto; policy: GatePolicyDto | null } | null>(
    null,
  )
  const [senderAddress, setSenderAddress] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<ApiError | null>(null)

  const [intent, setIntent] = useState<IntroductionIntentDto>(EMPTY_INTENT)
  const [attachments, setAttachments] = useState(0)
  const [disclosed, setDisclosed] = useState<DisclosedSignalDto['kind'][]>([])
  const [quote, setQuote] = useState<QuoteDto | null>(null)
  const [quotePending, setQuotePending] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ---- load the recipient and resolve the demo sender's address ---- */

  const load = useCallback(() => {
    if (recipientHandle.length === 0) return
    setLoadError(null)
    Promise.all([getProfile(recipientHandle), getProfiles()])
      .then(([target, profiles]) => {
        setRecipient(target)
        const sender =
          profiles.find((profile) => profile.handle === DEMO_SENDER_HANDLE) ??
          profiles.find((profile) => profile.handle !== recipientHandle)
        setSenderAddress(sender?.owner ?? null)
      })
      .catch((cause: unknown) => {
        setLoadError(cause instanceof ApiError ? cause : new ApiError(0, 'unknown_error', cause))
      })
  }, [recipientHandle])

  useEffect(load, [load])

  /* ---- live quote ---- */

  const contextChars = useMemo(() => Object.values(intent).join(' ').length, [intent])

  useEffect(() => {
    if (!senderAddress || recipientHandle.length === 0) return

    if (quoteTimer.current) clearTimeout(quoteTimer.current)
    setQuotePending(true)

    quoteTimer.current = setTimeout(() => {
      getQuote({ sender: senderAddress, recipientHandle, contextChars, attachmentCount: attachments })
        .then((next) => {
          setQuote(next)
          setQuoteError(null)
        })
        .catch((cause: unknown) => {
          const error = cause instanceof ApiError ? cause : null
          setQuote(null)
          if (error?.status === 409) {
            setQuoteError(
              typeof error.detail === 'object' && error.detail !== null && 'message' in error.detail
                ? String((error.detail as { message: unknown }).message)
                : 'This recipient is not accepting another introduction from you right now.',
            )
          } else if (error) {
            setQuoteError('Could not compute a quote.')
          }
        })
        .finally(() => setQuotePending(false))
    }, 350)

    return () => {
      if (quoteTimer.current) clearTimeout(quoteTimer.current)
    }
  }, [senderAddress, recipientHandle, contextChars, attachments])

  /* ---- submit ---- */

  const filled = FIELDS.every((field) => intent[field.key].trim().length > 0)
  const canSubmit = filled && quote !== null && senderAddress !== null && !submitting

  function toggleDisclosure(kind: DisclosedSignalDto['kind']) {
    setDisclosed((current) =>
      current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind],
    )
  }

  async function handleSubmit() {
    if (!senderAddress) return
    setSubmitting(true)
    setSubmitError(null)

    const consentedAt = Math.floor(Date.now() / 1000)
    const signals: DisclosedSignalDto[] = disclosed.map((kind) => ({
      kind,
      label: DISCLOSURES.find((d) => d.kind === kind)?.label ?? kind,
      evidenceUrl: null,
      consentedAt,
    }))

    try {
      const created = await submitIntroduction({
        sender: senderAddress,
        recipientHandle,
        intent,
        disclosedSignals: signals,
        attachmentCount: attachments,
      })

      // Funds are locked, so the bilateral evaluation runs immediately: the
      // sender should not have to press a second button to learn the verdict.
      await evaluateIntroduction(created.id)
      router.push(`/introductions/${created.id}`)
    } catch (cause) {
      const error = cause instanceof ApiError ? cause : null
      if (error?.status === 409) {
        setSubmitError(
          typeof error.detail === 'object' && error.detail !== null && 'message' in error.detail
            ? String((error.detail as { message: unknown }).message)
            : 'The recipient would not accept this request right now.',
        )
      } else {
        setSubmitError('The introduction could not be locked. The API did not accept it.')
      }
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <div className="wrap">
        <ApiDown error={loadError} retry={load} />
      </div>
    )
  }

  if (!recipient) {
    return (
      <div className="wrap">
        <div className="card">
          <Loading lines={5} />
        </div>
      </div>
    )
  }

  const policy = recipient.policy

  return (
    <div className="wrap">
      <Link href={`/builders/${recipientHandle}`} className="btn-link tiny">
        ← @{recipientHandle}
      </Link>

      <div className="row" style={{ gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <div className="eyebrow">Introduction to @{recipient.profile.displayName}</div>
        {policy ? <AvailabilityPill value={policy.availability} /> : null}
        <span className="pill">policy v{recipient.profile.policyVersion}</span>
      </div>

      <h1 className="h2" style={{ marginTop: 12, maxWidth: '26ch' }}>
        Four answers. Then the hard part is out of your hands.
      </h1>

      <div className="split" style={{ marginTop: 28 }}>
        <div className="stack">
          {policy ? (
            <div className="card-quiet">
              <div className="row-between">
                <span className="small strong">They published that they will consider</span>
                <span className="tiny dim">{policy.topics.length} topics</span>
              </div>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {policy.topics.map((topic) => (
                  <span className="pill" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
              <p className="tiny dim" style={{ marginTop: 12 }}>
                Wanted step: {policy.desiredNextStep}
              </p>
            </div>
          ) : null}

          <div className="intro-card">
            <div className="intro-card-head">
              <div>
                <div className="eyebrow">The introduction card</div>
                <div className="small dim" style={{ marginTop: 2 }}>
                  {contextChars} characters · evaluated once, by both sides
                </div>
              </div>
              <span className="pill" data-tone={filled ? 'bond' : 'fee'}>
                <span className="pill-dot" />
                {filled ? 'ready to lock' : 'incomplete'}
              </span>
            </div>

            <div className="intro-card-body" style={{ paddingTop: 18 }}>
              <div className="stack">
                {FIELDS.map((field, index) => {
                  const value = intent[field.key]
                  const over = value.length > field.limit
                  return (
                    <div className="field" key={field.key}>
                      <label className="label" htmlFor={field.key}>
                        <span>
                          <span className="intro-q-num">{String(index + 1).padStart(2, '0')}</span>{' '}
                          {field.label}
                        </span>
                        <span className="label-hint" style={over ? { color: 'var(--danger)' } : undefined}>
                          {value.length}/{field.limit}
                        </span>
                      </label>
                      <textarea
                        id={field.key}
                        className="textarea"
                        rows={field.key === 'nextStep' ? 2 : 3}
                        maxLength={field.limit}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(event) =>
                          setIntent((current) => ({ ...current, [field.key]: event.target.value }))
                        }
                      />
                      <span className="tiny dim">{field.hint}</span>
                    </div>
                  )
                })}

                <div className="field">
                  <label className="label" htmlFor="attachments">
                    <span>Attachments</span>
                    <span className="label-hint">each one costs extra — send none unless it is load-bearing</span>
                  </label>
                  <select
                    id="attachments"
                    className="input"
                    value={attachments}
                    onChange={(event) => setAttachments(Number(event.target.value))}
                  >
                    {[0, 1, 2, 3, 4, 5].map((count) => (
                      <option key={count} value={count}>
                        {count === 0 ? 'None' : `${count} document${count > 1 ? 's' : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="eyebrow">Verified context — opt in, per introduction</div>
            <h2 className="h3" style={{ marginTop: 10, fontSize: 16 }}>
              Disclose only what helps them say yes.
            </h2>
            <p className="small muted" style={{ marginTop: 8 }}>
              These are the only signals SignalPass will ever forward, and only when you tick them. They are
              explained to the recipient as context — never converted into a score, and never the reason a
              request is accepted.
            </p>

            <div className="stack-sm" style={{ marginTop: 18 }}>
              {DISCLOSURES.map((item) => {
                const checked = disclosed.includes(item.kind)
                return (
                  <label className="check" key={item.kind}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDisclosure(item.kind)}
                    />
                    <span>
                      <span className="small strong">{item.label}</span>
                      <span className="tiny dim" style={{ display: 'block', marginTop: 2 }}>
                        {item.detail}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>

            <p className="tiny dim" style={{ marginTop: 12 }}>
              Evidence links and third-party verification are not wired up in this build. The consent
              record — which signal, when it was agreed — is already part of the payload that gets hashed.
            </p>
          </div>

          {submitError ? (
            <div className="notice" data-tone="danger">
              <div className="strong">{submitError}</div>
              <p className="small muted" style={{ marginTop: 6 }}>
                Nothing was locked and nothing was charged.
              </p>
            </div>
          ) : null}
        </div>

        <div className="stack">
          <div className="quote">
            <QuotePanel quote={quote} pending={quotePending} />

            {quoteError ? (
              <div className="notice section-tight" data-tone="danger">
                <div className="small strong">Cannot send this right now</div>
                <p className="small muted" style={{ marginTop: 6 }}>
                  {quoteError}
                </p>
                <p className="tiny dim" style={{ marginTop: 8 }}>
                  The limit is per sender and per recipient, and it exists so one person cannot park
                  indefinitely in someone else’s queue.
                </p>
              </div>
            ) : null}

            <div className="card section-tight">
              <button
                type="button"
                className="btn btn-block"
                disabled={!canSubmit || quoteError !== null}
                onClick={handleSubmit}
              >
                {submitting ? <span className="spin" /> : null}
                {submitting ? 'Locking and evaluating…' : 'Lock the introduction'}
              </button>
              <p className="tiny dim" style={{ marginTop: 12 }}>
                Locking splits the fee and the bond in one transaction, then both agents read the card. This
                build simulates the split and runs the mock evaluator; the same state machine runs onchain.
              </p>
            </div>

            <div className="card-quiet section-tight">
              <div className="eyebrow">Then what</div>
              <ol className="bullets" style={{ marginTop: 12 }}>
                <li>Both agents read it — one per side.</li>
                <li>It lands in their private queue, or comes back to you for one more detail.</li>
                <li>They accept or decline. The bond returns to you either way.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
