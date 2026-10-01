import { isAbsolute } from 'node:path'
import { isIP } from 'node:net'

export interface RuntimeConfig {
  origin: string
  databasePath: string
  hostname: string
  port: number
  shutdownGraceMs: number
}

const invalid = (setting: string): never => { throw new Error(`Invalid ${setting} configuration.`) }
function integer(value: string | undefined, fallback: number, setting: string, min: number, max: number) {
  if (value === undefined) return fallback
  if (!/^\d+$/.test(value)) return invalid(setting)
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < min || number > max) return invalid(setting)
  return number
}

/** Production must opt into its public origin and a mounted data path explicitly. */
export function runtimeConfig(env: Record<string, string | undefined>, defaultDatabasePath: string): RuntimeConfig {
  const production = env.NODE_ENV === 'production'
  const origin = env.APP_ORIGIN ?? (production ? invalid('APP_ORIGIN') : 'http://localhost:3004')
  try {
    const url = new URL(origin)
    if (url.origin !== origin || url.username || url.password || url.search || url.hash ||
      !['http:', 'https:'].includes(url.protocol) || (production && url.protocol !== 'https:')) invalid('APP_ORIGIN')
  } catch { invalid('APP_ORIGIN') }
  const databasePath = env.SIGNALPASS_DB_PATH || (production ? invalid('SIGNALPASS_DB_PATH') : defaultDatabasePath)
  if (!databasePath || /[\x00-\x1f]/.test(databasePath) ||
    (production && (!isAbsolute(databasePath) || databasePath === ':memory:'))) invalid('SIGNALPASS_DB_PATH')
  const hostname = env.API_HOST ?? '127.0.0.1'
  if (hostname !== 'localhost' && !isIP(hostname)) invalid('API_HOST')
  return {
    origin, databasePath, hostname,
    port: integer(env.API_PORT, 8789, 'API_PORT', 1, 65535),
    shutdownGraceMs: integer(env.API_SHUTDOWN_GRACE_MS, 75000, 'API_SHUTDOWN_GRACE_MS', 1000, 120000),
  }
}
