import type { IntroductionIntent } from '@signalpass/core'

/** Provider implementations must bound response size, tokens and request duration. */
export interface AgentModel {
  readonly provider: string
  readonly model: string
  generate(request: {
    operation: 'discover' | 'draft'
    instructions: string
    input: unknown
    schema: Record<string, unknown>
  }): Promise<{ data: unknown; inputTokens: number; outputTokens: number }>
}

export interface HostedAgentOptions {
  model?: AgentModel
  dailyUserLimit?: number
  dailyGlobalLimit?: number
  maxConcurrent?: number
}

export interface AgentProfile {
  handle: string
  displayName: string
  building: string
  canOffer: string
  wantsToMeet: string
  interests: string[]
}
export type AgentEvidenceField = 'building' | 'canOffer' | 'wantsToMeet' | 'interests'
export interface AgentMatch extends AgentProfile {
  reason: string
  caveat: string
  evidence: Array<{ field: AgentEvidenceField; quote: string }>
}
export interface AgentRun {
  id: string
  goal: string
  createdAt: number
  usedProfile: boolean
  profileVersion: string | null
  matches: AgentMatch[]
  nextQuestion: string | null
  eligibleCandidates: number
  consideredCandidates: number
  candidateLimit: number
}
export interface AgentDraft {
  id: string
  recipientHandle: string
  recipientName: string
  goal: string
  intent: IntroductionIntent
  notes: string[]
  createdAt: number
  expiresAt: number
  usedProfile: boolean
  profileVersion: string
  recipientVersion: string
}
