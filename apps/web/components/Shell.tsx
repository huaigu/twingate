'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { V3Nav } from './v3/V3Nav'

export function Shell({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname()

  // Homepage renders its own self-contained 1:1 hero navigation and stage
  if (pathname === '/') {
    return <>{children}</>
  }

  return (
    <div className="v3-shell-wrapper">
      <V3Nav />
      <main className="v3-shell-main">{children}</main>
    </div>
  )
}
