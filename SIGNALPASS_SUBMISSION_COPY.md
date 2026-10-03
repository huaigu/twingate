# SignalPass Submission Copy

> Status: current-state submission copy, reviewed against the public verification reports on 2026-10-03.
> Primary track: **03 Social, Attention & Culture**.
> Public product: [SignalPass](https://signalpass.coderbojack.space/). Evidence below distinguishes the complete public no-bond journey from the separate mainnet settlement tests.

## Name

SignalPass

## One-Liner

SignalPass gives people a personal agent to find a reason to connect, prepare an introduction they approve, and make an optional refundable attention commitment on Monad.

## Vision

**People worth knowing, with context.**

We want everyone to have a private Personal Agent that understands who they are, helps them find people worth meeting, and prepares the first conversation. People choose what to share and whether a relationship begins. Monad builders are our first community, not the limit of that vision.

## Description

Good connections often start with a bad introduction: a vague message that gives someone little reason to reply. SignalPass helps people explain who they are, why they want to connect, what they can offer and what they would like to do next.

The public Web app provides a Personal Agent: describe a goal, consider a few people with quotes from their public profiles, clarify what matters and prepare a private introduction draft. The “Why you two” card connects what you need with what another person says they can offer. Source quotes support the suggestion; they do not establish expertise or mutual interest. Users do not need their own agent host or model key.

The sender edits the draft, reviews the exact message and chooses what profile context to share before confirming delivery. The recipient can ask for context, accept or decline. After acceptance, each participant can explicitly share a contact or scheduling channel; acceptance itself reveals no contact details. A public browser rehearsal completed this entire journey with two fictional, independently signed-in accounts and live AI, using the no-bond option. The agent cannot send, accept or spend on either person's behalf. The manual directory and editor remain available without AI.

Optional refundable attention bonds are live on Monad Mainnet, chain 143. The sender approves a signed quote; delivery follows confirmed funding. Two project-owned wallets have completed registration, locks, acceptance and decline with full bond refunds and public transaction evidence. An unanswered request can be resolved after its deadline; this expiry path is verified locally and has not yet been exercised on mainnet. Manual review charges zero AI evaluation fee, while network gas still applies. Paying never guarantees a response or acceptance.

The hosted pilot uses TokenRhythm `deepseek-v4-flash`. SignalPass covers inference within limits of 20 attempts per account and 200 across the site per UTC day, including failed attempts. Public discovery, clarification and drafting passed with explicitly fictional profiles; sessions, history, private drafts and quotas survived an actual API service restart. These are functional checks, not community traction or a ranking benchmark. No zero-cost provider claim is made. Monad builders are our first community; the ambition is a better beginning to relationships built around collaboration, learning and shared interests.

## Current Capability Boundary

| Capability | What can be claimed today |
| --- | --- |
| Web introductions | Authenticated cross-account delivery, profile approval and visibility, context requests/replies, recipient decisions, participant-only receipts, explicit accepted-contact sharing and persistence are implemented. |
| Wallet bonds | Mainnet registration, signed quotes, funding verification, acceptance/decline and full refunds have [public transaction evidence](docs/reports/signalpass-mainnet-deployment-2026-10-03.md). Expiry refund remains locally verified only. |
| AI evaluation and cost | The wallet-bond flow uses human review with zero AI evaluation fee. Hosted discovery/refinement/drafting is sponsored by SignalPass within request quotas; it is separate from sender-funded evaluation. The current provider's billing amount was not established by testing. |
| Hosted Personal Agent | TokenRhythm is enabled on the public site. Three public provider calls verified discovery, clarification and drafting, with real API restart persistence and owner-only access. See [activation and acceptance evidence](docs/reports/signalpass-tokenrhythm-2026-10-03.md). |
| Combined public journey | A [public Chromium rehearsal](docs/reports/signalpass-public-journey-2026-10-03.md) completed live AI → edited introduction → separate send confirmation → acceptance → explicit contact sharing. Exact edited wording was delivered; acceptance and shared contacts survived refresh. This used two fictional accounts and the no-bond option, with no MON transaction. |
| Bring your own agent | A person can import a JSON profile draft and review it. This is not a direct OpenClaw or Hermes integration. |
| Privacy | Private introduction records have participant access controls. The server does not provide application-level encryption at rest or end-to-end encrypted chat. |
| Sponsors | Dynamic, a live Envio index and Nansen verification are not integrated. Hunyuan remains unconfigured. No sponsor integration is claimed as complete. |

## Roadmap — Not Shipped Claims

1. **Useful connections in practice:** recruit a small, consenting first community of Monad builders. Record whether source-backed suggestions help, whether drafts need factual corrections and whether accepted introductions lead to useful conversations. Public matching requires approved, public, opted-in profiles. Rehearsal profiles were hidden after testing; no community outcome figures are claimed.
2. **Recommendation quality:** compare genuinely relevant, weak and no-match cases across a varied, consented candidate pool. Functional provider and browser checks do not establish ranking quality or every generated claim's accuracy.
3. **Sender-funded evaluation:** connect real evaluation to settlement before charging an evaluation fee. Display the fee separately from the refundable bond and explain when it is earned. Pre-evaluation expiry must refund both the unearned fee and bond; AI must never seize the bond or accept an introduction.
4. **Optional enhancements:** evaluate recipient inbox assistance, embedded wallets, event indexing, consented verified signals, external agent hosts and 3D personas when they improve the introduction experience or meet a selected bounty's verified requirements.

## Copy Rules

- Lead with **people**, **context**, **introductions** and **human consent**. Describe Monad builders as the initial community.
- Describe hosted discovery/refinement/drafting as publicly enabled with TokenRhythm. The complete public browser journey used fictional profiles and no bond; mainnet settlement was verified separately. Neither result establishes community outcomes or ranking quality. Broader Personal Agent abilities remain vision.
- Identify **sample mode**, **live no-payment mode**, **local EVM**, **testnet** and **Monad Mainnet (143)** accurately. Mainnet acceptance/decline refunds do not establish mainnet expiry behavior.
- Keep fees and bonds separate. The current manual-review wallet flow has a zero AI evaluation fee; gas still applies. A refundable bond does not buy acceptance or eliminate every form of spam.
- Do not call SignalPass a chat protocol, public infrastructure layer, or standalone pay-to-DM product.
- SignalPass-sponsored AI usage is not a promise that the provider is free; 20/200 daily limits cap attempts, not currency spend. Historical OpenRouter zero-cost test results do not describe current TokenRhythm billing.
- Do not claim private chat, autonomous outreach, private-profile matching, source verification, recipient inbox AI, installed agent skills or sponsor integrations without implementation and runtime evidence.
- Do not describe wallet context as a wealth score or let it imply automatic access decisions.
- Keep future capabilities in the roadmap, not in present-tense submission claims.
