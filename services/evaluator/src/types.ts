import type {
  DisclosedSignal,
  GatePolicy,
  IntroductionIntent,
} from '@signalpass/core'
import type { Hex } from 'viem'

/** Everything the evaluator is allowed to see. Nothing else leaves the app. */
export interface EvaluateInput {
  readonly introductionId: Hex
  readonly senderHandle: string
  readonly recipientHandle: string
  readonly intent: IntroductionIntent
  readonly recipientPolicy: GatePolicy
  readonly disclosedSignals: readonly DisclosedSignal[]
}

export type Recommendation = 'review' | 'ask_for_context' | 'not_now'

/**
 * The shared shape both providers must return. It is deliberately split into a
 * sender-facing half (coachNotes) and a recipient-facing half (summary), because
 * neither person should ever see the other side's reasoning.
 */
export interface ProviderResult {
  readonly recommendation: Recommendation
  readonly whyItMayMatter: string
  readonly recipientSummary: readonly string[]
  readonly suggestedOpeningQuestion: string
  readonly coachNotes: readonly string[]
  readonly missingContext: readonly string[]
  readonly modelVersion: string
}

export interface EvaluatorProvider {
  readonly name: string
  evaluate(input: EvaluateInput): Promise<ProviderResult>
}

export interface PersonaInput {
  readonly handle: string
  readonly sourceKind: 'image' | 'text'
  readonly source: string
}

export interface PersonaResult {
  readonly status: 'pending' | 'ready' | 'failed'
  readonly assetUrl: string | null
  readonly provider: string
  readonly taskId: string | null
}

export interface PersonaProvider {
  readonly name: string
  generate(input: PersonaInput): Promise<PersonaResult>
}

/**
 * Guardrail applied to every provider result, including the model-backed one.
 * A model may recommend review, ask for context, or hold off. It may never
 * decide access, and it may never move money.
 */
export function enforceRecommendationPolicy(result: ProviderResult): ProviderResult {
  const allowed: readonly Recommendation[] = ['review', 'ask_for_context', 'not_now']
  const recommendation = allowed.includes(result.recommendation) ? result.recommendation : 'not_now'

  return {
    ...result,
    recommendation,
    recipientSummary: result.recipientSummary.slice(0, 3),
    coachNotes: result.coachNotes.slice(0, 3),
    missingContext: result.missingContext.slice(0, 3),
  }
}
