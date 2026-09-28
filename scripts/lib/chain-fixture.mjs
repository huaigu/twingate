import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'node:net';
const require = createRequire(new URL('../../services/api/package.json', import.meta.url));
export const viem = require('viem');
export const accounts = require('viem/accounts');
export const root = fileURLToPath(new URL('../../', import.meta.url));
export function boot(command, args, env = {}, cwd = root) {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  child.logs = '';
  child.stdout.on('data', s => { child.logs = (child.logs + s).slice(-20000); });
  child.stderr.on('data', s => { child.logs = (child.logs + s).slice(-20000); });
  child.on('error', e => { child.logs += e.message; });
  return child;
}
export async function stop(child) {
  if (!child || child.exitCode !== null) return;
  try { process.platform === 'win32' ? child.kill('SIGTERM') : process.kill(-child.pid, 'SIGTERM'); } catch {}
  for (let i = 0; i < 60 && child.exitCode === null; i++) await delay(100);
}
export async function healthy(url, child) {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    if (child.exitCode !== null) throw new Error('Server startup failed: ' + child.logs);
    await delay(250);
  }
  throw new Error('Server startup timed out: ' + child.logs);
}
export async function available(port) {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  await new Promise(resolve => server.close(resolve));
}
export async function localChain({ directory, port, persistent = false }) {
  directory = resolve(directory);
  await available(port);
  mkdirSync(directory, { recursive: true, mode: 0o700 }); chmodSync(directory, 0o700);
  const compiled = boot('forge', ['build', '--quiet'], {}, join(root, 'packages/contracts'));
  await new Promise((resolve, reject) => { compiled.once('error', reject); compiled.once('exit', code => code ? reject(new Error(compiled.logs)) : resolve()); });
  const rpcUrl = 'http://127.0.0.1:' + port;
  const args = ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '31337', '--silent', '--block-time', '1'];
  if (persistent) args.push('--state', join(directory, 'anvil.json'), '--state-interval', '5');
  const node = boot('anvil', args);
  const client = viem.createPublicClient({ transport: viem.http(rpcUrl), pollingInterval: 100 });
  try {
    for (let i = 0; i < 60; i++) { try { if (await client.getChainId() === 31337) break; } catch {} if (node.exitCode !== null) throw new Error(node.logs); await delay(200); }
    if (await client.getChainId() !== 31337) throw new Error('Local chain ID mismatch');
    const rpc = (method, params) => client.request({ method, params });
    const keyPath = join(directory, 'quote-signer.key'), configPath = join(directory, 'chain.json');
    let config;
    if (persistent && existsSync(configPath)) {
      config = JSON.parse(readFileSync(configPath, 'utf8'));
      if (!existsSync(keyPath)) throw new Error('Local signing key missing; preserve state and restore it.');
      for (const name of ['registry', 'escrow', 'receipt']) if (!(await client.getCode({ address: config[name] }))) throw new Error('Saved deployment missing on chain; use a new local data directory.');
      const abi = viem.parseAbi(['function quoteSigner() view returns (address)']);
      const expected = accounts.privateKeyToAccount(readFileSync(keyPath, 'utf8').trim()).address;
      if ((await client.readContract({ address: config.escrow, abi, functionName: 'quoteSigner' })).toLowerCase() !== expected.toLowerCase()) throw new Error('Saved quote signer mismatch');
      config.rpcUrl = rpcUrl; config.walletRpcUrl = rpcUrl;
    } else {
      const deployer = accounts.privateKeyToAccount(accounts.generatePrivateKey());
      const quoteKey = accounts.generatePrivateKey(), signer = accounts.privateKeyToAccount(quoteKey);
      await rpc('anvil_setBalance', [deployer.address, viem.toHex(viem.parseEther('10'))]);
      const wallet = viem.createWalletClient({ account: deployer, transport: viem.http(rpcUrl) });
      const deploy = async (name, args) => {
        const artifact = JSON.parse(readFileSync(join(root, 'packages/contracts/out', name + '.sol', name + '.json'), 'utf8'));
        const hash = await wallet.deployContract({ chain: null, abi: artifact.abi, bytecode: artifact.bytecode.object, args });
        const receipt = await client.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success' || !receipt.contractAddress) throw new Error('Local contract deployment failed: ' + name);
        return receipt.contractAddress;
      };
      const registry = await deploy('ProfileRegistry', []);
      const receipt = await deploy('IntroductionReceipt', [deployer.address]);
      const escrow = await deploy('IntroductionEscrow', [registry, deployer.address, signer.address]);
      config = { chainId: 31337, rpcUrl, walletRpcUrl: rpcUrl, registry, escrow, receipt, name: 'Local EVM · development only', confirmations: 1, localTtlSeconds: 60 };
      writeFileSync(keyPath, quoteKey + '\n', { mode: 0o600 });
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
    return { node, client, config, rpc, keyPath, configPath, apiEnv: { SIGNALPASS_CHAIN_CONFIG: configPath, SIGNALPASS_QUOTE_SIGNER_KEY_FILE: keyPath, SIGNALPASS_QUOTE_SIGNER_PRIVATE_KEY: '', EVALUATOR_URL: '' } };
  } catch (error) { await stop(node); throw error; }
}
