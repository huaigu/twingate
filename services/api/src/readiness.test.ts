import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { privateKeyToAccount } from 'viem/accounts'
import { createApp } from './app.js'
import { runtimeConfig } from './runtime.js'

test('public readiness checks only SQLite and returns a safe 503 when it cannot be queried', async () => {
  const api = createApp({ origin: 'https://signalpass.example', agent: { model: { provider: 'fixture', model: 'fixture', generate: () => { assert.fail('Readiness must not invoke a provider') } } } })
  const ready = await api.app.request('/ready')
  assert.equal(ready.status, 200)
  assert.deepEqual(await ready.json(), { ok: true, ready: true, service: '@signalpass/api', checks: { database: 'ok' }, scope: 'database_only' })
  assert.equal(ready.headers.get('cache-control'), 'no-store')
  assert.equal((await api.app.request('/health')).status, 200)
  api.close()
  const unavailable = await api.app.request('/ready', { headers: { cookie: 'signalpass_session=' + 'a'.repeat(64) } })
  assert.equal(unavailable.status, 503)
  assert.deepEqual(await unavailable.json(), { ok: false, ready: false, error: 'database_unavailable' })
})

test('production origin binds SIWE and Secure host-only cookies; the same session survives a database reopen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'signalpass-production-session-'))
  const config = runtimeConfig({ NODE_ENV: 'production', APP_ORIGIN: 'https://signalpass.example', SIGNALPASS_DB_PATH: join(dir, 'app.sqlite') }, 'unused')
  let api = createApp(config)
  const account = privateKeyToAccount('0x0000000000000000000000000000000000000000000000000000000000000007')
  const post = (path: string, body: unknown, origin = config.origin) => api.app.request(path, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  try {
    const challenge = await (await post('/auth/challenge', { address: account.address, chainId: 10143 })).json() as { nonce: string; message: string }
    assert(challenge.message.includes('signalpass.example wants you to sign in'))
    assert(challenge.message.includes('URI: https://signalpass.example'))
    const signature = await account.signMessage({ message: challenge.message })
    assert.equal((await post('/auth/verify', { nonce: challenge.nonce, signature }, 'http://signalpass.example')).status, 403)
    const login = await post('/auth/verify', { nonce: challenge.nonce, signature })
    assert.equal(login.status, 200)
    const cookie = login.headers.get('set-cookie')!
    assert.match(cookie, /; Secure(?:;|$)/)
    assert.match(cookie, /; HttpOnly(?:;|$)/)
    assert.match(cookie, /; SameSite=Lax(?:;|$)/)
    assert(!/; Domain=/i.test(cookie))
    api.close(); api = createApp(config)
    const me = await api.app.request('/me', { headers: { cookie: cookie.split(';')[0]! } })
    assert.equal(me.status, 200)
    const data = await me.json() as { session: { address: string } }
    assert.equal(data.session.address, account.address.toLowerCase())
    assert.equal((await api.app.request('/ready')).status, 200)
  } finally { api.close(); rmSync(dir, { recursive: true, force: true }) }
})
