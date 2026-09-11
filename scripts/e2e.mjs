#!/usr/bin/env node
/**
 * End-to-end integration test for the SignalPass loop.
 *
 * It boots the real evaluator service and the real API service as child
 * processes, then drives the full path a human would take: read a policy,
 * get a quote, lock an introduction, let both agents read it, find it in the
 * recipient's private queue, and decide.
 *
 * It also asserts the negative cases that matter — an agent cannot approve
 * access, a second evaluation is rejected, a stranger's handle is a clean 404.
 *
 * Run: pnpm e2e
 */

import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const API_PORT = Number(process.env.E2E_API_PORT ?? 8797)
const EVALUATOR_PORT = Number(process.env.E2E_EVALUATOR_PORT ?? 8798)
const API = `http://127.0.0.1:${API_PORT}`
const EVALUATOR = `http://127.0.0.1:${EVALUATOR_PORT}`

let passed = 0
let failed = 0

function ok(name, detail = '') {
  passed += 1
  console.log(`  \u001b[32mPASS\u001b[0m  ${name}${detail ? `  ${detail}` : ''}`)
}

function bad(name, detail) {
  failed += 1
  console.log(`  \u001b[31mFAIL\u001b[0m  ${name}\n        ${detail}`)
}

/** Assertions here compare BigInt amounts, which JSON.stringify refuses. */
function show(value) {
  return typeof value === 'bigint' ? `${value}n` : JSON.stringify(value)
}

function check(name, condition, detail = '') {
  if (condition) ok(name, detail)
  else bad(name, detail || 'assertion failed')
  return condition
}

function equal(name, actual, expected) {
  return check(name, actual === expected, `expected ${show(expected)}, got ${show(actual)}`)
}

async function call(base, path, init) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  const text = await response.text()
  return { status: response.status, body: text.length > 0 ? JSON.parse(text) : null }
}

/* ------------------------------------------------------------------ boot */

const children = []

function boot(filter, env) {
  const child = spawn('pnpm', ['--filter', filter, 'start'], {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const logs = []
  child.stdout.on('data', (chunk) => logs.push(String(chunk)))
  child.stderr.on('data', (chunk) => logs.push(String(chunk)))
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${filter}] exited with ${code}\n${logs.join('')}`)
    }
  })
  children.push(child)
  return logs
}

async function waitForHealth(base, label, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const { status } = await call(base, '/health')
      if (status === 200) return true
    } catch {
      /* not up yet */
    }
    await delay(300)
  }
  throw new Error(`${label} did not become healthy at ${base} within ${timeoutMs}ms`)
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill('SIGTERM')
    } catch {
      /* already gone */
    }
  }
}

/* ------------------------------------------------------------- test data */

const SENDER = '0x1111111111111111111111111111111111111111'

const INTENT = {
  whoAmI:
    'I build a deterministic simulation harness for Monad contracts; three teams use it to reproduce edge cases before mainnet.',
  whyYou:
    'You shipped the event pipeline design I keep rereading, specifically how you handled backpressure without dropping consumer events under sustained load, and I want to understand how you decided that trade-off.',
  whatIOffer: 'Simulation tooling, and honest feedback on developer tooling design.',
  nextStep: 'A 20-minute call, or a written exchange if async is easier.',
}

/* ------------------------------------------------------------------ main */

async function main() {
  console.log('\nSignalPass end-to-end test\n')

  boot('@signalpass/evaluator', {
    EVALUATOR_MODE: 'mock',
    EVALUATOR_PORT: String(EVALUATOR_PORT),
  })
  boot('@signalpass/api', {
    API_PORT: String(API_PORT),
    EVALUATOR_URL: EVALUATOR,
    EVALUATOR_MODE: 'mock',
  })

  await waitForHealth(EVALUATOR, 'evaluator')
  await waitForHealth(API, 'api')

  console.log('\n1. Both services are up and report what they run')

  const evaluatorHealth = await call(EVALUATOR, '/health')
  equal('evaluator health is 200', evaluatorHealth.status, 200)
  equal('evaluator uses the mock provider', evaluatorHealth.body?.evaluator, 'mock')
  check(
    'evaluator persona slot is available',
    typeof evaluatorHealth.body?.persona === 'string' && evaluatorHealth.body.persona.length > 0,
    `persona = ${JSON.stringify(evaluatorHealth.body?.persona)}`,
  )

  const apiHealth = await call(API, '/health')
  equal('api health is 200', apiHealth.status, 200)
  check('api seeded the demo builders', apiHealth.body?.profiles === 2, `profiles = ${apiHealth.body?.profiles}`)

  console.log('\n2. The directory and the published policy')

  const profiles = await call(API, '/profiles')
  equal('listing profiles succeeds', profiles.status, 200)
  const handles = (profiles.body?.profiles ?? []).map((p) => p.handle).sort()
  check(
    'both demo builders are listed',
    handles.join(',') === 'alice,bob',
    `handles = ${handles.join(',')}`,
  )

  const bob = await call(API, '/profiles/bob')
  equal('reading a profile succeeds', bob.status, 200)
  check(
    'the profile carries a versioned gate policy',
    bob.body?.policy?.version >= 1 && Array.isArray(bob.body?.policy?.topics),
    `version = ${bob.body?.policy?.version}`,
  )

  const missing = await call(API, '/profiles/nobody')
  equal('an unknown handle is a clean 404', missing.status, 404)

  console.log('\n3. The quote is split into a spent fee and a refundable bond')

  const quoteRequest = {
    sender: SENDER,
    recipientHandle: 'bob',
    contextChars: Object.values(INTENT).join(' ').length,
    attachmentCount: 0,
  }
  const quote = await call(API, '/quote', { method: 'POST', body: JSON.stringify(quoteRequest) })
  equal('quoting succeeds', quote.status, 200)
  const fee = BigInt(quote.body?.quote?.evaluationFee ?? '0')
  const bond = BigInt(quote.body?.quote?.attentionBond ?? '0')
  check('the evaluation fee is non-zero', fee > 0n, `fee = ${fee}`)
  check('the attention bond is non-zero', bond > 0n, `bond = ${bond}`)
  check(
    'the quote explains every line item',
    Array.isArray(quote.body?.quote?.lines) && quote.body.quote.lines.length >= 5,
    `lines = ${quote.body?.quote?.lines?.length}`,
  )

  const expensive = await call(API, '/quote', {
    method: 'POST',
    body: JSON.stringify({ ...quoteRequest, attachmentCount: 3 }),
  })
  const attachmentBond = BigInt(expensive.body?.quote?.attentionBond ?? '0')
  const attachmentFee = BigInt(expensive.body?.quote?.evaluationFee ?? '0')
  check('attachments raise the fee', attachmentFee > fee, `${fee} -> ${attachmentFee}`)
  equal('attachments do not touch the refundable bond', attachmentBond, bond)

  console.log('\n4. Locking an introduction, then both agents read it')

  const created = await call(API, '/introductions', {
    method: 'POST',
    body: JSON.stringify({
      sender: SENDER,
      recipientHandle: 'bob',
      intent: INTENT,
      disclosedSignals: [
        {
          kind: 'deployed_contract',
          label: 'A contract I deployed',
          evidenceUrl: null,
          consentedAt: Math.floor(Date.now() / 1000),
        },
      ],
      attachmentCount: 0,
    }),
  })
  equal('locking returns 201', created.status, 201)
  const id = created.body?.introduction?.id
  check('the introduction has an onchain-shaped id', typeof id === 'string' && id.startsWith('0x'), `id = ${id}`)
  equal('it starts locked', created.body?.introduction?.state, 'locked')
  check(
    'the payload is hashed at lock time',
    typeof created.body?.introduction?.payloadHash === 'string',
    `payloadHash = ${created.body?.introduction?.payloadHash?.slice(0, 12)}…`,
  )

  const evaluated = await call(API, `/introductions/${id}/evaluate`, { method: 'POST' })
  equal('evaluation succeeds', evaluated.status, 200)
  equal('the evaluator service did the work', evaluated.body?.provider, 'mock')
  check(
    'the recommendation is one of the three allowed values',
    ['review', 'ask_for_context', 'not_now'].includes(evaluated.body?.outcome?.recommendation),
    `recommendation = ${evaluated.body?.outcome?.recommendation}`,
  )
  check(
    'a full card with a specific reason is recommended for review',
    evaluated.body?.outcome?.recommendation === 'review',
    `recommendation = ${evaluated.body?.outcome?.recommendation}`,
  )
  equal('it moves into the review queue', evaluated.body?.introduction?.state, 'ready_for_review')
  check(
    'an evaluation receipt is anchored',
    typeof evaluated.body?.introduction?.evaluationReceiptHash === 'string',
    `receipt = ${evaluated.body?.introduction?.evaluationReceiptHash?.slice(0, 12)}…`,
  )
  check(
    'the sender-facing half exists',
    Array.isArray(evaluated.body?.outcome?.coachNotes) && evaluated.body.outcome.coachNotes.length > 0,
  )
  check(
    'the recipient-facing half exists',
    Array.isArray(evaluated.body?.outcome?.recipientSummary) &&
      evaluated.body.outcome.recipientSummary.length > 0,
  )

  const reEvaluate = await call(API, `/introductions/${id}/evaluate`, { method: 'POST' })
  equal('evaluating twice is refused', reEvaluate.status, 409)

  console.log('\n5. Only the recipient can decide')

  const asEvaluator = await call(API, `/introductions/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ actor: 'evaluator', to: 'accepted' }),
  })
  equal('an agent cannot approve access', asEvaluator.status, 403)

  const asSender = await call(API, `/introductions/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ actor: 'sender', to: 'accepted' }),
  })
  equal('the sender cannot accept on their own behalf', asSender.status, 403)

  const queue = await call(API, '/queue/bob')
  equal('the recipient can read their queue', queue.status, 200)
  equal('the queue has exactly one item', queue.body?.queue?.length, 1)
  equal('the queue item is the one we just sent', queue.body?.queue?.[0]?.id, id)
  equal('the recipient sees it before deciding', queue.body?.queue?.[0]?.state, 'ready_for_review')

  const decided = await call(API, `/introductions/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ actor: 'recipient', to: 'accepted' }),
  })
  equal('the recipient can accept', decided.status, 200)
  equal('the introduction is now accepted', decided.body?.introduction?.state, 'accepted')

  const afterQueue = await call(API, '/queue/bob')
  equal('accepting drains the queue', afterQueue.body?.queue?.length, 0)

  const acceptance = await call(API, `/introductions/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ actor: 'recipient', to: 'declined' }),
  })
  equal('a decided introduction cannot be re-decided', acceptance.status, 409)

  console.log('\n6. The receipt survives a reload')

  const reread = await call(API, `/introductions/${id}`)
  equal('reading the introduction succeeds', reread.status, 200)
  equal('the state persisted', reread.body?.introduction?.state, 'accepted')
  check(
    'the evaluation outcome persisted with it',
    reread.body?.introduction?.evaluationOutcome !== null,
    'the persisted outcome is what the detail page renders after a refresh',
  )
  equal(
    'the persisted outcome is the one that was returned',
    reread.body?.introduction?.evaluationOutcome?.recommendation,
    evaluated.body?.outcome?.recommendation,
  )

  console.log('\n7. Unknown handles fail loudly, never silently')

  const strangerQueue = await call(API, '/queue/nobody')
  equal('an unknown queue is a clean 404', strangerQueue.status, 404)

  const selfIntro = await call(API, '/introductions', {
    method: 'POST',
    body: JSON.stringify({
      sender: SENDER,
      recipientHandle: 'nobody',
      intent: INTENT,
      disclosedSignals: [],
      attachmentCount: 0,
    }),
  })
  equal('sending to an unknown handle is a clean 404', selfIntro.status, 404)

  const rejectedIntent = await call(API, '/introductions', {
    method: 'POST',
    body: JSON.stringify({
      sender: SENDER,
      recipientHandle: 'bob',
      intent: { whoAmI: '', whyYou: '', whatIOffer: '', nextStep: '' },
      disclosedSignals: [],
      attachmentCount: 0,
    }),
  })
  equal('an empty introduction card is rejected', rejectedIntent.status, 400)

  console.log(`\n${'-'.repeat(56)}`)
  console.log(`  ${passed} passed, ${failed} failed`)

  return failed === 0
}

let exitCode = 1
try {
  const success = await main()
  exitCode = success ? 0 : 1
} catch (error) {
  console.error(`\n\u001b[31mSuite aborted:\u001b[0m ${error instanceof Error ? error.message : error}`)
  exitCode = 1
} finally {
  shutdown()
}

// Give the children a moment to die before the process exits.
await delay(300)
process.exit(exitCode)
