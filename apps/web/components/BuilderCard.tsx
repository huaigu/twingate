'use client'

import Link from 'next/link'
import type { BuilderProfileDto } from '@/lib/api'
import { AvailabilityPill } from './Bits'

function fallbackPersona(handle: string): string {
  return handle === 'alice'
    ? '/design/builder-right-reference.png'
    : '/design/builder-left-reference.png'
}

export function BuilderCard({ profile }: { readonly profile: BuilderProfileDto }) {
  const personaSrc = profile.persona?.assetUrl ?? fallbackPersona(profile.handle)
  return (
    <Link href={`/builders/${profile.handle}`} className="v2-builder-card">
      <div className="v2-builder-card-top">
        <div className="v2-builder-avatar">
          <img src={personaSrc} alt="" />
        </div>
        <div className="v2-builder-card-identity">
          <div className="v2-builder-card-name">
            <span>{profile.displayName}</span>
            <span className="mono tiny dim">@{profile.handle}</span>
          </div>
          <p>{profile.building}</p>
        </div>
        <span className="v2-arrow" aria-hidden="true">↗</span>
      </div>
      <div className="v2-builder-card-section">
        <span className="v2-mini-label">I can offer</span>
        <p>{profile.canOffer}</p>
      </div>
      <div className="v2-builder-card-section">
        <span className="v2-mini-label">I want to meet</span>
        <p>{profile.wantsToMeet}</p>
      </div>
      <div className="v2-builder-card-footer">
        <AvailabilityPill value={profile.availability} />
        <span className="pill">policy v{profile.policyVersion}</span>
        <span className="v2-view-profile">View profile <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  )
}
