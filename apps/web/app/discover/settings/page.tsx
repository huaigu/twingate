'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import styles from '@/app/v3.module.css'

export default function DiscoverSettingsPage() {
  const router = useRouter()
  const {
    profile,
    setAllowAgentMatching,
    toggleAllowedSource,
    selectedGoal,
    setSelectedGoal,
    addToast,
  } = useV3Demo()

  function handleSave() {
    addToast('Discovery preferences saved!', 'success')
    router.push('/discover')
  }

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container} style={{ maxWidth: '800px' }}>
        <div className={styles.headerBlock}>
          <Link href="/discover" style={{ fontSize: '0.875rem', color: '#6e5bf0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
            ← Back to Discover
          </Link>
          <h1 className={styles.serifTitle}>
            Discovery{' '}
            <span className={styles.orangeBrushWrapper}>
              Settings
              <span className={styles.orangeBrushStroke} />
            </span>
          </h1>
          <p className={styles.leadText}>
            Control your privacy boundaries, matching intents, and data source permissions.
          </p>
        </div>

        <div className={styles.paperTablet} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Allow Agent Matching */}
          <div className={styles.switchRow}>
            <div className={styles.switchLabelBlock}>
              <span className={styles.switchTitle}>Allow Agent matching</span>
              <span className={styles.switchSubtitle}>
                Allow your Personal Agent to privately evaluate common ground with other builders.
              </span>
            </div>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={profile.allowAgentMatching}
                onChange={(e) => {
                  setAllowAgentMatching(e.target.checked)
                  addToast(`Agent matching set to ${e.target.checked ? 'On' : 'Off'}`, 'info')
                }}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {/* Section 2: Default Intent Focus */}
          <div style={{ borderTop: '1px solid #ede8de', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Default Intent Focus
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
              When your agent searches for people, which default category aligns with your goals?
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(['chat', 'collaborate', 'learn'] as const).map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setSelectedGoal(goal)}
                  className={styles.secondaryBtn}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: selectedGoal === goal ? '#ede9fe' : '#ffffff',
                    borderColor: selectedGoal === goal ? '#6e5bf0' : '#d1cbbe',
                    color: selectedGoal === goal ? '#4b39c4' : '#27231e',
                    fontWeight: selectedGoal === goal ? 700 : 500,
                  }}
                >
                  {goal === 'chat' ? '💬 Chat' : goal === 'collaborate' ? '👥 Collaborate' : '📖 Learn'}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Allowed Data Sources */}
          <div style={{ borderTop: '1px solid #ede8de', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Allowed Data Sources
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={profile.allowedSources.github}
                  onChange={(e) => toggleAllowedSource('github', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#6e5bf0' }}
                />
                <span style={{ fontSize: '0.9375rem' }}>🐙 GitHub (public contributions and repositories)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={profile.allowedSources.twitter}
                  onChange={(e) => toggleAllowedSource('twitter', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#6e5bf0' }}
                />
                <span style={{ fontSize: '0.9375rem' }}>𝕏 Twitter / X (public posts and discussions)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={profile.allowedSources.website}
                  onChange={(e) => toggleAllowedSource('website', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#6e5bf0' }}
                />
                <span style={{ fontSize: '0.9375rem' }}>🌐 Other public links (blog, portfolio, projects)</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className={styles.buttonRow} style={{ marginTop: '1rem' }}>
            <button type="button" className={styles.primaryBtn} onClick={handleSave}>
              Save Preferences &amp; Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
