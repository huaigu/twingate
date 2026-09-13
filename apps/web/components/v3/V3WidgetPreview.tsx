'use client'

import React from 'react'
import styles from './V3WidgetPreview.module.css'

interface V3WidgetPreviewProps {
  persona: string
  name: string
  oneLiner: string
  interests: string[]
  cta: string
  onCtaClick?: () => void
}

export function V3WidgetPreview({
  persona,
  name,
  oneLiner,
  interests,
  cta,
  onCtaClick,
}: V3WidgetPreviewProps) {
  return (
    <div className={styles.widgetCard} role="region" aria-label="Profile Widget Preview">
      {/* Top row */}
      <div className={styles.topRow}>
        <div className={styles.brandRow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="8" cy="12" r="5" fill="#4338ca" />
            <circle cx="16" cy="12" r="5" fill="#6e5bf0" fillOpacity="0.85" />
          </svg>
          <span className={styles.brandName}>SignalPass</span>
        </div>
        <span className={styles.snapshotBadge}>PUBLIC SNAPSHOT v1</span>
      </div>

      {/* Main card body */}
      <div className={styles.bodyRow}>
        {/* Left Persona */}
        <div className={styles.avatarWrapper}>
          {persona && persona !== 'none' ? (
            <img src={persona} alt="" className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <span>👤</span>
            </div>
          )}
        </div>

        {/* Right Info */}
        <div className={styles.infoCol}>
          <h3 className={styles.name}>{name || 'Alex Chen'}</h3>
          <p className={styles.oneLiner}>
            {oneLiner || 'Building a more open internet with builders.'}
          </p>

          {/* Interests */}
          <div className={styles.interestsRow}>
            {interests.map((interest, idx) => {
              const tones = ['pillPurple', 'pillGreen', 'pillBlue', 'pillOrange', 'pillDefault']
              const toneKey = tones[idx % tones.length] ?? 'pillDefault'
              const toneClass = styles[toneKey] ?? ''
              return (
                <span key={interest} className={`${styles.interestPill} ${toneClass}`}>
                  {interest}
                </span>
              )
            })}
          </div>

          {/* CTA */}
          <button
            type="button"
            className={styles.ctaButton}
            onClick={onCtaClick}
          >
            {cta || 'Meet me on SignalPass'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
