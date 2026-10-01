import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runtimeConfig } from './runtime.js'

const defaultPath = '/local/signalpass.sqlite'
const production = { NODE_ENV: 'production', APP_ORIGIN: 'https://signalpass.example', SIGNALPASS_DB_PATH: '/data/signalpass.sqlite' }

test('development defaults bind loopback; production explicitly chooses HTTPS origin and an absolute data path', () => {
  assert.deepEqual(runtimeConfig({}, defaultPath), { origin: 'http://localhost:3004', databasePath: defaultPath, hostname: '127.0.0.1', port: 8789, shutdownGraceMs: 75000 })
  assert.equal(runtimeConfig({ SIGNALPASS_DB_PATH: '' }, defaultPath).databasePath, defaultPath)
  assert.equal(runtimeConfig({ SIGNALPASS_DB_PATH: ':memory:' }, defaultPath).databasePath, ':memory:')
  assert.deepEqual(runtimeConfig({ ...production, API_HOST: '0.0.0.0', API_PORT: '8791', API_SHUTDOWN_GRACE_MS: '70000' }, defaultPath), { origin: production.APP_ORIGIN, databasePath: production.SIGNALPASS_DB_PATH, hostname: '0.0.0.0', port: 8791, shutdownGraceMs: 70000 })
  assert.throws(() => runtimeConfig({ NODE_ENV: 'production' }, defaultPath), /APP_ORIGIN/)
  assert.throws(() => runtimeConfig({ NODE_ENV: 'production', APP_ORIGIN: production.APP_ORIGIN }, defaultPath), /SIGNALPASS_DB_PATH/)
  for (const value of ['', ':memory:', './data.sqlite', 'file:memory', '/data/test\u0000.sqlite']) {
    assert.throws(() => runtimeConfig({ ...production, SIGNALPASS_DB_PATH: value }, defaultPath), /SIGNALPASS_DB_PATH/)
  }
})

test('origins cannot smuggle a path, credentials, query, fragment, or an insecure production scheme', () => {
  for (const APP_ORIGIN of ['http://signalpass.example', 'https://signalpass.example/', 'https://signalpass.example/path', 'https://user:PRIVATE_CANARY@signalpass.example', 'https://signalpass.example?PRIVATE_CANARY', 'https://signalpass.example#PRIVATE_CANARY', 'ftp://signalpass.example', 'null', '']) {
    assert.throws(() => runtimeConfig({ ...production, APP_ORIGIN }, defaultPath), (error: unknown) => {
      assert(error instanceof Error)
      assert.equal(error.message, 'Invalid APP_ORIGIN configuration.')
      assert(!error.message.includes('PRIVATE_CANARY'))
      return true
    })
  }
  assert.throws(() => runtimeConfig({ APP_ORIGIN: 'ftp://localhost' }, defaultPath), /APP_ORIGIN/)
  assert.equal(runtimeConfig({ ...production, APP_ORIGIN: 'https://signalpass.example:8443' }, defaultPath).origin, 'https://signalpass.example:8443')
})

test('port, bind address and shutdown grace reject malformed and out-of-range settings', () => {
  for (const API_PORT of ['0', '-1', '65536', '1.5', 'Infinity', '1e3', '']) assert.throws(() => runtimeConfig({ API_PORT }, defaultPath), /API_PORT/)
  for (const API_HOST of ['', 'http://127.0.0.1', '127.0.0.1:8789', '999.0.0.1', '[::1]', '0.0.0.0\n']) assert.throws(() => runtimeConfig({ API_HOST }, defaultPath), /API_HOST/)
  for (const API_SHUTDOWN_GRACE_MS of ['0', '999', '120001', '-1', '1.2']) assert.throws(() => runtimeConfig({ API_SHUTDOWN_GRACE_MS }, defaultPath), /API_SHUTDOWN_GRACE_MS/)
  for (const API_HOST of ['localhost', '127.0.0.1', '0.0.0.0', '::', '::1']) assert.equal(runtimeConfig({ API_HOST }, defaultPath).hostname, API_HOST)
})
