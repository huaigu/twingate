'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import { GitHubIcon, TwitterXIcon, GlobeIcon, SparkleIcon, LeafIcon, CubeIcon, PeopleIcon, PencilIcon, CheckmarkIcon } from '@/components/v3/icons'

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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f6f3ed',
        backgroundImage: 'radial-gradient(rgba(18, 16, 22, 0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        color: '#14121a',
        paddingBottom: '3rem',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Top Bar matching 01-profile-source-import.png */}
      <div
        style={{
          maxWidth: '1672px',
          margin: '0 auto',
          padding: '1.25rem 2.5rem 0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#14121a' }}>
            <div style={{ width: 34, height: 26, display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 14, height: 24, borderRadius: 12, background: 'linear-gradient(135deg, #3b28cc, #6346eb)', transform: 'rotate(-20deg)' }} />
              <div style={{ width: 14, height: 24, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', transform: 'rotate(-20deg)', marginLeft: -4 }} />
            </div>
            <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              SignalPass
            </span>
          </Link>
          <div style={{ borderLeft: '1px solid #ded8cc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6b655b', textTransform: 'uppercase' }}>BUILDERS</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6b655b', textTransform: 'uppercase' }}>FIND BUILDERS</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6b655b', textTransform: 'uppercase' }}>ON MONAD</span>
          </div>
        </div>

        {/* Right Handwriting Note */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/slices/01_note_agent_writes.png"
          alt="Your agent writes. You approve."
          style={{ width: '180px', height: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Main 3-Column 1672px Grid */}
      <div
        style={{
          maxWidth: '1672px',
          margin: '0 auto',
          padding: '1rem 2rem 2rem',
          display: 'grid',
          gridTemplateColumns: '480px minmax(360px, 460px) minmax(440px, 580px)',
          gap: '2rem',
          alignItems: 'start',
          position: 'relative',
        }}
      >
        {/* Left Column: 1:1 Full Hero Art with Stepper Hotspots */}
        <div style={{ position: 'relative', width: '100%', borderRadius: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/01_hero_art_full_width.png"
            alt="Build your profile - Your agent writes. You approve."
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
          />

          {/* Interactive Stepper Hotspots */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <Link
              href="/"
              style={{
                position: 'absolute',
                top: '40%',
                left: '7%',
                width: '45%',
                height: '6%',
                pointerEvents: 'auto',
                borderRadius: 8,
              }}
              title="Step 1: Sign in"
            />
            <div
              style={{
                position: 'absolute',
                top: '47.5%',
                left: '7%',
                width: '45%',
                height: '6%',
                pointerEvents: 'auto',
                borderRadius: 8,
              }}
              title="Step 2: Add sources (Current)"
            />
            <Link
              href="/profile/review"
              style={{
                position: 'absolute',
                top: '55%',
                left: '7%',
                width: '45%',
                height: '6%',
                pointerEvents: 'auto',
                borderRadius: 8,
              }}
              title="Step 3: Review"
            />
          </div>
        </div>

        {/* Middle Column: Add Sources Paper Tablet Card */}
        <div
          style={{
            background: '#fdfbf7',
            border: '1px solid #d9d2c4',
            borderRadius: 20,
            padding: '2.25rem 2rem',
            boxShadow: '0 12px 36px rgba(45, 30, 20, 0.08), 0 2px 8px rgba(45, 30, 20, 0.04)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '2.1rem', fontWeight: 700, margin: '0 0 0.6rem', color: '#121016' }}>
              Add sources
            </h2>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: '#555048', lineHeight: 1.5 }}>
              Help your agent draft your profile from public information you provide. You can add one or more sources.
            </p>
          </div>

          {/* 4 Source Cards 2x2 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
            {profile.sources.map((source) => {
              return (
                <div
                  key={source.id}
                  onClick={() => toggleSourceActive(source.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '1.25rem',
                    background: '#ffffff',
                    border: source.active ? '1.5px solid #2328b0' : '1px solid #e2ddd3',
                    borderRadius: 16,
                    boxShadow: source.active ? '0 4px 16px rgba(35, 40, 176, 0.12)' : '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    {/* Official Crisp Icon Badge */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 9999,
                        background:
                          source.id === 'website'
                            ? '#2563eb'
                            : source.id === 'agent'
                            ? 'linear-gradient(135deg, #6346eb, #8b5cf6)'
                            : '#14121a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      {source.id === 'github' && <GitHubIcon size={26} />}
                      {source.id === 'twitter' && <TwitterXIcon size={22} />}
                      {source.id === 'website' && <GlobeIcon size={24} />}
                      {source.id === 'agent' && <SparkleIcon size={24} />}
                    </div>

                    {/* Top Right Toggle Button (+ or Check) */}
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: source.active ? '#2563eb' : '#f4efe6',
                        color: source.active ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        border: source.active ? 'none' : '1px solid #d5cec0',
                      }}
                    >
                      {source.active ? <CheckmarkIcon size={14} /> : '+'}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: '#14121a' }}>
                      {source.id === 'twitter' ? 'Twitter / X' : source.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.45 }}>
                      {source.id === 'github' && 'Projects, repositories, contributions'}
                      {source.id === 'twitter' && 'Ideas, conversations, public activity'}
                      {source.id === 'website' && 'About you, blog, projects, links'}
                      {source.id === 'agent' && 'Let your agent find relevant public context'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Info Callout Box */}
          <div
            style={{
              marginTop: '1.75rem',
              background: '#edf3f8',
              border: '1px solid #d1dfe8',
              borderRadius: 14,
              padding: '1.1rem 1.25rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 9999,
                background: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              i
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>
                User-provided sources are not verified.
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.45 }}>
                You&apos;ll review and approve every field before anything is saved. We only use publicly available information you choose to share.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Draft Paper Tablet Card */}
        <div
          style={{
            background: '#fdfbf7',
            border: '1px solid #d9d2c4',
            borderRadius: 20,
            padding: '2.25rem 2rem',
            boxShadow: '0 12px 36px rgba(45, 30, 20, 0.08), 0 2px 8px rgba(45, 30, 20, 0.04)',
            position: 'relative',
          }}
        >
          {/* Note: A first look, in your hands */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/01_note_first_look.png"
            alt="A first look, in your hands."
            style={{ position: 'absolute', right: -65, top: 40, width: 100, height: 'auto', pointerEvents: 'none' }}
          />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', borderBottom: '1px solid #eee8dc', paddingBottom: '1rem' }}>
            <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '2.1rem', fontWeight: 700, margin: 0, color: '#121016' }}>
              Profile draft
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                background: '#f8eedb',
                color: '#854d0e',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid #edd9b5',
              }}
            >
              <span>ℹ</span> User-provided · not verified
            </span>
          </div>

          {/* Alex Chen Identity Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', borderBottom: '1px solid #eee8dc', paddingBottom: '1.5rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/01_avatar_alex_round.png"
              alt="Alex Chen"
              style={{ width: 84, height: 84, borderRadius: 9999, objectFit: 'cover', border: '2px solid #ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
            />
            <div style={{ flex: 1 }}>
              {editingField === 'headline' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #c9c2b4', fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  <input
                    type="text"
                    value={tempHeadline}
                    onChange={(e) => setTempHeadline(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #c9c2b4', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveField('headline')}
                    style={{ alignSelf: 'flex-start', padding: '0.35rem 1rem', background: '#1e22aa', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#121016' }}>
                    {profile.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: '#555048', lineHeight: 1.45 }}>
                    {profile.headline}
                  </p>
                </>
              )}
            </div>
            {editingField !== 'headline' && (
              <button
                type="button"
                onClick={() => setEditingField('headline')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 9999,
                  border: '1px solid #c9c2b4',
                  background: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#4a453e',
                  cursor: 'pointer',
                }}
              >
                <PencilIcon size={12} /> Edit
              </button>
            )}
          </div>

          {/* Current interests */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee8dc', paddingBottom: '1.5rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#e5efe7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LeafIcon size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: '#121016' }}>
                Current interests
              </h4>
              {editingField === 'interests' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={tempInterests}
                    onChange={(e) => setTempInterests(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #c9c2b4', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveField('interests')}
                    style={{ alignSelf: 'flex-start', padding: '0.35rem 1rem', background: '#1e22aa', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#555048', lineHeight: 1.5 }}>
                  {profile.interests.join(', ')}
                </p>
              )}
            </div>
            {editingField !== 'interests' && (
              <button
                type="button"
                onClick={() => setEditingField('interests')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 9999,
                  border: '1px solid #c9c2b4',
                  background: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#4a453e',
                  cursor: 'pointer',
                }}
              >
                <PencilIcon size={12} /> Edit
              </button>
            )}
          </div>

          {/* Can offer */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee8dc', paddingBottom: '1.5rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#e5efe7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CubeIcon size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: '#121016' }}>
                Can offer
              </h4>
              {editingField === 'canOffer' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={tempCanOffer}
                    onChange={(e) => setTempCanOffer(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #c9c2b4', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveField('canOffer')}
                    style={{ alignSelf: 'flex-start', padding: '0.35rem 1rem', background: '#1e22aa', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#555048', lineHeight: 1.5 }}>
                  {profile.canOffer}
                </p>
              )}
            </div>
            {editingField !== 'canOffer' && (
              <button
                type="button"
                onClick={() => setEditingField('canOffer')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 9999,
                  border: '1px solid #c9c2b4',
                  background: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#4a453e',
                  cursor: 'pointer',
                }}
              >
                <PencilIcon size={12} /> Edit
              </button>
            )}
          </div>

          {/* Wants to meet */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.75rem', borderBottom: '1px solid #eee8dc', paddingBottom: '1.5rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#e5efe7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PeopleIcon size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: '#121016' }}>
                Wants to meet
              </h4>
              {editingField === 'wantsToMeet' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={tempWantsToMeet}
                    onChange={(e) => setTempWantsToMeet(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #c9c2b4', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveField('wantsToMeet')}
                    style={{ alignSelf: 'flex-start', padding: '0.35rem 1rem', background: '#1e22aa', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#555048', lineHeight: 1.5 }}>
                  {profile.wantsToMeet}
                </p>
              )}
            </div>
            {editingField !== 'wantsToMeet' && (
              <button
                type="button"
                onClick={() => setEditingField('wantsToMeet')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 9999,
                  border: '1px solid #c9c2b4',
                  background: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#4a453e',
                  cursor: 'pointer',
                }}
              >
                <PencilIcon size={12} /> Edit
              </button>
            )}
          </div>

          {/* Sources Bottom Row */}
          <div>
            <span style={{ fontSize: '0.8125rem', color: '#6b655b', display: 'block', marginBottom: '0.65rem' }}>
              Sources (user-provided · not verified)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', background: '#f5f0e6', borderRadius: 9999, fontSize: '0.8125rem', fontWeight: 600 }}>
                <div style={{ width: 18, height: 18, borderRadius: 9999, background: '#14121a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitHubIcon size={12} />
                </div>
                GitHub
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', background: '#f5f0e6', borderRadius: 9999, fontSize: '0.8125rem', fontWeight: 600 }}>
                <div style={{ width: 18, height: 18, borderRadius: 9999, background: '#14121a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TwitterXIcon size={10} />
                </div>
                X
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', background: '#f5f0e6', borderRadius: 9999, fontSize: '0.8125rem', fontWeight: 600 }}>
                <div style={{ width: 18, height: 18, borderRadius: 9999, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GlobeIcon size={12} />
                </div>
                alexchen.dev
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', background: '#ede9fe', color: '#4329b5', borderRadius: 9999, fontSize: '0.8125rem', fontWeight: 600 }}>
                <div style={{ width: 18, height: 18, borderRadius: 9999, background: '#6346eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SparkleIcon size={12} />
                </div>
                Imported via Agent
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar matching 01-profile-source-import.png */}
      <div
        style={{
          maxWidth: '1672px',
          margin: '1.5rem auto 0',
          padding: '0 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          position: 'relative',
        }}
      >
        {/* Green Sticky Note on bottom left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/slices/01_sticky_public_info.png"
          alt="Public info you choose. Nothing more."
          style={{ position: 'absolute', left: 490, bottom: -10, width: 160, height: 'auto', pointerEvents: 'none' }}
        />

        {/* Buttons */}
        <button
          type="button"
          onClick={() => router.push('/profile/review')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '1rem 2.75rem',
            background: '#1b1f9b',
            color: '#ffffff',
            fontSize: '1.125rem',
            fontWeight: 600,
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(27, 31, 155, 0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          Review my draft &rarr;
        </button>

        <button
          type="button"
          onClick={() => router.push('/profile/review')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 2.25rem',
            background: '#ffffff',
            color: '#38342f',
            fontSize: '1.125rem',
            fontWeight: 600,
            borderRadius: '9999px',
            border: '1px solid #c9c2b4',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(45, 30, 20, 0.05)',
            transition: 'all 0.2s ease',
          }}
        >
          Start manually
        </button>

        {/* Purple Monad scrap on bottom right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/slices/01_scrap_purple_monad.png"
          alt="People Ideas A Brighter Monad"
          style={{ position: 'absolute', right: 40, bottom: -20, width: 190, height: 'auto', pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}
