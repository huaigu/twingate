import type { AgentEvidence } from './agent-types.js'

// Conversational glue is not evidence of a connection. This deliberately small
// lexical heuristic only changes display order; it is not a semantic fit or
// expertise check, and must never create or discard a recommendation.
const stopwords = new Set(`a about after all also am an and any are as at be been before being both but by can could did do does each either else find for from had has have help here how i if in into is it its just like look looking may me might more most my need needs of offer offers on only or other our out own people person please provide seeking should so some someone something such than that the their them then there these they this those through to up us want wants was we were what when where which who will with would you your`.split(' '))
const terms = (text: string) => new Set((text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((term) => term.length >= 2 && !stopwords.has(term)))

/** Order only exact source quotes already validated by the discovery route. */
export function prioritizeEvidence(evidence: readonly AgentEvidence[], goal: string, clarificationAnswers: readonly string[]): AgentEvidence[] {
  const context = terms([goal, ...clarificationAnswers].join(' '))
  return evidence.map((item, index) => ({
    item, index,
    overlap: [...terms(item.quote)].filter((term) => context.has(term)).length,
  })).sort((a, b) => b.overlap - a.overlap || a.index - b.index).map(({ item }) => item)
}
