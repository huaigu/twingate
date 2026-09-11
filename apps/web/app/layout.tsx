import type { Metadata } from 'next'
import { Shell } from '@/components/Shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'SignalPass — introductions that both people actually want',
  description:
    'SignalPass is an introduction network for Monad builders. An introduction is the unit of contact, both people opt in, and the AI can never move anyone’s money.',
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
