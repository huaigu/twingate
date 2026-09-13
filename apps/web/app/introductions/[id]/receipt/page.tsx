'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useV3Demo } from '@/lib/v3-context'
import { SEEDED_INBOX_INTRODUCTIONS, type IntroductionRecord } from '@/lib/v3-data'
import styles from '@/app/v3.module.css'

const FALLBACK_INTRO: IntroductionRecord = SEEDED_INBOX_INTRODUCTIONS[0]!

export default function IntroductionReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const { getIntroById, introductions } = useV3Demo()

  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? 'intro-1'
  const intro: IntroductionRecord = getIntroById(id) ?? introductions[0] ?? FALLBACK_INTRO

  const receipt = intro.receipt ?? {
    receiptHash: '0x7f83b194a20f92b7c41',
    timestamp: 'Just now',
    bondAmount: '0.05 MON',
    bondRefunded: true,
    evaluationFee: '0.005 MON',
    evaluationSettled: true,
    decision: 'accepted' as const,
    contactChannel: '@alexchen on Telegram & Farcaster (@alexchen.eth)',
    suggestedOpeningQuestion: intro.intent.specificQuestions,
  }

  const isAccepted = receipt.decision === 'accepted'
  const isContext = receipt.decision === 'context_requested'
  const isDeclined = receipt.decision === 'declined'

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container} style={{ maxWidth: '820px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/inbox/intro-1" style={{ fontSize: '0.875rem', color: '#6e5bf0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Introductions
          </Link>
        </div>

        {/* Title Block */}
        <div className={styles.headerBlock}>
          <h1 className={styles.serifTitle}>
            Introduction{' '}
            <span className={styles.orangeBrushWrapper}>
              Receipt
              <span className={styles.orangeBrushStroke} />
            </span>
          </h1>
          <p className={styles.leadText}>
            Transparent, cryptographic settlement proof for introduction lifecycle outcome.
          </p>
        </div>

        {/* Receipt Card */}
        <div className={styles.paperTablet} style={{ position: 'relative' }}>
          {/* Top Status Header */}
          <div className={styles.tabletHeader}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase' }}>
                SIGNALPASS OUTCOME RECEIPT
              </span>
              <h2 className={styles.tabletTitle} style={{ margin: '0.25rem 0' }}>
                {intro.senderName} ↔ {intro.recipientName}
              </h2>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#666' }}>
                Hash: {receipt.receiptHash}
              </span>
            </div>

            <span
              className={
                isAccepted
                  ? styles.badgeVerified
                  : isContext
                  ? styles.badgeSuggested
                  : styles.badgeUnverified
              }
              style={{ fontSize: '0.875rem', padding: '6px 14px' }}
            >
              {isAccepted
                ? '✓ Accepted & Handed Off'
                : isContext
                ? '💬 Clarification Requested'
                : '✋ Declined & Bond Refunded'}
            </span>
          </div>

          {/* Outcome Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', margin: '1.5rem 0' }}>
            {/* Accepted Handoff Box */}
            {isAccepted && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', color: '#16a34a' }}>🎉</span>
                  <strong style={{ fontSize: '1rem', color: '#166534' }}>
                    Private Contact Channel Shared
                  </strong>
                </div>
                <p style={{ fontSize: '0.9375rem', color: '#14532d', margin: '0 0 0.75rem 0' }}>
                  Both parties have consented to connect. You may now continue your conversation directly:
                </p>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #86efac',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    color: '#15803d',
                    fontFamily: 'monospace',
                  }}
                >
                  {receipt.contactChannel}
                </div>
                {receipt.suggestedOpeningQuestion && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#166534' }}>
                    <strong>Recommended opening topic:</strong> {receipt.suggestedOpeningQuestion}
                  </div>
                )}
              </div>
            )}

            {/* Clarification Box */}
            {isContext && (
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', color: '#2563eb' }}>💬</span>
                  <strong style={{ fontSize: '1rem', color: '#1e40af' }}>
                    Follow-up Question Sent
                  </strong>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#1e3a8a', margin: '0 0 0.5rem 0' }}>
                  The recipient has asked for clarification:
                </p>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #93c5fd',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    color: '#1e40af',
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{receipt.decisionNote ?? 'Could you provide additional detail on your background?'}&rdquo;
                </div>
              </div>
            )}

            {/* Declined Box */}
            {isDeclined && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', color: '#dc2626' }}>✋</span>
                  <strong style={{ fontSize: '1rem', color: '#991b1b' }}>
                    Introduction Respectfully Declined
                  </strong>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                  {receipt.decisionNote ? `Recipient note: "${receipt.decisionNote}"` : 'Recipient is currently focusing on other commitments.'}
                </p>
              </div>
            )}

            {/* Financial & Attention Settlement Audit */}
            <div style={{ background: '#f8f6f0', border: '1px solid #ded8cc', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: '#121016' }}>
                Settlement Ledger
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Evaluation Fee (Sender):</span>
                  <span style={{ fontWeight: 600 }}>{receipt.evaluationFee} · Settled to inference pool</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Attention Bond (Sender):</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>
                    {receipt.bondAmount} · 100% Refunded
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Timestamp:</span>
                  <span style={{ color: '#333' }}>{receipt.timestamp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.buttonRow} style={{ justifyContent: 'space-between', borderTop: '1px solid #ede8de', paddingTop: '1.25rem' }}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push('/discover')}
            >
              Discover more people
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => router.push('/inbox/intro-1')}
            >
              Go to Inbox →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
