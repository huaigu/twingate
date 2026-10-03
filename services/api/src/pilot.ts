import type { GatePolicy } from '@signalpass/core'

/** Pilot pricing is opt-in; existing recipient policies are never migrated. */
export function configuredPilotMode(env: Record<string, string | undefined> = process.env): boolean {
  const value = env.SIGNALPASS_PILOT_MODE
  if (value === undefined || value === '' || value === 'false') return false
  if (value === 'true') return true
  throw new Error('Invalid SIGNALPASS_PILOT_MODE configuration; use true or false.')
}

export function profilePolicyDefaults(pilotMode: boolean): Pick<GatePolicy, 'baseBond' | 'timeoutSeconds'> {
  return pilotMode
    ? { baseBond: 100_000_000_000_000n, timeoutSeconds: 600 }
    : { baseBond: 2_000_000_000_000_000n, timeoutSeconds: 259200 }
}
