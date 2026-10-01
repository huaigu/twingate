import type { EvaluationOutcome } from '@signalpass/core'
import type { StoredIntroduction, Store } from './store.js'
import { hashDocument } from './store.js'
import { z } from 'zod'

function mockEvaluate(
  intro: StoredIntroduction,
  topics: readonly string[],
): EvaluationOutcome {
  const body = [intro.intent.whoAmI, intro.intent.whyYou, intro.intent.whatIOffer, intro.reply, intro.sharedProfile?.bio, ...(intro.sharedProfile?.interests ?? [])].filter(Boolean).join(' ').toLowerCase()
  const hits = topics.filter((t) => body.includes(t.toLowerCase().split(' ')[0] ?? ''))
  const hasDetail = [intro.intent.whyYou, intro.reply].filter(Boolean).join(' ').trim().length > 80
  const recommendation: EvaluationOutcome['recommendation'] =
    hits.length > 0 && hasDetail ? 'review' : hits.length > 0 ? 'ask_for_context' : 'not_now'

  const receiptBody = {
    introductionId: intro.id,
    policyVersion: intro.policyVersion,
    modelVersion: 'mock-evaluator-v1',
    recommendation,
    signals: intro.disclosedSignals.length,
    payloadHash: intro.payloadHash,
    context: evaluationContext(intro),
  }

  return {
    recommendation,
    whyItMayMatter:
      hits.length > 0
        ? `Shares an interest in ${hits.join(', ')}, which is on your published list.`
        : 'Nothing in the request maps to your published topics yet.',
    recipientSummary: [
      `${intro.intent.whoAmI.slice(0, 140)}`,
      `Wants: ${intro.intent.nextStep.slice(0, 140)}`,
      `Offers: ${intro.intent.whatIOffer.slice(0, 140)}`,
    ],
    suggestedOpeningQuestion: 'What does your current build look like in production?',
    coachNotes: hasDetail
      ? ['The request already states a concrete reason for reaching out.']
      : ['Add one sentence about why this specific person, not the category they belong to.'],
    missingContext: hasDetail ? [] : ['whyYou'],
    receiptHash: hashDocument(receiptBody),
  }
}

const resultSchema = z.object({
  recommendation: z.enum(['review', 'ask_for_context', 'not_now']),
  whyItMayMatter: z.string().max(2000),
  recipientSummary: z.array(z.string().max(2000)).max(3),
  suggestedOpeningQuestion: z.string().max(1000),
  coachNotes: z.array(z.string().max(2000)).max(3),
  missingContext: z.array(z.string().max(300)).max(12),
})
// Use the consented snapshot stored with the introduction, never current profile
// settings or source links. The recipient's question is context, not sender evidence.
function evaluationContext(intro: StoredIntroduction) {
  return { sharedProfile: intro.sharedProfile, question: intro.question, reply: intro.reply }
}
export async function evaluateIntroduction(store: Store, intro: StoredIntroduction, url?: string) {
  const policy = store.policies.get(intro.recipientHandle)
  if (!url) return { outcome: mockEvaluate(intro, policy?.topics ?? []), provider: 'mock-local' }
  const response = await fetch((url.endsWith('/') ? url.slice(0, -1) : url) + '/evaluate', {
    method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ introductionId: intro.id, senderHandle: intro.senderName, recipientHandle: intro.recipientHandle, intent: intro.intent, context: evaluationContext(intro), recipientPolicy: policy, disclosedSignals: intro.disclosedSignals }, (_k, v) => typeof v === 'bigint' ? v.toString() : v),
  })
  if (!response.ok) throw new Error('Evaluator unavailable')
  const body = z.object({ outcome: resultSchema, provider: z.string().min(1).max(100) }).parse(await response.json())
  return { provider: body.provider, outcome: { ...body.outcome, receiptHash: hashDocument({ introductionId: intro.id, payloadHash: intro.payloadHash, context: evaluationContext(intro), policyVersion: intro.policyVersion, provider: body.provider, outcome: body.outcome }) } }
}
