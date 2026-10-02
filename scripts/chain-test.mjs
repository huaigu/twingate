#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { localChain, boot, stop, healthy, viem, accounts, root } from './lib/chain-fixture.mjs';
const directory = mkdtempSync(join(tmpdir(), 'signalpass-chain-'));
const port = Number(process.env.CHAIN_TEST_API_PORT || 18991);
const origin = 'http://localhost:3095', base = 'http://127.0.0.1:' + port;
const processes = [];
const profile = handle => ({ handle, profile: { name: handle.toUpperCase(), bio: 'Building tools for Monad communities.', interests: 'Monad, developer tooling', offer: 'Contract simulation and product feedback.', meet: 'Builders who want to collaborate.' }, agent: { visibility: 'public', matching: true, sources: [], interests: ['Monad', 'developer tooling'] }, sourceLinks: {}, avatar: 'alex' });
const intent = { whoAmI: 'I build developer tools.', whyYou: 'Your community tooling is relevant to our simulation project. I would like to compare our approaches to testing and build a shared contract test suite together.', whatIOffer: 'Contract testing and product feedback.', nextStep: 'A short call.' };
let chain, api;
try {
  chain = await localChain({ directory, port: Number(process.env.CHAIN_TEST_RPC_PORT || 18547) }); processes.push(chain.node);
  const env = { ...chain.apiEnv, API_PORT: String(port), APP_ORIGIN: origin, SIGNALPASS_DB_PATH: join(directory, 'app.sqlite') };
  const start = async () => { api = boot(process.execPath, ['--import', 'tsx', 'src/index.ts'], env, join(root, 'services/api')); processes.push(api); await healthy(base + '/health', api); };
  await start();
  const request = async (user, path, body, expected = 200) => {
    const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { origin, 'content-type': 'application/json', ...(user ? { cookie: user.cookie, 'x-signalpass-csrf': user.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json(); assert.equal(response.status, expected, path + ': ' + JSON.stringify(data));
    return { ...data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  const users = [];
  for (const handle of ['alice', 'bob', 'eve']) {
    const account = accounts.privateKeyToAccount(accounts.generatePrivateKey());
    const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 31337 });
    const login = await request(null, '/auth/verify', { nonce: challenge.nonce, signature: await account.signMessage({ message: challenge.message }) });
    const user = { account, cookie: login.cookie, csrf: login.session.csrf, wallet: viem.createWalletClient({ account, transport: viem.http(chain.config.rpcUrl) }) };
    users.push(user); await request(user, '/me/profile', profile(handle)); await request(user, '/chain/faucet', {});
  }
  const [a, b, c] = users;
  const send = async (user, tx) => {
    assert.equal(tx.from.toLowerCase(), user.account.address.toLowerCase()); assert.equal(Number(tx.chainId), 31337);
    const hash = await user.wallet.sendTransaction({ chain: null, to: tx.to, data: tx.data, value: BigInt(tx.value) });
    const receipt = await chain.client.waitForTransactionReceipt({ hash }); assert.equal(receipt.status, 'success'); return hash;
  };
  const path = id => '/introductions/' + id;
  const create = async () => (await request(a, '/introductions', { recipientHandle: 'bob', intent, idempotencyKey: crypto.randomUUID(), sharedContext: false, settlement: 'onchain' }, 201)).introduction;
  const get = async (id, user = a) => (await request(user, path(id))).introduction;
  const unsynced = await create();
  await request(a, path(unsynced.id) + '/funding-quote', {}, 409);
  for (const tx of (await request(b, '/chain/profile/prepare', {})).transactions) await send(b, tx);
  assert.equal((await request(b, '/chain/profile')).synced, true);
  console.log('PASS: signed identities, local balance guard, approved recipient profile registered on EVM');
  const q = await request(a, path(unsynced.id) + '/funding-quote', {});
  const parallelDraft = await create();
  const parallelQuote = await request(a, path(parallelDraft.id) + '/funding-quote', {});
  assert.notEqual(q.summary.payloadHash, parallelQuote.summary.payloadHash);
  assert.equal(q.summary.evaluationFee, '0'); assert.equal(BigInt(q.transaction.value), BigInt(q.summary.attentionBond));
  assert.equal((await request(b, '/introductions?box=inbox')).introductions.length, 0);
  await request(b, path(unsynced.id), undefined, 404); await request(c, path(unsynced.id), undefined, 404);
  const escrowAbi = JSON.parse(readFileSync(join(root, 'packages/contracts/out/IntroductionEscrow.sol/IntroductionEscrow.json'), 'utf8')).abi;
  const decoded = viem.decodeFunctionData({ abi: escrowAbi, data: q.transaction.data });
  const lockTypes = { LockIntroduction: escrowAbi.find(f => f.type === 'function' && f.name === 'lockIntroduction').inputs[0].components.map(({ name, type }) => ({ name, type })) };
  const digest = viem.hashTypedData({ domain: { name: 'SignalPass', version: '1', chainId: 31337, verifyingContract: chain.config.escrow }, types: lockTypes, primaryType: 'LockIntroduction', message: decoded.args[0] });
  assert.equal(digest, await chain.client.readContract({ address: chain.config.escrow, abi: escrowAbi, functionName: 'hashQuote', args: [decoded.args[0]] }));
  await assert.rejects(chain.client.call({ account: a.account, to: q.transaction.to, data: q.transaction.data, value: BigInt(q.transaction.value) - 1n }));
  const forged = viem.encodeFunctionData({ abi: escrowAbi, functionName: 'lockIntroduction', args: [{ ...decoded.args[0], attentionBond: 1n }, decoded.args[1]] });
  await assert.rejects(chain.client.call({ account: a.account, to: q.transaction.to, data: forged, value: 1n }));
  const hash = await send(a, q.transaction);
  const locked = await request(a, path(unsynced.id) + '/funding', { transactionHash: hash });
  assert.equal(locked.confirmed, true); assert.equal(locked.state, 'ready_for_review');
  assert.equal((await get(unsynced.id, b)).payment.status, 'locked');
  assert.equal((await get(parallelDraft.id)).payment.status, 'awaiting_wallet');
  assert.equal((await request(a, path(parallelDraft.id) + '/funding-quote', {}, 409)).error, 'nonce_changed_sync_or_start_new');
  await request(b, path(parallelDraft.id), undefined, 404);
  await assert.rejects(chain.client.call({ account: a.account, to: q.transaction.to, data: q.transaction.data, value: BigInt(q.transaction.value) }));
  await request(a, path(unsynced.id) + '/transition', { to: 'accepted', revision: (await get(unsynced.id)).revision }, 409);
  await request(a, path(unsynced.id) + '/settlement/prepare', { action: 'accepted' }, 403);
  console.log('PASS: viem EIP-712 digest equals Solidity; exact-value lock; tampering, replay and forged acceptance rejected');
  let record = await get(unsynced.id, b);
  await request(b, path(record.id) + '/context', { revision: record.revision, text: 'What would we build together?' });
  record = await get(record.id); const originalHash = record.payloadHash;
  await request(a, path(record.id) + '/reply', { revision: record.revision, text: 'An open-source contract simulation suite.' });
  record = await get(record.id); assert.equal(record.payloadHash, originalHash); assert.equal(record.state, 'ready_for_review');
  const settle = async (id, action, user = b) => {
    const before = await chain.client.getBalance({ address: a.account.address });
    const info = await get(id), prepared = await request(user, path(id) + '/settlement/prepare', { action });
    const txHash = await send(user, prepared.transaction);
    const done = await request(user, path(id) + '/settlement/confirm', { action, transactionHash: txHash });
    assert.equal(done.state, action); assert.equal(done.refund.amount, info.payment.attentionBond);
    const after = await chain.client.getBalance({ address: a.account.address });
    const txReceipt = await chain.client.getTransactionReceipt({ hash: txHash });
    const senderGas = user === a ? txReceipt.gasUsed * txReceipt.effectiveGasPrice : 0n;
    assert.equal(after - before + senderGas, BigInt(info.payment.attentionBond));
    assert.equal((await get(id)).payment.status, 'refunded');
    return done;
  };
  await settle(unsynced.id, 'accepted');
  console.log('PASS: offchain context preserves signed payload; acceptance returns full bond with gas accounted separately');
  const second = await create(), sq = await request(a, path(second.id) + '/funding-quote', {});
  await request(a, path(second.id) + '/funding', { transactionHash: hash }, 409);
  await send(a, sq.transaction); // Deliberately omit funding callback; recover the mined event after restart.
  await stop(api); await start();
  assert.equal((await get(second.id)).state, 'ready_for_review');
  await settle(second.id, 'declined');
  console.log('PASS: unrelated lock rejected; missing browser callback and API restart recover chain proof; decline refunds');
  const third = await create(), tq = await request(a, path(third.id) + '/funding-quote', {});
  await request(a, path(third.id) + '/funding', { transactionHash: await send(a, tq.transaction) });
  await request(a, path(third.id) + '/settlement/prepare', { action: 'expired' }, 409);
  await chain.rpc('evm_increaseTime', [65]); await chain.rpc('evm_mine', []);
  await settle(third.id, 'expired', a);
  console.log('PASS: expiry cannot be forged early; elapsed contract deadline refunds the full bond');
  if (process.argv.includes('--browser')) {
    const { browserCheck } = await import('./lib/chain-browser.mjs');
    await browserCheck({ chain, base, origin, env, profile, users, processes });
  }
  console.log('All local-chain integration checks passed. No public testnet transaction was sent.');
} catch (error) { console.error(error); process.exitCode = 1; }
finally { for (const p of processes.reverse()) await stop(p); rmSync(directory, { recursive: true, force: true }); }
