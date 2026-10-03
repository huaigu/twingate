import { serve } from '@hono/node-server'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { configuredChain } from './chain.js'
import { configuredHostedAgent } from './agent-provider.js'
import { runtimeConfig } from './runtime.js'
import { createLifecycle } from './lifecycle.js'
import { configuredPilotMode } from './pilot.js'

const config = runtimeConfig(process.env, fileURLToPath(new URL('../../../.data/signalpass.sqlite', import.meta.url)))
const pilotMode = configuredPilotMode()
const api = createApp({
  chain: configuredChain(pilotMode),
  pilotMode,
  databasePath: config.databasePath,
  origin: config.origin,
  evaluatorUrl: process.env.EVALUATOR_URL || undefined,
  agent: configuredHostedAgent(),
})
// An interrupted provider call is retryable after restart; it never grants access.
for (const intro of api.store.introductions.values()) {
  if (intro.settlement === 'offchain' && intro.state === 'evaluating') api.store.introductions.set(intro.id, { ...intro, state: 'submitted', revision: intro.revision + 1 })
}
const lifecycle = createLifecycle({ graceMs: config.shutdownGraceMs, closeResources: api.close, exit: (code) => process.exit(code) })
const reconciliation = setInterval(() => { void lifecycle.background(api.syncChain).catch(() => console.error('[api] Background reconciliation failed.')) }, 4000)
reconciliation.unref()
const server = serve({ fetch: lifecycle.fetch(api.app.fetch), port: config.port, hostname: config.hostname }, () => console.log(`@signalpass/api listening on ${config.hostname}:${config.port}; authenticated SQLite mode`))
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => {
  clearInterval(reconciliation)
  void lifecycle.stop(server)
})
