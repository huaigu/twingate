'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import styles from '@/app/v3.module.css'

export default function ProfileImportPage() {
  const router = useRouter()
  const { profile, updateProfile, updateSource, addToast } = useV3Demo()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempName, setTempName] = useState(profile.name)
  const [tempHeadline, setTempHeadline] = useState(profile.headline)
  const [tempInterests, setTempInterests] = useState(profile.interests.join(', '))
  const [tempCanOffer, setTempCanOffer] = useState(profile.canOffer)
  const [tempWantsToMeet, setTempWantsToMeet] = useState(profile.wantsToMeet)

  function handleSaveField(field: string) {
    if (field === 'headline') {
      updateProfile({ name: tempName, headline: tempHeadline })
    } else if (field === 'interests') {
      updateProfile({
        interests: tempInterests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
    } else if (field === 'canOffer') {
      updateProfile({ canOffer: tempCanOffer })
    } else if (field === 'wantsToMeet') {
      updateProfile({ wantsToMeet: tempWantsToMeet })
    }
    setEditingField(null)
    addToast('Profile draft updated', 'info')
  }

  function toggleSourceActive(id: 'github' | 'twitter' | 'website' | 'agent') {
    const source = profile.sources.find((s) => s.id === id)
    if (source) {
      updateSource(id, { active: !source.active })
      addToast(`${source.name} source ${!source.active ? 'connected' : 'disconnected'}`, 'info')
    }
  }

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container1672}>

        {/* 3-Column Split: Stepper+Scene, Add Sources, Profile Draft */}
        <div className={styles.importPageGrid}>
          {/* Left Column: 1:1 Hero Art with Interactive Stepper Hotspots */}
          <div className={styles.importLeftHero}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/01_left_hero_art.png"
              alt="Build your profile - Your agent writes. You approve."
              className={styles.leftHeroArtImg}
            />
            {/* Clickable interactive hotspots for the stepper */}
            <div className={styles.stepperOverlay}>
              <Link href="/" className={styles.stepperHotspot} style={{ top: '41%' }} title="Step 1: Sign in">
                <span className="sr-only">Step 1: Sign in</span>
              </Link>
              <div className={styles.stepperHotspot} style={{ top: '48.5%' }} title="Step 2: Add sources (current step)">
                <span className="sr-only">Step 2: Add sources</span>
              </div>
              <Link href="/profile/review" className={styles.stepperHotspot} style={{ top: '56%' }} title="Step 3: Review profile draft">
                <span className="sr-only">Step 3: Review</span>
              </Link>
            </div>
          </div>

          {/* Middle Column: Add Sources Paper Tablet */}
          <div className={styles.paperTablet}>
            <div className={styles.tabletHeader}>
              <div>
                <h2 className={styles.tabletTitle}>Add sources</h2>
                <p className={styles.tabletSubtitle}>
                  Help your agent draft your profile from public information you provide. You can add one or more sources.
                </p>
              </div>
              <span className={styles.handwrittenNote}>
                Same you.<br />More opportunities.
              </span>
            </div>

            {/* 4 Source Cards 2x2 Grid */}
            <div className={styles.sourceCardsGrid} style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {profile.sources.map((source) => {
                return (
                  <div
                    key={source.id}
                    onClick={() => toggleSourceActive(source.id)}
                    className={`${styles.sourceCard} ${source.active ? styles.sourceCardActive : ''}`}
                    style={{ cursor: 'pointer', padding: '1.25rem', background: '#fff', border: source.active ? '1.5px solid #2528ab' : '1px solid #e2ddd3', borderRadius: 14 }}
                  >
                    <div className={styles.sourceCardTop} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 9999,
                          background: source.id === 'website' ? '#3b82f6' : source.id === 'agent' ? '#8b5cf6' : '#18181b',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                        }}
                      >
                        {source.id === 'github' ? '🐙' : source.id === 'twitter' ? '𝕏' : source.id === 'website' ? '🌐' : '✦'}
                      </div>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: source.active ? '#2563eb' : '#f1f5f9',
                          color: source.active ? '#fff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          border: source.active ? 'none' : '1px solid #cbd5e1',
                        }}
                      >
                        {source.active ? '✓' : '+'}
                      </span>
                    </div>
                    <div className={styles.sourceCardBody}>
                      <h3 className={styles.sourceCardName} style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 700 }}>{source.name}</h3>
                      <p className={styles.sourceCardDesc} style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.4 }}>{source.subtitle}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Unverified Disclaimer Inset Panel */}
            <div style={{ marginTop: '1.75rem', background: '#edf2f7', border: '1px solid #cbd5e1', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>ℹ️</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>
                  User-provided sources are not verified.
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.45 }}>
                  You&apos;ll review and approve every field before anything is saved. We only use publicly available information you choose to share.
                </p>
              </div>
            </div>

            {/* Bottom buttons inside middle column matching design */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.75rem' }}>
              <button
                type="button"
                onClick={() => router.push('/profile/review')}
                className={styles.btnPrimaryBlue}
                style={{ flex: 1 }}
              >
                Review my draft &rarr;
              </button>
              <button
                type="button"
                onClick={() => router.push('/profile/review')}
                className={styles.btnSecondaryCream}
                style={{ whiteSpace: 'nowrap' }}
              >
                Start manually
              </button>
            </div>
          </div>

          {/* Right Column: Profile Draft Paper Tablet */}
          <div className={styles.paperTablet} style={{ position: 'relative' }}>
            {/* Note: A first look, in your hands */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/note_first_look.png"
              alt="A first look, in your hands."
              style={{ position: 'absolute', right: -55, top: 30, width: 90 }}
            />
            <div className={styles.tabletHeader}>
              <div>
                <h2 className={styles.tabletTitle}>Profile draft</h2>
                <p className={styles.tabletSubtitle}>
                  Synthesized by your Personal Agent from public signals.
                </p>
              </div>
              <span className={styles.unverifiedBadge} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                ℹ User-provided • not verified
              </span>
            </div>

            {/* Profile Draft Content */}
            <div className={styles.draftCard}>
              <div className={styles.draftIdentityRow}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/avatar_alex_3d.png"
                  alt={profile.name}
                  className={styles.draftAvatar}
                  style={{ width: 70, height: 70, borderRadius: 9999, objectFit: 'cover' }}
                />
                <div className={styles.draftIdentityInfo} style={{ flex: 1 }}>
                  {editingField === 'headline' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className={styles.inputField}
                        placeholder="Your name"
                      />
                      <input
                        type="text"
                        value={tempHeadline}
                        onChange={(e) => setTempHeadline(e.target.value)}
                        className={styles.inputField}
                        placeholder="One-line headline"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveField('headline')}
                        className={styles.btnActionSmall}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className={styles.draftName}>{profile.name}</h3>
                      <p className={styles.draftHeadline}>{profile.headline}</p>
                    </>
                  )}
                </div>
                {editingField !== 'headline' && (
                  <button
                    type="button"
                    onClick={() => setEditingField('headline')}
                    className={styles.btnEdit}
                  >
                    ✏ Edit
                  </button>
                )}
              </div>

              {/* Current Interests Row */}
              <div className={styles.draftFieldRow}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e2f4e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  🌱
                </div>
                <div className={styles.draftFieldContent} style={{ flex: 1 }}>
                  <span className={styles.draftFieldLabel}>Current interests</span>
                  {editingField === 'interests' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        value={tempInterests}
                        onChange={(e) => setTempInterests(e.target.value)}
                        className={styles.inputField}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveField('interests')}
                        className={styles.btnActionSmall}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className={styles.draftFieldValue}>{profile.interests.join(', ')}</p>
                  )}
                </div>
                {editingField !== 'interests' && (
                  <button
                    type="button"
                    onClick={() => setEditingField('interests')}
                    className={styles.btnEdit}
                  >
                    ✏ Edit
                  </button>
                )}
              </div>

              {/* Can Offer Row */}
              <div className={styles.draftFieldRow}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  📦
                </div>
                <div className={styles.draftFieldContent} style={{ flex: 1 }}>
                  <span className={styles.draftFieldLabel}>Can offer</span>
                  {editingField === 'canOffer' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <textarea
                        value={tempCanOffer}
                        onChange={(e) => setTempCanOffer(e.target.value)}
                        className={styles.inputField}
                        rows={2}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveField('canOffer')}
                        className={styles.btnActionSmall}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className={styles.draftFieldValue}>{profile.canOffer}</p>
                  )}
                </div>
                {editingField !== 'canOffer' && (
                  <button
                    type="button"
                    onClick={() => setEditingField('canOffer')}
                    className={styles.btnEdit}
                  >
                    ✏ Edit
                  </button>
                )}
              </div>

              {/* Wants to Meet Row */}
              <div className={styles.draftFieldRow}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  👥
                </div>
                <div className={styles.draftFieldContent} style={{ flex: 1 }}>
                  <span className={styles.draftFieldLabel}>Wants to meet</span>
                  {editingField === 'wantsToMeet' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <textarea
                        value={tempWantsToMeet}
                        onChange={(e) => setTempWantsToMeet(e.target.value)}
                        className={styles.inputField}
                        rows={2}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveField('wantsToMeet')}
                        className={styles.btnActionSmall}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className={styles.draftFieldValue}>{profile.wantsToMeet}</p>
                  )}
                </div>
                {editingField !== 'wantsToMeet' && (
                  <button
                    type="button"
                    onClick={() => setEditingField('wantsToMeet')}
                    className={styles.btnEdit}
                  >
                    ✏ Edit
                  </button>
                )}
              </div>

              {/* Sources footer pills */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #ede8de' }}>
                <span style={{ fontSize: '0.75rem', color: '#766f65', display: 'block', marginBottom: '0.5rem' }}>
                  Sources (user-provided • not verified):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f4efe6', padding: '0.25rem 0.65rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                    🐙 GitHub
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f4efe6', padding: '0.25rem 0.65rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                    𝕏 X
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f4efe6', padding: '0.25rem 0.65rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                    🌐 alexchen.dev
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ede9fe', color: '#4b39c4', padding: '0.25rem 0.65rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                    ✦ Imported via Agent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Scraps & Notes matching 01-profile-source-import.png */}
        <div style={{ position: 'relative', height: '60px', marginTop: '1rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/sticky_public_info.png"
            alt="Public info you choose. Nothing more."
            style={{ width: 155, position: 'absolute', left: '380px', top: '-10px', transform: 'rotate(2deg)' }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/scrap_purple_monad.png"
            alt="People Ideas A Brighter Monad"
            style={{ width: 160, position: 'absolute', right: '0px', top: '-25px' }}
          />
        </div>
      </div>
    </div>
  )
}
