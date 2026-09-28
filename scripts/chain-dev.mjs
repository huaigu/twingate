#!/usr/bin/env node
import { resolve } from 'node:path';
import { localChain, boot, stop, healthy, available } from './lib/chain-fixture.mjs';
const processes = [];
let closing = false;
async function close() { if (closing) return; closing = true; for (const p of processes.reverse()) await stop(p); }
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await close(); process.exit(0); });
try {
  const apiPort = Number(process.env.CHAIN_API_PORT || 8791), webPort = Number(process.env.CHAIN_WEB_PORT || 3005);
  await available(apiPort); await available(webPort);
  const directory = resolve(process.env.CHAIN_DATA_DIR || '.data/local-chain');
  const chain = await localChain({ directory, port: Number(process.env.CHAIN_RPC_PORT || 8547), persistent: true });
  processes.push(chain.node);
  const api = boot('pnpm', ['--filter', '@signalpass/api', 'start'], { ...chain.apiEnv, API_PORT: String(apiPort), APP_ORIGIN: 'http://localhost:' + webPort, SIGNALPASS_DB_PATH: resolve(directory, 'app.sqlite') });
  processes.push(api); await healthy('http://127.0.0.1:' + apiPort + '/health', api);
  const web = boot('pnpm', ['--filter', '@signalpass/web', 'exec', 'next', 'dev', '-p', String(webPort)], { SIGNALPASS_API_ORIGIN: 'http://127.0.0.1:' + apiPort, SIGNALPASS_NEXT_DIST: '.next-chain' });
  processes.push(web); await healthy('http://localhost:' + webPort + '/api/health', web);
  console.log('SignalPass local-chain preview: http://localhost:' + webPort);
  console.log('Local EVM 31337, DEV tokens only. Hunyuan off; evaluation fee 0. Approve transactions in your own wallet.');
  console.log('State persists in ' + directory + '. Public deployment addresses: ' + chain.configPath);
  await Promise.race(processes.map(p => new Promise(resolve => p.once('exit', resolve))));
  if (!closing) throw new Error('A local development process exited.');
} catch (error) { console.error(error.message); process.exitCode = 1; } finally { await close(); }
