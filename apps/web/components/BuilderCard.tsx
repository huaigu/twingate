'use client'

import Link from 'next/link'
import type { BuilderProfileDto } from '@/lib/api'
import { AvailabilityPill } from './Bits'

/**
 * The persona slot is deliberately visible even when empty. 3D presence is an
 * asynchronous decoration on top of a profile that is already complete — the
 * placeholder says so rather than pretending the render exists.
 */
function PersonaSlot({ persona }: { readonly persona: BuilderProfileDto['persona'] }) {
  const status = persona?.status ?? 'none'
  return (
    <div className="persona persona-sm" title={`3D presence: ${status}`}>
      <span className="mono tiny dim">
        {status === 'ready' ? '3D' : status === 'pending' ? '…' : '—'}
      </span>
    </div>
  )
}

export function BuilderCard({ profile }: { readonly profile: BuilderProfileDto }) {
  return (
    <Link href={`/builders/${profile.handle}`} className="card card-link">
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <PersonaSlot persona={profile.persona} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row-between">
            <div className="h3">{profile.displayName}</div>
            <span className="mono tiny dim">@{profile.handle}</span>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {profile.building}
          </p>
          <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
            <AvailabilityPill value={profile.availability} />
            <span className="pill">policy v{profile.policyVersion}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
