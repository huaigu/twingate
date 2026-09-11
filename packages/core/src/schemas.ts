import { z } from 'zod'

export const availabilitySchema = z.enum(['open', 'selective', 'closed'])

export const introductionIntentSchema = z.object({
  whoAmI: z.string().min(1).max(600),
  whyYou: z.string().min(1).max(600),
  whatIOffer: z.string().min(1).max(600),
  nextStep: z.string().min(1).max(300),
})

export const disclosedSignalSchema = z.object({
  kind: z.enum(['monad_activity', 'deployed_contract', 'ecosystem_membership']),
  label: z.string().min(1).max(160),
  evidenceUrl: z.string().url().nullable(),
  consentedAt: z.number().int().nonnegative(),
})

export const gatePolicySchema = z.object({
  version: z.number().int().nonnegative(),
  topics: z.array(z.string().min(1).max(80)).max(12),
  availability: availabilitySchema,
  desiredNextStep: z.string().min(1).max(300),
  baseBond: z.coerce.bigint().nonnegative(),
  unresolvedLimit: z.number().int().positive().max(20),
  timeoutSeconds: z.number().int().positive(),
})

export const builderProfileInputSchema = z.object({
  handle: z.string().min(3).max(32).regex(/^[a-z0-9_-]+$/),
  displayName: z.string().min(1).max(80),
  building: z.string().min(1).max(240),
  wantsToMeet: z.string().min(1).max(240),
  canOffer: z.string().min(1).max(240),
  availability: availabilitySchema,
})

export const introductionSubmissionSchema = z.object({
  sender: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  recipientHandle: z.string().min(3).max(32),
  intent: introductionIntentSchema,
  disclosedSignals: z.array(disclosedSignalSchema).max(3).default([]),
  attachmentCount: z.number().int().min(0).max(5).default(0),
})

export const quoteRequestSchema = z.object({
  sender: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  recipientHandle: z.string().min(3).max(32),
  contextChars: z.number().int().min(0).max(20_000).default(0),
  attachmentCount: z.number().int().min(0).max(5).default(0),
})

export const personaRequestSchema = z.object({
  handle: z.string().min(3).max(32),
  sourceKind: z.enum(['image', 'text']),
  /** Text description, or an URL to an image the builder has the right to use. */
  source: z.string().min(1).max(2000),
})

export type IntroductionSubmission = z.infer<typeof introductionSubmissionSchema>
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export type PersonaRequest = z.infer<typeof personaRequestSchema>
export type BuilderProfileInput = z.infer<typeof builderProfileInputSchema>
