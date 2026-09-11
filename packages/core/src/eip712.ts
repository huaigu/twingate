import type { Address, Hex } from 'viem'

/**
 * The signature that locks an introduction. The recipient never signs; the
 * sender authorises the escrow to hold their evaluation fee and attention bond
 * for the duration of the introduction.
 */
export const EIP712_DOMAIN_NAME = 'SignalPass'
export const EIP712_DOMAIN_VERSION = '1'

export function escrowDomain(chainId: number, verifyingContract: Address) {
  return {
    name: EIP712_DOMAIN_NAME,
    version: EIP712_DOMAIN_VERSION,
    chainId,
    verifyingContract,
  } as const
}

export const LOCK_INTRODUCTION_TYPES = {
  LockIntroduction: [
    { name: 'sender', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'recipientProfileId', type: 'uint256' },
    { name: 'policyHash', type: 'bytes32' },
    { name: 'payloadHash', type: 'bytes32' },
    { name: 'evaluationFee', type: 'uint256' },
    { name: 'attentionBond', type: 'uint256' },
    { name: 'quoteExpiresAt', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const

export interface LockIntroductionMessage {
  readonly sender: Address
  readonly recipient: Address
  readonly recipientProfileId: bigint
  readonly policyHash: Hex
  readonly payloadHash: Hex
  readonly evaluationFee: bigint
  readonly attentionBond: bigint
  readonly quoteExpiresAt: bigint
  readonly nonce: bigint
}

/**
 * The evaluator signs its verdict so a recipient can verify that the summary
 * they were shown came from the policy version it claims.
 */
export const EVALUATION_RECEIPT_TYPES = {
  EvaluationReceipt: [
    { name: 'introductionId', type: 'bytes32' },
    { name: 'policyVersion', type: 'uint32' },
    { name: 'modelVersion', type: 'string' },
    { name: 'recommendation', type: 'uint8' },
    { name: 'receiptHash', type: 'bytes32' },
    { name: 'issuedAt', type: 'uint256' },
  ],
} as const

export const RECOMMENDATION_CODE: Readonly<Record<'review' | 'ask_for_context' | 'not_now', number>> = {
  review: 0,
  ask_for_context: 1,
  not_now: 2,
}

export interface EvaluationReceiptMessage {
  readonly introductionId: Hex
  readonly policyVersion: number
  readonly modelVersion: string
  readonly recommendation: number
  readonly receiptHash: Hex
  readonly issuedAt: bigint
}
