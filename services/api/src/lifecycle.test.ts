import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLifecycle } from './lifecycle.js'

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done }); return { promise, resolve } }

test('shutdown drains request and background work, rejects new work, and closes storage once', async () => {
  const request = deferred<Response>(), reconciliation = deferred<void>()
  const events: string[] = []
  const lifecycle = createLifecycle({ graceMs: 1000, closeResources: () => events.push('database closed'), exit: (code) => events.push(`exit ${code}`) })
  const fetch = lifecycle.fetch(() => request.promise)
  const active = fetch(new Request('http://localhost/agent/discover'))
  const background = lifecycle.background(() => reconciliation.promise)
  let closeServer!: () => void
  const server = { close: (done: () => void) => { events.push('server closing'); closeServer = done }, closeAllConnections: () => events.push('forced connections') }
  const stopping = lifecycle.stop(server)
  assert.equal(lifecycle.stop(server), stopping)
  const rejected = await fetch(new Request('http://localhost/ready'))
  assert.equal(rejected.status, 503)
  assert.equal((await rejected.json() as { error: string }).error, 'service_draining')
  assert.equal(rejected.headers.get('cache-control'), 'no-store')
  await lifecycle.background(() => assert.fail('New background work must not start during shutdown'))
  request.resolve(Response.json({ complete: true })); await active
  closeServer()
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.deepEqual(events, ['server closing'])
  reconciliation.resolve(); await background
  assert.deepEqual(await stopping, { forced: false, exitCode: 0 })
  assert.deepEqual(events, ['server closing', 'database closed', 'exit 0'])
})

test('a hung connection or handler cannot hold shutdown past its deadline', async () => {
  const blocked = deferred<Response>(), events: string[] = []
  const lifecycle = createLifecycle({ graceMs: 15, closeResources: () => events.push('database closed'), exit: (code) => events.push(`exit ${code}`) })
  const active = lifecycle.fetch(() => blocked.promise)(new Request('http://localhost/agent/discover'))
  const result = await lifecycle.stop({ close: () => {}, closeAllConnections: () => events.push('forced connections') })
  assert.deepEqual(result, { forced: true, exitCode: 1 })
  assert.deepEqual(events, ['forced connections', 'database closed', 'exit 1'])
  // The injected exit callback lets this test finish; production exits immediately.
  blocked.resolve(new Response()); await active
})

test('failed requests release their drain reservations and storage close failure exits nonzero', async () => {
  const exits: number[] = []
  const lifecycle = createLifecycle({ graceMs: 1000, closeResources: () => { throw new Error('fixture close failure') }, exit: (code) => exits.push(code) })
  await assert.rejects(lifecycle.fetch(() => { throw new Error('fixture request failure') })(new Request('http://localhost/')), /fixture request failure/)
  const result = await lifecycle.stop({ close: (done) => done(), closeAllConnections: () => assert.fail('No forced close expected') })
  assert.deepEqual(result, { forced: false, exitCode: 1 })
  assert.deepEqual(exits, [1])
})
