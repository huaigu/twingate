/**
 * Thin typed client for the SignalPass API.
 *
 * Every amount in a response is a decimal string: the API serialises bigint
 * values as strings so nothing is ever run through a float. Keep that contract
 * in mind when reading `QuoteDto`.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'

/** The seeded demo identity used for the sender side of the flow. */
export const DEMO_SENDER_HANDLE = 'alice'

export type Availability = 'open' | 'selective' | 'closed'

export interface PersonaRefDto {
  status: 'pending' | 'ready' | 'failed'
  assetUrl: string | null
  sourceKind: 'image' | 'text'
}

export interface BuilderProfileDto {
  profileId: string
  owner: string
  handle: string
  displayName: string
  building: string
  wantsToMeet: string
  canOffer: string
  availability: Availability
  policyVersion: number
  policyHash: string
  persona: PersonaRefDto | null
  createdAt: number
}

export interface GatePolicyDto {
  version: number
  topics: string[]
  availability: Availability
  desiredNextStep: string
  baseBond: string
  unresolvedLimit: number
  timeoutSeconds: number
}

export interface QuoteLineDto {
  label: string
  amount: string
}

export interface QuoteDto {
  evaluationFee: string
  attentionBond: string
  lines: QuoteLineDto[]
  computedAt: number
  expiresAt: number
}

export interface DisclosedSignalDto {
  kind: 'monad_activity' | 'deployed_contract' | 'ecosystem_membership'
  label: string
  evidenceUrl: string | null
  consentedAt: number
}

export interface IntroductionIntentDto {
  whoAmI: string
  whyYou: string
  whatIOffer: string
  nextStep: string
}

export type IntroductionStateDto =
  | 'draft'
  | 'quoted'
  | 'locked'
  | 'evaluating'
  | 'needs_context'
  | 'ready_for_review'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'withdrawn'

export interface IntroductionDto {
  id: string
  sender: string
  recipient: string
  intent: IntroductionIntentDto
  disclosedSignals: DisclosedSignalDto[]
  state: IntroductionStateDto
  policyVersion: number
  createdAt: number
  updatedAt: number
  quote: QuoteDto
  payloadHash: string
  evaluationReceiptHash: string | null
  /** Persisted so the receipt stays readable after a reload. */
  evaluationOutcome: EvaluationOutcomeDto | null
  evaluationProvider: string | null
}

export interface EvaluationOutcomeDto {
  recommendation: 'review' | 'ask_for_context' | 'not_now'
  whyItMayMatter: string
  recipientSummary: string[]
  suggestedOpeningQuestion: string
  coachNotes: string[]
  missingContext: string[]
  receiptHash: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly detail: unknown

  constructor(status: number, code: string, detail: unknown) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
  }

  /** The API is not wrong, it simply is not there. The UI says so plainly. */
  get isUnreachable(): boolean {
    return this.status === 0
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      cache: 'no-store',
    })
  } catch (cause) {
    throw new ApiError(0, 'api_unreachable', cause)
  }

  const text = await response.text()
  const body: unknown = text.length > 0 ? safeJson(text) : null

  if (!response.ok) {
    const code =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `http_${response.status}`
    throw new ApiError(response.status, code, body)
  }

  return body as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function getProfiles(): Promise<BuilderProfileDto[]> {
  const body = await request<{ profiles: BuilderProfileDto[] }>('/profiles')
  return body.profiles
}

export async function getProfile(
  handle: string,
): Promise<{ profile: BuilderProfileDto; policy: GatePolicyDto | null }> {
  return request<{ profile: BuilderProfileDto; policy: GatePolicyDto | null }>(
    `/profiles/${encodeURIComponent(handle)}`,
  )
}

export async function getQueue(
  handle: string,
): Promise<{ handle: string; depth: number; queue: IntroductionDto[] }> {
  return request<{ handle: string; depth: number; queue: IntroductionDto[] }>(
    `/queue/${encodeURIComponent(handle)}`,
  )
}

export async function getIntroduction(id: string): Promise<IntroductionDto> {
  const body = await request<{ introduction: IntroductionDto }>(
    `/introductions/${encodeURIComponent(id)}`,
  )
  return body.introduction
}

export async function getQuote(input: {
  sender: string
  recipientHandle: string
  contextChars: number
  attachmentCount: number
}): Promise<QuoteDto> {
  const body = await request<{ quote: QuoteDto }>('/quote', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return body.quote
}

export async function submitIntroduction(input: {
  sender: string
  recipientHandle: string
  intent: IntroductionIntentDto
  disclosedSignals: DisclosedSignalDto[]
  attachmentCount: number
}): Promise<IntroductionDto> {
  const body = await request<{ introduction: IntroductionDto }>('/introductions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return body.introduction
}

export async function evaluateIntroduction(
  id: string,
): Promise<{ introduction: IntroductionDto; outcome: EvaluationOutcomeDto; provider: string }> {
  return request<{ introduction: IntroductionDto; outcome: EvaluationOutcomeDto; provider: string }>(
    `/introductions/${encodeURIComponent(id)}/evaluate`,
    { method: 'POST' },
  )
}

export async function transitionIntroduction(
  id: string,
  actor: 'sender' | 'recipient' | 'evaluator' | 'system',
  to: IntroductionStateDto,
): Promise<IntroductionDto> {
  const body = await request<{ introduction: IntroductionDto }>(
    `/introductions/${encodeURIComponent(id)}/transition`,
    { method: 'POST', body: JSON.stringify({ actor, to }) },
  )
  return body.introduction
}
