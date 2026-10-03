# SignalPass

V4 live product: run `pnpm dev`, then open `http://localhost:3004/`. This starts the API and web app. Sign in with an injected Ethereum wallet; the signature authorizes a session, never a payment. The explicitly labelled offline sample is available at `/?demo=1`; `/?demo=0` returns to live mode.
For the wallet-bond flow with Hunyuan disabled, run `pnpm chain:dev` and open `http://localhost:3005/`. It uses a real local EVM, explicitly labelled DEV. See [wallet bonds and deployment](docs/WALLET_BONDS.md).
See [V4 pages, interactions and implementation notes](design-explorations/signalpass-v4/README.md).

> **High-signal introductions for Monad builders**
> Built for the **Monad Metropolis Global Hackathon 2026**  
> Track: **Social, Attention & Culture**

---

## 📖 Overview

**SignalPass** is a high-signal introduction network on **Monad**. It helps builders replace cold DMs with structured, context-rich introductions that only open when both people opt in.

The product shape is **one private Personal Agent per person, one public Builder Profile, and an optional 3D Persona**. SignalPass provides the agent at `/assistant`: describe a goal, review a few people with public-profile evidence, and prepare a private introduction draft. The human edits and confirms every send or money action. Users do not need OpenClaw, Hermes or their own model key; those hosts remain optional future adapters. The hosted workflow has OpenAI Responses and free-only OpenRouter adapters. Live OpenRouter discovery and drafting passed with fictional profiles on October 1, 2026; public deployment and community validation remain pending. See [hosted agent setup and boundaries](docs/HOSTED_AGENT.md).

### The Core Problem
1. **Cold DMs lack context**: Builders cannot tell whether a stranger is a future collaborator or another generic pitch.
2. **Compute inversion**: If a recipient uses an AI gatekeeper, the recipient should not pay to assess an unsolicited request.
3. **Blunt paywalls fail socially**: A fixed price can discourage legitimate first-time collaborators without creating a better introduction experience.

### The SignalPass Experience
1. **A goal that survives setup**: Enter what you need, sign in and approve your profile, then return to the same goal and selected person.
2. **People with reasons**: The hosted agent recommends eligible public profiles with source quotes and a “Why you two” explanation. Answer a clarification to refine the original goal; a weak fit stays tentative and no-match is a valid outcome.
3. **An introduction you approve**: Explicitly permit profile use, review a private four-part draft, edit it and independently choose what context to share. AI cannot send or spend.
4. **A recipient with a choice**: The recipient accepts, asks for context or declines. Optional refundable wallet bonds are verified on a local EVM; manual review has zero AI evaluation fee. Public Monad testnet deployment remains pending.
5. **An explicit next step**: After acceptance, each participant can choose and share one contact or scheduling channel with the other participant. Acceptance never exposes contact details automatically.

Hunyuan persona generation, a recipient-side autonomous agent, Nansen verification and embedded wallets remain future integrations. See [the product demo and first-community guide](docs/HACKATHON_PRODUCT_DEMO.md) for the current complete journey and clearly labelled rehearsal data.

---

## 📚 Project Documentation

In this repository:

- [📒 Product Direction](./SIGNALPASS_PRODUCT_DIRECTION.md): the problem, the mechanism, the fee/bond split, the agent handshake, and an explicit list of what SignalPass does *not* do.
- [📝 Submission Copy](./SIGNALPASS_SUBMISSION_COPY.md): the canonical name, one-liner and description used on the submission form.
- [🗺️ Product Architecture Diagram](./docs/architecture/signalpass-product-architecture.html): interactive diagram with dark and light themes.
- [🤖 Agent Surface](./docs/SIGNALPASS_AGENT_SURFACES.md): the Personal Agent model, provider-neutral skills, OpenClaw/Hermes adapter boundary and hackathon acceptance criteria.
- [Product demo and first community](./docs/HACKATHON_PRODUCT_DEMO.md): the complete product story, recovery rehearsal, synthetic quality cases and consenting cohort plan.
- [🎨 V2 Design Set](./design-explorations/signalpass-v2/DESIGN.md): the redesigned Builders, Profile, Composer, Inbox and Hero interaction references.
- [✨ V3 Design Set](./design-explorations/signalpass-v3/DESIGN.md): profile source import, private matching, people discovery, Profile Widget and the broader introduction flow.

Hackathon research notes — the official catalog and rules, the bounty analysis, and the participant directory — are kept outside this repository. They contain sponsor access credentials and other participants' contact details, so they are deliberately not published here.

---

## 🏗️ Architecture Stack

- **Settlement networks**: local EVM (`31337`), Monad Testnet (`10143`), and opt-in Monad Mainnet (`143`). Public deployment is pending; see [the mainnet pilot plan](docs/MONAD_MAINNET_PILOT.md) for pricing, funding and verification.
- **Smart Contracts**: Solidity 0.8.24 (Foundry)
  - `ProfileRegistry.sol`: builder profile, availability, and versioned gate-policy hashes.
  - `IntroductionEscrow.sol`: evaluation fee, attention bond, unresolved limits, timeouts, resolution.
  - `IntroductionReceipt.sol`: anchored evaluation and outcome receipts.
- **Domain Core**: `@signalpass/core` — Introduction state machine, pricing curve, zod schemas and EIP-712 payloads. Shipped as TypeScript source so the API, evaluator, indexer and web app all run the *same* logic as the contracts' off-chain twin.
- **Services (Node.js + Hono)**: `services/api` (read/write API), `services/evaluator` (bilateral evaluation + recommendation guardrail), `services/indexer` (Envio HyperIndex event handlers and aggregation).
- **Frontend**: Next.js 15 App Router with a hand-written CSS design system (custom properties, no UI framework).
- **Hosted Personal Agent**: a provider-neutral discover/draft workflow in the API, an OpenAI Responses adapter, account-private history and a Web workspace. Profile context requires explicit consent; model outputs are validated against eligible public profiles. Hunyuan remains unconfigured.
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

To run the real evaluator as a separate process, start it and point the API at it:

```bash
EVALUATOR_MODE=mock pnpm --filter @signalpass/evaluator start   # :8788
EVALUATOR_URL=http://localhost:8788 pnpm api:dev
```

Default V4 uses same-origin `/api/*`, proxied to `SIGNALPASS_API_ORIGIN` (default `http://127.0.0.1:8789`). Set `APP_ORIGIN` on the API to the exact browser origin. Export API variables when launching it; the API does not automatically load `.env`. The older React pages retain `NEXT_PUBLIC_API_URL`. See `.env.example` for all settings.

For hosting, use the [production deployment guide](docs/DEPLOYMENT.md): a single API process with persistent SQLite, the production Next app and a Caddy HTTPS edge. Production startup requires an explicit HTTPS origin and absolute database path; API ports bind loopback unless configured otherwise. `SIGNALPASS_API_ORIGIN` is baked into the Next build. `/api/ready` checks SQLite availability, while `node scripts/deployment-preflight.mjs https://your-host` performs read-only routing, authentication-boundary and asset checks. These checks do not prove live model availability or public settlement. See [the deployment verification report](docs/reports/signalpass-deployment-readiness-2026-10-01.md) for completed local evidence and remaining launch requirements.

Node.js >=22.13 is required for built-in SQLite (experimental in Node 22). One API process uses WAL-backed storage at `.data/signalpass.sqlite`. Keep it on persistent disk, back it up, and exclude it from Git. Private records are access-controlled, not application-level encrypted at rest. Multiple API processes require an explicit database/concurrency design.

The live flow supports approved profiles, visibility, actual cross-account delivery, participant-only receipts, context requests/replies, recipient decisions, idempotent sends, and session/data recovery after restart. Its initial state is `submitted`, not `locked`. Without a chain manifest, this is the no-payment flow. With `SIGNALPASS_CHAIN_CONFIG`, V4 also supports a signed, refundable wallet bond: `quoted` → verified lock → recipient decision or expiry → confirmed refund. Manual review charges zero AI evaluation fee. The hosted Personal Agent is disabled until a server operator configures its provider; it has no mock fallback. Hunyuan and source verification remain unconfigured. Local chain verification is not public Monad deployment evidence. Evaluation without `EVALUATOR_URL` is labelled `mock-local`; a configured evaluator failure returns an error rather than silently falling back. There is no production test-login bypass.

To enable `/assistant`, export `SIGNALPASS_AGENT_PROVIDER=openai` or `openrouter`, a dedicated `SIGNALPASS_AGENT_API_KEY`, and an explicit `SIGNALPASS_AGENT_MODEL` supporting Responses structured output before starting the API. OpenRouter is currently a free-only test adapter: select a named `vendor/model:free`; it rejects paid models and random routers, disables fallback and requests zero-price providers. Leave `SIGNALPASS_AGENT_BASE_URL` empty for the correct provider default. The API does not read `.env` automatically. End users never enter these settings. See [the hosted agent guide](docs/HOSTED_AGENT.md) for limits, privacy and tests, and [the live acceptance evidence](docs/reports/signalpass-hosted-agent-live-2026-10-01.md) for observed successes and free-provider failures.

---

## ✅ Verifying It

```bash
pnpm verify     # typecheck + unit tests + Foundry tests + end-to-end
```

Individually:

| Command | What it proves |
| --- | --- |
| `pnpm -r typecheck` | 5 configured TypeScript projects compile under `strict` (generated Envio handlers remain excluded) |
| `pnpm contracts:test` | 47 Foundry tests, incl. a 256-run fuzz over terminal paths |
| `pnpm --filter @signalpass/indexer test` | 8 aggregation tests (queue health, standing, pressure index) |
| `pnpm --filter @signalpass/api test` | Signed sessions, replay, object permissions, consent, idempotency, database reopen, hosted agent privacy/budgets/staleness and provider transport fixtures; no paid inference |
| `pnpm v4:flow:test` | Asset-independent regressions for guest-to-wallet draft recovery and composing with sparse profile interests; uses controlled DOM/API fixtures, not a browser E2E |
| `pnpm agent:ui:test` | Real Chromium checks of hosted-agent pages with HTTP fixtures: consent, evidence, edited draft handoff, separate send confirmation, error states and mobile layout. Requires Playwright Chromium; no live model or wallet transaction. |
| `pnpm connection:ui:test` | Real Chromium checks of accepted-contact sharing with HTTP fixtures: explicit review, safe links, removal, session expiry and mobile layout. No message is sent. |
| `pnpm agent:live:test` | Opt-in OpenRouter free-model acceptance through actual signed-session discover/draft routes using fictional profiles; needs your server-side key and explicit free model. Fails when unconfigured; never sends an introduction or spends wallet funds. |
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
4. **Unanswered introductions always expire**, and the pre-evaluation case refunds fee and bond in full.

### Deploying the contracts

```bash
# reproduce the deploy against the real network without a key or funds
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url monad_testnet --sender 0xYourAddress

# broadcast for real
DEPLOYER_PRIVATE_KEY=0x... forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
```

The earlier unsigned-lock deployment has been superseded. Deploy the current signed-quote contracts and set `QUOTE_SIGNER_ADDRESS` to the API signer address; `TREASURY_ADDRESS` optionally separates administration. The script accepts 31337 and 10143; mainnet 143 additionally requires `SIGNALPASS_ALLOW_MAINNET=true` and a quote signer different from the deployer. No public deployment is claimed for this revision. Follow [the wallet checklist](docs/WALLET_BONDS.md) or [the mainnet pilot plan](docs/MONAD_MAINNET_PILOT.md); broadcasting needs a funded wallet.

---

## 📄 License
MIT License

## AI Coding Assistance

AI coding tools are used during development. All generated changes are reviewed, integrated, and tested by the project team. Specifically: the contract, domain, service and UI code was drafted with AI assistance and then verified by the test suites above — the state machine, the pricing curve and the four contract invariants were each checked by executing them, not by inspection.
