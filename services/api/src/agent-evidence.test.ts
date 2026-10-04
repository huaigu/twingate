import assert from 'node:assert/strict'
import { test } from 'node:test'
import { prioritizeEvidence } from './agent-evidence.js'
import type { AgentEvidence } from './agent-types.js'

test('evidence ordering uses goal context rather than generic text or a field preference', () => {
  const cases: Array<{ goal: string; evidence: AgentEvidence[] }> = [
    { goal: 'Find someone to review wallet onboarding.', evidence: [
      { field: 'building', quote: 'This is a fictional product rehearsal.' },
      { field: 'canOffer', quote: 'Wallet onboarding usability reviews.' },
    ] },
    { goal: 'Debug event backfill.', evidence: [
      { field: 'canOffer', quote: 'Music arrangement feedback.' },
      { field: 'building', quote: 'An event backfill debugger.' },
    ] },
    { goal: 'Discuss Monad.', evidence: [
      { field: 'building', quote: 'An electronic music project.' },
      { field: 'interests', quote: 'Monad' },
    ] },
    { goal: 'I can offer help with an audit.', evidence: [
      { field: 'canOffer', quote: 'I can offer help with auditorium bookings.' },
      { field: 'building', quote: 'An audit preparation tool.' },
    ] },
  ]
  for (const { goal, evidence } of cases) {
    const before = structuredClone(evidence)
    assert.deepEqual(prioritizeEvidence(evidence, goal, []), [evidence[1], evidence[0]])
    assert.deepEqual(evidence, before, 'The model evidence and exact source text stay unchanged')
  }
})

test('clarifications contribute distinct whole terms, without rewarding repeated words', () => {
  const evidence: AgentEvidence[] = [
    { field: 'building', quote: 'Monad Monad Monad app.' },
    { field: 'canOffer', quote: 'Event backfill and transaction history debugging.' },
  ]
  assert.deepEqual(prioritizeEvidence(evidence, 'Improve my Monad app.', ['Missing event backfill and transaction history.']), [evidence[1], evidence[0]])
})

test('equal or absent lexical signal preserves model order and all qualifications', () => {
  const evidence: AgentEvidence[] = [
    { field: 'interests', quote: 'Wallets' },
    { field: 'canOffer', quote: 'Wallets, not a formal audit.' },
  ]
  assert.deepEqual(prioritizeEvidence(evidence, 'Discuss wallets.', []), evidence)
  assert.deepEqual(prioritizeEvidence(evidence, 'Find a telescope optics specialist.', []), evidence)
  assert.deepEqual(prioritizeEvidence(evidence, 'I can offer help to someone.', []), evidence)
})
