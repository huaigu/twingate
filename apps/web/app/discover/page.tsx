'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import type { DiscoveryGoal } from '@/lib/v3-data'
import { SignalPassHeader } from '@/components/v3/header'
import { LockIcon } from '@/components/v3/icons'

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
      <SignalPassHeader activeNav="our-approach" />

      {/* Main 3-Column Layout Grid matching 03-people-discovery.png */}
      <div
        style={{
          maxWidth: '1672px',
          margin: '0 auto',
          padding: '1rem 2rem 2rem',
          display: 'grid',
          gridTemplateColumns: '380px minmax(700px, 920px) 320px',
          gap: '1.5rem',
          alignItems: 'start',
          position: 'relative',
        }}
      >
        {/* Left Column: People worth knowing + Alex sitting on block */}
        <div style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/03_left_people_column.png"
            alt="People worth knowing - Different backgrounds. Shared curiosity. A more open internet."
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
          />
        </div>

        {/* Center Column: Search & Curated Candidates */}
        <div>
          {/* Top Paper Card: I'm curious about... */}
          <div
            style={{
              background: '#fdfbf7',
              border: '1px solid #d9d2c4',
              borderRadius: 20,
              padding: '2rem 2.25rem',
              boxShadow: '0 10px 30px rgba(45, 30, 20, 0.07)',
              marginBottom: '1.75rem',
            }}
          >
            <h2
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: '2.4rem',
                fontWeight: 700,
                margin: '0 0 1.25rem',
                color: '#14121a',
                position: 'relative',
                display: 'inline-block',
              }}
            >
              I&apos;m{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                curious
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: -4,
                    width: '100%',
                    height: 6,
                    background: 'url(/design/slices/03_brush_curious.png) no-repeat center',
                    backgroundSize: '100% 100%',
                    pointerEvents: 'none',
                  }}
                />
              </span>{' '}
              about...
            </h2>

            <form onSubmit={handleSearch}>
              {/* Natural Language Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="e.g. finding a design partner, learning about zk, or meeting creators..."
                  style={{
                    width: '100%',
                    padding: '1rem 1.5rem',
                    fontSize: '1rem',
                    color: '#1e293b',
                    background: '#f8f6f0',
                    border: '1px solid #d5cebf',
                    borderRadius: 9999,
                    outline: 'none',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                />
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {/* Chat */}
                  <button
                    type="button"
                    onClick={() => handleGoalClick('chat')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1.4rem',
                      borderRadius: 9999,
                      border: selectedGoal === 'chat' ? '1.5px solid #2328b0' : '1px solid #c9c2b4',
                      background: selectedGoal === 'chat' ? '#e0e7ff' : '#ffffff',
                      color: selectedGoal === 'chat' ? '#1e1b4b' : '#38342f',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    💬 Chat
                  </button>
                  {/* Collaborate */}
                  <button
                    type="button"
                    onClick={() => handleGoalClick('collaborate')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1.4rem',
                      borderRadius: 9999,
                      border: selectedGoal === 'collaborate' ? '1.5px solid #2328b0' : '1px solid #c9c2b4',
                      background: selectedGoal === 'collaborate' ? '#e0e7ff' : '#ffffff',
                      color: selectedGoal === 'collaborate' ? '#1e1b4b' : '#38342f',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    👥 Collaborate
                  </button>
                  {/* Learn */}
                  <button
                    type="button"
                    onClick={() => handleGoalClick('learn')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1.4rem',
                      borderRadius: 9999,
                      border: selectedGoal === 'learn' ? '1.5px solid #2328b0' : '1px solid #c9c2b4',
                      background: selectedGoal === 'learn' ? '#e0e7ff' : '#ffffff',
                      color: selectedGoal === 'learn' ? '#1e1b4b' : '#38342f',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    📖 Learn
                  </button>
                </div>

                <button
                  type="submit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 2rem',
                    borderRadius: 9999,
                    border: 'none',
                    background: '#1b1f9b',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(27, 31, 155, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Ask my agent &rarr;
                </button>
              </div>
            </form>
          </div>

          {/* Candidates Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', position: 'relative' }}>
            <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.45rem', fontWeight: 700, margin: 0, color: '#14121a' }}>
              A few people your agent found
            </h3>
            {/* Sticky note: Suggestions, not a ranking */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/03_sticky_suggestions.png"
              alt="Suggestions, not a ranking."
              style={{ width: 190, height: 'auto', pointerEvents: 'none' }}
            />
          </div>

          {/* 3 Candidate Cards Side-by-Side matching 03-people-discovery.png */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
            {/* Card 1: Maya */}
            <div
              style={{
                background: '#fdfbf7',
                border: '1px solid #d9d2c4',
                borderRadius: 18,
                padding: '1.5rem',
                boxShadow: '0 8px 24px rgba(45, 30, 20, 0.06)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/avatar_maya_circle.png"
                  alt="Maya"
                  style={{ width: 62, height: 62, borderRadius: 9999, objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.2rem', color: '#14121a' }}>
                    Maya
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Product designer &amp; community builder
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span style={{ padding: '0.25rem 0.6rem', background: '#dcfce7', color: '#166534', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Design
                </span>
                <span style={{ padding: '0.25rem 0.6rem', background: '#dcfce7', color: '#166534', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Communities
                </span>
                <span style={{ padding: '0.25rem 0.6rem', background: '#dcfce7', color: '#166534', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Open Source
                </span>
              </div>

              {/* Why this might fit */}
              <div style={{ borderTop: '1px solid #ede8de', paddingTop: '1rem', flex: 1 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '0.75rem' }}>
                  Why this might fit
                </span>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8125rem', color: '#4b5563' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>💡</span>
                    <span>Shared curiosity about more human social tools</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>👥</span>
                    <span>Complementary practice (product &times; community)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>⭐</span>
                    <span>Both open to matching</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/introductions/new/maya"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '1.25rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 9999,
                  background: '#f0eef8',
                  color: '#2328b0',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  border: '1px solid #dcd5f0',
                }}
              >
                Confirm &amp; explore introduction &rarr;
              </Link>
            </div>

            {/* Card 2: Rohan */}
            <div
              style={{
                background: '#fdfbf7',
                border: '1px solid #d9d2c4',
                borderRadius: 18,
                padding: '1.5rem',
                boxShadow: '0 8px 24px rgba(45, 30, 20, 0.06)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/avatar_rohan_circle.png"
                  alt="Rohan"
                  style={{ width: 62, height: 62, borderRadius: 9999, objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.2rem', color: '#14121a' }}>
                    Rohan
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Protocol engineer &amp; educator
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span style={{ padding: '0.25rem 0.6rem', background: '#ede9fe', color: '#4329b5', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Infrastructure
                </span>
                <span style={{ padding: '0.25rem 0.6rem', background: '#ede9fe', color: '#4329b5', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Education
                </span>
                <span style={{ padding: '0.25rem 0.6rem', background: '#ede9fe', color: '#4329b5', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Monad
                </span>
              </div>

              {/* Why this might fit */}
              <div style={{ borderTop: '1px solid #ede8de', paddingTop: '1rem', flex: 1 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '0.75rem' }}>
                  Why this might fit
                </span>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8125rem', color: '#4b5563' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>📖</span>
                    <span>Shared curiosity about open internet infrastructure</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>🧩</span>
                    <span>Complementary practice (technical &times; product)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>⭐</span>
                    <span>Both open to matching</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/introductions/new/rohan"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '1.25rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 9999,
                  background: '#f0eef8',
                  color: '#2328b0',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  border: '1px solid #dcd5f0',
                }}
              >
                Confirm &amp; explore introduction &rarr;
              </Link>
            </div>

            {/* Card 3: Leo */}
            <div
              style={{
                background: '#fdfbf7',
                border: '1px solid #d9d2c4',
                borderRadius: 18,
                padding: '1.5rem',
                boxShadow: '0 8px 24px rgba(45, 30, 20, 0.06)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/avatar_leo_circle.png"
                  alt="Leo"
                  style={{ width: 62, height: 62, borderRadius: 9999, objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.2rem', color: '#14121a' }}>
                    Leo
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Creator &amp; researcher
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span style={{ padding: '0.25rem 0.6rem', background: '#ccfbf1', color: '#0f766e', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Content
                </span>
                <span style={{ padding: '0.25rem 0.6rem', background: '#ccfbf1', color: '#0f766e', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Research
                </span>
                <span style={{ padding: '0.25rem 0.6rem', background: '#ccfbf1', color: '#0f766e', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
                  Onchain Culture
                </span>
              </div>

              {/* Why this might fit */}
              <div style={{ borderTop: '1px solid #ede8de', paddingTop: '1rem', flex: 1 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '0.75rem' }}>
                  Why this might fit
                </span>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8125rem', color: '#4b5563' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>💬</span>
                    <span>Shared curiosity about creator economies</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>👥</span>
                    <span>Complementary practice (research &times; storytelling)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>⭐</span>
                    <span>Both open to matching</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/introductions/new/leo"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '1.25rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 9999,
                  background: '#f0eef8',
                  color: '#2328b0',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  border: '1px solid #dcd5f0',
                }}
              >
                Confirm &amp; explore introduction &rarr;
              </Link>
            </div>
          </div>

          {/* Bottom Security / Privacy Guarantee Bar */}
          <div
            style={{
              background: '#fbf9f5',
              border: '1px solid #ded8cc',
              borderRadius: 16,
              padding: '1.1rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9999, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockIcon size={18} color="#6346eb" />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#14121a', display: 'block' }}>
                  Private matching is on
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  No raw interests shared
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8125rem', color: '#555048' }}>
              <span>👁️ Your interests stay private</span>
              <span>👥 We don&apos;t contact anyone</span>
              <span>🛡️ You decide who to meet</span>
            </div>

            <Link
              href="/builders"
              style={{
                textDecoration: 'none',
                color: '#2328b0',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderBottom: '1px solid #2328b0',
                paddingBottom: 2,
              }}
            >
              Browse people &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Rohan Standing in Monad Hoodie & Quotes */}
        <div style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/03_right_art_column.png"
            alt="Rohan standing - Real conversations. Real progress."
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
          />
        </div>
      </div>
    </div>
  )
}
