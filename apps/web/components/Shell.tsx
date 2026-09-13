'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DEMO_SENDER_HANDLE } from '@/lib/api'

const LINKS: readonly { href: string; label: string }[] = [
  { href: '/builders', label: 'Find builders' },
  { href: '/inbox/bob', label: 'Introductions' },
  { href: '/status', label: 'Build status' },
]

/** Which nav item owns a given path. Nested routes keep their section lit. */
function activeSection(pathname: string): string | null {
  for (const link of LINKS) {
    const root = link.href.split('/')[1] ?? ''
    if (root.length > 0 && pathname.startsWith(`/${root}`)) return link.href
  }
  return null
}

export function Shell({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname()
  const active = activeSection(pathname)

  if (pathname === '/') return <>{children}</>

  return (
    <div className="shell">
      <nav className="nav">
        <div className="wrap nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">SP</span>
            <span>SignalPass</span>
          </Link>

          <div className="nav-links">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                data-active={active === link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="nav-identity">
            <span className="pill" data-tone="accent">
              <span className="pill-dot" />
              Personal Agent · {DEMO_SENDER_HANDLE}
            </span>
          </div>
        </div>
      </nav>

      <main className="main">{children}</main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span>SignalPass — introductions for Monad builders. Both people have to opt in.</span>
          <span className="mono">
            Built for the Monad Metropolis Hackathon · Track 03 Social, Attention &amp; Culture
          </span>
        </div>
      </footer>
    </div>
  )
}
