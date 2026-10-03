#!/usr/bin/env node
// Read-only checks of a running deployment. No login, provider call or mutation.
import assert from 'node:assert/strict';

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: node scripts/deployment-preflight.mjs https://your-host');
  const origin = new URL(input);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  assert(!origin.username && !origin.password && !origin.search && !origin.hash && origin.pathname === '/', 'Provide only an origin, without credentials, path, query or fragment.');
  assert(origin.protocol === 'https:' || (local && origin.protocol === 'http:'), 'Public deployments must use HTTPS; HTTP is allowed only for localhost verification.');
  const get = async (path, status = 200) => {
    const response = await fetch(origin.origin + path, { redirect: 'error', signal: AbortSignal.timeout(10_000), headers: { accept: 'application/json, text/html;q=0.9, */*;q=0.8' } });
    assert.equal(response.status, status, `${path}: expected HTTP ${status}, received ${response.status}.`);
    return response;
  };
  const health = await (await get('/api/health')).json();
  assert(health.ok === true && health.service === '@signalpass/api' && health.storage === 'sqlite' && health.identity === 'siwe-eoa', 'The API health response does not identify the expected SignalPass service.');
  const ready = await (await get('/api/ready')).json();
  assert(ready.ready === true, 'The API did not confirm SQLite readiness.');
  console.log('PASS API proxy, service identity and SQLite readiness');
  const locked = await (await get('/api/agent/workspace', 401)).json();
  assert.equal(locked.error, 'authentication_required', 'Anonymous requests must not expose private agent history.');
  console.log('PASS private agent history requires sign-in');
  const assistant = await (await get('/assistant')).text();
  assert(assistant.includes('data-page="assistant"') && assistant.includes('id="agent-draft-panel"'), 'The assistant route did not serve the expected product page.');
  for (const path of ['/v4/assistant.js', '/v4/client.js', '/v4/assistant.css']) {
    const response = await get(path);
    assert(!response.headers.get('content-type')?.includes('text/html'), `${path}: received an HTML fallback instead of the asset.`);
    assert((await response.text()).length > 100, `${path}: asset is unexpectedly empty.`);
  }
  console.log('PASS assistant route and its required scripts/styles');
  const chain = await (await get('/api/chain/config')).json();
  if (chain.enabled) {
    assert([10143, 143].includes(chain.chainId) || (local && chain.chainId === 31337), 'Unexpected chain: a public demo must not present local EVM as a deployed Monad network.');
    assert(chain.evaluationMode === 'manual' && chain.evaluationFee === '0', 'Expected manual-review chain flow with zero AI evaluation fee.');
    console.log(`PASS configured chain is ${chain.chainId}; contract/RPC validity requires separate chain:preflight`);
  } else console.log('PASS chain is disabled; this deployment is the no-payment flow');
  console.log('Read-only preflight passed. Provider availability, real wallet sign-in, delivery, persistence across host redeploys and public settlement still need their separate acceptance checks.');
}

main().catch(error => { console.error('FAIL deployment preflight:', error instanceof assert.AssertionError ? error.message : 'Could not validate the origin or reach the expected service. Check the URL, TLS and service logs.'); process.exitCode = 1; });
