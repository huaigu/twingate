'use client'

import React from 'react'
import Link from 'next/link'
import styles from '@/app/v3.module.css'

const NODE_MAPPINGS = [
  { id: 'onboard', label: 'Login & Onboard', route: '/' },
  { id: 'profile_draft', label: 'Profile Import Draft', route: '/profile/import' },
  { id: 'profile_review', label: 'Review & Privacy', route: '/profile/review' },
  { id: 'widget_snapshot', label: 'Profile Widget', route: '/widget/create' },
  { id: 'matching_opt_in', label: 'Matching Settings', route: '/discover/settings' },
  { id: 'candidate_shortlist', label: 'People Discovery', route: '/discover' },
  { id: 'user_select', label: 'Confirm Candidate', route: '/discover/maya' },
  { id: 'intro_draft', label: 'Draft Introduction', route: '/introductions/new/maya' },
  { id: 'consent_lock', label: 'Confirm & Send Lock', route: '/introductions/intro-1/confirm' },
  { id: 'recipient_review', label: 'Recipient Inbox', route: '/inbox/intro-1' },
  { id: 'recipient_decision', label: 'Human Decision', route: '/inbox/intro-1/decision' },
  { id: 'outcomes', label: 'Outcome Receipt', route: '/introductions/intro-1/receipt' },
]

export default function FlowPage() {
  return (
    <div className={styles.v3Page} style={{ paddingBottom: '2rem' }}>
      <div className={styles.v3Container} style={{ maxWidth: '1440px' }}>
        {/* Header Block */}
        <div className={styles.headerBlock} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className={styles.serifTitle} style={{ fontSize: '2.4rem' }}>
                SignalPass V3{' '}
                <span className={styles.orangeBrushWrapper}>
                  Workflow
                  <span className={styles.orangeBrushStroke} />
                </span>
              </h1>
              <p className={styles.leadText}>
                Profile to Introduction state machine and human confirmation gates.
              </p>
            </div>
            <Link href="/" className={styles.secondaryBtn} style={{ padding: '0.5rem 1.25rem' }}>
              ← Return to Home
            </Link>
          </div>
        </div>

        {/* Quick Node Navigator Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6e5bf0', whiteSpace: 'nowrap' }}>
            Interactive Nodes:
          </span>
          {NODE_MAPPINGS.map((node) => (
            <Link
              key={node.id}
              href={node.route}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#374151',
                background: '#ffffff',
                border: '1px solid #dcd7cc',
                padding: '4px 10px',
                borderRadius: '6px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
              title={`Jump to live route ${node.route}`}
            >
              <code>{node.id}</code> · {node.label}
            </Link>
          ))}
        </div>

        {/* Embedded Interactive Diagram Frame */}
        <div
          style={{
            width: '100%',
            height: '780px',
            borderRadius: '16px',
            border: '1px solid #ded8cc',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            background: '#020617',
          }}
        >
          <iframe
            src="/flow-v3.html"
            title="SignalPass V3 Workflow Diagram"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
