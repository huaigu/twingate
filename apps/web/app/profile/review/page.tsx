'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import type { ProfileVisibility } from '@/lib/v3-data'
import styles from '@/app/v3.module.css'

export default function ProfileReviewPage() {
  const router = useRouter()
  const { profile, updateProfile, addToast } = useV3Demo()

  const [newInterest, setNewInterest] = useState('')
  const [showAddInterest, setShowAddInterest] = useState(false)
  const [allowedGitHub, setAllowedGitHub] = useState(true)
  const [allowedTwitter, setAllowedTwitter] = useState(true)
  const [allowedOther, setAllowedOther] = useState(false)

  function handleVisibilitySelect(vis: ProfileVisibility) {
    updateProfile({ visibility: vis })
    addToast(`Profile visibility set to ${vis}`, 'info')
  }

  function handleToggleMatching() {
    const nextVal = !profile.allowAgentMatching
    updateProfile({ allowAgentMatching: nextVal })
    addToast(
      nextVal
        ? 'Agent matching enabled (private & encrypted)'
        : 'Agent matching disabled',
      'info'
    )
  }

  function handleAddInterest() {
    if (!newInterest.trim()) return
    if (profile.interests.includes(newInterest.trim())) {
      addToast('Interest already in list', 'info')
      return
    }
    updateProfile({ interests: [...profile.interests, newInterest.trim()] })
    setNewInterest('')
    setShowAddInterest(false)
    addToast('Interest added', 'info')
  }

  function handleRemoveInterest(tag: string) {
    updateProfile({ interests: profile.interests.filter((t) => t !== tag) })
    addToast(`Removed "${tag}"`, 'info')
  }

  function handleSaveSettings() {
    addToast('Agent settings saved successfully!', 'success')
    router.push('/discover')
  }

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container1672}>
        <div className={styles.agentPageGrid}>
          {/* Left Sidebar: 1:1 Sliced Art with Interactive Hotspot Navigation */}
          <aside className={styles.agentSidebarArt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/02_left_sidebar_art.png"
              alt="Personal Agent Navigation and Persona"
              className={styles.sidebarArtImg}
            />
            <div className={styles.sidebarNavOverlay}>
              <Link href="/" className={styles.sidebarHotspot} style={{ top: '13.5%' }} title="Home">
                <span className="sr-only">Home</span>
              </Link>
              <Link href="/profile/review" className={styles.sidebarHotspot} style={{ top: '18.8%' }} title="My agent">
                <span className="sr-only">My agent</span>
              </Link>
              <Link href="/inbox/intro-1" className={styles.sidebarHotspot} style={{ top: '28.3%' }} title="Introductions">
                <span className="sr-only">Introductions</span>
              </Link>
              <Link href="/discover" className={styles.sidebarHotspot} style={{ top: '36.6%' }} title="Explore">
                <span className="sr-only">Explore</span>
              </Link>
              <Link href="/discover" className={styles.sidebarHotspot} style={{ top: '45.0%' }} title="Community">
                <span className="sr-only">Community</span>
              </Link>
              <Link href="/discover" className={styles.sidebarHotspot} style={{ top: '53.3%' }} title="Settings">
                <span className="sr-only">Settings</span>
              </Link>
            </div>
          </aside>

          {/* Main Area */}
          <main>
            {/* Title Block */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
              <div>
                <h1 className={styles.serifTitle} style={{ fontSize: '3.25rem', marginBottom: '0.25rem' }}>
                  Personal Agent
                </h1>
                <p className={styles.leadText} style={{ fontSize: '1.25rem' }}>
                  <span className={styles.orangeBrushWrapper}>
                    Same you. More meaningful conversations.
                  </span>
                </p>
              </div>

              {/* Floating note top right */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/slices/note_privacy_connection.png"
                alt="Privacy and connection can co-exist."
                style={{ width: 170, transform: 'rotate(-2deg)' }}
              />
            </div>

            {/* 2-Column Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Left Column: Public Profile, Interests, Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* 1. Profile Visibility Card */}
                <div className={styles.paperTablet}>
                  <div className={styles.tabletHeader}>
                    <div>
                      <h2 className={styles.tabletTitle} style={{ fontSize: '1.4rem' }}>Your public Profile</h2>
                      <p className={styles.tabletSubtitle}>
                        Profile visibility &mdash; Decide who can see your profile and what they can see.
                      </p>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: 9999, background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                      👤
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {/* Public */}
                    <button
                      type="button"
                      onClick={() => handleVisibilitySelect('public')}
                      style={{
                        padding: '1rem 0.85rem',
                        borderRadius: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: profile.visibility === 'public' ? '#f5f3ff' : '#fdfbf7',
                        border: profile.visibility === 'public' ? '2px solid #6366f1' : '1px solid #e2ddd3',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🌐</span>
                        <div style={{ width: 16, height: 16, borderRadius: 9999, border: profile.visibility === 'public' ? '5px solid #6366f1' : '1.5px solid #94a3b8', background: '#fff' }} />
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#1e293b' }}>Public</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.35 }}>
                        Visible to everyone in the SignalPass community.
                      </p>
                    </button>

                    {/* Limited */}
                    <button
                      type="button"
                      onClick={() => handleVisibilitySelect('limited')}
                      style={{
                        padding: '1rem 0.85rem',
                        borderRadius: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: profile.visibility === 'limited' ? '#f5f3ff' : '#fdfbf7',
                        border: profile.visibility === 'limited' ? '2px solid #6366f1' : '1px solid #e2ddd3',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>👥</span>
                        <div style={{ width: 16, height: 16, borderRadius: 9999, border: profile.visibility === 'limited' ? '5px solid #6366f1' : '1.5px solid #94a3b8', background: '#fff' }} />
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#1e293b' }}>Limited</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.35 }}>
                        Visible to people you match with or choose.
                      </p>
                    </button>

                    {/* Private */}
                    <button
                      type="button"
                      onClick={() => handleVisibilitySelect('private')}
                      style={{
                        padding: '1rem 0.85rem',
                        borderRadius: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: profile.visibility === 'private' ? '#f5f3ff' : '#fdfbf7',
                        border: profile.visibility === 'private' ? '2px solid #6366f1' : '1px solid #e2ddd3',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🔒</span>
                        <div style={{ width: 16, height: 16, borderRadius: 9999, border: profile.visibility === 'private' ? '5px solid #6366f1' : '1.5px solid #94a3b8', background: '#fff' }} />
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#1e293b' }}>Private</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.35 }}>
                        Your profile is hidden. You can still match privately.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Interests & Curiosities Card */}
                <div className={styles.paperTablet}>
                  <div className={styles.tabletHeader}>
                    <div>
                      <h2 className={styles.tabletTitle} style={{ fontSize: '1.4rem' }}>Your interests &amp; curiosities</h2>
                      <p className={styles.tabletSubtitle}>
                        What gets you excited? Add a few to help your agent find the right people.
                      </p>
                    </div>
                    <div style={{ fontSize: '1.4rem', color: '#22c55e' }}>🍃</div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    {profile.interests.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#ede9fe',
                          color: '#4338ca',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 9999,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(tag)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 0 }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}

                    {showAddInterest ? (
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Topic / interest"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddInterest()
                            }
                          }}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: 9999, border: '1.5px solid #6366f1', fontSize: '0.8rem', outline: 'none' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddInterest}
                          style={{ padding: '0.3rem 0.65rem', borderRadius: 9999, background: '#2528ab', color: '#fff', fontSize: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddInterest(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddInterest(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'transparent',
                          border: '1.5px dashed #cbd5e1',
                          color: '#64748b',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 9999,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        + Add interest
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Preview: What another person may see */}
                <div className={styles.paperTablet}>
                  <div className={styles.tabletHeader}>
                    <div>
                      <h2 className={styles.tabletTitle} style={{ fontSize: '1.4rem' }}>Preview: what another person may see</h2>
                      <p className={styles.tabletSubtitle}>
                        A preview of your public profile based on your current settings.
                      </p>
                    </div>
                    <div style={{ fontSize: '1.2rem', color: '#64748b' }}>👁️</div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/design/slices/note_glimpse_not_everything.png"
                      alt="A glimpse, not everything."
                      style={{ position: 'absolute', right: 20, top: -35, width: 85 }}
                    />

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/design/slices/avatar_alex_3d.png"
                        alt={profile.name}
                        style={{ width: 62, height: 62, borderRadius: 9999, objectFit: 'cover' }}
                      />
                      <div>
                        <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{profile.name}</h4>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                          Builder exploring open source, developer tools and onchain UX.
                        </p>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <span style={{ background: '#ede9fe', color: '#4338ca', padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>Builder</span>
                          <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>Open source</span>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>Onchain UX</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Agent Matching, Allowed Data Sources, Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* 1. Agent Matching Card */}
                <div className={styles.paperTablet} style={{ position: 'relative' }}>
                  {/* Floating note right */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/design/slices/note_good_matches.png"
                    alt="Good matches. Your way."
                    style={{ position: 'absolute', right: -110, top: 20, width: 110 }}
                  />

                  <div className={styles.tabletHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9999, background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        ✦
                      </div>
                      <div>
                        <h2 className={styles.tabletTitle} style={{ fontSize: '1.4rem', margin: 0 }}>Agent matching</h2>
                        <p className={styles.tabletSubtitle} style={{ margin: 0 }}>Find aligned builders, on your terms.</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleToggleMatching}
                        style={{
                          width: 48,
                          height: 26,
                          borderRadius: 9999,
                          background: profile.allowAgentMatching ? '#4f46e5' : '#cbd5e1',
                          position: 'relative',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: 3,
                            left: profile.allowAgentMatching ? 24 : 3,
                            width: 20,
                            height: 20,
                            borderRadius: 9999,
                            background: '#fff',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      </button>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: profile.allowAgentMatching ? '#4f46e5' : '#64748b' }}>
                        {profile.allowAgentMatching ? 'On' : 'Off'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                      Your interests can be compared <span style={{ textDecoration: 'underline', textDecorationColor: '#f59e0b', textDecorationThickness: '3px' }}>privately</span>
                    </h3>
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5 }}>
                      When this is on, we compare your interests with others to suggest relevant introductions. This happens privately on our servers &mdash; your interests are never shared.
                    </p>

                    {/* Green Box */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '1rem 1.25rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>🔒</span>
                      <div style={{ fontSize: '0.85rem', color: '#15803d', lineHeight: 1.4 }}>
                        <strong>No raw interests are shared.</strong>
                        <br />
                        Your data stays private. Only encrypted matching is used to find aligned builders.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Allowed Data Sources Card */}
                <div className={styles.paperTablet} style={{ position: 'relative' }}>
                  {/* Floating note right */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/design/slices/note_you_choose.png"
                    alt="You choose what to use. Always."
                    style={{ position: 'absolute', right: -120, top: 40, width: 110 }}
                  />

                  <div className={styles.tabletHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9999, background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        🗄️
                      </div>
                      <div>
                        <h2 className={styles.tabletTitle} style={{ fontSize: '1.4rem', margin: 0 }}>Allowed data sources</h2>
                        <p className={styles.tabletSubtitle} style={{ margin: 0 }}>Choose what your agent can use for matching.</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={allowedGitHub}
                        onChange={(e) => setAllowedGitHub(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#4f46e5' }}
                      />
                      <span style={{ fontSize: '1.1rem' }}>🐙</span>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>GitHub</strong>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>Projects, repositories, languages</span>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={allowedTwitter}
                        onChange={(e) => setAllowedTwitter(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#4f46e5' }}
                      />
                      <span style={{ fontSize: '1.1rem' }}>𝕏</span>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>X (Twitter)</strong>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>Public posts and topics you engage with</span>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={allowedOther}
                        onChange={(e) => setAllowedOther(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#4f46e5' }}
                      />
                      <span style={{ fontSize: '1.1rem' }}>🔗</span>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>Other public links</strong>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>e.g. personal website, Farcaster, Lens</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => router.push('/widget/create')}
                    className={styles.btnSecondaryCream}
                    style={{ flex: 1 }}
                  >
                    Preview public profile
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className={styles.btnPrimaryBlue}
                    style={{ flex: 1.2 }}
                  >
                    Save agent settings
                  </button>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#78716c', textAlign: 'center', display: 'block' }}>
                  You can change these at any time.
                </span>

                {/* Purple Scrap & Mountain Arch bottom right */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/design/slices/scrap_arch_and_purple.png"
                    alt="People Ideas A Brighter Monad"
                    style={{ width: 220 }}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
