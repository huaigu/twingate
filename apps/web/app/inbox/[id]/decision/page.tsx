'use client'

import React, { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useV3Demo } from '@/lib/v3-context'
import { SEEDED_INBOX_INTRODUCTIONS, type IntroductionRecord } from '@/lib/v3-data'
import styles from '@/app/v3.module.css'

const FALLBACK_INTRO: IntroductionRecord = SEEDED_INBOX_INTRODUCTIONS[0]!

export default function RecipientDecisionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getIntroById, introductions, decideIntroduction, addToast } = useV3Demo()

  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? 'intro-1'
  const intro: IntroductionRecord = getIntroById(id) ?? introductions[0] ?? FALLBACK_INTRO

  const initialAction = searchParams.get('action') as 'accept' | 'ask_context' | 'decline' | null
  const [selectedDecision, setSelectedDecision] = useState<'accepted' | 'context_requested' | 'declined'>(
    initialAction === 'ask_context'
      ? 'context_requested'
      : initialAction === 'decline'
      ? 'declined'
      : 'accepted'
  )

  const [contactHandle, setContactHandle] = useState('@alexchen on Telegram & Farcaster (@alexchen.eth)')
  const [contextQuestion, setContextQuestion] = useState(
    'Could you share a bit more on how your team plans to approach developer documentation?'
  )
  const [declineReason, setDeclineReason] = useState('Focusing entirely on current sprint commitments right now.')

  function handleSubmitDecision() {
    const note =
      selectedDecision === 'accepted'
        ? contactHandle
        : selectedDecision === 'context_requested'
        ? contextQuestion
        : declineReason

    decideIntroduction(intro.id, selectedDecision, note)
    router.push(`/introductions/${intro.id}/receipt`)
  }

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container} style={{ maxWidth: '820px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href={`/inbox/${intro.id}`} style={{ fontSize: '0.875rem', color: '#6e5bf0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Inbox
          </Link>
        </div>

        <div className={styles.headerBlock}>
          <h1 className={styles.serifTitle}>
            Recipient{' '}
            <span className={styles.orangeBrushWrapper}>
              Decision
              <span className={styles.orangeBrushStroke} />
            </span>
          </h1>
          <p className={styles.leadText}>
            You own the final verdict on introductions. Choose how you would like to proceed with {intro.senderName}.
          </p>
        </div>

        <div className={styles.paperTablet}>
          {/* 3 Decision Tabs / Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Option 1: Accept */}
            <div
              className={`${styles.visibilityCard} ${
                selectedDecision === 'accepted' ? styles.visibilityCardActive : ''
              }`}
              onClick={() => setSelectedDecision('accepted')}
              role="button"
              tabIndex={0}
            >
              <div className={styles.visibilityTop}>
                <span>🤝</span>
                <span>Accept</span>
              </div>
              <p className={styles.visibilityDesc}>
                Open private handoff &amp; share communication channel.
              </p>
            </div>

            {/* Option 2: Ask for context */}
            <div
              className={`${styles.visibilityCard} ${
                selectedDecision === 'context_requested' ? styles.visibilityCardActive : ''
              }`}
              onClick={() => setSelectedDecision('context_requested')}
              role="button"
              tabIndex={0}
            >
              <div className={styles.visibilityTop}>
                <span>💬</span>
                <span>Ask for context</span>
              </div>
              <p className={styles.visibilityDesc}>
                Request one clarifying answer before deciding.
              </p>
            </div>

            {/* Option 3: Decline */}
            <div
              className={`${styles.visibilityCard} ${
                selectedDecision === 'declined' ? styles.visibilityCardActive : ''
              }`}
              onClick={() => setSelectedDecision('declined')}
              role="button"
              tabIndex={0}
            >
              <div className={styles.visibilityTop}>
                <span>✋</span>
                <span>Decline</span>
              </div>
              <p className={styles.visibilityDesc}>
                Respectfully pass. 100% of sender&apos;s bond is refunded.
              </p>
            </div>
          </div>

          {/* Decision Specific Configuration */}
          <div style={{ background: '#f8f6f0', padding: '1.25rem', borderRadius: '12px', border: '1px solid #ded8cc', marginBottom: '1.5rem' }}>
            {selectedDecision === 'accepted' && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#166534' }}>
                  ✓ Consented Contact Swap
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#4b463e', marginBottom: '1rem' }}>
                  Choose which contact handles or meeting links will be shared with {intro.senderName}:
                </p>
                <input
                  type="text"
                  value={contactHandle}
                  onChange={(e) => setContactHandle(e.target.value)}
                  className={styles.textInput}
                  placeholder="Telegram / Farcaster / Discord handle or email"
                />
              </div>
            )}

            {selectedDecision === 'context_requested' && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#4338ca' }}>
                  💬 Ask a Clarifying Question
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#4b463e', marginBottom: '1rem' }}>
                  Your Gatekeeper will relay this question to {intro.senderName} without sharing your private contact info yet:
                </p>
                <textarea
                  value={contextQuestion}
                  onChange={(e) => setContextQuestion(e.target.value)}
                  className={styles.textareaInput}
                  rows={3}
                />
              </div>
            )}

            {selectedDecision === 'declined' && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#991b1b' }}>
                  ✋ Respectful Decline
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#4b463e', marginBottom: '1rem' }}>
                  The {intro.quote.attentionBond} attention bond will be refunded back to {intro.senderName}. You can optionally include a brief polite note:
                </p>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className={styles.textareaInput}
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Settlement Transparency Box */}
          <div className={styles.noticeBox}>
            <span className={styles.noticeBoxIcon}>⚖</span>
            <div>
              <strong>Fair Economic Commitment:</strong>
              <br />
              {selectedDecision === 'accepted'
                ? `Accepting this introduction returns the sender's ${intro.quote.attentionBond} bond and fulfills the introduction lifecycle.`
                : selectedDecision === 'context_requested'
                ? `Requesting context pauses timeout counters and holds the ${intro.quote.attentionBond} bond in escrow.`
                : `Declining immediately triggers the automatic refund of ${intro.quote.attentionBond} to the sender. AI models never forfeit bonds unilaterally.`}
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.buttonRow} style={{ justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push(`/inbox/${intro.id}`)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={selectedDecision === 'declined' ? styles.dangerBtn : styles.primaryBtn}
              onClick={handleSubmitDecision}
            >
              Confirm {selectedDecision === 'accepted' ? 'Acceptance' : selectedDecision === 'context_requested' ? 'Question' : 'Decline'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
