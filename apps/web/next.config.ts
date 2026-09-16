import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

/**
 * Without this Next walks up and finds an unrelated lockfile outside the repo,
 * which silently widens the file-tracing root. Pin it to the monorepo root.
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * `@signalpass/core` ships TypeScript source rather than a build artifact, so
 * Next compiles it alongside the app. That keeps one copy of the state machine
 * and pricing curve shared by the contracts' off-chain twin, the API, the
 * evaluator, the indexer and this UI.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@signalpass/core'],
  outputFileTracingRoot: repoRoot,
  typedRoutes: false,
  // V4 is a native multi-page HTML site. Rewrites keep stable public URLs and
  // leave the existing React/API implementation available outside these routes.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/v4/index.html' },
        { source: '/profile/import', destination: '/v4/profile.html' },
        { source: '/profile/review', destination: '/v4/profile.html?review=1' },
        { source: '/agent', destination: '/v4/agent.html' },
        { source: '/discover/settings', destination: '/v4/agent.html' },
        { source: '/discover', destination: '/v4/discover.html' },
        { source: '/discover/:candidateId', destination: '/v4/discover.html?person=:candidateId' },
        { source: '/widget/create', destination: '/v4/widget.html' },
        { source: '/widget/preview', destination: '/v4/widget-preview.html' },
        { source: '/introductions/new', destination: '/v4/compose.html' },
        { source: '/introductions/new/:candidateId', destination: '/v4/compose.html?person=:candidateId' },
        { source: '/introductions/:id/confirm', destination: '/v4/compose.html?review=1' },
        { source: '/introductions/:id/receipt', destination: '/v4/receipt.html' },
        { source: '/inbox', destination: '/v4/inbox.html' },
        { source: '/inbox/:id/decision', destination: '/v4/inbox.html' },
        { source: '/inbox/:id', destination: '/v4/inbox.html' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig
