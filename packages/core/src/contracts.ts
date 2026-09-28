import { parseAbi } from 'viem'
export const profileRegistryAbi = parseAbi([
  'function registerProfile(bytes32 handleHash,bytes32 profileHash,bytes32 policyHash) returns (uint256)',
  'function updatePolicy(uint256 profileId,bytes32 policyHash)',
  'function updateProfileDocument(uint256 profileId,bytes32 profileHash)',
  'function setAcceptsIntroductions(uint256 profileId,bool accepts)',
  'function profileIdByOwner(address) view returns (uint256)',
  'function getProfile(uint256) view returns ((address owner,bytes32 profileHash,bytes32 policyHash,uint32 policyVersion,uint64 updatedAt,bool acceptsIntroductions,bool exists))',
])
export const introductionEscrowAbi = parseAbi([
  'function registry() view returns (address)',
  'function quoteSigner() view returns (address)',
  'function nonces(address) view returns (uint256)',
  'function unresolvedCount(address,address) view returns (uint256)',
  'function unresolvedLimitFor(address) view returns (uint256)',
  'function hashQuote((address sender,address recipient,uint256 recipientProfileId,bytes32 policyHash,uint256 policyVersion,bytes32 payloadHash,uint256 evaluationFee,uint256 attentionBond,uint256 ttl,uint256 quoteExpiresAt,uint256 nonce) quote) view returns (bytes32)',
  'function lockIntroduction((address sender,address recipient,uint256 recipientProfileId,bytes32 policyHash,uint256 policyVersion,bytes32 payloadHash,uint256 evaluationFee,uint256 attentionBond,uint256 ttl,uint256 quoteExpiresAt,uint256 nonce) quote,bytes signature) payable returns (bytes32)',
  'function getIntroduction(bytes32) view returns ((address sender,address recipient,uint256 recipientProfileId,bytes32 policyHash,uint32 policyVersion,bytes32 payloadHash,uint128 evaluationFee,uint128 attentionBond,uint64 lockedAt,uint64 expiresAt,uint8 state))',
  'function accept(bytes32 id)', 'function decline(bytes32 id)', 'function expire(bytes32 id)', 'function withdraw(bytes32 id)',
  'event IntroductionLocked(bytes32 indexed id,address indexed sender,address indexed recipient,uint256 recipientProfileId,uint256 evaluationFee,uint256 attentionBond,uint64 expiresAt)',
  'event AttentionBondRefunded(bytes32 indexed id,address indexed to,uint256 amount)',
  'event IntroductionStateChanged(bytes32 indexed id,uint8 state)',
])
