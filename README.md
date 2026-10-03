# SignalPass

**People worth knowing, with context.** [Open SignalPass](https://signalpass.coderbojack.space/) or [your Personal Agent](https://signalpass.coderbojack.space/assistant).

V4 live product: run `pnpm dev`, then open `http://localhost:3004/`. This starts the API and web app. Sign in with an injected Ethereum wallet; the signature authorizes a session, never a payment. The explicitly labelled offline sample is available at `/?demo=1`; `/?demo=0` returns to live mode.
For the wallet-bond flow with Hunyuan disabled, run `pnpm chain:dev` and open `http://localhost:3005/`. It uses a real local EVM, explicitly labelled DEV. See [wallet bonds and deployment](docs/WALLET_BONDS.md).
See [V4 pages, interactions and implementation notes](design-explorations/signalpass-v4/README.md).

> **Thoughtful introductions, starting with the Monad builder community**
> Built for the **Monad Metropolis Global Hackathon 2026**  
> Track: **Social, Attention & Culture**

---

## 📖 Overview

**SignalPass** helps people find a reason to connect, prepare a thoughtful introduction and choose whether to continue the conversation. Monad builders are the first community. Optional attention bonds settle on **Monad Mainnet**.

SignalPass provides the Personal Agent at `/assistant`: describe a goal, review a few people with public-profile evidence, clarify what matters and prepare a private introduction draft. The human edits and confirms every send or money action. Users do not need OpenClaw, Hermes or their own model key; those hosts remain optional future adapters. The public pilot uses **TokenRhythm `deepseek-v4-flash`**, with SignalPass covering up to **20 inference attempts per account and 200 across the site per UTC day**. These limits include failures and are not a monetary budget; no zero-cost provider claim is made. See [hosted agent setup and boundaries](docs/HOSTED_AGENT.md).

### Verified public status — October 3, 2026

| Scope | Evidence |
| --- | --- |
| Hosted agent | Public HTTPS discovery, clarification and private drafting passed with explicitly fictional profiles. Sessions, history, drafts and consumed quota survived an actual API service restart. [TokenRhythm report](docs/reports/signalpass-tokenrhythm-2026-10-03.md). |
| Monad Mainnet (`143`) | Two project-owned wallets registered profiles, locked bonds, accepted and declined introductions, and received full bond refunds. [Transactions and deployment checks](docs/reports/signalpass-mainnet-deployment-2026-10-03.md). Expiry refund is verified locally, not by a mainnet expiry transaction. |
| Combined product rehearsal | Two independently signed-in fictional accounts completed live AI → edited introduction → separate send confirmation → recipient acceptance → explicit contact sharing in Chromium against the public HTTPS site. This rehearsal used the no-bond option and made no MON transaction; it is separate from the mainnet tests. [Public journey report](docs/reports/signalpass-public-journey-2026-10-03.md). |

The public rehearsals hid their QA profiles and cleared AI history and shared test contacts after verification. Recommendations require people to approve profiles, make them public and opt into matching. Synthetic test accounts are not community traction or proof of recommendation quality across a community.

### The Core Problem
1. **Cold DMs lack context**: People cannot tell whether a stranger shares a useful interest or is sending another generic pitch.
2. **Compute inversion**: If a recipient uses an AI gatekeeper, the recipient should not pay to assess an unsolicited request.
3. **Blunt paywalls fail socially**: A fixed price can discourage legitimate first-time collaborators without creating a better introduction experience.

### The SignalPass Experience
1. **A goal that survives setup**: Enter what you need, sign in and approve your profile, then return to the same goal and selected person.
2. **People with reasons**: The hosted agent recommends eligible public profiles with source quotes and a “Why you two” explanation. Answer a clarification to refine the original goal; a weak fit stays tentative and no-match is a valid outcome.
3. **An introduction you approve**: Explicitly permit profile use, review a private four-part draft, edit it and independently choose what context to share. AI cannot send or spend.
4. **A recipient with a choice**: The recipient accepts, asks for context or declines. Optional refundable wallet bonds are live on Monad Mainnet; manual review has zero AI evaluation fee. [Deployment and refund evidence](docs/reports/signalpass-mainnet-deployment-2026-10-03.md).
5. **An explicit next step**: After acceptance, each participant can choose and share one contact or scheduling channel with the other participant. Acceptance never exposes contact details automatically.

Hunyuan persona generation, a recipient-side autonomous agent, Nansen verification and embedded wallets remain future integrations. See [the product demo and first-community guide](docs/HACKATHON_PRODUCT_DEMO.md) for the current complete journey and clearly labelled rehearsal data.

---

## 📚 Project Documentation

In this repository:

- [📒 Product Direction](./SIGNALPASS_PRODUCT_DIRECTION.md): the problem, the mechanism, the fee/bond split, the agent handshake, and an explicit list of what SignalPass does *not* do.
- [📝 Submission Copy](./SIGNALPASS_SUBMISSION_COPY.md): the canonical name, one-liner and description used on the submission form.
- [Submission checklist](./docs/HACKATHON_SUBMISSION_CHECKLIST.md): saved portal progress, the October 13 deadline, private-repository judge access and remaining owner actions.
- [Video recording briefs](./docs/HACKATHON_VIDEO_BRIEFS.md): timed outlines and shot lists for the technical demo (up to 3 minutes) and pitch (up to 2 minutes).
- [🗺️ Product Architecture Diagram](./docs/architecture/signalpass-product-architecture.html): interactive diagram with dark and light themes.
- [🤖 Agent Surface](./docs/SIGNALPASS_AGENT_SURFACES.md): the Personal Agent model, provider-neutral skills, OpenClaw/Hermes adapter boundary and hackathon acceptance criteria.
- [Product demo and first community](./docs/HACKATHON_PRODUCT_DEMO.md): the complete product story, recovery rehearsal, synthetic quality cases and consenting cohort plan.
- [🎨 V2 Design Set](./design-explorations/signalpass-v2/DESIGN.md): the redesigned Builders, Profile, Composer, Inbox and Hero interaction references.
- [✨ V3 Design Set](./design-explorations/signalpass-v3/DESIGN.md): profile source import, private matching, people discovery, Profile Widget and the broader introduction flow.

Hackathon research notes — the official catalog and rules, the bounty analysis, and the participant directory — are kept outside this repository. They contain sponsor access credentials and other participants' contact details, so they are deliberately not published here.

---

## 🏗️ Architecture Stack

- **Settlement networks**: local EVM (`31337`), Monad Testnet (`10143`), and Monad Mainnet (`143`). The live site uses mainnet with low-cost pilot settings; see [the deployment record](docs/reports/signalpass-mainnet-deployment-2026-10-03.md) and [pilot plan](docs/MONAD_MAINNET_PILOT.md).
- **Smart Contracts**: Solidity 0.8.24 (Foundry)
  - `ProfileRegistry.sol`: builder profile, availability, and versioned gate-policy hashes.
  - `IntroductionEscrow.sol`: evaluation fee, attention bond, unresolved limits, timeouts, resolution.
  - `IntroductionReceipt.sol`: anchored evaluation and outcome receipts.
- **Domain Core**: `@signalpass/core` — Introduction state machine, pricing curve, zod schemas and EIP-712 payloads. Shipped as TypeScript source so the API, evaluator, indexer and web app all run the *same* logic as the contracts' off-chain twin.
- **Services (Node.js + Hono)**: `services/api` (read/write API), `services/evaluator` (bilateral evaluation + recommendation guardrail), `services/indexer` (Envio HyperIndex event handlers and aggregation).
- **Frontend**: Next.js 15 App Router with a hand-written CSS design system (custom properties, no UI framework).
- **Hosted Personal Agent**: a provider-neutral discovery/refinement/draft workflow in the API, account-private history and a Web workspace. TokenRhythm Chat Completions is active on the public pilot; OpenAI Responses and free-only OpenRouter remain alternative adapters. Profile context requires explicit consent; recipient handles and source quotes are checked against eligible public profiles. Generated interpretations and self-reported facts are not independently verified. Hunyuan remains unconfigured.
- **Agent-first flow**: goal → suggested people with source quotes → private draft → editable Introduction Card → human confirmation. The existing public directory remains available without AI. Recipient-side AI assistance and conversational profile creation remain future work.
- **Account Abstraction**: Dynamic embedded wallets — *not wired yet. Default V4 uses server-verified SIWE signatures from injected EOA wallets and HttpOnly sessions.*
- **Verified Context**: opt-in onchain signals — *consent record is real and hashed into the payload; third-party verification is not wired.*

---

## 📦 Repository Layout

```
packages/core        domain model: state machine, pricing, schemas, EIP-712
packages/contracts   Foundry: ProfileRegistry, IntroductionEscrow, IntroductionReceipt
services/api         Hono API: profiles, quote, submit, evaluate, transition, queue
services/evaluator   Hono service: /evaluate and /persona, mock + Hunyuan providers
services/indexer     Envio HyperIndex config, schema, event handlers, aggregations
apps/web             Next.js App Router UI
scripts/e2e.mjs      boots both services and drives the whole loop
```

---

## ▶️ Running It

```bash
git submodule update --init --recursive   # pulls packages/contracts/lib/forge-std
pnpm install --frozen-lockfile

# API + default V4 UI, http://localhost:3004
pnpm dev
```

To run the separate evaluator service in its explicit mock mode, start it and point the API at it. This is separate from the hosted Personal Agent and does not enable paid AI evaluation on wallet bonds:

```bash
EVALUATOR_MODE=mock pnpm --filter @signalpass/evaluator start   # :8788
EVALUATOR_URL=http://localhost:8788 pnpm api:dev
```

Default V4 uses same-origin `/api/*`, proxied to `SIGNALPASS_API_ORIGIN` (default `http://127.0.0.1:8789`). Set `APP_ORIGIN` on the API to the exact browser origin. Export API variables when launching it; the API does not automatically load `.env`. The older React pages retain `NEXT_PUBLIC_API_URL`. See `.env.example` for all settings.

For a separate host, use the [production deployment guide](docs/DEPLOYMENT.md): a single API process with persistent SQLite, the production Next app and a Caddy HTTPS edge. The current public site instead uses native Node services and a Cloudflare Tunnel; see [VPS operations](docs/VPS-DEPLOYMENT.md). Production startup requires an explicit HTTPS origin and absolute database path; API ports bind loopback unless configured otherwise. `SIGNALPASS_API_ORIGIN` is baked into the Next build. `/api/ready` checks SQLite availability, while `node scripts/deployment-preflight.mjs https://your-host` performs read-only routing, authentication-boundary and asset checks. These checks alone do not prove live model availability or settlement; the October 3 reports above record those separate public checks. The [October 1 deployment report](docs/reports/signalpass-deployment-readiness-2026-10-01.md) remains historical evidence.

Node.js >=22.13 is required for built-in SQLite (experimental in Node 22). One API process uses WAL-backed storage at `.data/signalpass.sqlite`. Keep it on persistent disk, back it up, and exclude it from Git. Private records are access-controlled, not application-level encrypted at rest. Multiple API processes require an explicit database/concurrency design.

The live flow supports approved profiles, visibility, cross-account delivery, participant-only receipts, context requests/replies, recipient decisions, explicit accepted-contact sharing, idempotent sends and recovery after restart. Without a chain manifest, the no-payment flow begins at `submitted`. With `SIGNALPASS_CHAIN_CONFIG`, V4 supports a signed, refundable wallet bond: `quoted` → verified lock → recipient decision or expiry claim → confirmed refund. Manual review charges zero AI evaluation fee; gas still applies. Expiry requires a resolution transaction and has been verified in the local suite only. A fresh installation leaves the hosted Personal Agent disabled until its provider is configured; the public pilot is configured with TokenRhythm and has no mock fallback. Hunyuan and source verification remain unconfigured. Evaluation without `EVALUATOR_URL` is labelled `mock-local`; a configured evaluator failure returns an error rather than silently falling back. There is no production test-login bypass.

To enable `/assistant` on another installation, select `SIGNALPASS_AGENT_PROVIDER=tokenrhythm`, `openai` or `openrouter`, an explicit compatible `SIGNALPASS_AGENT_MODEL`, and a dedicated server-side `SIGNALPASS_AGENT_API_KEY` **or** protected `SIGNALPASS_AGENT_API_KEY_FILE`. The public pilot selects TokenRhythm `deepseek-v4-flash`; its adapter uses Chat Completions with a strict JSON schema. OpenAI and OpenRouter use Responses structured output. OpenRouter remains free-only: select a named `vendor/model:free`; it rejects paid models and random routers, disables fallback and requests zero-price providers. These OpenRouter constraints do not describe TokenRhythm billing. Leave `SIGNALPASS_AGENT_BASE_URL` empty for the provider default. The API does not read `.env` automatically. End users never enter these settings. See [the hosted agent guide](docs/HOSTED_AGENT.md) for protected-file setup, consent, limits and tests, and [the public TokenRhythm report](docs/reports/signalpass-tokenrhythm-2026-10-03.md) for activation evidence.

---

## ✅ Verifying It

```bash
pnpm verify     # typecheck + unit tests + Foundry tests + end-to-end
```

Individually:

| Command | What it proves |
| --- | --- |
| `pnpm -r typecheck` | 5 configured TypeScript projects compile under `strict` (generated Envio handlers remain excluded) |
| `pnpm contracts:test` | Contract behavior and authorization, including a 256-run fuzz over terminal paths |
| `pnpm --filter @signalpass/indexer test` | 8 aggregation tests (queue health, standing, pressure index) |
| `pnpm --filter @signalpass/api test` | Signed sessions, replay, object permissions, consent, idempotency, database reopen, hosted agent privacy/budgets/staleness and provider transport fixtures; no paid inference |
| `pnpm v4:flow:test` | Asset-independent regressions for guest-to-wallet draft recovery and composing with sparse profile interests; uses controlled DOM/API fixtures, not a browser E2E |
| `pnpm agent:ui:test` | Real Chromium checks of hosted-agent pages with HTTP fixtures: consent, evidence, edited draft handoff, separate send confirmation, error states and mobile layout. Requires Playwright Chromium; no live model or wallet transaction. |
| `pnpm connection:ui:test` | Real Chromium checks of accepted-contact sharing with HTTP fixtures: explicit review, safe links, removal, session expiry and mobile layout. No message is sent. |
| `pnpm agent:live:test` | Opt-in OpenRouter free-model acceptance through actual signed-session discover/draft routes using fictional profiles; needs your server-side key and explicit free model. Fails when unconfigured; never sends an introduction or spends wallet funds. |
| `pnpm agent:live:persistence:test` | Opt-in, at most three real provider calls for discovery, clarification and drafting using fictional profiles and temporary SQLite; checks ownership, API re-instantiation and preserved quota. No introduction or chain transaction. Supports the documented TokenRhythm and OpenRouter settings. |
| `pnpm wallet:quote:test` | Refreshed quote amount stays consistent in the receipt, saved record and wallet approval; quote errors and wallet cancellation never auto-send. |
| `pnpm e2e` | Real API + Next servers and 3 browser sessions: sign in → approve profile → send/receive → request/reply → accept → API restart |
| `pnpm chain:test` | Real Anvil contracts, EIP-712 signature compatibility, funding verification, authorization, refunds, interrupted-callback recovery and restart |
| `pnpm chain:verify` | Chain integration plus two-browser wallet flow, network switch, profile sync, cancel, accept, decline and expiry |
| `pnpm chain:preflight <manifest>` | Read-only RPC/deployment/signer/network validation before enabling a chain |
| `pnpm v4:verify` | Explicit sample-mode geometry and interaction regression; requires the web server |
| `pnpm motion:verify` | Desktop motion lifecycle, keyboard/focus, reduced motion, draft meter and responsive checks; requires a running preview (default 3005) |
| `pnpm motion:record` | The same checks plus a 1440px sample-mode desktop walkthrough video |

The contracts expose four invariants that are each covered by a test that fails if broken:

1. **No path ever seizes the bond.** The fuzz test walks every terminal state and asserts the sender's balance is exactly restored.
2. **Only the recipient can decide.** Accept and decline revert for the sender and for strangers.
3. **An agent can never approve access.** The evaluator role cannot move an introduction past review.
4. **Unanswered introductions can be expired after their deadline**, and the pre-evaluation case refunds fee and bond in full. A resolution transaction is required; refunds are not sent by a background timer.

### Deploying the contracts

```bash
# reproduce the deploy against the real network without a key or funds
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url monad_testnet --sender 0xYourAddress

# broadcast for real
DEPLOYER_PRIVATE_KEY=0x... forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
```

The earlier unsigned-lock deployment has been superseded. Deploy the current signed-quote contracts and set `QUOTE_SIGNER_ADDRESS` to the API signer address; `TREASURY_ADDRESS` optionally separates administration. The script accepts 31337 and 10143; mainnet 143 additionally requires `SIGNALPASS_ALLOW_MAINNET=true` and a quote signer different from the deployer. The current mainnet addresses are in [deployments/monad-mainnet.json](deployments/monad-mainnet.json), with [successful mainnet lock/refund evidence](docs/reports/signalpass-mainnet-deployment-2026-10-03.md). Follow [the wallet checklist](docs/WALLET_BONDS.md) or [the pilot plan](docs/MONAD_MAINNET_PILOT.md) for another deployment.

---

## 📄 License
MIT License

## AI Coding Assistance

AI coding tools are used during development. All generated changes are reviewed, integrated, and tested by the project team. Specifically: the contract, domain, service and UI code was drafted with AI assistance and then verified by the test suites above — the state machine, the pricing curve and the four contract invariants were each checked by executing them, not by inspection.
