'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useV3Demo } from '@/lib/v3-context'
import { CANDIDATES_CATALOG, type Candidate } from '@/lib/v3-data'
import styles from '@/app/v3.module.css'

const DEFAULT_CANDIDATE: Candidate = CANDIDATES_CATALOG[0]!

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { createOrUpdateDraft, addToast } = useV3Demo()

  const candidateId = (Array.isArray(params?.candidateId) ? params.candidateId[0] : params?.candidateId) ?? 'maya'
  const candidate: Candidate = CANDIDATES_CATALOG.find((c) => c.id === candidateId) ?? DEFAULT_CANDIDATE

  function handleProceedToDraft() {
    const introId = createOrUpdateDraft(candidate.id, {}, 'collaborate')
    addToast(`Personal Agent drafting introduction to ${candidate.name}...`, 'info')
    router.push(`/introductions/new/${candidate.id}`)
  }

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container} style={{ maxWidth: '880px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/discover" style={{ fontSize: '0.875rem', color: '#6e5bf0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Discover
          </Link>
        </div>

        {/* Candidate Detail Tablet */}
        <div className={styles.paperTablet} style={{ marginBottom: '1.5rem' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <img
              src={candidate.avatarUrl}
              alt=""
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                background: '#ede9fe',
                border: '3px solid #ddd6fe',
                boxShadow: '0 4px 14px rgba(110, 91, 240, 0.15)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h1 className={styles.serifTitle} style={{ fontSize: '2rem', margin: 0 }}>
                  {candidate.name}
                </h1>
                <span className={styles.badgeSuggested}>Open to introductions</span>
              </div>
              <p style={{ fontSize: '1.05rem', color: '#555048', margin: '0.25rem 0 0.75rem 0', fontWeight: 500 }}>
                {candidate.role}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {candidate.tags.map((tag) => (
                  <span key={tag} className={styles.smallTag} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Body details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid #ede8de', paddingTop: '1.25rem' }}>
            {/* What they are building */}
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6e5bf0' }}>
                Current focus
              </span>
              <p style={{ fontSize: '1rem', color: '#121016', marginTop: '0.35rem', lineHeight: 1.5 }}>
                {candidate.building}
              </p>
            </div>

            {/* Why this match was suggested */}
            <div style={{ background: '#f8f6f0', padding: '1rem', borderRadius: '10px', border: '1px solid #ded8cc' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#121016' }}>
                Why your agent suggested {candidate.name}:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: '#4b463e' }}>
                <div>🌱 <strong>Shared curiosity:</strong> {candidate.sharedCuriosity}</div>
                <div>🧩 <strong>Complementary practice:</strong> {candidate.complementaryPractice}</div>
                {candidate.verifiedContext && (
                  <div>🛡 <strong>Verified context:</strong> {candidate.verifiedContext}</div>
                )}
              </div>
            </div>

            {/* Can offer and wants to meet lists */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#166534' }}>
                  What {candidate.name} can offer
                </span>
                <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
                  {candidate.canOfferList.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1e40af' }}>
                  Who {candidate.name} wants to meet
                </span>
                <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
                  {candidate.wantsToMeetList.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Boundary Notice Card: Nothing has been sent */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '1.5rem',
          }}
        >
          <span style={{ fontSize: '1.35rem' }}>⚠️</span>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9375rem', fontWeight: 700, color: '#92400e' }}>
              Nothing has been sent yet
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#78350f', lineHeight: 1.45 }}>
              SignalPass personal agents never auto-contact anyone. Clicking below simply instructs your Personal Agent to draft an editable introduction card based on your mutual context.
            </p>
          </div>
        </div>

        {/* Action Button Row */}
        <div className={styles.buttonRow} style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => router.push('/discover')}
          >
            ← Choose someone else
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleProceedToDraft}
          >
            Draft Introduction with Agent →
          </button>
        </div>
      </div>
    </div>
  )
}
