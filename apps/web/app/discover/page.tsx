'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import type { DiscoveryGoal } from '@/lib/v3-data'
import styles from '@/app/v3.module.css'

export default function DiscoverPage() {
  const router = useRouter()
  const { filteredCandidates, searchQuery, setSearchQuery, selectedGoal, setSelectedGoal } = useV3Demo()
  const [localQuery, setLocalQuery] = useState(searchQuery)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchQuery(localQuery)
  }

  function handleGoalClick(goal: DiscoveryGoal) {
    setSelectedGoal(goal)
  }

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container1672}>
        <div className={styles.discoverGrid1672}>
          {/* Left Column: People worth knowing title & Alex Sitting 3D Scene */}
          <div className={styles.discoverLeftCol}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/p3_left_art_448.png"
              alt="People worth knowing - Different backgrounds. Shared curiosity. A more open internet."
              style={{ width: '100%', maxWidth: 448, objectFit: 'contain' }}
            />
          </div>

          {/* Center Column: Query Bar, Curated Candidates, Privacy Guarantee Bar */}
          <div>
            {/* Top Paper Tablet: I'm curious about... */}
            <div className={styles.paperTablet} style={{ marginBottom: '2rem' }}>
              <h2 className={styles.tabletTitle} style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
                I&apos;m{' '}
                <span className={styles.orangeBrushWrapper}>
                  curious
                </span>{' '}
                about...
              </h2>

              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="e.g. finding a design partner, learning about zk, or meeting creators..."
                  className={styles.inputField}
                  style={{ width: '100%', padding: '0.85rem 1.25rem', fontSize: '1rem', borderRadius: 10, marginBottom: '1rem' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleGoalClick('chat')}
                      className={styles.btnSecondaryCream}
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.875rem',
                        background: selectedGoal === 'chat' ? '#ede9fe' : '#fdfbf7',
                        borderColor: selectedGoal === 'chat' ? '#6366f1' : '#c9c2b4',
                      }}
                    >
                      💬 Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGoalClick('collaborate')}
                      className={styles.btnSecondaryCream}
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.875rem',
                        background: selectedGoal === 'collaborate' ? '#ede9fe' : '#fdfbf7',
                        borderColor: selectedGoal === 'collaborate' ? '#6366f1' : '#c9c2b4',
                      }}
                    >
                      👥 Collaborate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGoalClick('learn')}
                      className={styles.btnSecondaryCream}
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.875rem',
                        background: selectedGoal === 'learn' ? '#ede9fe' : '#fdfbf7',
                        borderColor: selectedGoal === 'learn' ? '#6366f1' : '#c9c2b4',
                      }}
                    >
                      📖 Learn
                    </button>
                  </div>

                  <button
                    type="submit"
                    className={styles.btnPrimaryBlue}
                    style={{ padding: '0.55rem 1.5rem', fontSize: '0.9375rem' }}
                  >
                    Ask my agent &rarr;
                  </button>
                </div>
              </form>
            </div>

            {/* Candidates Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'Georgia, serif', fontWeight: 700, margin: 0 }}>
                  A few people your agent found
                </h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/note_suggestions_ranking.png"
                  alt="Suggestions, not a ranking."
                  style={{ width: 170 }}
                />
              </div>

              {/* 3 Candidate Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {filteredCandidates.slice(0, 3).map((candidate) => {
                  const candidateAvatar =
                    candidate.id === 'maya'
                      ? '/design/slices/avatar_maya_candidate.png'
                      : candidate.id === 'rohan'
                      ? '/design/slices/avatar_rohan_candidate.png'
                      : candidate.id === 'leo'
                      ? '/design/slices/avatar_leo_candidate.png'
                      : candidate.avatarUrl

                  return (
                    <div
                      key={candidate.id}
                      className={styles.paperTablet}
                      style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    >
                      <div>
                        {/* Avatar & Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={candidateAvatar}
                            alt={candidate.name}
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: 9999,
                              objectFit: 'cover',
                            }}
                          />
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1c1917' }}>{candidate.name}</h4>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#57534e' }}>{candidate.role}</p>
                          </div>
                        </div>

                      {/* Tag Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                        {candidate.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: '#f5f5f4',
                              color: '#44403c',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 9999,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Why this might fit */}
                      <div style={{ borderTop: '1px solid #e7e5e4', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                          Why this might fit
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: '#44403c' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                            <span>💡</span>
                            <span><strong>Shared curiosity:</strong> {candidate.sharedCuriosity}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                            <span>🧩</span>
                            <span><strong>Complementary practice:</strong> {candidate.complementaryPractice}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803d', fontWeight: 600 }}>
                            <span>⭐</span>
                            <span>Both open to matching</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/introductions/new/${candidate.id}`}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#2528ab',
                        textDecoration: 'none',
                        padding: '0.4rem 0',
                        borderTop: '1px solid #f5f5f4',
                      }}
                    >
                      Confirm &amp; explore introduction &rarr;
                    </Link>
                  </div>
                )
              })}
              </div>
            </div>

            {/* Bottom Paper Tablet: Private matching guarantee */}
            <div
              className={styles.paperTablet}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                gap: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9999, background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  🔒
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b', display: 'block' }}>Private matching is on</strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>No raw interests shared</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8125rem', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>👁️‍🗨️</span> <span>Your interests stay private</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>👥</span> <span>We don&apos;t contact anyone</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🛡️</span> <span>You decide who to meet</span>
                </div>
              </div>

              <Link
                href="/discover"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#2528ab',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Browse people &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Rohan Standing 3D Persona in Purple Monad Hoodie & Note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/p3_note_agent_finds.png"
              alt="Your agent finds people, with context."
              style={{ width: 135, alignSelf: 'flex-start' }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/p3_rohan_column_clean.png"
              alt="Real conversations. Real progress. Rohan on Monad"
              style={{ width: '100%', maxWidth: 277, objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
