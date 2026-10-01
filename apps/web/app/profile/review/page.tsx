'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import type { ProfileVisibility } from '@/lib/v3-data'
import { SignalPassHeader } from '@/components/v3/header'
import { GitHubIcon, TwitterXIcon, GlobeIcon, SparkleIcon, LockIcon, PeopleIcon, LeafIcon } from '@/components/v3/icons'

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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f6f3ed',
        backgroundImage: 'radial-gradient(rgba(18, 16, 22, 0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        color: '#14121a',
        paddingBottom: '4rem',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Top Header */}
      <SignalPassHeader activeNav="how-it-works" />

      {/* Main Layout Grid */}
      <div
        style={{
          maxWidth: '1672px',
          margin: '0 auto',
          padding: '1rem 2.5rem',
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '2.5rem',
          alignItems: 'start',
          position: 'relative',
        }}
      >
        {/* Left Sidebar Art with Interactive Hotspots */}
        <div style={{ position: 'relative', width: '100%', borderRadius: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/02_alex_standing_sidebar.png"
            alt="Personal Agent Navigation and Persona"
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
          />
          {/* Interactive Navigation Hotspots */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <Link href="/" style={{ position: 'absolute', top: '13.5%', left: '8%', width: '42%', height: '5.5%', pointerEvents: 'auto' }} title="Home" />
            <Link href="/profile/review" style={{ position: 'absolute', top: '18.8%', left: '8%', width: '42%', height: '5.5%', pointerEvents: 'auto' }} title="My agent" />
            <Link href="/inbox/intro-1" style={{ position: 'absolute', top: '28.3%', left: '8%', width: '42%', height: '5.5%', pointerEvents: 'auto' }} title="Introductions" />
            <Link href="/discover" style={{ position: 'absolute', top: '36.6%', left: '8%', width: '42%', height: '5.5%', pointerEvents: 'auto' }} title="Explore" />
            <Link href="/builders" style={{ position: 'absolute', top: '45.0%', left: '8%', width: '42%', height: '5.5%', pointerEvents: 'auto' }} title="Community" />
            <Link href="/discover/settings" style={{ position: 'absolute', top: '53.3%', left: '8%', width: '42%', height: '5.5%', pointerEvents: 'auto' }} title="Settings" />
          </div>
        </div>

        {/* Right Content Area */}
        <main>
          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', position: 'relative' }}>
            <div>
              <h1
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: '3.4rem',
                  fontWeight: 700,
                  margin: '0 0 0.4rem',
                  color: '#14121a',
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                Personal Agent
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: -8,
                    width: '100%',
                    height: 8,
                    background: 'url(/design/slices/02_brush_agent.png) no-repeat center',
                    backgroundSize: '100% 100%',
                    pointerEvents: 'none',
                  }}
                />
              </h1>
              <p style={{ margin: '0.8rem 0 0', fontSize: '1.25rem', color: '#555048' }}>
                Same you. More meaningful conversations.
              </p>
            </div>

            {/* Handwriting: Privacy and connection can co-exist */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/02_note_privacy_connection.png"
              alt="Privacy and connection can co-exist."
              style={{ width: 165, height: 'auto', pointerEvents: 'none' }}
            />
          </div>

          {/* 2-Column Paper Card Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Left Sub-Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Card 1: Your public Profile */}
              <div
                style={{
                  background: '#fdfbf7',
                  border: '1px solid #d9d2c4',
                  borderRadius: 20,
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(45, 30, 20, 0.07)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9999, background: '#d5e6dc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PeopleIcon size={20} color="#2e7355" />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#14121a' }}>
                      Your public Profile
                    </h2>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '0.2rem' }}>
                    Profile visibility
                  </span>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                    Decide who can see your profile and what they can see.
                  </p>
                </div>

                {/* 3 Visibility Radio Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                  {/* Public */}
                  <div
                    onClick={() => handleVisibilitySelect('public')}
                    style={{
                      cursor: 'pointer',
                      padding: '1.1rem 1rem',
                      borderRadius: 14,
                      border: profile.visibility === 'public' ? '1.5px solid #2328b0' : '1px solid #dcd7cc',
                      background: profile.visibility === 'public' ? '#f0f2ff' : '#ffffff',
                      boxShadow: profile.visibility === 'public' ? '0 4px 14px rgba(35, 40, 176, 0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 9999, border: profile.visibility === 'public' ? '5px solid #2328b0' : '1.5px solid #94a3b8', background: '#fff' }} />
                      <GlobeIcon size={18} color="#475569" />
                    </div>
                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#14121a' }}>Public</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                      Visible to everyone in the SignalPass community.
                    </p>
                  </div>

                  {/* Limited */}
                  <div
                    onClick={() => handleVisibilitySelect('limited')}
                    style={{
                      cursor: 'pointer',
                      padding: '1.1rem 1rem',
                      borderRadius: 14,
                      border: profile.visibility === 'limited' ? '1.5px solid #2328b0' : '1px solid #dcd7cc',
                      background: profile.visibility === 'limited' ? '#f0f2ff' : '#ffffff',
                      boxShadow: profile.visibility === 'limited' ? '0 4px 14px rgba(35, 40, 176, 0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 9999, border: profile.visibility === 'limited' ? '5px solid #2328b0' : '1.5px solid #94a3b8', background: '#fff' }} />
                      <PeopleIcon size={18} color="#475569" />
                    </div>
                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#14121a' }}>Limited</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                      Visible to people you match with or choose.
                    </p>
                  </div>

                  {/* Private (Selected in design) */}
                  <div
                    onClick={() => handleVisibilitySelect('private')}
                    style={{
                      cursor: 'pointer',
                      padding: '1.1rem 1rem',
                      borderRadius: 14,
                      border: profile.visibility === 'private' ? '2px solid #6346eb' : '1px solid #dcd7cc',
                      background: profile.visibility === 'private' ? '#f3f0fd' : '#ffffff',
                      boxShadow: profile.visibility === 'private' ? '0 4px 14px rgba(99, 70, 235, 0.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 9999, border: '5px solid #2328b0', background: '#fff' }} />
                      <LockIcon size={18} color="#14121a" />
                    </div>
                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#14121a' }}>Private</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                      Your profile is hidden. You can still match privately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Your interests & curiosities */}
              <div
                style={{
                  background: '#fdfbf7',
                  border: '1px solid #d9d2c4',
                  borderRadius: 20,
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(45, 30, 20, 0.07)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9999, background: '#e5efe7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LeafIcon size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#14121a' }}>
                      Your interests & curiosities
                    </h2>
                  </div>
                </div>

                <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
                  What gets you excited? Add a few to help your agent find the right people.
                </p>

                {/* Tag Pills Grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  {profile.interests.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.95rem',
                        background: '#e0e7ff',
                        color: '#1e1b4b',
                        borderRadius: 9999,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(tag)}
                        style={{ border: 'none', background: 'transparent', color: '#6366f1', cursor: 'pointer', padding: 0, fontSize: '0.85rem', lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}

                  {showAddInterest ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="New interest..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: 9999, border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddInterest}
                        style={{ padding: '0.4rem 0.85rem', borderRadius: 9999, background: '#1e22aa', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8125rem' }}
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddInterest(true)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: 9999,
                        border: '1px dashed #94a3b8',
                        background: 'transparent',
                        color: '#475569',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Add interest
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3: Preview what another person may see */}
              <div
                style={{
                  background: '#fdfbf7',
                  border: '1px solid #d9d2c4',
                  borderRadius: 20,
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(45, 30, 20, 0.07)',
                  position: 'relative',
                }}
              >
                {/* Note: A glimpse, not everything */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/02_note_glimpse.png"
                  alt="A glimpse, not everything."
                  style={{ position: 'absolute', right: -45, top: 15, width: 85, height: 'auto', pointerEvents: 'none' }}
                />

                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#14121a' }}>
                    Preview: what another person may see
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                    A preview of your public profile based on your current settings.
                  </p>
                </div>

                {/* Alex Miniature Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2ddd3',
                    borderRadius: 16,
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/design/slices/persona_alex_round.png"
                    alt="Alex"
                    style={{ width: 56, height: 56, borderRadius: 9999, objectFit: 'cover' }}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#14121a' }}>
                      Alex
                    </h4>
                    <p style={{ margin: '0 0 0.6rem', fontSize: '0.8125rem', color: '#64748b' }}>
                      Builder exploring open source, developer tools and onchain UX.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.2rem 0.6rem', background: '#ede9fe', color: '#4329b5', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                        Builder
                      </span>
                      <span style={{ padding: '0.2rem 0.6rem', background: '#e0e7ff', color: '#1e1b4b', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                        Open source
                      </span>
                      <span style={{ padding: '0.2rem 0.6rem', background: '#e0e7ff', color: '#1e1b4b', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                        Onchain UX
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sub-Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative' }}>
              {/* Note: Good matches. Your way */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/slices/02_note_good_matches.png"
                alt="Good matches. Your way."
                style={{ position: 'absolute', right: -65, top: 40, width: 110, height: 'auto', pointerEvents: 'none' }}
              />

              {/* Note: You choose what to use. Always. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/slices/02_note_you_choose.png"
                alt="You choose what to use. Always."
                style={{ position: 'absolute', right: -65, bottom: 80, width: 120, height: 'auto', pointerEvents: 'none' }}
              />

              {/* Card 1: Agent matching */}
              <div
                style={{
                  background: '#fdfbf7',
                  border: '1px solid #d9d2c4',
                  borderRadius: 20,
                  padding: '2.25rem 2rem',
                  boxShadow: '0 10px 30px rgba(45, 30, 20, 0.07)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 9999, background: 'linear-gradient(135deg, #ede9fe, #dcd4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SparkleIcon size={24} color="#6346eb" />
                    </div>
                    <div>
                      <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#14121a' }}>
                        Agent matching
                      </h2>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                        Find aligned builders, on your terms.
                      </p>
                    </div>
                  </div>

                  {/* Toggle switch On/Off */}
                  <div
                    onClick={handleToggleMatching}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 54,
                        height: 30,
                        borderRadius: 9999,
                        background: profile.allowAgentMatching ? '#2328b0' : '#cbd5e1',
                        position: 'relative',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 9999,
                          background: '#ffffff',
                          position: 'absolute',
                          top: 3,
                          left: profile.allowAgentMatching ? 27 : 3,
                          transition: 'left 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: profile.allowAgentMatching ? '#2328b0' : '#64748b' }}>
                      {profile.allowAgentMatching ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>

                {/* Subtitle & text */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#14121a' }}>
                    Your interests can be compared <span style={{ textDecoration: 'underline', textDecorationColor: '#f97316', textUnderlineOffset: 4 }}>privately</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: '#555048', lineHeight: 1.55 }}>
                    When this is on, we compare your interests with others to suggest relevant introductions. This happens privately on our servers — your interests are never shared.
                  </p>
                </div>

                {/* Green callout box */}
                <div
                  style={{
                    background: '#e9f5ed',
                    border: '1px solid #cce8d4',
                    borderRadius: 14,
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9999, background: '#c1e5cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LockIcon size={18} color="#166534" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 700, color: '#14532d' }}>
                      No raw interests are shared
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#166534', lineHeight: 1.45 }}>
                      Your data stays private. Only encrypted matching is used to find aligned builders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Allowed data sources */}
              <div
                style={{
                  background: '#fdfbf7',
                  border: '1px solid #d9d2c4',
                  borderRadius: 20,
                  padding: '2.25rem 2rem',
                  boxShadow: '0 10px 30px rgba(45, 30, 20, 0.07)',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#14121a' }}>
                    Allowed data sources
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                    Choose what your agent can use for matching.
                  </p>
                </div>

                {/* Checkbox Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {/* GitHub */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowedGitHub}
                      onChange={(e) => setAllowedGitHub(e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: '#2328b0', cursor: 'pointer' }}
                    />
                    <div style={{ width: 32, height: 32, borderRadius: 9999, background: '#14121a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GitHubIcon size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', marginRight: '0.75rem' }}>
                        GitHub
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        Projects, repositories, languages
                      </span>
                    </div>
                  </label>

                  {/* X (Twitter) */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowedTwitter}
                      onChange={(e) => setAllowedTwitter(e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: '#2328b0', cursor: 'pointer' }}
                    />
                    <div style={{ width: 32, height: 32, borderRadius: 9999, background: '#14121a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TwitterXIcon size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', marginRight: '0.75rem' }}>
                        X (Twitter)
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        Public posts and topics you engage with
                      </span>
                    </div>
                  </label>

                  {/* Other public links */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowedOther}
                      onChange={(e) => setAllowedOther(e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: '#2328b0', cursor: 'pointer' }}
                    />
                    <div style={{ width: 32, height: 32, borderRadius: 9999, background: '#e2ddd3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GlobeIcon size={18} color="#475569" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', marginRight: '0.75rem' }}>
                        Other public links
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        e.g. personal website, Farcaster, Lens
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '2.5rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.75rem' }}>
              <Link
                href="/widget/create"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.85rem 2.25rem',
                  borderRadius: 9999,
                  border: '1px solid #c9c2b4',
                  background: '#ffffff',
                  color: '#38342f',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(45, 30, 20, 0.05)',
                }}
              >
                Preview public profile
              </Link>
              <button
                type="button"
                onClick={handleSaveSettings}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.85rem 2.5rem',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#1b1f9b',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(27, 31, 155, 0.35)',
                }}
              >
                Save agent settings
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
              You can change these at any time.
            </p>

            {/* Purple Monad Arch scrap bottom right */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/02_scrap_purple_arch.png"
              alt="People Ideas A Brighter Monad"
              style={{ position: 'absolute', right: -40, bottom: -30, width: 220, height: 'auto', pointerEvents: 'none' }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
