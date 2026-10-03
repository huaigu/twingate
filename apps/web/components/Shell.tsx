'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { V3Nav } from './v3/V3Nav'

export function Shell({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname()

  // Homepage renders its own self-contained 1:1 hero navigation and stage
  if (pathname === '/') {
    return <>{children}</>
  }

  // Public deployment information must not inherit the legacy demo identity.
  if (pathname === '/status') {
    return (
      <div className="shell">
        <header className="nav">
          <div className="wrap row-between" style={{ flexWrap: 'wrap', paddingTop: 14, paddingBottom: 14 }}>
            <Link href="/" className="brand" aria-label="SignalPass home">SignalPass</Link>
            <nav className="row" aria-label="Public navigation" style={{ flexWrap: 'wrap' }}>
              <Link href="/discover?demo=1" className="nav-link">Sample tour</Link>
              <Link href="/assistant?demo=0" className="nav-link">Live agent</Link>
            </nav>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    )
  }

  return (
    <div className="v3-shell-wrapper">
      <V3Nav />
      <main className="v3-shell-main">{children}</main>
    </div>
  )
}
