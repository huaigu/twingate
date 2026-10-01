'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import type { IntroductionRecord } from '@/lib/v3-data'
import { SignalPassHeader } from '@/components/v3/header'
import {
  LeafIcon,
  CubeIcon,
  LockIcon,
  SparkleIcon,
} from '@/components/v3/icons'

type IntroTab = 'needs_look' | 'waiting_sender' | 'saved_later'

export default function InboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { introductions } = useV3Demo()

  const [activeTab, setActiveTab] = useState<IntroTab>('needs_look')

  const currentIntro: IntroductionRecord =
    introductions.find((i) => i.id === resolvedParams.id) ??
    introductions[0]!

  const needsLookItems = introductions.filter((i) => i.category === 'needs_look')
  const waitingItems = introductions.filter((i) => i.category === 'waiting_sender')
  const savedItems = introductions.filter((i) => i.category === 'saved_later')

  const listAvatarMap: Record<string, string> = {
    'intro-1': '/design/slices/06_list_alex.png',
    'intro-2': '/design/slices/06_list_sam.png',
    'intro-3': '/design/slices/06_list_jordan.png',
    'intro-4': '/design/slices/06_list_taylor.png',
    'intro-5': '/design/slices/06_list_priya.png',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4efe6',
        color: '#1a1816',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Top Navbar */}
      <SignalPassHeader activeNav="how-it-works" />

      {/* Main 1672 Master Canvas Container */}
      <main
        style={{
          maxWidth: 1672,
          margin: '0 auto',
          padding: '1.25rem 2.5rem 4rem',
        }}
      >
        {/* 4-Column Grid: Left Column, Inbox List, Detail Card, Right Column */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '230px minmax(430px, 480px) minmax(520px, 1.2fr) 260px',
            gap: '1.75rem',
            alignItems: 'start',
          }}
        >
          {/* Column 1: Left Title, Alex Sitting on Books & Note */}
          <div style={{ position: 'relative' }}>
            <h1
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: '2.9rem',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 0.5rem 0',
                lineHeight: 1.08,
              }}
            >
              Your<br />
              <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
                introductions
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/06_brush_introductions.png"
                  alt="Orange brushstroke underline"
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: -6,
                    width: '100%',
                    height: '14px',
                    pointerEvents: 'none',
                    objectFit: 'fill',
                  }}
                />
              </span>
            </h1>

            <p
              style={{
                fontSize: '0.95rem',
                color: '#4b5563',
                lineHeight: 1.45,
                margin: '0 0 1.25rem 0',
              }}
            >
              People with shared curiosity, learning goals or collaboration ideas.
            </p>

            {/* Handwritten note: Real people. Shared curiosity. */}
            <div style={{ marginBottom: '1rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/slices/06_note_real_people.png"
                alt="Real people. Shared curiosity."
                style={{ width: '100%', maxWidth: 170, objectFit: 'contain' }}
              />
            </div>

            {/* Alex sitting on books */}
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/slices/06_alex_sitting_books.png"
                alt="Alex sitting on stack of books"
                style={{
                  width: '100%',
                  maxWidth: 220,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 14px 28px rgba(35, 26, 12, 0.12))',
                }}
              />
            </div>
          </div>

          {/* Column 2: Center-Left 3-Tab Inbox List Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              border: '1px solid #e8e2d5',
              padding: '1.5rem',
              boxShadow: '0 12px 36px rgba(35, 26, 12, 0.08)',
              position: 'relative',
            }}
          >
            {/* 3 Pills / Tabs */}
            <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.35rem' }}>
              {/* Tab 1: Needs your look */}
              <button
                type="button"
                onClick={() => setActiveTab('needs_look')}
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: 9999,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'needs_look' ? '#2528ab' : '#f4efe6',
                  color: activeTab === 'needs_look' ? '#ffffff' : '#4a453e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Needs your look</span>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 9999,
                    background: activeTab === 'needs_look' ? '#ffffff' : '#e2ddd3',
                    color: activeTab === 'needs_look' ? '#2528ab' : '#1e293b',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {needsLookItems.length}
                </span>
              </button>

              {/* Tab 2: Waiting for sender */}
              <button
                type="button"
                onClick={() => setActiveTab('waiting_sender')}
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: 9999,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'waiting_sender' ? '#2528ab' : '#f4efe6',
                  color: activeTab === 'waiting_sender' ? '#ffffff' : '#4a453e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Waiting</span>
                <span style={{ fontSize: '0.725rem', color: activeTab === 'waiting_sender' ? '#ffffff' : '#64748b' }}>
                  ({waitingItems.length})
                </span>
              </button>

              {/* Tab 3: Saved for later */}
              <button
                type="button"
                onClick={() => setActiveTab('saved_later')}
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: 9999,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'saved_later' ? '#2528ab' : '#f4efe6',
                  color: activeTab === 'saved_later' ? '#ffffff' : '#4a453e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Saved</span>
                <span style={{ fontSize: '0.725rem', color: activeTab === 'saved_later' ? '#ffffff' : '#64748b' }}>
                  ({savedItems.length})
                </span>
              </button>
            </div>

            {/* List of Introductions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {(activeTab === 'needs_look'
                ? needsLookItems
                : activeTab === 'waiting_sender'
                ? waitingItems
                : savedItems
              ).map((item) => {
                const isSelected = item.id === currentIntro.id
                const avatarSlice = listAvatarMap[item.id] || '/design/slices/persona_alex_round.png'
                return (
                  <Link
                    key={item.id}
                    href={`/inbox/${item.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      borderRadius: 14,
                      textDecoration: 'none',
                      background: isSelected ? '#ede9fe' : '#ffffff',
                      border: isSelected ? '1.5px solid #818cf8' : '1px solid #e8e2d5',
                      boxShadow: isSelected
                        ? '0 4px 14px rgba(99, 102, 241, 0.12)'
                        : '0 2px 6px rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarSlice}
                      alt={item.senderName}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 9999,
                        objectFit: 'cover',
                        border: isSelected ? '2px solid #6366f1' : '1px solid #e2ddd3',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '0.925rem', color: '#1e293b' }}>
                          {item.senderName}
                        </strong>
                        <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                          {item.createdAt}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: '0.15rem 0 0',
                          fontSize: '0.78rem',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.senderRole}
                      </p>
                    </div>
                    <span style={{ color: isSelected ? '#4f46e5' : '#cbd5e1', fontSize: '1rem', fontWeight: 600 }}>
                      &rsaquo;
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Column 3: Center-Right Main "A THOUGHTFUL INTRODUCTION" Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              border: '1px solid #e8e2d5',
              padding: '1.75rem',
              boxShadow: '0 12px 36px rgba(35, 26, 12, 0.08)',
              position: 'relative',
            }}
          >
            {/* Header: SignalPass Mark + A THOUGHTFUL INTRODUCTION */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 24, height: 20, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 10, height: 18, borderRadius: 9, background: 'linear-gradient(135deg, #3b28cc, #6346eb)', transform: 'rotate(-20deg)' }} />
                  <div style={{ width: 10, height: 18, borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', transform: 'rotate(-20deg)', marginLeft: -3 }} />
                </div>
                <span
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    color: '#111827',
                  }}
                >
                  SignalPass
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                A THOUGHTFUL INTRODUCTION
              </span>
            </div>

            {/* Connection Header Banner with Alex & Maya Avatars */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '1.25rem 0 1.5rem',
                padding: '0.5rem 1rem',
                position: 'relative',
              }}
            >
              {/* Sender Persona: Alex */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontStyle: 'italic',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: '0.35rem',
                  }}
                >
                  {currentIntro.senderName} reached out &rarr;
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/persona_alex_round.png"
                  alt={currentIntro.senderName}
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: 9999,
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    objectFit: 'cover',
                  }}
                />
                <h4 style={{ margin: '0.5rem 0 0.15rem', fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
                  {currentIntro.senderName}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', maxWidth: 170 }}>
                  {currentIntro.senderRole}
                </p>
              </div>

              {/* Connecting Arc & Shared Curiosity Pill */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0 0.75rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: 140, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="120" height="20" viewBox="0 0 120 20" fill="none">
                    <path
                      d="M 10 16 C 40 2, 80 2, 110 16"
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      fill="none"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    background: '#ede9fe',
                    color: '#4f46e5',
                    padding: '0.3rem 0.85rem',
                    borderRadius: 9999,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)',
                  }}
                >
                  ✦ A SHARED CURIOSITY BRINGS PEOPLE TOGETHER
                </span>
              </div>

              {/* Recipient Persona: Maya (This is you) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontStyle: 'italic',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: '0.35rem',
                  }}
                >
                  &larr; This is you
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/avatar_maya_circle.png"
                  alt={currentIntro.recipientName}
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: 9999,
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    objectFit: 'cover',
                  }}
                />
                <h4 style={{ margin: '0.5rem 0 0.15rem', fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
                  {currentIntro.recipientName}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', maxWidth: 170 }}>
                  {currentIntro.recipientRole}
                </p>
              </div>
            </div>

            {/* "Why this might fit" Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  margin: '0 0 0.95rem',
                  color: '#111827',
                }}
              >
                Why this{' '}
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  might fit
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: -2,
                      width: '100%',
                      height: '3px',
                      background: '#f59e0b',
                      borderRadius: 2,
                    }}
                  />
                </span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Shared curiosity card */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '1.1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      color: '#16a34a',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <LeafIcon size={18} color="#16a34a" />
                    <span>Shared curiosity</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: '#475569', lineHeight: 1.45 }}>
                    You&apos;re both exploring how smaller, more open teams can build meaningful products.
                  </p>
                </div>

                {/* Complementary practice card */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '1.1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      color: '#7c3aed',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <CubeIcon size={18} color="#7c3aed" />
                    <span>Complementary practice</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: '#475569', lineHeight: 1.45 }}>
                    {currentIntro.senderName} brings product experience; you bring a community lens. Different angles, shared goals.
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimers & Security */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.78rem',
                color: '#64748b',
              }}
            >
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ marginTop: 2 }}>
                  <LockIcon size={16} color="#64748b" />
                </span>
                <div>
                  <strong style={{ color: '#1e293b', display: 'block', marginBottom: '0.15rem' }}>
                    Public profiles + consented context
                  </strong>
                  <span style={{ lineHeight: 1.35 }}>
                    Your agent uses publicly available profiles and context you&apos;ve chosen to share.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ marginTop: 2 }}>
                  <SparkleIcon size={16} color="#64748b" />
                </span>
                <div>
                  <strong style={{ color: '#1e293b', display: 'block', marginBottom: '0.15rem' }}>
                    Suggestion, not decision
                  </strong>
                  <span style={{ lineHeight: 1.35 }}>
                    This is a personalized suggestion from your agent. You decide whether to meet.
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Accept / Ask for context / Decline */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Accept button */}
              <Link
                href={`/inbox/${currentIntro.id}/decision?action=accept`}
                style={{
                  flex: 1.3,
                  padding: '0.85rem 1rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  background: '#1e22aa',
                  color: '#ffffff',
                  borderRadius: 9999,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(30, 34, 170, 0.25)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Accept introduction
              </Link>

              {/* Ask for context button */}
              <Link
                href={`/inbox/${currentIntro.id}/decision?action=ask_context`}
                style={{
                  flex: 1,
                  padding: '0.85rem 1rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  background: '#fdfbf7',
                  color: '#1e293b',
                  border: '1px solid #dcd7cc',
                  borderRadius: 9999,
                  textDecoration: 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Ask for context
              </Link>

              {/* Decline button */}
              <Link
                href={`/inbox/${currentIntro.id}/decision?action=decline`}
                style={{
                  flex: 1,
                  padding: '0.85rem 1rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 9999,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Decline introduction
              </Link>
            </div>
          </div>

          {/* Column 4: Right Column with Rohan & Collage */}
          <div style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/06_right_column_full.png"
              alt="Different perspectives brighter possibilities. Mountain arch scrap. People + ideas + Monad = momentum. Rohan sitting with mug"
              style={{
                width: '100%',
                maxWidth: 260,
                objectFit: 'contain',
                filter: 'drop-shadow(0 14px 28px rgba(35, 26, 12, 0.12))',
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
