# SignalPass

**People worth knowing, with context.**

SignalPass is an **AI introduction assistant** for communities. Tell it who you want to meet or what you need help with. Your Personal Agent suggests relevant people, shows the profile quotes behind each suggestion, and helps you write a thoughtful first message. You review what is sent; the other person decides whether to continue.

Built first for builder communities: a member needs specific help, another member has relevant experience, and both need a clear reason to start a conversation. Monad builders are our initial community. Our broader vision is personal agents helping people connect around shared interests and complementary goals.

[Open SignalPass](https://signalpass.coderbojack.space/) · [Try your Personal Agent](https://signalpass.coderbojack.space/assistant?demo=0) · [Try the guided story](https://signalpass.coderbojack.space/v4/walkthrough.html) · [Inspect the evidence](https://signalpass.coderbojack.space/v4/evidence.html)

## Demo

> Updated October 7: the guided story, evidence page and V3 films are live. Public browser checks verified both videos, the walkthrough, mobile loading states and evidence links.

[![Watch SignalPass in action](https://signalpass.coderbojack.space/media/signalpass-demo-20261007-v3.png)](https://signalpass.coderbojack.space/media/signalpass-demo-20261003.html)

[Watch the two-person demo](https://signalpass.coderbojack.space/media/signalpass-demo-20261003.html) · [Watch the product pitch](https://signalpass.coderbojack.space/media/signalpass-product-pitch-20261007-v3.mp4)

Alice needs feedback on a wallet prototype. Bob offers usability reviews. Follow their introduction in a **2:53 narrated product demo**, or watch the **1:51 product pitch** for the idea and why it matters. The films use edited production recordings, fictional participants, real AI responses, English narration and subtitles, and original music. The introduction uses no bond; the separate Monad segment shows verified mainnet test transactions.

- **Live product:** [start an assisted introduction](https://signalpass.coderbojack.space/assistant?demo=0). Live matching requires people to approve their profiles, make them public and opt into matching. Use **Send without a bond** for a first complete journey.
- **Guided story:** [follow Alice and Bob](https://signalpass.coderbojack.space/v4/walkthrough.html) without a wallet. Compare a weak fit with Bob’s explicit offer, edit and review a sample introduction, exchange context, accept and choose contact sharing independently. These prepared examples run only in the page; no live AI, real delivery or payment occurs. Back rewinds later actions; restart or reload clears sample edits.
- **Free exploration:** [browse fictional profiles](https://signalpass.coderbojack.space/discover?demo=1) in the existing sample app. Open the live assistant link to exit that sample mode.
- **Current service status:** [deployment and capability boundaries](https://signalpass.coderbojack.space/status).

On October 3, two explicitly fictional accounts completed the public HTTPS flow with live AI, an edited and separately confirmed introduction, acceptance and mutual contact sharing. This rehearsal used no bond; the receipt was also checked at a 390-pixel viewport. [Public journey evidence](docs/reports/signalpass-public-journey-2026-10-03.md). Synthetic rehearsals are not community traction or a recommendation-quality benchmark; their profiles were hidden after verification.

## How it works

1. **Start with a goal.** Describe who you want to meet or what you want to work on. Sign in with an injected Ethereum wallet and approve the profile context your agent may use. The sign-in signature creates a session; it is not a payment.
2. **See people with reasons.** The agent considers eligible public, matching-enabled profiles and shows source quotes alongside its explanation of a possible fit. It may ask a clarification when useful. Profile claims are self-reported; no-match and tentative-fit results are valid outcomes.
3. **Make the introduction yours.** Review a private draft, edit the context and proposed next step, then confirm the exact message in a separate send review. You can send without a bond. AI cannot send or spend for you.
4. **Let the other person choose.** The recipient can accept, ask for context or decline. After acceptance, each person can preview and explicitly share a contact or scheduling link. Acceptance never reveals contact details automatically.

SignalPass provides the hosted agent: users do not need their own model key, OpenClaw or Hermes. The public pilot uses TokenRhythm `deepseek-v4-flash`, sponsored by SignalPass with limits of **20 inference attempts per account and 200 site-wide per UTC day**. Failures count toward those limits; they are request limits, not a monetary spending cap. Private drafts and history belong to the signed-in account. [Agent setup and privacy boundaries](docs/HOSTED_AGENT.md).

## Optional attention bonds on Monad

For an introduction that benefits from an extra commitment, the sender can explicitly approve a refundable attention bond on **Monad Mainnet, chain 143**. The bond is locked in escrow and refunded on acceptance or decline. An unresolved introduction can be expired with a resolution transaction. Manual review charges no AI evaluation fee; network gas still applies.

Mainnet profile registration, bond locks, acceptance, decline and full refunds were verified using project-owned wallets. Expiry is verified in the local EVM suite only. These settlement checks are separate from the public no-bond AI rehearsal. [Contract addresses and transaction evidence](docs/reports/signalpass-mainnet-deployment-2026-10-03.md) · [Wallet-bond design](docs/WALLET_BONDS.md).

## Matching quality and evidence

The [public evidence page](https://signalpass.coderbojack.space/v4/evidence.html) separates the synthetic matching benchmark, production browser rehearsal and historical mainnet settlement. The [evaluation methodology](docs/MATCHING_EVALUATION.md) documents the frozen cases, production discovery route and BM25 keyword comparison.

In one **20-call hosted evaluation** with no operational failures, the agent returned a relevant first result for **16/16** positive cases and abstained correctly in **4/4** no-match cases. However, **10 unwanted secondary suggestions** lowered strict case success to **14/20**, versus **15/20** for the keyword baseline; returned recommendation relevance was **17/27**, versus **15/18**. This is a mixed result, not evidence of overall superiority to keyword matching.

All 38 quoted fragments matched source text, but a [qualitative review by the coding assistant](docs/reports/matching-live-2026-10-07/claim-review.md) still found unsupported or contradictory explanations. The review distinguishes actual claim errors from secondary matches permitted by the product's exploratory policy but rejected by the benchmark's stricter direct-fit rule. Exact quotes do not prove every generated claim. These are engineering results on 20 team-authored fictional cases, with one hosted sample per case, not independent human evaluation or customer traction. [Complete report and limitations](docs/reports/matching-live-2026-10-07/report.md) · [Case-level output](docs/reports/matching-live-2026-10-07/results.json).

An October 7 production rehearsal repeated discovery, edited-message delivery, acceptance and separately approved contact sharing on the latest interface. It used two hosted inference calls, no wallet transaction, and passed persistence and a 390px receipt-layout check. [Machine-readable rehearsal report](docs/reports/signalpass-public-journey-2026-10-07.json).

## Run locally

Use **Node.js 22.13 or later** and **pnpm 10.32.1**. Git access is required to clone this repository. Foundry is needed for contract tests or the optional local bond flow.

```bash
git clone --recurse-submodules https://github.com/huaigu/twingate.git
cd twingate
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:3004/**. This starts the API and web app; the default no-payment introduction flow does not need a chain. Existing clones can run `git submodule update --init --recursive` to initialize `forge-std`.

A fresh installation leaves the hosted Personal Agent disabled until a server-side provider is configured. Follow [the hosted agent guide](docs/HOSTED_AGENT.md); never put a provider key in the browser. API settings must be exported into the process environment; `.env` is not loaded automatically. For the guided fictional story, open `http://localhost:3004/v4/walkthrough.html`.

For a real **local** EVM bond flow, install Forge and Anvil, run `pnpm chain:dev`, and open **http://localhost:3005/**. It is explicitly labelled DEV and is not Monad Mainnet. [Full setup, verification commands and deployment](docs/DEVELOPMENT.md).

## Architecture

| Component | Responsibility |
| --- | --- |
| `apps/web` | Next.js hosts the current native HTML/CSS/JavaScript pages, stable routes and same-origin API proxy. React pages and earlier design iterations also remain in the repository. |
| `services/api` | Hono API for signed sessions, profile consent, hosted discovery/drafts, introductions and explicit contact sharing. SQLite persists private records and request budgets. |
| `packages/core` | Shared TypeScript state machine, schemas, pricing and typed signing payloads. |
| `packages/contracts` | Solidity/Foundry profile registry, introduction escrow and receipt contracts. |
| `services/evaluator` | Separate evaluation service with explicit mock mode and an unconfigured Hunyuan adapter. It is not the hosted Personal Agent. |
| `services/indexer` | Envio configuration, event handlers and tested aggregations; a live product index is not integrated. |

The live API uses one process and persistent SQLite with WAL. Private records are access-controlled, not application-level encrypted at rest. See [production boundaries and agent surfaces](docs/SIGNALPASS_AGENT_SURFACES.md) and the [architecture diagram](docs/architecture/signalpass-product-architecture.html).

## Development and evidence

- [Development guide](docs/DEVELOPMENT.md): setup, tests, deployment and original commit provenance.
- [October 7 deployment evidence](docs/reports/signalpass-deployment-2026-10-07.json) and [public release QA](docs/reports/signalpass-release-qa-2026-10-07.json).
- [Two-person pilot guide](docs/PILOT.md): a consent-based first trial, feedback questions and cleanup.
- [Hosted agent](docs/HOSTED_AGENT.md) and [public provider/restart verification](docs/reports/signalpass-tokenrhythm-2026-10-03.md).
- [Product direction](SIGNALPASS_PRODUCT_DIRECTION.md), [product walkthrough](docs/HACKATHON_PRODUCT_DEMO.md) and [VPS operations](docs/VPS-DEPLOYMENT.md).
- [Third-party notices](THIRD_PARTY_NOTICES.md): reused software, fonts and asset provenance.

The retained original GitHub history begins on **September 11, 2026**, with documentation followed by the first application scaffold that day. [Development provenance](docs/DEVELOPMENT.md#development-provenance) identifies the commits, existing third-party foundations and limits of that evidence.

## AI Coding Assistance

AI coding tools were used to draft contract, domain, service and UI code. The project team reviews and integrates changes and checks behavior with unit, contract, API and browser tests. AI assistance does not replace the recipient's decisions or wallet approvals in the product. The development guide distinguishes fixture-based checks from live-model and onchain evidence.

## License

Project code is licensed under the [MIT License](LICENSE). Third-party components retain their own licenses and notices; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

