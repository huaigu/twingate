#!/usr/bin/env node
// Read-only: no key, signature, wallet client or transaction broadcast.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, viem } from './lib/chain-fixture.mjs';

const rpcUrl = process.argv[2] || 'https://rpc.monad.xyz';
// Constructor role placeholders only. These are never deployment destinations.
const sender = process.argv[3] || '0x000000000000000000000000000000000000dEaD';
const registry = '0x0000000000000000000000000000000000000001';
const signer = '0x0000000000000000000000000000000000000002';
let requestId = 0;
async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }), signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error(`${method}: ${result.error.message}`);
  if (result.result === undefined) throw new Error(`${method}: missing result`);
  return result.result;
}

async function main() {
  if (!viem.isAddress(sender)) throw new Error('Provide a public sender address, never a private key.');
  const chainId = Number(BigInt(await rpc('eth_chainId')));
  if (![143, 10143, 31337].includes(chainId)) throw new Error('Unsupported chain ID.');
  const gasPrice = BigInt(await rpc('eth_gasPrice'));
  const contracts = [['ProfileRegistry', []], ['IntroductionReceipt', [sender]], ['IntroductionEscrow', [registry, sender, signer]]];
  let totalLimit = 0n;
  const estimates = [];
  for (const [name, args] of contracts) {
    const artifact = JSON.parse(readFileSync(join(root, 'packages/contracts/out', `${name}.sol`, `${name}.json`), 'utf8'));
    const sources = artifact.metadata?.sources;
    if (!sources || !Object.keys(sources).length) throw new Error(`Missing source metadata for ${name}; run pnpm contracts:build.`);
    for (const [path, source] of Object.entries(sources)) {
      const content = readFileSync(join(root, 'packages/contracts', path));
      if (viem.keccak256(content) !== source.keccak256) throw new Error(`Stale artifact for ${path}; run pnpm contracts:build.`);
    }
    const data = viem.encodeDeployData({ abi: artifact.abi, bytecode: artifact.bytecode.object, args });
    const estimate = BigInt(await rpc('eth_estimateGas', [{ from: sender, data, value: '0x0' }, 'latest']));
    const limit = (estimate * 120n + 99n) / 100n;
    totalLimit += limit;
    estimates.push({ contract: name, estimatedGas: estimate.toString(), gasLimitWith20PercentBuffer: limit.toString(), estimatedFeeMON: viem.formatEther(limit * gasPrice) });
  }
  console.log(JSON.stringify({ chainId, checkedAt: new Date().toISOString(), gasPriceGwei: viem.formatGwei(gasPrice), estimates, totalWithGasBufferMON: viem.formatEther(totalLimit * gasPrice), note: 'Read-only estimate using placeholder constructor addresses. No funds spent. Monad charges the full gas limit; gas price can change. Recheck actual deployment transactions before signing.' }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
