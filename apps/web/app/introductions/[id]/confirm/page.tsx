'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useV3Demo } from '@/lib/v3-context'
import { SEEDED_INBOX_INTRODUCTIONS, type IntroductionRecord } from '@/lib/v3-data'
import { V3StepProgress } from '@/components/v3/V3StepProgress'
import styles from '@/app/v3.module.css'

const FALLBACK_INTRO: IntroductionRecord = SEEDED_INBOX_INTRODUCTIONS[0]!

export default function IntroductionConfirmPage() {
  const params = useParams()
  const router = useRouter()
  const { getIntroById, confirmAndSendIntroduction, introductions } = useV3Demo()

  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? 'intro-1'
  const intro: IntroductionRecord = getIntroById(id) ?? introductions[0] ?? FALLBACK_INTRO

  function handleConfirmAndSend() {
    confirmAndSendIntroduction(intro.id)
    router.push(`/inbox/${intro.id}`)
  }

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container} style={{ maxWidth: '860px' }}>
        {/* Header with Step Progress */}
        <div className={styles.headerBlock}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h1 className={styles.serifTitle}>
                Confirm &amp;{' '}
                <span className={styles.orangeBrushWrapper}>
                  Send
                  <span className={styles.orangeBrushStroke} />
                </span>
              </h1>
              <p className={styles.leadText}>
                Review what will be shared with {intro.recipientName}&apos;s Gatekeeper.
              </p>
            </div>
            <V3StepProgress
              steps={[
                { number: 1, label: 'Choose' },
                { number: 2, label: 'Draft' },
                { number: 3, label: 'Confirm' },
              ]}
              currentStep={3}
              completedStep={2}
            />
          </div>
        </div>

        {/* Paper Tablet: Summary & Disclosures */}
        <div className={styles.paperTablet} style={{ marginBottom: '1.5rem' }}>
          <div className={styles.tabletHeader}>
            <div>
              <h2 className={styles.tabletTitle}>Pre-send Confirmation</h2>
              <p className={styles.tabletSubtitle}>
                Recipient: <strong>{intro.recipientName}</strong> ({intro.recipientRole})
              </p>
            </div>
            <span className={styles.badgeVerified}>Ready to Lock</span>
          </div>

          {/* Shared Context Review Box */}
          <div style={{ background: '#f8f6f0', border: '1px solid #ded8cc', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: '#121016' }}>
              Introduction Card Content
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <strong>Personal note:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#4b463e', lineHeight: 1.45 }}>
                  {intro.intent.personalNote}
                </p>
              </div>
              <div>
                <strong>Exploration topics:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#4b463e', lineHeight: 1.45 }}>
                  {intro.intent.exploreTopics}
                </p>
              </div>
              <div>
                <strong>What you bring:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#4b463e', lineHeight: 1.45 }}>
                  {intro.intent.whatIOffer}
                </p>
              </div>
              <div>
                <strong>Opening question:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#4b463e', lineHeight: 1.45 }}>
                  {intro.intent.specificQuestions}
                </p>
              </div>
            </div>
          </div>

          {/* Transparent Fee & Refundable Bond Breakdown */}
          <div style={{ borderTop: '1px solid #ede8de', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#121016' }}>
              Fee &amp; Attention Commitment
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#666', margin: '0 0 1rem 0' }}>
              The sender covers the cost of bilateral evaluation. Unsolicited spam is economically disincentivized.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Line 1: Evaluation Fee */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#92400e' }}>
                    Evaluation Fee: {intro.quote.evaluationFee}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#78350f' }}>
                    Non-refundable · Covers your Intro Coach and {intro.recipientName}&apos;s Gatekeeper LLM inference.
                  </div>
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#92400e' }}>
                  Settled on send
                </span>
              </div>

              {/* Line 2: Attention Bond */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#065f46' }}>
                    Attention Bond: {intro.quote.attentionBond}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                    100% Refundable · Returned immediately when {intro.recipientName} responds, or if the request times out.
                  </div>
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#065f46' }}>
                  Refundable escrow
                </span>
              </div>
            </div>
          </div>

          {/* Agent Boundary Disclosure Notice */}
          <div className={styles.noticeBox}>
            <span className={styles.noticeBoxIcon}>🛡</span>
            <div>
              <strong>Human Consent Boundary:</strong>
              <br />
              Your Personal Agent does not automatically send messages or move funds. By clicking &quot;Confirm &amp; Send Introduction&quot;, you are giving explicit authorization to lock this introduction and dispatch it to {intro.recipientName}&apos;s Gatekeeper.
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className={styles.buttonRow} style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => router.push(`/introductions/new/${intro.recipientId}`)}
          >
            ← Back to Edit Draft
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleConfirmAndSend}
          >
            Confirm &amp; Send Introduction →
          </button>
        </div>
      </div>
    </div>
  )
}
