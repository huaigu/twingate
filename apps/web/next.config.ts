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
}

export default nextConfig
