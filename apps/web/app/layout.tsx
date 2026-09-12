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
        <template
          dangerouslySetInnerHTML={{
            __html:
              '<!-- THESIS: Personal agents make a first introduction human and legible. OWN-WORLD: Cobalt and apricot ceramic personas on sky blue, chalk ground, Manrope lettering, compact result slips. STORY: Meet builders, understand shared context, try the seeded introduction. FIRST VIEWPORT: Large three-line headline at left, two interactive 3D personas and owner summary at right, visible directory action. FORM: Designer-toy introduction studio, grounded candidate 5, seed f1b06f20. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->',
          }}
        />
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
