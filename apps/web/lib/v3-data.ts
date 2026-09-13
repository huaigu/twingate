/**
 * SignalPass V3 Data Models and Seed Data
 *
 * Grounded in:
 * - SIGNALPASS_PRODUCT_DIRECTION.md
 * - docs/SIGNALPASS_AGENT_SURFACES.md
 * - design-explorations/signalpass-v3/
 */

export type ProfileVisibility = 'public' | 'limited' | 'private'

export type DiscoveryGoal = 'chat' | 'collaborate' | 'learn'

export interface ProfileSource {
  id: 'github' | 'twitter' | 'website' | 'agent'
  name: string
  subtitle: string
  url: string
  active: boolean
  verified: boolean
}

export interface UserProfile {
  id: string
  handle: string
  name: string
  headline: string
  avatarUrl: string
  personaChoice: string
  interests: string[]
  canOffer: string
  wantsToMeet: string
  sources: ProfileSource[]
  visibility: ProfileVisibility
  allowAgentMatching: boolean
  allowedSources: {
    github: boolean
    twitter: boolean
    website: boolean
    agent: boolean
  }
}

export interface WidgetConfig {
  persona: string
  name: string
  oneLiner: string
  interests: string[]
  cta: string
}

export interface Candidate {
  id: string
  handle: string
  name: string
  role: string
  avatarUrl: string
  tags: string[]
  sharedCuriosity: string
  complementaryPractice: string
  openToMatching: boolean
  verifiedContext: string
  goals: DiscoveryGoal[]
  building: string
  canOfferList: string[]
  wantsToMeetList: string[]
  notes?: string
}

export interface IntroductionIntent {
  personalNote: string
  exploreTopics: string
  whatIOffer: string
  specificQuestions: string
}

export type IntroductionLifecycleState =
  | 'draft'
  | 'awaiting_confirmation'
  | 'evaluating'
  | 'needs_look'
  | 'waiting_sender'
  | 'saved_later'
  | 'accepted'
  | 'context_requested'
  | 'declined'

export interface OutcomeReceipt {
  receiptHash: string
  timestamp: string
  bondAmount: string
  bondRefunded: boolean
  evaluationFee: string
  evaluationSettled: boolean
  decision: 'accepted' | 'context_requested' | 'declined'
  decisionNote?: string
  contactChannel?: string
  suggestedOpeningQuestion?: string
}

export interface IntroductionRecord {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  senderRole: string
  recipientId: string
  recipientName: string
  recipientAvatar: string
  recipientRole: string
  goal: DiscoveryGoal
  intent: IntroductionIntent
  sharedCuriosity: string
  complementaryPractice: string
  youCanOffer: string[]
  theyCanOffer: string[]
  disclosedSignals: {
    label: string
    kind: string
    verified: boolean
  }[]
  quote: {
    evaluationFee: string
    attentionBond: string
  }
  state: IntroductionLifecycleState
  category: 'needs_look' | 'waiting_sender' | 'saved_later'
  createdAt: string
  updatedAt: string
  receipt?: OutcomeReceipt
}

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'user_alex',
  handle: 'alexchen',
  name: 'Alex Chen',
  headline: 'Builds products at the intersection of people, internet, and creative tech.',
  avatarUrl: '/design/slices/avatar_alex_3d.png',
  personaChoice: '/design/slices/persona_picker_alex.png',
  interests: [
    'Open source',
    'Developer tools',
    'Onchain UX',
    'AI x crypto',
    'Community building',
    'Design systems',
    'Public goods',
    'Monadic culture',
  ],
  canOffer:
    'Product design, frontend development, community building, and feedback on early ideas.',
  wantsToMeet:
    'Founders, designers, and curious people exploring social, identity, and the future of the internet.',
  sources: [
    {
      id: 'github',
      name: 'GitHub',
      subtitle: 'Projects, repositories, contributions',
      url: 'https://github.com/alexchen',
      active: true,
      verified: false,
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      subtitle: 'Ideas, conversations, public activity',
      url: 'https://x.com/alexchen',
      active: true,
      verified: false,
    },
    {
      id: 'website',
      name: 'Personal website',
      subtitle: 'About you, blog, projects, links',
      url: 'https://alexchen.dev',
      active: true,
      verified: false,
    },
    {
      id: 'agent',
      name: 'Import from my Agent',
      subtitle: 'Let your agent find relevant public context',
      url: 'http://localhost:11434',
      active: true,
      verified: false,
    },
  ],
  visibility: 'private',
  allowAgentMatching: true,
  allowedSources: {
    github: true,
    twitter: true,
    website: false,
    agent: false,
  },
}

export const INITIAL_WIDGET_CONFIG: WidgetConfig = {
  persona: '/design/slices/persona_picker_alex.png',
  name: 'Alex Chen',
  oneLiner: 'Building a more open internet with builders.',
  interests: ['Builders', 'Open Source', 'Monad', 'Product', 'Community'],
  cta: 'Meet me on SignalPass',
}

export const CANDIDATES_CATALOG: Candidate[] = [
  {
    id: 'alex',
    handle: 'alex',
    name: 'Alex',
    role: 'Product builder · Curious about distributed teams',
    avatarUrl: '/design/slices/avatar_rohan_candidate.png',
    tags: ['Product', 'Distributed Teams', 'Monad'],
    sharedCuriosity: 'Exploring how smaller, more open teams can build meaningful products.',
    complementaryPractice: 'Alex brings product experience; you bring a community lens. Different angles, shared goals.',
    openToMatching: true,
    verifiedContext: 'You both have publicly available work on Monad. This helps build trust.',
    goals: ['chat', 'collaborate'],
    building: 'Open infrastructure for more people and collaborative tooling.',
    canOfferList: ['Deep experience with Monad', 'Insights on ecosystem growth', 'Introductions to relevant builders'],
    wantsToMeetList: ['Founders', 'Designers', 'Curious builders'],
  },
  {
    id: 'maya',
    handle: 'maya',
    name: 'Maya',
    role: 'Product designer & community builder',
    avatarUrl: '/design/slices/avatar_maya_candidate.png',
    tags: ['Design', 'Communities', 'Open Source'],
    sharedCuriosity: 'You are both exploring how smaller, more open teams can build human social tools.',
    complementaryPractice: 'Maya brings visual craft and community design; you bring product architecture.',
    openToMatching: true,
    verifiedContext: 'Active contributor on Monad testnet governance and design forums.',
    goals: ['collaborate', 'chat'],
    building: 'Designing intuitive social coordination interfaces for decentralized collectives.',
    canOfferList: ['Design systems feedback', 'Community growth strategies', 'UI prototypes'],
    wantsToMeetList: ['Protocol engineers', 'Technical product builders', 'Frontend hackers'],
  },
  {
    id: 'rohan',
    handle: 'rohan',
    name: 'Rohan',
    role: 'Protocol engineer & educator',
    avatarUrl: '/design/slices/avatar_rohan_candidate.png',
    tags: ['Infrastructure', 'Education', 'Monad'],
    sharedCuriosity: 'Shared curiosity about open internet infrastructure and async state machines.',
    complementaryPractice: 'Rohan specializes in low-level consensus and execution; you focus on user surfaces.',
    openToMatching: true,
    verifiedContext: 'Deployed 4 verifiable contracts on Monad; technical workshop host.',
    goals: ['learn', 'collaborate'],
    building: 'High-throughput contract testing harnesses and developer onboarding workshops.',
    canOfferList: ['Deep protocol architecture review', 'Monad performance tips', 'Compiler insights'],
    wantsToMeetList: ['Application builders', 'Dev toolmakers', 'Technical writers'],
  },
  {
    id: 'leo',
    handle: 'leo',
    name: 'Leo',
    role: 'Creator & researcher',
    avatarUrl: '/design/slices/avatar_leo_candidate.png',
    tags: ['Content', 'Research', 'Onchain Culture'],
    sharedCuriosity: 'Shared curiosity about creator economies, tokenized attention, and durable curation.',
    complementaryPractice: 'Leo excels at storytelling, cultural resonance, and distribution.',
    openToMatching: true,
    verifiedContext: 'Authored long-form essays on decentralized attention and internet history.',
    goals: ['chat', 'learn'],
    building: 'Curated knowledge archives exploring how creative works persist across protocol shifts.',
    canOfferList: ['Editorial feedback', 'Cultural context mapping', 'Audience connection'],
    wantsToMeetList: ['Creative coders', 'Platform architects', 'Independent researchers'],
  },
  {
    id: 'bob',
    handle: 'bob',
    name: 'Bob',
    role: 'Infrastructure builder & data indexing',
    avatarUrl: '/design/avatars/bob.png',
    tags: ['Social graphs', 'Indexing', 'Monad'],
    sharedCuriosity: 'Shared passion for high-speed indexing and verifiable social signals on Monad.',
    complementaryPractice: 'Bob brings back-end indexing and storage pipeline expertise.',
    openToMatching: true,
    verifiedContext: 'Maintainer of open-source indexing pipeline for Metropolis ecosystem.',
    goals: ['collaborate', 'chat'],
    building: 'Real-time indexing infrastructure for social graphs and attention bonds on Monad.',
    canOfferList: ['High-throughput indexing support', 'Data schemas', 'GraphQL endpoints'],
    wantsToMeetList: ['Designers', 'Full-stack developers', 'Community leads'],
  },
  {
    id: 'alice',
    handle: 'alice',
    name: 'Alice',
    role: 'Simulation & contract security engineer',
    avatarUrl: '/design/avatars/alice.png',
    tags: ['Simulation', 'Protocol design', 'Monad'],
    sharedCuriosity: 'Deep focus on deterministic execution and verifiable agent handshakes.',
    complementaryPractice: 'Alice brings formal contract modeling and rigorous simulation engineering.',
    openToMatching: true,
    verifiedContext: 'Authored fuzzing harness used by multiple Monad teams.',
    goals: ['learn', 'collaborate'],
    building: 'Deterministic simulation harness for asynchronous parallel smart contracts.',
    canOfferList: ['Security auditing assistance', 'Contract fuzzing models', 'Gas profiling'],
    wantsToMeetList: ['Ecosystem architects', 'System developers', 'Autonomous agent teams'],
  },
]

export const SEEDED_INBOX_INTRODUCTIONS: IntroductionRecord[] = [
  {
    id: 'intro-1',
    senderId: 'alex',
    senderName: 'Alex',
    senderAvatar: '/design/slices/avatar_rohan_candidate.png',
    senderRole: 'Product builder · Curious about distributed teams',
    recipientId: 'maya',
    recipientName: 'Maya',
    recipientAvatar: '/design/slices/avatar_maya_candidate.png',
    recipientRole: 'Explorer · Interested in open collaboration',
    goal: 'collaborate',
    intent: {
      personalNote:
        'Hi Maya, I have been following your work on community coordination and really appreciate your perspective on open infrastructure.',
      exploreTopics:
        'I would love to hear your thoughts on how smaller, more open teams can build human-centered social tools without noisy algorithmic feeds.',
      whatIOffer:
        'I work on product design and frontend architecture, and can share concrete lessons from our recent Metropolis builds.',
      specificQuestions:
        'Would you be open to a 20-minute chat about community tools, onboarding workflows, and design patterns?',
    },
    sharedCuriosity:
      'You are both exploring how smaller, more open teams can build meaningful products.',
    complementaryPractice:
      'Alex brings product experience; you bring a community lens. Different angles, shared goals.',
    youCanOffer: ['Product design experience', 'Community perspective', 'Lessons from recent builds'],
    theyCanOffer: [
      'Deep experience with Monad',
      'Insights on ecosystem growth',
      'Introductions to relevant builders',
    ],
    disclosedSignals: [
      {
        label: 'Both have publicly available work on Monad ecosystem',
        kind: 'monad_activity',
        verified: true,
      },
    ],
    quote: {
      evaluationFee: '0.005 MON',
      attentionBond: '0.05 MON',
    },
    state: 'needs_look',
    category: 'needs_look',
    createdAt: '2 days ago',
    updatedAt: '2 days ago',
  },
  {
    id: 'intro-2',
    senderId: 'sam',
    senderName: 'Sam',
    senderAvatar: '/design/slices/avatar_alex_3d.png',
    senderRole: 'Researcher · Exploring onchain coordination',
    recipientId: 'maya',
    recipientName: 'Maya',
    recipientAvatar: '/design/slices/avatar_maya_candidate.png',
    recipientRole: 'Explorer · Interested in open collaboration',
    goal: 'chat',
    intent: {
      personalNote: 'Hi! Reading your recent posts on token curation touched on questions I am writing about.',
      exploreTopics: 'Discussing curation mechanisms that prioritize human attention over liquidity.',
      whatIOffer: 'Synthesized research notes from 15 decentralized curation experiments.',
      specificQuestions: 'What friction points have you observed when community members evaluate submissions?',
    },
    sharedCuriosity: 'Exploring sustainable, anti-spam attention models on high-throughput chains.',
    complementaryPractice: 'Sam provides comparative historical research; you test real user patterns.',
    youCanOffer: ['Historical curation datasets', 'Mechanism teardowns'],
    theyCanOffer: ['User feedback observations', 'Design heuristics'],
    disclosedSignals: [],
    quote: {
      evaluationFee: '0.005 MON',
      attentionBond: '0.05 MON',
    },
    state: 'needs_look',
    category: 'needs_look',
    createdAt: '4 days ago',
    updatedAt: '4 days ago',
  },
  {
    id: 'intro-3',
    senderId: 'jordan',
    senderName: 'Jordan',
    senderAvatar: '/design/slices/avatar_rohan_candidate.png',
    senderRole: 'Developer · Interested in creator tools',
    recipientId: 'maya',
    recipientName: 'Maya',
    recipientAvatar: '/design/slices/avatar_maya_candidate.png',
    recipientRole: 'Explorer · Interested in open collaboration',
    goal: 'learn',
    intent: {
      personalNote: 'Building an onchain audio player and looking for community design guidance.',
      exploreTopics: 'How creators want their intellectual property attributed in collaborative mixes.',
      whatIOffer: 'Full-stack TypeScript / Rust engineering and audio protocol prototyping.',
      specificQuestions: 'Are there specific licensing primitives creator communities have asked for?',
    },
    sharedCuriosity: 'Audio and media primitives that preserve creator sovereignty.',
    complementaryPractice: 'Jordan handles media protocol engineering; you bring creator community ties.',
    youCanOffer: ['Protocol prototypes', 'Audio streaming infra'],
    theyCanOffer: ['Direct creator feedback', 'Community advisory'],
    disclosedSignals: [],
    quote: {
      evaluationFee: '0.005 MON',
      attentionBond: '0.05 MON',
    },
    state: 'needs_look',
    category: 'needs_look',
    createdAt: '5 days ago',
    updatedAt: '5 days ago',
  },
  {
    id: 'intro-4',
    senderId: 'taylor',
    senderName: 'Taylor',
    senderAvatar: '/design/avatars/taylor.png',
    senderRole: 'Designer · Shared event interest',
    recipientId: 'maya',
    recipientName: 'Maya',
    recipientAvatar: '/design/slices/avatar_maya_candidate.png',
    recipientRole: 'Explorer · Interested in open collaboration',
    goal: 'collaborate',
    intent: {
      personalNote: 'Reaching out regarding Metropolis hackathon project co-design.',
      exploreTopics: 'Pairing on UI design components for decentralized social tooling.',
      whatIOffer: 'Figma component library and interaction specs.',
      specificQuestions: 'Can we sync on shared design tokens?',
    },
    sharedCuriosity: 'Design systems for web3 applications with tactile, organic aesthetic.',
    complementaryPractice: 'Taylor focuses on component typography; you focus on flow ergonomics.',
    youCanOffer: ['Design tokens', 'Micro-interactions'],
    theyCanOffer: ['Flow architecture', 'Ecosystem integration'],
    disclosedSignals: [],
    quote: {
      evaluationFee: '0.005 MON',
      attentionBond: '0.05 MON',
    },
    state: 'waiting_sender',
    category: 'waiting_sender',
    createdAt: '1 week ago',
    updatedAt: '1 week ago',
  },
  {
    id: 'intro-5',
    senderId: 'priya',
    senderName: 'Priya',
    senderAvatar: '/design/avatars/priya.png',
    senderRole: 'Community builder · Exploring governance models',
    recipientId: 'maya',
    recipientName: 'Maya',
    recipientAvatar: '/design/slices/avatar_maya_candidate.png',
    recipientRole: 'Explorer · Interested in open collaboration',
    goal: 'chat',
    intent: {
      personalNote: 'Loved your thoughts on asynchronous governance in small collectives.',
      exploreTopics: 'How personal agents can filter consensus discussions without replacing voting.',
      whatIOffer: 'Case studies from 6 live DAO governance transitions.',
      specificQuestions: 'Have you seen examples where agent summarization prevented decision fatigue?',
    },
    sharedCuriosity: 'Reducing decision fatigue while maintaining decentralized sovereignty.',
    complementaryPractice: 'Priya brings governance facilitation experience; you bring product clarity.',
    youCanOffer: ['Governance frameworks', 'Facilitation playbooks'],
    theyCanOffer: ['Product UI design', 'Attention models'],
    disclosedSignals: [],
    quote: {
      evaluationFee: '0.005 MON',
      attentionBond: '0.05 MON',
    },
    state: 'saved_later',
    category: 'saved_later',
    createdAt: '2 weeks ago',
    updatedAt: '2 weeks ago',
  },
]
