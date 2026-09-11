'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ApiDown, AvailabilityPill, Loading } from '@/components/Bits'
import {
  ApiError,
  DEMO_SENDER_HANDLE,
  getProfile,
  type BuilderProfileDto,
  type GatePolicyDto,
} from '@/lib/api'
import { formatMon, formatRelative, shortHash } from '@/lib/format'

export default function BuilderPage() {
  const params = useParams<{ handle: string }>()
  const handle = typeof params?.handle === 'string' ? params.handle : ''

  const [data, setData] = useState<{ profile: BuilderProfileDto; policy: GatePolicyDto | null } | null>(
    null,
  )
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(() => {
    if (handle.length === 0) return
    setError(null)
    getProfile(handle)
      .then(setData)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause : new ApiError(0, 'unknown_error', cause))
      })
  }, [handle])

  useEffect(load, [load])

  if (error) {
    return (
      <div className="wrap">
        {error.status === 404 ? (
          <div className="notice">
            <div className="strong">No builder is registered under @{handle}.</div>
            <p className="small muted" style={{ marginTop: 6 }}>
              <Link href="/builders" className="btn-link">
                Back to the directory
              </Link>
            </p>
          </div>
        ) : (
          <ApiDown error={error} retry={load} />
        )}
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

  const { profile, policy } = data
  const isSelf = profile.handle === DEMO_SENDER_HANDLE

  return (
    <div className="wrap">
      <Link href="/builders" className="btn-link tiny">
        ← Directory
      </Link>

      <div className="split" style={{ marginTop: 22 }}>
        <div>
          <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
            <div className="persona" style={{ width: 116, height: 116, flex: 'none' }}>
              <div>
                <div className="mono small dim">3D presence</div>
                <div className="tiny dim" style={{ marginTop: 4 }}>
                  {profile.persona?.status === 'ready'
                    ? 'rendered'
                    : profile.persona?.status === 'pending'
                      ? 'rendering…'
                      : 'not generated'}
                </div>
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <h1 className="h2">{profile.displayName}</h1>
              <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <span className="mono small dim">@{profile.handle}</span>
                <AvailabilityPill value={profile.availability} />
                <span className="pill">policy v{profile.policyVersion}</span>
              </div>
              <p className="small muted" style={{ marginTop: 12 }}>
                Profile id #{profile.profileId} · registered {formatRelative(profile.createdAt)} ·{' '}
                <span className="mono">{shortHash(profile.owner, 10, 8)}</span>
              </p>
            </div>
          </div>

          <div className="section">
            <div className="eyebrow">What they are building</div>
            <p className="lede" style={{ marginTop: 10, fontSize: 17 }}>
              {profile.building}
            </p>
          </div>

          <div className="grid-2 section-tight">
            <div className="card">
              <div className="eyebrow">Who they want to meet</div>
              <p style={{ marginTop: 10 }}>{profile.wantsToMeet}</p>
            </div>
            <div className="card">
              <div className="eyebrow">What they can offer</div>
              <p style={{ marginTop: 10 }}>{profile.canOffer}</p>
            </div>
          </div>

          {policy ? (
            <div className="section">
              <div className="eyebrow">The gate policy their agent reads</div>
              <h2 className="h3" style={{ marginTop: 10 }}>
                Published, versioned, and hashed onchain.
              </h2>
              <p className="small muted" style={{ marginTop: 8, maxWidth: '62ch' }}>
                This is not a filter you set for a stranger. It is the standard they agreed to hold
                themselves to, and an evaluation receipt binds the verdict to this exact version — so if
                they change it, past decisions stay explainable.
              </p>

              <div className="card section-tight">
                <div className="stack-sm">
                  <div className="label">
                    <span>Topics they will consider</span>
                    <span className="label-hint">{policy.topics.length} of 12</span>
                  </div>
                  <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                    {policy.topics.map((topic) => (
                      <span className="pill" key={topic}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="divider" style={{ margin: '20px 0' }} />

                <dl className="kv">
                  <dt>Availability</dt>
                  <dd>
                    <AvailabilityPill value={policy.availability} />
                  </dd>
                  <dt>The next step they want</dt>
                  <dd>{policy.desiredNextStep}</dd>
                  <dt>Base attention bond</dt>
                  <dd className="mono">{formatMon(policy.baseBond)} MON</dd>
                  <dt>Open introductions allowed per sender</dt>
                  <dd>{policy.unresolvedLimit}</dd>
                  <dt>Unanswered introductions expire after</dt>
                  <dd>{formatRelative(0, -policy.timeoutSeconds).replace(' ago', '')} — bond refunded</dd>
                </dl>

                <hr className="divider" style={{ margin: '20px 0' }} />

                <div className="tiny dim">
                  Policy hash{' '}
                  <span className="mono" style={{ wordBreak: 'break-all' }}>
                    {profile.policyHash}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="stack">
          <div className="card-raised">
            <div className="eyebrow">Make contact</div>
            {isSelf ? (
              <>
                <p className="small muted" style={{ marginTop: 12 }}>
                  This is the demo sender identity. Open someone else’s profile to write an introduction
                  from @{DEMO_SENDER_HANDLE}.
                </p>
                <Link href="/builders" className="btn btn-ghost btn-block" style={{ marginTop: 16 }}>
                  Pick a recipient
                </Link>
              </>
            ) : (
              <>
                <p className="small muted" style={{ marginTop: 12 }}>
                  You will write four short answers, optionally disclose verified context, and see the exact
                  fee and bond before anything is locked.
                </p>
                <Link
                  href={`/introduce/${profile.handle}`}
                  className="btn btn-block"
                  style={{ marginTop: 16 }}
                >
                  Write an introduction
                </Link>
                <p className="tiny dim" style={{ marginTop: 12 }}>
                  Sending as @{DEMO_SENDER_HANDLE}. Nothing is signed onchain in this build — the quote and
                  the escrow split are computed by the same code the contract uses.
                </p>
              </>
            )}
          </div>

          <div className="card-quiet">
            <div className="eyebrow">What they will see</div>
            <ul className="bullets" style={{ marginTop: 12 }}>
              <li>A three-line summary of your card.</li>
              <li>Why your request touches their published topics.</li>
              <li>Any verified context you chose to disclose — explained, not scored.</li>
              <li>A suggested opening question they can ignore.</li>
            </ul>
            <p className="tiny dim" style={{ marginTop: 14 }}>
              They never see your agent’s notes, your private reasoning, or your wallet balance as a
              measure of your worth.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
