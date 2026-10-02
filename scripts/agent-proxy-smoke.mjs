#!/usr/bin/env node
/**
 * Real Next rewrite regression: a local response arriving after 32 seconds
 * must survive the proxy. No provider, wallet, API credentials or delivery.
 * Run from any directory: node scripts/agent-proxy-smoke.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import { isDeepStrictEqual } from 'node:util';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(repo, 'apps/web');
const nextBin = path.join(app, 'node_modules/next/dist/bin/next');
const waitMs = 32_000;
let delayedRequests = 0;
const pendingTimers = new Set();
const upstream = createServer(async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ localFixture: true }));
    return;
  }
  if (request.url !== '/agent/discover' || request.method !== 'POST') { response.writeHead(404).end(); return; }
  delayedRequests++;
  // Drain the tiny request so the check exercises waiting for an upstream
  // response, rather than a stalled client upload.
  for await (const _chunk of request) { /* no body storage */ }
  const timer = setTimeout(() => {
    pendingTimers.delete(timer);
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ localFixture: true, delayedMs: waitMs }));
  }, waitMs);
  pendingTimers.add(timer);
  response.on('close', () => { clearTimeout(timer); pendingTimers.delete(timer); });
});
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
await listen(upstream);
// Let the OS allocate an available port for the isolated Next process.
const portReservation = createServer();
await listen(portReservation);
const nextPort = portReservation.address().port;
await new Promise(resolve => portReservation.close(resolve));
await mkdir(path.join(app, '.run'), { recursive: true });
const dist = await mkdtemp(path.join(app, '.run/proxy-smoke-'));
const tsconfigPath = path.join(app, 'tsconfig.json');
const originalTsconfig = await readFile(tsconfigPath, 'utf8');
const origin = `http://127.0.0.1:${nextPort}`;
let child;
try {
  child = spawn(process.execPath, [nextBin, 'dev', '--hostname', '127.0.0.1', '--port', String(nextPort)], {
    cwd: app,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      SIGNALPASS_NEXT_DIST: path.relative(app, dist),
      SIGNALPASS_API_ORIGIN: `http://127.0.0.1:${upstream.address().port}`,
    },
    stdio: 'ignore',
  });
  let spawnError;
  child.once('error', error => { spawnError = error; });
  const startupDeadline = performance.now() + 45_000;
  let ready = false;
  while (performance.now() < startupDeadline) {
    assert(!spawnError && child.exitCode === null, 'The isolated Next process could not start.');
    try {
      const response = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(1000) });
      if (response.ok && (await response.json()).localFixture) { ready = true; break; }
    } catch { /* Next is still starting. */ }
    await delay(150);
  }
  assert(ready, 'The isolated Next proxy did not become ready within 45 seconds.');
  console.log('Ready: real Next rewrite with a local-only API fixture. Waiting for a 32-second response.');
  const started = performance.now();
  const response = await fetch(origin + '/api/agent/discover', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ goal: 'Local transport verification only.' }),
    signal: AbortSignal.timeout(65_000),
  });
  const elapsed = Math.round(performance.now() - started);
  assert.equal(response.status, 200, `Next rejected the delayed local response after ${elapsed} ms.`);
  assert.deepEqual(await response.json(), { localFixture: true, delayedMs: waitMs });
  assert(elapsed >= 31_000, 'The fixture did not exercise a delay beyond Next’s 30-second default.');
  assert.equal(delayedRequests, 1, 'The local fixture must receive exactly one delayed request.');
  console.log(`PASS: HTTP 200 through the real Next proxy after ${elapsed} ms; one local request, zero provider calls.`);
} finally {
  if (child && child.exitCode === null && child.signalCode === null) {
    const stopped = new Promise(resolve => child.once('exit', resolve));
    child.kill('SIGTERM');
    const forceStop = setTimeout(() => child.kill('SIGKILL'), 5000);
    await stopped;
    clearTimeout(forceStop);
  }
  for (const timer of pendingTimers) clearTimeout(timer);
  upstream.closeAllConnections();
  await new Promise(resolve => upstream.close(resolve));
  await rm(dist, { recursive: true, force: true });
  // Next adds its temporary generated-types directory to tsconfig and formats
  // the file. Restore only this known automatic rewrite; preserve concurrent edits.
  const currentTsconfig = await readFile(tsconfigPath, 'utf8');
  if (currentTsconfig !== originalTsconfig) {
    const original = JSON.parse(originalTsconfig), current = JSON.parse(currentTsconfig);
    const generatedTypes = path.relative(app, dist) + '/types/**/*.ts';
    const normalized = value => ({ ...value, include: [...(value.include || [])].filter(entry => entry !== generatedTypes).sort() });
    assert(isDeepStrictEqual(normalized(original), normalized(current)), 'Next changed tsconfig beyond its generated-types entry; concurrent changes were preserved.');
    await writeFile(tsconfigPath, originalTsconfig);
  }
}
