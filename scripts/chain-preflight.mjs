#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { viem, accounts } from './lib/chain-fixture.mjs';
try {
  const path = process.argv[2] || process.env.SIGNALPASS_CHAIN_CONFIG;
  if (!path) throw new Error('Provide a deployment manifest path: pnpm chain:preflight .data/local-chain/chain.json');
  const config = JSON.parse(readFileSync(path, 'utf8'));
  if (![31337, 10143, 143].includes(config.chainId)) throw new Error('Only Local EVM 31337, Monad testnet 10143 and Monad mainnet 143 are supported.');
  for (const name of ['registry', 'escrow', 'receipt']) if (!viem.isAddress(config[name]) || config[name] === viem.zeroAddress) throw new Error('Set a deployed address for ' + name + '.');
  if (!Number.isInteger(config.confirmations) || config.confirmations < 1 || config.confirmations > 20) throw new Error('Set confirmations between 1 and 20.');
  const client = viem.createPublicClient({ transport: viem.http(config.rpcUrl, { timeout: 10000, retryCount: 0 }), cacheTime: 0 });
  if (await client.getChainId() !== config.chainId) throw new Error('The RPC chain ID differs from the deployment manifest.');
  for (const name of ['registry', 'escrow', 'receipt']) if (!(await client.getCode({ address: config[name] }))) throw new Error('No deployed code found for ' + name + '.');
  const abi = viem.parseAbi(['function quoteSigner() view returns (address)', 'function registry() view returns (address)']);
  const registry = await client.readContract({ address: config.escrow, abi, functionName: 'registry' });
  if (registry.toLowerCase() !== config.registry.toLowerCase()) throw new Error('Escrow references a different profile registry.');
  const signer = await client.readContract({ address: config.escrow, abi, functionName: 'quoteSigner' });
  const key = process.env.SIGNALPASS_QUOTE_SIGNER_PRIVATE_KEY || (process.env.SIGNALPASS_QUOTE_SIGNER_KEY_FILE ? readFileSync(process.env.SIGNALPASS_QUOTE_SIGNER_KEY_FILE, 'utf8').trim() : '');
  if (!key) throw new Error('Contract addresses verified. Set the API quote key locally to complete signer verification; do not paste keys into chat.');
  if (accounts.privateKeyToAccount(key).address.toLowerCase() !== signer.toLowerCase()) throw new Error('The API quote key does not match the escrow quote signer.');
  if (config.walletRpcUrl) {
    const url = new URL(config.walletRpcUrl);
    if (url.username || url.password || url.search) throw new Error('Use a public, credential-free wallet RPC URL.');
    const walletChain = await viem.createPublicClient({ transport: viem.http(url.href, { timeout: 10000, retryCount: 0 }) }).getChainId();
    if (walletChain !== config.chainId) throw new Error('Wallet RPC points to a different network.');
  }
  console.log('PASS: chain ID, three deployments, escrow registry, quote signer, confirmations and wallet network.');
  console.log(config.name + ' · chain ' + config.chainId + ' · manual review · evaluation fee 0');
  console.log('Read-only preflight. No transaction was signed or broadcast.');
} catch (error) { console.error(error.shortMessage || error.message); process.exitCode = 1; }
