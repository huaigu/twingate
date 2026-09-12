# SignalPass

> **High-signal introductions for Monad builders**
> Built for the **Monad Metropolis Global Hackathon 2026**  
> Track: **Social, Attention & Culture**

---

## 📖 Overview

**SignalPass** is a high-signal introduction network on **Monad**. It helps builders replace cold DMs with structured, context-rich introductions that only open when both people opt in.

### The Core Problem
1. **Cold DMs lack context**: Builders cannot tell whether a stranger is a future collaborator or another generic pitch.
2. **Compute inversion**: If a recipient uses an AI gatekeeper, the recipient should not pay to assess an unsolicited request.
3. **Blunt paywalls fail socially**: A fixed price can discourage legitimate first-time collaborators without creating a better introduction experience.

### The SignalPass Experience
1. **3D Agent Persona**: Builders can create an optional Hunyuan-powered digital presence that represents their profile and current availability.
2. **Private agent handshake**: The sender's Intro Coach and the recipient's Gatekeeper exchange only permitted structured context. People see clear summaries and next steps, not opaque agent reasoning.
3. **Sender-pays evaluation**: The sender locks a transparent evaluation fee and refundable attention bond on Monad. The fee covers the recipient-side AI evaluation; the bond is governed by public timeout and resolution rules.
4. **Opt-in verified context**: Nansen can contribute concise, explainable onchain signals only when a builder chooses to disclose them.
5. **Human consent opens the introduction**: The recipient accepts, asks for more context, or declines. AI never grants access or unilaterally seizes funds.

---

## 📚 Project Documentation

In this repository:

- [📒 Product Direction](./SIGNALPASS_PRODUCT_DIRECTION.md): the problem, the mechanism, the fee/bond split, the agent handshake, and an explicit list of what SignalPass does *not* do.
- [📝 Submission Copy](./SIGNALPASS_SUBMISSION_COPY.md): the canonical name, one-liner and description used on the submission form.
- [🗺️ Product Architecture Diagram](./docs/architecture/signalpass-product-architecture.html): interactive diagram with dark and light themes.

Hackathon research notes — the official catalog and rules, the bounty analysis, and the participant directory — are kept outside this repository. They contain sponsor access credentials and other participants' contact details, so they are deliberately not published here.

---

## 🏗️ Architecture Stack

- **L1 Blockchain**: Monad Testnet (chain `10143`) / Mainnet — parallel EVM, 800ms finality
- **Smart Contracts**: Solidity 0.8.24 (Foundry)
  - `ProfileRegistry.sol`: builder profile, availability, and versioned gate-policy hashes.
  - `IntroductionEscrow.sol`: evaluation fee, attention bond, unresolved limits, timeouts, resolution.
  - `IntroductionReceipt.sol`: anchored evaluation and outcome receipts.
- **Domain Core**: `@signalpass/core` — Introduction state machine, pricing curve, zod schemas and EIP-712 payloads. Shipped as TypeScript source so the API, evaluator, indexer and web app all run the *same* logic as the contracts' off-chain twin.
- **Services (Node.js + Hono)**: `services/api` (read/write API), `services/evaluator` (bilateral evaluation + recommendation guardrail), `services/indexer` (Envio HyperIndex event handlers and aggregation).
- **Frontend**: Next.js 15 App Router with a hand-written CSS design system (custom properties, no UI framework).
- **AI Experience**: Tencent Hunyuan 3D agent persona, sender-facing Intro Coach, recipient-side Gatekeeper.
- **Account Abstraction**: Dynamic embedded wallets — *not wired in this build; demo identities are used instead.*
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
pnpm install

# terminal 1 — API (falls back to an in-process mock evaluator)
pnpm api:dev

# terminal 2 — the UI
pnpm --filter @signalpass/web dev        # http://localhost:3000
```

To run the real evaluator as a separate process, start it and point the API at it:

```bash
EVALUATOR_MODE=mock pnpm --filter @signalpass/evaluator start   # :8788
EVALUATOR_URL=http://localhost:8788 pnpm api:dev
```

The web app reads `NEXT_PUBLIC_API_URL` (default `http://localhost:8787`). See `.env.example` for
the full list, including the Hunyuan, Nansen and Dynamic keys.

---

## ✅ Verifying It

```bash
pnpm verify     # typecheck + unit tests + Foundry tests + end-to-end
```

Individually:

| Command | What it proves |
| --- | --- |
| `pnpm -r typecheck` | 6 of 6 projects compile under `strict` |
| `pnpm contracts:test` | 34 Foundry tests, incl. a 257-run fuzz over every terminal path |
| `pnpm --filter @signalpass/indexer test` | 8 aggregation tests (queue health, standing, pressure index) |
| `pnpm e2e` | 46 assertions over the live loop: quote → lock → evaluate → queue → decide, plus the negative cases |

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

The dry run has been executed against the live Monad testnet RPC: three contracts, ~3.54M gas,
~0.72 MON at the gas price observed at the time. Broadcasting needs a funded key.

---

## 📄 License
MIT License

## AI Coding Assistance

AI coding tools are used during development. All generated changes are reviewed, integrated, and tested by the project team. Specifically: the contract, domain, service and UI code was drafted with AI assistance and then verified by the test suites above — the state machine, the pricing curve and the four contract invariants were each checked by executing them, not by inspection.

