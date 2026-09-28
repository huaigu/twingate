/**
 * Thin typed client for the SignalPass API with offline demo fallback support.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8789'

export const DEMO_SENDER_HANDLE = 'alex'

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

// ---------------------------------------------------------------------------
// Fallback Mock Data for Offline Demo Resilience
// ---------------------------------------------------------------------------

const MOCK_PROFILES: Record<string, BuilderProfileDto> = {
  alice: {
    profileId: '1',
    owner: '0x1111111111111111111111111111111111111111',
    handle: 'alice',
    displayName: 'Alice',
    building: 'Deterministic simulation harness for Monad smart contracts.',
    wantsToMeet: 'Protocol engineers who have shipped high-concurrency systems.',
    canOffer: 'Deterministic testing harnesses and security auditing.',
    availability: 'open',
    policyVersion: 1,
    policyHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    persona: {
      status: 'ready',
      assetUrl: '/design/builder-right-reference.png',
      sourceKind: 'image',
    },
    createdAt: Date.now() - 86400000 * 3,
  },
  bob: {
    profileId: '2',
    owner: '0x2222222222222222222222222222222222222222',
    handle: 'bob',
    displayName: 'Bob',
    building: 'Indexing infrastructure for social graphs and attention bonds on Monad.',
    wantsToMeet: 'Builders solving discovery, curation, and human attention.',
    canOffer: 'Low-latency data pipelines and event streaming.',
    availability: 'open',
    policyVersion: 1,
    policyHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    persona: {
      status: 'ready',
      assetUrl: '/design/builder-left-reference.png',
      sourceKind: 'image',
    },
    createdAt: Date.now() - 86400000 * 2,
  },
}

const MOCK_GATE_POLICY: GatePolicyDto = {
  version: 1,
  topics: ['Developer tools', 'Monad ecosystem', 'Infrastructure', 'Open collaboration'],
  availability: 'open',
  desiredNextStep: 'A 20-minute call or structured async discussion.',
  baseBond: '0.05',
  unresolvedLimit: 3,
  timeoutSeconds: 86400 * 7,
}

const DEFAULT_FALLBACK_INTRO: IntroductionDto = {
  id: 'demo-intro-1',
  sender: 'alice',
  recipient: 'bob',
  intent: {
    whoAmI: 'I build developer tools and testing harnesses on Monad.',
    whyYou: 'You built the event indexing pipeline our team relies on.',
    whatIOffer: 'Shared architecture lessons and simulation tool feedback.',
    nextStep: 'A 20-minute discussion on high-throughput indexing.',
  },
  disclosedSignals: [
    {
      kind: 'monad_activity',
      label: 'Active testnet deployer',
      evidenceUrl: null,
      consentedAt: Date.now() - 3600000,
    },
  ],
  state: 'ready_for_review',
  policyVersion: 1,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now() - 3600000,
  quote: {
    evaluationFee: '0.005',
    attentionBond: '0.05',
    lines: [
      { label: 'Evaluation fee', amount: '0.005' },
      { label: 'Attention bond (refundable)', amount: '0.05' },
    ],
    computedAt: Date.now() - 86400000,
    expiresAt: Date.now() + 86400000 * 6,
  },
  payloadHash: '0x123',
  evaluationReceiptHash: '0xabc',
  evaluationOutcome: {
    recommendation: 'review',
    whyItMayMatter: 'Both builders are actively developing on Monad infrastructure.',
    recipientSummary: [
      'Alice builds simulation harnesses for Monad smart contracts.',
      'She is seeking insights on your high-speed indexing pipeline.',
      'Offers deterministic testing tooling in exchange.',
    ],
    suggestedOpeningQuestion: 'What concurrency bottlenecks have you encountered in pipeline tests?',
    coachNotes: ['Context is specific and respectful of recipient time.'],
    missingContext: [],
    receiptHash: '0xabc',
  },
  evaluationProvider: 'Hunyuan-Gatekeeper',
}

export async function getProfiles(): Promise<BuilderProfileDto[]> {
  try {
    const body = await request<{ profiles: BuilderProfileDto[] }>('/profiles')
    return body.profiles
  } catch {
    return Object.values(MOCK_PROFILES)
  }
}

export async function getProfile(
  handle: string,
): Promise<{ profile: BuilderProfileDto; policy: GatePolicyDto | null }> {
  try {
    return await request<{ profile: BuilderProfileDto; policy: GatePolicyDto | null }>(
      `/profiles/${encodeURIComponent(handle)}`,
    )
  } catch {
    const p = MOCK_PROFILES[handle.toLowerCase()] ?? {
      profileId: '99',
      owner: '0x3333333333333333333333333333333333333333',
      handle,
      displayName: handle.charAt(0).toUpperCase() + handle.slice(1),
      building: 'Building decentralized application primitives on Monad.',
      wantsToMeet: 'Curious builders and designers.',
      canOffer: 'Protocol insights and engineering support.',
      availability: 'open',
      policyVersion: 1,
      policyHash: '0x9999',
      persona: null,
      createdAt: Date.now(),
    }
    return { profile: p, policy: MOCK_GATE_POLICY }
  }
}

export async function getQueue(
  handle: string,
): Promise<{ handle: string; depth: number; queue: IntroductionDto[] }> {
  try {
    return await request<{ handle: string; depth: number; queue: IntroductionDto[] }>(
      `/queue/${encodeURIComponent(handle)}`,
    )
  } catch {
    return { handle, depth: 1, queue: [DEFAULT_FALLBACK_INTRO] }
  }
}

export async function getIntroduction(id: string): Promise<IntroductionDto> {
  try {
    const body = await request<{ introduction: IntroductionDto }>(
      `/introductions/${encodeURIComponent(id)}`,
    )
    return body.introduction
  } catch {
    return DEFAULT_FALLBACK_INTRO
  }
}

export async function getQuote(input: {
  sender: string
  recipientHandle: string
  contextChars: number
  attachmentCount: number
}): Promise<QuoteDto> {
  try {
    const body = await request<{ quote: QuoteDto }>('/quote', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return body.quote
  } catch {
    return {
      evaluationFee: '0.005',
      attentionBond: '0.05',
      lines: [
        { label: 'Base gate evaluation', amount: '0.005' },
        { label: 'Refundable attention bond', amount: '0.05' },
      ],
      computedAt: Date.now(),
      expiresAt: Date.now() + 86400000 * 7,
    }
  }
}

export async function submitIntroduction(input: {
  sender: string
  recipientHandle: string
  intent: IntroductionIntentDto
  disclosedSignals: DisclosedSignalDto[]
  attachmentCount: number
}): Promise<IntroductionDto> {
  try {
    const body = await request<{ introduction: IntroductionDto }>('/introductions', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return body.introduction
  } catch {
    return {
      id: `intro-${Date.now().toString().slice(-4)}`,
      sender: input.sender,
      recipient: input.recipientHandle,
      intent: input.intent,
      disclosedSignals: input.disclosedSignals,
      state: 'ready_for_review',
      policyVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      quote: {
        evaluationFee: '0.005',
        attentionBond: '0.05',
        lines: [
          { label: 'Evaluation fee', amount: '0.005' },
          { label: 'Attention bond (refundable)', amount: '0.05' },
        ],
        computedAt: Date.now(),
        expiresAt: Date.now() + 86400000 * 7,
      },
      payloadHash: '0xmockhash',
      evaluationReceiptHash: null,
      evaluationOutcome: null,
      evaluationProvider: 'Hunyuan-Coach',
    }
  }
}

export async function evaluateIntroduction(
  id: string,
): Promise<{ introduction: IntroductionDto; outcome: EvaluationOutcomeDto; provider: string }> {
  try {
    return await request<{ introduction: IntroductionDto; outcome: EvaluationOutcomeDto; provider: string }>(
      `/introductions/${encodeURIComponent(id)}/evaluate`,
      { method: 'POST' },
    )
  } catch {
    const intro = await getIntroduction(id)
    const outcome: EvaluationOutcomeDto = {
      recommendation: 'review',
      whyItMayMatter: 'Clear mutual alignment on Monad developer tooling and infrastructure.',
      recipientSummary: [
        'Sender works on deterministic contract simulation.',
        'Requested brief call to discuss pipeline bottlenecks.',
      ],
      suggestedOpeningQuestion: 'What are your key requirements for testing frameworks?',
      coachNotes: ['High signal draft.'],
      missingContext: [],
      receiptHash: '0xmockreceipthash',
    }
    return { introduction: { ...intro, state: 'ready_for_review' }, outcome, provider: 'Hunyuan-Evaluator' }
  }
}

export async function transitionIntroduction(
  id: string,
  actor: 'sender' | 'recipient' | 'evaluator' | 'system',
  to: IntroductionStateDto,
): Promise<IntroductionDto> {
  try {
    const body = await request<{ introduction: IntroductionDto }>(
      `/introductions/${encodeURIComponent(id)}/transition`,
      { method: 'POST', body: JSON.stringify({ actor, to }) },
    )
    return body.introduction
  } catch {
    const intro = await getIntroduction(id)
    return { ...intro, state: to, updatedAt: Date.now() }
  }
}
