'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import type { IntroductionRecord } from '@/lib/v3-data'
import styles from '@/app/v3.module.css'

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

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container1672}>
        <div className={styles.inboxGrid1672}>
          {/* 1. Left Column: Title, Notes, Alex Sitting Thinking */}
          <div>
            <h1 className={styles.serifTitle} style={{ fontSize: '3rem', lineHeight: 1.05, marginBottom: '0.5rem' }}>
              Your<br />
              <span className={styles.orangeBrushWrapper}>
                introductions
              </span>
            </h1>
            <p className={styles.leadText} style={{ fontSize: '1rem', color: '#57534e', lineHeight: 1.4, marginBottom: '1rem' }}>
              People with shared curiosity, learning goals or collaboration ideas.
            </p>

            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/slices/alex_sitting_inbox.png"
                alt="Real people. Shared curiosity. Alex sitting"
                style={{ width: '100%', maxWidth: 240, objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* 2. Center Left Column: 3-Tab Inbox List */}
          <div className={styles.paperTablet} style={{ padding: '1.25rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('needs_look')}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: 9999,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'needs_look' ? '#2528ab' : '#f4efe6',
                  color: activeTab === 'needs_look' ? '#ffffff' : '#4a453e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Needs your look</span>
                <span style={{ width: 18, height: 18, borderRadius: 9999, background: activeTab === 'needs_look' ? '#ffffff' : '#e2ddd3', color: activeTab === 'needs_look' ? '#2528ab' : '#1e293b', fontSize: '0.68rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {needsLookItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('waiting_sender')}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: 9999,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'waiting_sender' ? '#2528ab' : '#f4efe6',
                  color: activeTab === 'waiting_sender' ? '#ffffff' : '#4a453e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Waiting</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({waitingItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saved_later')}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: 9999,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'saved_later' ? '#2528ab' : '#f4efe6',
                  color: activeTab === 'saved_later' ? '#ffffff' : '#4a453e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Saved</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({savedItems.length})</span>
              </button>
            </div>

            {/* List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(activeTab === 'needs_look'
                ? needsLookItems
                : activeTab === 'waiting_sender'
                ? waitingItems
                : savedItems
              ).map((item) => {
                const isSelected = item.id === currentIntro.id
                return (
                  <Link
                    key={item.id}
                    href={`/inbox/${item.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 12,
                      textDecoration: 'none',
                      background: isSelected ? '#ede9fe' : '#ffffff',
                      border: isSelected ? '1.5px solid #818cf8' : '1px solid #e2ddd3',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.senderAvatar}
                      alt={item.senderName}
                      style={{ width: 44, height: 44, borderRadius: 9999, background: '#bae6fd' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{item.senderName}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.createdAt}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.senderRole}
                      </p>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>&gt;</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 3. Center Right Column: A THOUGHTFUL INTRODUCTION Card */}
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
                A THOUGHTFUL INTRODUCTION
              </span>
            </div>

            {/* Avatars & Introduction Direction */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.25rem 0', padding: '0 1rem' }}>
              {/* Alex Reached Out */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span className={styles.handwrittenNote} style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  {currentIntro.senderName} reached out &rarr;
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentIntro.senderAvatar}
                  alt={currentIntro.senderName}
                  style={{ width: 88, height: 88, borderRadius: 9999, background: '#ede9fe', border: '3px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                />
                <h4 style={{ margin: '0.5rem 0 0.1rem', fontSize: '1.15rem', fontWeight: 700 }}>{currentIntro.senderName}</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', maxWidth: 160 }}>{currentIntro.senderRole}</p>
              </div>

              {/* Connecting Pill */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', color: '#6366f1' }}>&rarr;</span>
                <span style={{ background: '#ede9fe', color: '#4f46e5', padding: '0.25rem 0.75rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                  ✦ A SHARED CURIOSITY BRINGS PEOPLE TOGETHER
                </span>
              </div>

              {/* Maya (This is you) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span className={styles.handwrittenNote} style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  &larr; This is you
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentIntro.recipientAvatar}
                  alt={currentIntro.recipientName}
                  style={{ width: 88, height: 88, borderRadius: 9999, background: '#dcfce7', border: '3px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                />
                <h4 style={{ margin: '0.5rem 0 0.1rem', fontSize: '1.15rem', fontWeight: 700 }}>{currentIntro.recipientName}</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', maxWidth: 160 }}>{currentIntro.recipientRole}</p>
              </div>
            </div>

            {/* Why this might fit */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.85rem' }}>
                Why this{' '}
                <span style={{ textDecoration: 'underline', textDecorationColor: '#f59e0b', textDecorationThickness: '3px' }}>
                  might fit
                </span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>🌱</span> <span>Shared curiosity</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.4 }}>
                    You&apos;re both exploring how smaller, more open teams can build meaningful products.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>🧩</span> <span>Complementary practice</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.4 }}>
                    {currentIntro.senderName} brings product experience; you bring a community lens. Different angles, shared goals.
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginBottom: '1.5rem', fontSize: '0.78rem', color: '#64748b' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span>🔒</span>
                <div>
                  <strong style={{ color: '#1e293b', display: 'block' }}>Public profiles + consented context</strong>
                  <span>Your agent uses publicly available profiles and context you&apos;ve chosen to share.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span>✦</span>
                <div>
                  <strong style={{ color: '#1e293b', display: 'block' }}>Suggestion, not decision</strong>
                  <span>This is a personalized suggestion from your agent. You decide whether to meet.</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Accept / Ask / Decline */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href={`/inbox/${currentIntro.id}/decision`}
                className={styles.btnPrimaryBlue}
                style={{ flex: 1.3, padding: '0.75rem', fontSize: '0.9rem', textAlign: 'center' }}
              >
                Accept introduction
              </Link>
              <Link
                href={`/inbox/${currentIntro.id}/decision`}
                className={styles.btnSecondaryCream}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem', textAlign: 'center' }}
              >
                Ask for context
              </Link>
              <Link
                href={`/inbox/${currentIntro.id}/decision`}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 9999,
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Decline introduction
              </Link>
            </div>
          </div>

          {/* 4. Right Column: Rohan Sitting with Mug, Arch Scrap & Notes */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/p6_right_column_clean.png"
              alt="Different perspectives brighter possibilities. Rohan on Monad"
              style={{ width: '100%', maxWidth: 267, objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
