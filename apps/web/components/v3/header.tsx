import React from 'react'
import Link from 'next/link'

export function SignalPassHeader({ activeNav = '' }: { activeNav?: string }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2.5rem',
        maxWidth: '1672px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#14121a' }}>
          {/* Monad Violet Beans Logo */}
          <div style={{ width: 34, height: 26, display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 14, height: 24, borderRadius: 12, background: 'linear-gradient(135deg, #3b28cc, #6346eb)', transform: 'rotate(-20deg)' }} />
            <div style={{ width: 14, height: 24, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', transform: 'rotate(-20deg)', marginLeft: -4 }} />
          </div>
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            SignalPass
          </span>
        </Link>
        <div style={{ borderLeft: '1px solid #ded8cc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6b655b', textTransform: 'uppercase' }}>BUILDERS</span>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6b655b', textTransform: 'uppercase' }}>FIND BUILDERS</span>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6b655b', textTransform: 'uppercase' }}>ON MONAD</span>
        </div>
      </div>

      {/* Center Slogan */}
      <div style={{ fontSize: '0.9375rem', color: '#555048', fontWeight: 500 }}>
        A more thoughtful internet starts with better introductions.
      </div>

      {/* Right Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#4a453e' }}>
          <Link href="/flow" style={{ textDecoration: 'none', color: activeNav === 'how-it-works' ? '#2328b0' : 'inherit', fontWeight: activeNav === 'how-it-works' ? 700 : 500 }}>
            How it works
          </Link>
          <Link href="/builders" style={{ textDecoration: 'none', color: activeNav === 'for-builders' ? '#2328b0' : 'inherit', fontWeight: activeNav === 'for-builders' ? 700 : 500 }}>
            For builders
          </Link>
          <Link href="/discover" style={{ textDecoration: 'none', color: activeNav === 'our-approach' ? '#2328b0' : 'inherit', fontWeight: activeNav === 'our-approach' ? 700 : 500 }}>
            Our approach
          </Link>
        </nav>

        <Link
          href="/discover"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.4rem',
            background: '#1e22aa',
            color: '#ffffff',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(30, 34, 170, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          Explore introductions &rarr;
        </Link>

        {/* User Pill */}
        <Link
          href="/profile/review"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem 0.35rem 0.4rem',
            background: '#ffffff',
            border: '1px solid #dcd7cc',
            borderRadius: '9999px',
            textDecoration: 'none',
            color: '#1e293b',
            fontSize: '0.8125rem',
            fontWeight: 600,
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design/slices/persona_alex_round.png" alt="Alex Chen" style={{ width: 26, height: 26, borderRadius: 9999, objectFit: 'cover' }} />
          <span>Alex Chen</span>
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#22c55e', display: 'inline-block' }} />
        </Link>
      </div>
    </header>
  )
}
