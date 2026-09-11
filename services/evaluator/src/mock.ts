import { keccak256, toHex } from 'viem'
import type { EvaluateInput, EvaluatorProvider, PersonaInput, PersonaProvider, PersonaResult, ProviderResult } from './types.js'

/**
 * Deterministic offline evaluator. Used when no Hunyuan credentials are present
 * so the whole product can be demoed and tested without a network dependency.
 * It returns the same shape as the real provider.
 */
export class MockEvaluator implements EvaluatorProvider {
  readonly name = 'mock'

  async evaluate(input: EvaluateInput): Promise<ProviderResult> {
    const body = [
      input.intent.whoAmI,
      input.intent.whyYou,
      input.intent.whatIOffer,
      input.intent.nextStep,
    ]
      .join(' ')
      .toLowerCase()

    const matchedTopics = input.recipientPolicy.topics.filter((topic) => {
      const head = topic.toLowerCase().split(' ')[0] ?? ''
      return head.length > 2 && body.includes(head)
    })

    const hasSpecificWhy = input.intent.whyYou.trim().length >= 80
    const hasOffer = input.intent.whatIOffer.trim().length >= 20

    const recommendation: ProviderResult['recommendation'] =
      matchedTopics.length > 0 && hasSpecificWhy && hasOffer
        ? 'review'
        : matchedTopics.length > 0
          ? 'ask_for_context'
          : 'not_now'

    const missingContext: string[] = []
    if (!hasSpecificWhy) missingContext.push('whyYou')
    if (!hasOffer) missingContext.push('whatIOffer')

    const coachNotes: string[] = []
    if (hasSpecificWhy) coachNotes.push('The request names a concrete reason for reaching out.')
    else coachNotes.push('Say why this specific person, not just the category they belong to.')
    if (hasOffer) coachNotes.push('You state something concrete you can offer.')
    else coachNotes.push('Add one line about what you can bring to the collaboration.')
    if (input.disclosedSignals.length > 0) {
      coachNotes.push(`You disclosed ${input.disclosedSignals.length} verified signal(s); they are explained to the recipient, not scored.`)
    }

    return {
      recommendation,
      whyItMayMatter:
        matchedTopics.length > 0
          ? `Overlaps with your published interests: ${matchedTopics.join(', ')}.`
          : 'Nothing here maps to your published interests yet.',
      recipientSummary: [
        input.intent.whoAmI.slice(0, 160),
        `Wants: ${input.intent.nextStep.slice(0, 160)}`,
        `Offers: ${input.intent.whatIOffer.slice(0, 160)}`,
      ],
      suggestedOpeningQuestion: matchedTopics.length > 0
        ? `What have you shipped so far on ${matchedTopics[0]}?`
        : 'What would you want to get out of a first conversation?',
      coachNotes,
      missingContext,
      modelVersion: 'mock-evaluator-v1',
    }
  }
}

/**
 * Stand-in for Hunyuan 3D. Without credentials it returns a deterministic
 * placeholder so the async persona slot in the UI is still exercised.
 */
export class MockPersonaProvider implements PersonaProvider {
  readonly name = 'mock-3d'

  async generate(input: PersonaInput): Promise<PersonaResult> {
    return {
      status: 'ready',
      assetUrl: `/persona/${keccak256(toHex(`${input.handle}:${input.source}`)).slice(2, 12)}.glb`,
      provider: this.name,
      taskId: null,
    }
  }
}
