import type { Metadata } from 'next'
import { Shell } from '@/components/Shell'
import { V3DemoProvider } from '@/lib/v3-context'
import { V3Toast } from '@/components/v3/V3Toast'
import '@fontsource-variable/manrope'
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
        <template
          dangerouslySetInnerHTML={{
            __html:
              '<!-- THESIS: Personal agents make a first introduction human and legible. OWN-WORLD: Blender-authored Builder Personas and a physical Introduction Card on a paper editorial stage, with ink navy, cobalt, Monad violet and signal mint. STORY: Meet builders, understand shared context, try the seeded introduction. FIRST VIEWPORT: Large invitation at left, two animated 3D personas and a 3D card at right, visible directory action. FORM: A tactile introduction studio where agents prepare and people decide. FINISH: unreviewed and undocumented is unfinished; the Blender source and exported GLB carry the scene provenance. -->',
          }}
        />
        <V3DemoProvider>
          <Shell>{children}</Shell>
          <V3Toast />
        </V3DemoProvider>
      </body>
    </html>
  )
}
