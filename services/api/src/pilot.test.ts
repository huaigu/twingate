import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import type { Hex } from 'viem'
import { createApp } from './app.js'
import { configuredPilotMode } from './pilot.js'

test('pilot pricing requires an explicit valid opt-in', () => {
  assert.equal(configuredPilotMode({}), false)
  assert.equal(configuredPilotMode({ SIGNALPASS_PILOT_MODE: '' }), false)
  assert.equal(configuredPilotMode({ SIGNALPASS_PILOT_MODE: 'false' }), false)
  assert.equal(configuredPilotMode({ SIGNALPASS_PILOT_MODE: 'true' }), true)
  for (const value of ['1', 'yes', 'TRUE', ' true ']) {
    assert.throws(() => configuredPilotMode({ SIGNALPASS_PILOT_MODE: value }), /Invalid SIGNALPASS_PILOT_MODE/)
  }
})

test('switching pilot mode only affects new profiles, never saved recipient prices or deadlines', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'signalpass-pilot-'))
  const options = { databasePath: join(directory, 'app.sqlite'), origin: 'http://localhost:3004' }
  let api = createApp(options)
  type Identity = { cookie: string; csrf: string }
  const request = async (identity: Identity | null, path: string, body?: unknown) => {
    const response = await api.app.request(path, { method: body === undefined ? 'GET' : 'POST', headers: { origin: options.origin, 'content-type': 'application/json', ...(identity ? { cookie: identity.cookie, 'x-signalpass-csrf': identity.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    assert.equal(response.status, 200)
    return { data: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }
  const login = async (key: number) => {
    const account = privateKeyToAccount(('0x' + key.toString(16).padStart(64, '0')) as Hex)
    const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 143 })
    const signature = await account.signMessage({ message: challenge.data.message })
    const verified = await request(null, '/auth/verify', { nonce: challenge.data.nonce, signature })
    return { cookie: verified.cookie, csrf: verified.data.session.csrf } as Identity
  }
  const profile = (handle: string) => ({ handle, profile: { name: handle, bio: 'Building Monad tools.', interests: 'Monad', offer: 'Simulation tooling.', meet: 'Other builders.' }, agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad'] } })
  try {
    const normal = await login(1)
    await request(normal, '/me/profile', profile('normal'))
    const original = api.store.policies.get('normal')!
    assert.equal(original.baseBond, 2_000_000_000_000_000n)
    assert.equal(original.timeoutSeconds, 259200)
    api.close(); api = createApp({ ...options, pilotMode: true })
    assert.deepEqual(api.store.policies.get('normal'), original)
    await request(normal, '/me/profile', profile('normal'))
    assert.equal(api.store.policies.get('normal')!.baseBond, original.baseBond)
    assert.equal(api.store.policies.get('normal')!.timeoutSeconds, original.timeoutSeconds)

    const pilot = await login(2)
    await request(pilot, '/me/profile', profile('pilot'))
    const reduced = api.store.policies.get('pilot')!
    assert.equal(reduced.baseBond, 100_000_000_000_000n)
    assert.equal(reduced.timeoutSeconds, 600)
    api.close(); api = createApp(options)
    await request(pilot, '/me/profile', profile('pilot'))
    assert.equal(api.store.policies.get('pilot')!.baseBond, reduced.baseBond)
    assert.equal(api.store.policies.get('pilot')!.timeoutSeconds, reduced.timeoutSeconds)
    const later = await login(3)
    await request(later, '/me/profile', profile('later'))
    assert.equal(api.store.policies.get('later')!.baseBond, original.baseBond)
    assert.equal(api.store.policies.get('later')!.timeoutSeconds, original.timeoutSeconds)
  } finally { api.close(); rmSync(directory, { recursive: true, force: true }) }
})
