'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import { CANDIDATES_CATALOG, type DiscoveryGoal } from '@/lib/v3-data'
import styles from '@/app/v3.module.css'

export default function NewIntroductionPage({
  params,
}: {
  params: Promise<{ candidateId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { profile, createOrUpdateDraft, addToast } = useV3Demo()

  const candidate =
    CANDIDATES_CATALOG.find((c) => c.id === resolvedParams.candidateId) ??
    CANDIDATES_CATALOG[0]!

  const [selectedGoal, setSelectedGoal] = useState<DiscoveryGoal>('chat')
  const [personalNote, setPersonalNote] = useState(
    `Hi ${candidate.name}, I've been following your work and really appreciate your perspective on open infrastructure.`
  )
  const [exploreTopic, setExploreTopic] = useState(
    `I'd love to hear more about your experience building on Monad and where you see the ecosystem going.`
  )
  const [canOffer, setCanOffer] = useState(
    `I work on developer tools and can share some lessons from our recent build.`
  )
  const [openingQuestion, setOpeningQuestion] = useState(
    `Would you be open to a 20 minute chat about community tools and onboarding?`
  )
  const [showVerifiedContext, setShowVerifiedContext] = useState(true)

  function handleProceedToConfirm() {
    const newId = createOrUpdateDraft(
      candidate.id,
      {
        personalNote,
        exploreTopics: exploreTopic,
        whatIOffer: canOffer,
        specificQuestions: openingQuestion,
      },
      selectedGoal
    )

    addToast('Introduction draft created. Proceeding to confirmation.', 'info')
    router.push(`/introductions/${newId}/confirm`)
  }

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container1672}>
        {/* Header & Stepper */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.serifTitle} style={{ fontSize: '3.25rem', marginBottom: '0.25rem' }}>
              A better{' '}
              <span className={styles.orangeBrushWrapper}>
                first hello
              </span>
            </h1>
            <p className={styles.leadText} style={{ fontSize: '1.15rem' }}>
              Thoughtful introductions for conversation, collaboration and learning.
            </p>
          </div>

          {/* Stepper: (1) Choose -> (2) Draft -> (3) Confirm */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e1b4b' }}>
              <span style={{ width: 26, height: 26, borderRadius: 9999, background: '#2528ab', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              <span>Choose</span>
            </div>
            <span style={{ color: '#cbd5e1' }}>&mdash;</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#2528ab' }}>
              <span style={{ width: 26, height: 26, borderRadius: 9999, border: '2px solid #2528ab', color: '#2528ab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              <span style={{ background: '#ede9fe', padding: '0.2rem 0.6rem', borderRadius: 9999 }}>Draft</span>
            </div>
            <span style={{ color: '#cbd5e1' }}>&mdash;</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>
              <span style={{ width: 26, height: 26, borderRadius: 9999, border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
              <span>Confirm</span>
            </div>
          </div>
        </div>

        {/* 4-Column Grid */}
        <div className={styles.composerGrid1672}>
          {/* Left Column: Alex Standing with Notebook & My Personal Agent Note */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/p5_alex_with_note.png"
              alt="My Personal Agent. Alex standing with notebook"
              style={{ width: '100%', maxWidth: 268, objectFit: 'contain' }}
            />
          </div>

          {/* Center Left Card: My Personal Agent Form */}
          <div className={styles.paperTablet}>
            <div className={styles.tabletHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="7.5" cy="12" r="5.5" fill="#4338ca" />
                  <circle cx="16.5" cy="12" r="5.5" fill="#6e5bf0" fillOpacity="0.9" />
                </svg>
                <h2 className={styles.tabletTitle} style={{ fontSize: '1.4rem', margin: 0 }}>My Personal Agent</h2>
              </div>
              <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 9999 }}>
                ✦ Suggested, not sent
              </span>
            </div>

            <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.45 }}>
              I&apos;ve drafted a thoughtful introduction based on your goal and what we know about both of you. Feel free to edit anything before sending.
            </p>

            {/* Goal Selector (Chat, Collaborate, Learn) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.5rem' }}>
                What&apos;s your goal for this introduction?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedGoal('chat')}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: 10,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: selectedGoal === 'chat' ? '#ede9fe' : '#fdfbf7',
                    border: selectedGoal === 'chat' ? '2px solid #6366f1' : '1px solid #e2ddd3',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e1b4b' }}>💬 Chat</strong>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Have a thoughtful conversation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGoal('collaborate')}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: 10,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: selectedGoal === 'collaborate' ? '#ede9fe' : '#fdfbf7',
                    border: selectedGoal === 'collaborate' ? '2px solid #6366f1' : '1px solid #e2ddd3',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e1b4b' }}>👥 Collaborate</strong>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Explore working together</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGoal('learn')}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: 10,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: selectedGoal === 'learn' ? '#ede9fe' : '#fdfbf7',
                    border: selectedGoal === 'learn' ? '2px solid #6366f1' : '1px solid #e2ddd3',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e1b4b' }}>📖 Learn</strong>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Ask questions and learn from them</span>
                </button>
              </div>
            </div>

            {/* 4 Numbered Editable Rows styled as 2-column cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem' }}>1. Add a personal note</span>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <textarea
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    rows={2}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.8rem', color: '#334155', resize: 'none', fontFamily: 'inherit' }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>✏️</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem' }}>2. What do you want to explore?</span>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <textarea
                    value={exploreTopic}
                    onChange={(e) => setExploreTopic(e.target.value)}
                    rows={2}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.8rem', color: '#334155', resize: 'none', fontFamily: 'inherit' }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>✏️</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem' }}>3. What can you bring to the conversation?</span>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <textarea
                    value={canOffer}
                    onChange={(e) => setCanOffer(e.target.value)}
                    rows={2}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.8rem', color: '#334155', resize: 'none', fontFamily: 'inherit' }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>✏️</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem' }}>4. Any specific questions or topics?</span>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <textarea
                    value={openingQuestion}
                    onChange={(e) => setOpeningQuestion(e.target.value)}
                    rows={2}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.8rem', color: '#334155', resize: 'none', fontFamily: 'inherit' }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>✏️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Right Card: INTRODUCTION CARD Preview */}
          <div className={styles.paperTablet} style={{ position: 'relative' }}>
            <div className={styles.tabletHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="7.5" cy="12" r="5.5" fill="#4338ca" />
                  <circle cx="16.5" cy="12" r="5.5" fill="#6e5bf0" fillOpacity="0.9" />
                </svg>
                <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.15rem' }}>SignalPass</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>
                INTRODUCTION CARD
              </span>
            </div>

            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1.25rem', textAlign: 'center' }}>
              Two curious people.{' '}
              <span style={{ textDecoration: 'underline', textDecorationColor: '#f59e0b', textDecorationThickness: '3px' }}>
                A thoughtful starting point.
              </span>
            </h3>

            {/* Overlapping Venn Diagram */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1.5rem 0', position: 'relative' }}>
              {/* Left Persona: You */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatarUrl || '/design/avatars/alex.png'}
                  alt="You"
                  style={{ width: 80, height: 80, borderRadius: 9999, background: '#bae6fd', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.35rem' }}>You</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BUILDER ON MONAD</span>
              </div>

              {/* Venn Center Lens */}
              <div
                style={{
                  margin: '0 -20px',
                  zIndex: 2,
                  background: '#f5f3ff',
                  border: '1.5px dashed #818cf8',
                  borderRadius: 16,
                  padding: '0.5rem 0.85rem',
                  textAlign: 'center',
                  maxWidth: 160,
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)',
                }}
              >
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>
                  ✦ SHARED CURIOSITY
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e1b4b', lineHeight: 1.25, display: 'block', marginTop: '0.2rem' }}>
                  Open infrastructure for more people
                </span>
              </div>

              {/* Right Persona: Candidate */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidate.avatarUrl}
                  alt={candidate.name}
                  style={{ width: 80, height: 80, borderRadius: 9999, background: '#ede9fe', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.35rem' }}>{candidate.name}</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BUILDER ON MONAD</span>
              </div>
            </div>

            {/* Comparison Table: YOU CAN OFFER vs THEY CAN OFFER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  YOU CAN OFFER
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>📦</span> <span>Developer tools experience</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>👥</span> <span>Community perspective</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>📄</span> <span>Lessons from recent builds</span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  THEY CAN OFFER
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>💡</span> <span>Deep experience with Monad</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>📖</span> <span>Insights on ecosystem growth</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>👥</span> <span>Introductions to relevant builders</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Verified Context Green Banner */}
            {showVerifiedContext && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: '#16a34a', fontSize: '1.1rem' }}>✓</span>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'block' }}>OPTIONAL VERIFIED CONTEXT</span>
                    <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
                      You both have publicly available work on Monad. This helps build trust.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerifiedContext(false)}
                  style={{ background: 'none', border: 'none', color: '#166534', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hide context
                </button>
              </div>
            )}

            {/* Action Button: Approve and send */}
            <button
              type="button"
              onClick={handleProceedToConfirm}
              className={styles.btnPrimaryBlue}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginBottom: '0.5rem' }}
            >
              Approve and send &rarr;
            </button>
            <span style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', display: 'block', marginBottom: '1.25rem' }}>
              You approve before anything is shared
            </span>

            {/* Fees Bottom Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>💳</span> <span>Evaluation fee (0.005 MON) ℹ️</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🛡️</span> <span>Refundable attention bond (0.05 MON) ℹ️</span>
              </div>
            </div>
          </div>

          {/* Right Column: Collage Scraps & Notes matching 05-introduction-composer.png */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/p5_right_collage.png"
              alt="You approve before anything is shared. Higher signal brighter builders on Monad."
              style={{ width: '100%', maxWidth: 237, objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
