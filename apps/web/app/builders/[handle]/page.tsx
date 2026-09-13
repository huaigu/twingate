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

function fallbackPersona(handle: string): string {
  return handle === 'alice'
    ? '/design/builder-right-reference.png'
    : '/design/builder-left-reference.png'
}

export default function BuilderPage() {
  const params = useParams<{ handle: string }>()
  const handle = typeof params?.handle === 'string' ? params.handle : ''
  const [data, setData] = useState<{ profile: BuilderProfileDto; policy: GatePolicyDto | null } | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(() => {
    if (!handle) return
    setError(null)
    getProfile(handle)
      .then(setData)
      .catch((cause: unknown) => setError(cause instanceof ApiError ? cause : new ApiError(0, 'unknown_error', cause)))
  }, [handle])

  useEffect(load, [load])

  if (error) {
    return (
      <div className="wrap v2-page">
        {error.status === 404 ? (
          <div className="v2-notice"><strong>No builder is registered under @{handle}.</strong><Link href="/builders">Back to builders</Link></div>
        ) : <ApiDown error={error} retry={load} />}
      </div>
    )
  }

  if (!data) {
    return <div className="wrap v2-page"><div className="v2-loading-card"><Loading lines={6} /></div></div>
  }

  const { profile, policy } = data
  const isSelf = profile.handle === DEMO_SENDER_HANDLE
  const personaSrc = profile.persona?.assetUrl ?? fallbackPersona(profile.handle)

  return (
    <div className="wrap v2-page v2-profile-page">
      <Link href="/builders" className="v2-back-link">← Find builders</Link>
      <div className="v2-profile-layout">
        <aside className="v2-profile-persona">
          <div className="v2-profile-persona-image">
            <img src={personaSrc} alt={`${profile.displayName} visual persona`} />
          </div>
          <div className="v2-profile-persona-caption">
            <span>OPTIONAL 3D PERSONA</span>
            <p>{profile.persona?.status === 'ready' ? 'A visual layer for your public profile.' : 'A visual layer — not an identity proof.'}</p>
          </div>
        </aside>

        <div className="v2-profile-content">
          <header className="v2-profile-heading">
            <span className="v2-kicker">YOUR PUBLIC PROFILE</span>
            <div className="v2-profile-name-row">
              <h1>{profile.displayName}</h1>
              <span className="mono tiny dim">@{profile.handle}</span>
            </div>
            <div className="v2-profile-meta"><AvailabilityPill value={profile.availability} /><span className="pill">policy v{profile.policyVersion}</span></div>
            <p className="v2-profile-lede">This is what other builders can learn before they decide whether to send you an introduction.</p>
          </header>

          <section className="v2-public-dossier" aria-labelledby="public-dossier-title">
            <h2 id="public-dossier-title" className="sr-only">Public builder profile</h2>
            <article>
              <span className="v2-dossier-icon">↗</span>
              <div><span className="v2-mini-label">Building</span><p>{profile.building}</p></div>
            </article>
            <article>
              <span className="v2-dossier-icon">+</span>
              <div><span className="v2-mini-label">I can offer</span><p>{profile.canOffer}</p></div>
            </article>
            <article>
              <span className="v2-dossier-icon">✦</span>
              <div><span className="v2-mini-label">I want to meet</span><p>{profile.wantsToMeet}</p></div>
            </article>
            <article>
              <span className="v2-dossier-icon">◎</span>
              <div><span className="v2-mini-label">Open to introductions</span><p>{profile.availability === 'closed' ? 'Not accepting new introductions right now.' : 'A thoughtful request is welcome.'}</p></div>
            </article>
          </section>

          <section className="v2-agent-panel" aria-labelledby="agent-panel-title">
            <div className="v2-agent-panel-head">
              <div>
                <span className="v2-kicker">{isSelf ? 'PRIVATE TO YOU' : 'PUBLISHED POLICY'}</span>
                <h2 id="agent-panel-title">{isSelf ? 'Your Personal Agent' : `${profile.displayName}’s Personal Agent`}</h2>
              </div>
              <span className="v2-lock-badge">⌁ {isSelf ? 'your controls' : 'public summary'}</span>
            </div>
            <p className="v2-agent-panel-lede">{isSelf ? 'It helps people understand how to approach you, while you stay in control of every introduction.' : 'This is the boundary this builder published so an incoming introduction can be evaluated with context.'}</p>
            <div className="v2-agent-policy-grid">
              <div><span className="v2-mini-label">Topics I’ll consider</span><div className="v2-chip-row">{(policy?.topics ?? []).map((topic) => <span className="v2-chip" key={topic}>{topic}</span>)}</div></div>
              <div><span className="v2-mini-label">Desired next step</span><p>{policy?.desiredNextStep ?? 'A thoughtful conversation.'}</p></div>
              <div><span className="v2-mini-label">{isSelf ? 'What my agent may use' : 'What this agent reads'}</span><ul className="v2-agent-list"><li>Public profile and stated interests</li><li>Context you explicitly disclose</li><li>Published availability and policy</li></ul></div>
              <div><span className="v2-mini-label">What it cannot do</span><p>Accept, decline or speak for you without your confirmation.</p></div>
            </div>
            <div className="v2-agent-panel-footer">
              <span>Policy hash <span className="mono">{shortHash(profile.policyHash, 8, 6)}</span> · expires unanswered in {policy ? formatRelative(0, -policy.timeoutSeconds).replace(/^in /, '') : 'a few days'}</span>
              {isSelf ? <Link href="/builders" className="btn btn-ghost">Pick a recipient →</Link> : <Link href={`/introduce/${profile.handle}`} className="btn btn-accent">Start an introduction →</Link>}
            </div>
          </section>

          <p className="v2-profile-footnote">Profile id #{profile.profileId} · registered {formatRelative(profile.createdAt)} · Base attention bond {policy ? formatMon(policy.baseBond) : '—'} MON. Nothing here is a reputation score.</p>
        </div>
      </div>
    </div>
  )
}
