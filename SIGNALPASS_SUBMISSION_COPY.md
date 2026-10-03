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

## Portal fields saved — October 3, 2026

The [submission checklist](docs/HACKATHON_SUBMISSION_CHECKLIST.md) tracks remaining work. The primary track is Social, Attention & Culture; unsupported Envio, Dynamic and Hunyuan bounty selections were removed. The entry remains a saved draft, with the owner's two video links outstanding. The repository remains private at the owner's direction. An invitation to the organizer's stated address was sent on October 3 and is awaiting MonadMetropolis's acceptance. The form permits private sharing, but Rules v3.0 sections 4.1 and 7.2 require public source; eligibility through private sharing needs organizer clarification. The October 3 progress update records this blocker, completed work and ordered next steps. Saving progress is not final submission.

### Go-to-market and user acquisition

We will start with a small, opt-in group of 8–12 Monad builders, designers and usability researchers whose offers and current needs complement each other. Recruitment will begin through the team's existing relationships and permitted posts in relevant builder communities. These are planned channels, not existing partnerships or committed users.

Each participant will approve a short profile with one concrete need and one useful contribution. We will help the first participants complete an introduction, then ask both sides whether the explanation was useful, whether the draft needed corrections and whether they chose to continue the conversation.

After a useful exchange, participants can share their public SignalPass profile and invite a relevant peer. We want introductions with a clear purpose, rather than referrals driven by rewards or indiscriminate outreach.

We will track onboarding completion, time to the first approved introduction, recipient responses and participant-reported useful conversations, with consent. The first goal is to learn what makes an introduction worth answering. We have not yet established adoption or conversion figures; public rehearsal accounts are excluded from community metrics. Broader acquisition follows that initial learning.

### Live product

https://signalpass.coderbojack.space/

### Judge access instructions

Live product: https://signalpass.coderbojack.space/

Use an injected Ethereum wallet to sign in. The sign-in signature creates a session; it does not request a payment. Users do not need an AI API key or an external agent installation.

The live directory was empty after QA cleanup on October 3. For live matching, use two consenting people with independent wallets and approved profiles. The intended recipient must be public, open to introductions and opted into matching.

Open https://signalpass.coderbojack.space/assistant?demo=0, describe a concrete goal and choose whether to use your approved profile. Review the recommendation's source quote, prepare a draft, edit it and use the separate confirmation to send. Choose 'Send without a bond' for the first complete journey. The other participant can accept, then each person separately chooses whether to share a contact option.

For an interface-only walkthrough, use https://signalpass.coderbojack.space/discover?demo=1. This is explicitly offline sample mode: no live AI generation, external delivery or payments. Sample mode persists across navigation; the assistant link above explicitly returns to live mode.

Included AI usage is limited to 20 attempts per account and 200 site-wide per UTC day. Optional Monad Mainnet bonds require real MON and gas; inspect recorded transaction evidence without transacting.

Public browser rehearsal (fictional accounts, no bond): https://github.com/huaigu/twingate/blob/main/docs/reports/signalpass-public-journey-2026-10-03.md

Separate mainnet transactions and refunds: https://github.com/huaigu/twingate/blob/main/docs/reports/signalpass-mainnet-deployment-2026-10-03.md

Repository evidence links require access because the source repository is private. An invitation to metropolis@hackathon.monad.xyz (GitHub: MonadMetropolis) was sent on October 3 and is awaiting acceptance. The submission form permits this sharing route, but Rules v3.0 sections 4.1 and 7.2 require public source. Organizer clarification is needed before relying on private access for eligibility; the repository remains private pending resolution. These mainnet transaction links are publicly accessible:

- Accepted introduction lock: https://monadvision.com/tx/0x3f64e633da6c0bff6880703bf8e228419b39125f3fd14747bd048031c45850f6
- Acceptance refund: https://monadvision.com/tx/0xe7c23bc70532bafe2bc2d9ef14b465a73214358a129626a0a40e1b6bb05ab00a
- Declined introduction lock: https://monadvision.com/tx/0x977ba65dcc77ededf7966c3e1c52b21003dd41e476b2dd8079528cc9e1c64717
- Decline refund: https://monadvision.com/tx/0xb4b86d8c62b3611d897fb7908cb50ac06e6ba0617e75b7a17b52d967f6103190
