'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BuilderCard } from '@/components/BuilderCard'
import { ApiDown, Loading } from '@/components/Bits'
import { ApiError, getProfiles, type BuilderProfileDto } from '@/lib/api'

const DEFAULT_PROMPT = 'builders working on developer tools and infrastructure on Monad'

function recommendationReason(profile: BuilderProfileDto, prompt: string): string {
  const text = prompt.toLowerCase()
  const reasons: string[] = []
  if (text.includes('tool') || text.includes('developer')) reasons.push('shared focus on developer tools')
  if (text.includes('infra') || text.includes('pipeline')) reasons.push('complementary infrastructure skills')
  if (profile.availability === 'open') reasons.push('open to introductions')
  if (reasons.length === 0) reasons.push('their public profile matches your stated goal')
  return reasons.slice(0, 2).join(' · ')
}

function scoreProfile(profile: BuilderProfileDto, prompt: string): number {
  const haystack = `${profile.building} ${profile.wantsToMeet} ${profile.canOffer}`.toLowerCase()
  const terms = prompt.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return terms.reduce(
    (score, term) => score + (haystack.includes(term) ? 2 : 0),
    profile.availability === 'open' ? 1 : 0,
  )
}

function AgentSuggestion({ profile, prompt }: { profile: BuilderProfileDto; prompt: string }) {
  return (
    <article className="v2-suggestion-card">
      <div className="v2-suggestion-avatar">
        <img
          src={profile.handle === 'alice' ? '/design/builder-right-reference.png' : '/design/builder-left-reference.png'}
          alt=""
        />
      </div>
      <div className="v2-suggestion-copy">
        <div className="v2-suggestion-name">
          <h3>{profile.displayName}</h3>
          <span className="pill" data-tone="accent">suggested</span>
        </div>
        <p className="v2-suggestion-building">{profile.building}</p>
        <div className="v2-match-note">
          <span>Why this match</span>
          <p>{recommendationReason(profile, prompt)}</p>
        </div>
        <p className="v2-suggestion-boundary">Nothing is sent without your say-so.</p>
      </div>
      <Link className="btn btn-ghost v2-suggestion-cta" href={`/builders/${profile.handle}`}>
        View profile <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

export default function BuildersPage() {
  const [profiles, setProfiles] = useState<BuilderProfileDto[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [agentAsked, setAgentAsked] = useState(false)

  const load = useCallback(() => {
    setError(null)
    getProfiles()
      .then(setProfiles)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause : new ApiError(0, 'unknown_error', cause))
      })
  }, [])

  useEffect(load, [load])

  const recommendations = useMemo(() => {
    if (!profiles) return []
    return [...profiles].sort((a, b) => scoreProfile(b, prompt) - scoreProfile(a, prompt)).slice(0, 3)
  }, [profiles, prompt])

  if (error) {
    return (
      <div className="wrap v2-page">
        <ApiDown error={error} retry={load} />
      </div>
    )
  }

  if (profiles === null) {
    return (
      <div className="wrap v2-page">
        <div className="v2-loading-card"><Loading lines={5} /></div>
      </div>
    )
  }

  return (
    <div className="wrap v2-page v2-builders-page">
      <section className="v2-page-intro">
        <div>
          <span className="v2-kicker">DISCOVERY / PERSONAL AGENT</span>
          <h1>Find the right people.</h1>
          <p>
            Your Personal Agent can surface a few builders from public profiles and explain why they may
            be worth your time. You choose who to meet.
          </p>
        </div>
        <div className="v2-agent-prompt">
          <div className="v2-agent-prompt-head">
            <span className="v2-agent-orb">✦</span>
            <div>
              <strong>My Personal Agent</strong>
              <span>suggestion mode</span>
            </div>
          </div>
          <label htmlFor="builder-intent">What are you looking for?</label>
          <textarea
            id="builder-intent"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
          />
          <div className="v2-agent-prompt-foot">
            <span>Public profiles only · no contact sent</span>
            <button type="button" className="btn btn-accent" onClick={() => setAgentAsked(true)}>
              {agentAsked ? 'Refresh suggestions' : 'Ask my agent'} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {agentAsked ? (
        <section className="v2-suggestions" aria-labelledby="suggested-title">
          <div className="v2-section-heading">
            <div>
              <span className="v2-kicker">A SHORTLIST, NOT A DECISION</span>
              <h2 id="suggested-title">Suggested for you</h2>
            </div>
            <span className="v2-section-note">Based on public profiles · {recommendations.length} suggestions</span>
          </div>
          <div className="v2-suggestion-list">
            {recommendations.length > 0
              ? recommendations.map((profile) => <AgentSuggestion key={profile.handle} profile={profile} prompt={prompt} />)
              : <div className="v2-empty-card">Your agent needs a little more detail to make a useful suggestion.</div>}
          </div>
        </section>
      ) : null}

      <section className="v2-directory" aria-labelledby="directory-title">
        <div className="v2-section-heading">
          <div>
            <span className="v2-kicker">BROWSE ON YOUR OWN TERMS</span>
            <h2 id="directory-title">Browse all builders</h2>
          </div>
          <span className="v2-section-note">Every card starts with what someone is building.</span>
        </div>
        <div className="v2-builder-grid">
          {profiles.map((profile) => <BuilderCard key={profile.handle} profile={profile} />)}
        </div>
      </section>
    </div>
  )
}
