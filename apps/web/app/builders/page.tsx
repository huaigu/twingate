'use client'

import { useCallback, useEffect, useState } from 'react'
import { BuilderCard } from '@/components/BuilderCard'
import { ApiDown, Loading } from '@/components/Bits'
import { ApiError, getProfiles, type BuilderProfileDto } from '@/lib/api'

export default function BuildersPage() {
  const [profiles, setProfiles] = useState<BuilderProfileDto[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(() => {
    setError(null)
    getProfiles()
      .then(setProfiles)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause : new ApiError(0, 'unknown_error', cause))
      })
  }, [])

  useEffect(load, [load])

  return (
    <div className="wrap">
      <div className="eyebrow">Directory</div>
      <h1 className="h2" style={{ marginTop: 12 }}>
        Builders who have published what they want to be asked about.
      </h1>
      <p className="lede" style={{ marginTop: 14 }}>
        Every profile here carries a gate policy: the topics they will consider, how available they are
        right now, and the step they would actually take next. You cannot send an introduction without
        reading it first — the composer shows it back to you on the same screen.
      </p>

      <div className="section-tight">
        {error ? (
          <ApiDown error={error} retry={load} />
        ) : profiles === null ? (
          <div className="grid-2">
            <div className="card">
              <Loading lines={3} />
            </div>
            <div className="card">
              <Loading lines={3} />
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="card-quiet">No profiles are registered yet.</div>
        ) : (
          <div className="grid-2">
            {profiles.map((profile) => (
              <BuilderCard key={profile.handle} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
