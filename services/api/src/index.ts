import { serve } from '@hono/node-server'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { configuredChain } from './chain.js'
import { configuredHostedAgent } from './agent-provider.js'

const api = createApp({
  chain: configuredChain(),
  databasePath: process.env.SIGNALPASS_DB_PATH || fileURLToPath(new URL('../../../.data/signalpass.sqlite', import.meta.url)),
  origin: process.env.APP_ORIGIN ?? 'http://localhost:3004',
  evaluatorUrl: process.env.EVALUATOR_URL || undefined,
  agent: configuredHostedAgent(),
})
// An interrupted provider call is retryable after restart; it never grants access.
for (const intro of api.store.introductions.values()) {
  if (intro.settlement === 'offchain' && intro.state === 'evaluating') api.store.introductions.set(intro.id, { ...intro, state: 'submitted', revision: intro.revision + 1 })
}
const reconciliation = setInterval(() => { void api.syncChain() }, 4000)
reconciliation.unref()
const port = Number(process.env.API_PORT ?? 8789)
const server = serve({ fetch: api.app.fetch, port }, () => console.log(`@signalpass/api listening on http://localhost:${port}; authenticated SQLite mode`))
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { clearInterval(reconciliation); server.close(() => { api.close(); process.exit(0) }) })
