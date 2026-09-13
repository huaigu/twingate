'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import styles from './V3Nav.module.css'

export function V3Nav() {
  const pathname = usePathname()
  const { profile, introductions } = useV3Demo()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isOnboard = pathname === '/profile/import'

  return (
    <header className={styles.navHeader} role="banner">
      <div className={styles.navContainer}>
        {/* Brand Group */}
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.brandLink} aria-label="SignalPass Homepage">
            <svg
              className={styles.brandIcon}
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="7.5" cy="12" r="5.5" fill="#4338ca" />
              <circle cx="16.5" cy="12" r="5.5" fill="#6e5bf0" fillOpacity="0.9" />
            </svg>
            <span className={styles.brandTitle}>SignalPass</span>
          </Link>
          <div className={styles.brandTaglineStacked}>
            <span>BUILDERS</span>
            <span>FIND BUILDERS</span>
            <span>ON MONAD</span>
          </div>
        </div>

        {/* Center Editorial Slogan (hidden on onboard) */}
        {!isOnboard && (
          <div className={styles.centerEditorial}>
            A more thoughtful internet starts with better introductions.
          </div>
        )}

        {/* Right Section */}
        {isOnboard ? (
          <div className={styles.onboardNote}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/note_your_agent_writes.png"
              alt="Your agent writes. You approve."
              className={styles.noteAgentWrites}
            />
          </div>
        ) : (
          <div className={styles.rightGroup}>
            <nav className={styles.desktopLinks} aria-label="Main Navigation">
              <Link href="/flow" className={styles.navLink}>
                How it works
              </Link>
              <Link
                href="/profile/review"
                className={`${styles.navLink} ${pathname === '/profile/review' ? styles.navLinkActive : ''}`}
              >
                For builders
              </Link>
              <Link
                href="/discover"
                className={`${styles.navLink} ${pathname === '/discover' ? styles.navLinkActive : ''}`}
              >
                Our approach
              </Link>
              <Link href="/discover" className={styles.exploreButton}>
                Explore introductions &rarr;
              </Link>
            </nav>

            {/* Identity Capsule */}
            <Link href="/profile/review" className={styles.identityButton} title="View your agent profile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatarUrl || '/design/avatars/alex.png'}
                alt={profile.name}
                className={styles.avatarImg}
              />
              <span className={styles.identityText}>{profile.name}</span>
              <span className={styles.statusDot} aria-hidden="true" />
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className={styles.mobileToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && !isOnboard && (
        <div className={styles.mobileDropdown}>
          <Link
            href="/discover"
            className={styles.mobileNavLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>Discover</span>
          </Link>
          <Link
            href="/profile/review"
            className={styles.mobileNavLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>My Agent</span>
          </Link>
          <Link
            href="/inbox/intro-1"
            className={styles.mobileNavLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>Inbox</span>
          </Link>
          <Link
            href="/widget/create"
            className={styles.mobileNavLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>Widget</span>
          </Link>
          <Link
            href="/flow"
            className={styles.mobileNavLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>Workflow V3</span>
          </Link>
          <div className={styles.mobileDivider} />
          <Link
            href="/discover"
            className={styles.mobileCta}
            onClick={() => setMobileMenuOpen(false)}
          >
            Explore introductions &rarr;
          </Link>
        </div>
      )}
    </header>
  )
}
