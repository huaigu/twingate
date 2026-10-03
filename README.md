# SignalPass

**People worth knowing, with context.**

SignalPass helps you find someone worth meeting, understand why you might connect, and prepare a thoughtful introduction. Your Personal Agent helps with discovery and writing; you decide what to share and when to send. Monad builders are our first community, with a broader vision of personal agents helping people connect around shared interests and complementary goals.

[Open SignalPass](https://signalpass.coderbojack.space/) · [Try your Personal Agent](https://signalpass.coderbojack.space/assistant?demo=0) · [Explore the sample](https://signalpass.coderbojack.space/discover?demo=1)

## Demo

[![Watch SignalPass in action](https://signalpass.coderbojack.space/media/signalpass-demo-20261003.jpg)](https://signalpass.coderbojack.space/media/signalpass-demo-20261003.html)

[Watch the two-person demo](https://signalpass.coderbojack.space/media/signalpass-demo-20261003.html) · [Watch the product pitch](https://signalpass.coderbojack.space/media/signalpass-product-pitch-20261003.mp4)

Follow Alice and Bob from a goal to an introduction they both choose. The films use edited recordings from the production app, with fictional participants, real AI, English subtitles and original music. The introduction uses no bond; the separate Monad segment shows verified mainnet test transactions.

- **Live product:** [start an assisted introduction](https://signalpass.coderbojack.space/assistant?demo=0). Live matching requires people to approve their profiles, make them public and opt into matching. Use **Send without a bond** for a first complete journey.
- **Sample walkthrough:** [explore fictional people](https://signalpass.coderbojack.space/discover?demo=1) without a wallet. This mode is explicitly illustrative: it uses no live AI, sends no external introduction and makes no payment. Open the live link above to exit sample mode.
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

## Run locally

Use **Node.js 22.13 or later** and **pnpm 10.32.1**. Git access is required to clone this repository. Foundry is needed for contract tests or the optional local bond flow.

```bash
git clone --recurse-submodules https://github.com/huaigu/twingate.git
cd twingate
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:3004/**. This starts the API and web app; the default no-payment introduction flow does not need a chain. Existing clones can run `git submodule update --init --recursive` to initialize `forge-std`.

A fresh installation leaves the hosted Personal Agent disabled until a server-side provider is configured. Follow [the hosted agent guide](docs/HOSTED_AGENT.md); never put a provider key in the browser. API settings must be exported into the process environment; `.env` is not loaded automatically. For an illustrative walkthrough, open `http://localhost:3004/discover?demo=1`.

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
- [Two-person pilot guide](docs/PILOT.md): a consent-based first trial, feedback questions and cleanup.
- [Hosted agent](docs/HOSTED_AGENT.md) and [public provider/restart verification](docs/reports/signalpass-tokenrhythm-2026-10-03.md).
- [Product direction](SIGNALPASS_PRODUCT_DIRECTION.md), [product walkthrough](docs/HACKATHON_PRODUCT_DEMO.md) and [VPS operations](docs/VPS-DEPLOYMENT.md).
- [Third-party notices](THIRD_PARTY_NOTICES.md): reused software, fonts and asset provenance.

The retained original GitHub history begins on **September 11, 2026**, with documentation followed by the first application scaffold that day. [Development provenance](docs/DEVELOPMENT.md#development-provenance) identifies the commits, existing third-party foundations and limits of that evidence.

## AI Coding Assistance

AI coding tools were used to draft contract, domain, service and UI code. The project team reviews and integrates changes and checks behavior with unit, contract, API and browser tests. AI assistance does not replace the recipient's decisions or wallet approvals in the product. The development guide distinguishes fixture-based checks from live-model and onchain evidence.

## License

Project code is licensed under the [MIT License](LICENSE). Third-party components retain their own licenses and notices; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
