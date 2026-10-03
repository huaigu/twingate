# Development guide

This guide covers reproducible setup, verification and the recorded development history. For the product experience and demo, start with [README](../README.md).

## Prerequisites

- Node.js **22.13 or later** for built-in SQLite; the Node 22 API is experimental.
- pnpm **10.32.1**, pinned in the root `package.json`.
- Git access to the repository and its `forge-std` submodule.
- Forge and Anvil for contract/local-chain checks. Browser checks require Playwright Chromium: `pnpm exec playwright install chromium`.
- A server-side provider key only for live hosted-agent inference. Default setup keeps the hosted agent disabled; fixture tests need no paid inference.

Commands below run from the repository root unless a block explicitly changes directories.

## Run locally

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

For a separate host, use the [production deployment guide](../docs/DEPLOYMENT.md): a single API process with persistent SQLite, the production Next app and a Caddy HTTPS edge. The current public site instead uses native Node services and a Cloudflare Tunnel; see [VPS operations](../docs/VPS-DEPLOYMENT.md). Production startup requires an explicit HTTPS origin and absolute database path; API ports bind loopback unless configured otherwise. `SIGNALPASS_API_ORIGIN` is baked into the Next build. `/api/ready` checks SQLite availability, while `node scripts/deployment-preflight.mjs https://your-host` performs read-only routing, authentication-boundary and asset checks. These checks alone do not prove live model availability or settlement; the October 3 reports in [evidence boundaries](#ai-assistance-and-evidence-boundaries) record those separate public checks. The [October 1 deployment report](../docs/reports/signalpass-deployment-readiness-2026-10-01.md) remains historical evidence.

Node.js >=22.13 is required for built-in SQLite (experimental in Node 22). One API process uses WAL-backed storage at `.data/signalpass.sqlite`. Keep it on persistent disk, back it up, and exclude it from Git. Private records are access-controlled, not application-level encrypted at rest. Multiple API processes require an explicit database/concurrency design.

The live flow supports approved profiles, visibility, cross-account delivery, participant-only receipts, context requests/replies, recipient decisions, explicit accepted-contact sharing, idempotent sends and recovery after restart. Without a chain manifest, the no-payment flow begins at `submitted`. With `SIGNALPASS_CHAIN_CONFIG`, V4 supports a signed, refundable wallet bond: `quoted` → verified lock → recipient decision or expiry claim → confirmed refund. Manual review charges zero AI evaluation fee; gas still applies. Expiry requires a resolution transaction and has been verified in the local suite only. A fresh installation leaves the hosted Personal Agent disabled until its provider is configured; the public pilot is configured with TokenRhythm and has no mock fallback. Hunyuan and source verification remain unconfigured. Evaluation without `EVALUATOR_URL` is labelled `mock-local`; a configured evaluator failure returns an error rather than silently falling back. There is no production test-login bypass.

To enable `/assistant` on another installation, select `SIGNALPASS_AGENT_PROVIDER=tokenrhythm`, `openai` or `openrouter`, an explicit compatible `SIGNALPASS_AGENT_MODEL`, and a dedicated server-side `SIGNALPASS_AGENT_API_KEY` **or** protected `SIGNALPASS_AGENT_API_KEY_FILE`. The public pilot selects TokenRhythm `deepseek-v4-flash`; its adapter uses Chat Completions with a strict JSON schema. OpenAI and OpenRouter use Responses structured output. OpenRouter remains free-only: select a named `vendor/model:free`; it rejects paid models and random routers, disables fallback and requests zero-price providers. These OpenRouter constraints do not describe TokenRhythm billing. Leave `SIGNALPASS_AGENT_BASE_URL` empty for the provider default. The API does not read `.env` automatically. End users never enter these settings. See [the hosted agent guide](../docs/HOSTED_AGENT.md) for protected-file setup, consent, limits and tests, and [the public TokenRhythm report](../docs/reports/signalpass-tokenrhythm-2026-10-03.md) for activation evidence.

---

## Verification

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

The earlier unsigned-lock deployment has been superseded. Deploy the current signed-quote contracts and set `QUOTE_SIGNER_ADDRESS` to the API signer address; `TREASURY_ADDRESS` optionally separates administration. The script accepts 31337 and 10143; mainnet 143 additionally requires `SIGNALPASS_ALLOW_MAINNET=true` and a quote signer different from the deployer. The current mainnet addresses are in [deployments/monad-mainnet.json](../deployments/monad-mainnet.json), with [successful mainnet lock/refund evidence](../docs/reports/signalpass-mainnet-deployment-2026-10-03.md). Follow [the wallet checklist](../docs/WALLET_BONDS.md) or [the pilot plan](../docs/MONAD_MAINNET_PILOT.md) for another deployment.

## Development provenance

Checked against the **original GitHub history** of [huaigu/twingate](https://github.com/huaigu/twingate) on October 3, 2026 at main [`9233074077e5eb12cc3712800d563c1fbadc4ff3`](https://github.com/huaigu/twingate/commit/9233074077e5eb12cc3712800d563c1fbadc4ff3). The repository is private; these links require repository access. This documentation does not change its visibility.

The GitHub commits API returned **72 reachable commits**, including merges, with every parent accounted for and one parentless root. All recorded author and committer dates in this ancestry fall between **September 11 and October 3, 2026**, within the September 1–October 13 Metropolis build window. The root tree has only `README.md` and `.gitignore`; it contains no application implementation. The first monorepo scaffold appears later on September 11.

### Existing foundations and work during the window

The retained repository history contains no project implementation dated before September 1. The initial TwinGate concept/README and its SignalPass rebrand were committed on September 11, followed that day by the application scaffold. No separate pre-window SignalPass application or fork is identified by this reviewed history. Existing foundations are third-party tools and libraries—Node.js, Next.js/React, Hono, viem, Zod, Foundry/`forge-std`, fonts and other dependencies—credited in [third-party notices](../THIRD_PARTY_NOTICES.md). They were reused, not created by this project.

| UTC date | Original commit | Recorded work |
| --- | --- | --- |
| September 11, 11:43:58 | [`92e7d2d`](https://github.com/huaigu/twingate/commit/92e7d2dd07136b7e497e26edd8e42f53c290abd2) | Parentless TwinGate concept/README; root tree contains no app code. |
| September 11, 15:17:25 | [`23547e2`](https://github.com/huaigu/twingate/commit/23547e27df5e811b44a924458aaa6ffd62fe0560) | SignalPass rebrand and product direction. |
| September 11, 15:24:26 | [`3225e53`](https://github.com/huaigu/twingate/commit/3225e53d3b01c6df1ad311575389f7ce99070481) | Domain model, contracts, API and pnpm monorepo scaffold. |
| September 11, 16:01:03 | [`92fd1a2`](https://github.com/huaigu/twingate/commit/92fd1a287758edaf2587d876b2cc4021d8d778a7) | Web app, separate evaluator, indexer aggregations and initial end-to-end verification. |
| September 16 | [`08247a6`](https://github.com/huaigu/twingate/commit/08247a6b1933940931202bc4e737e46680d6765f) | Supplied SignalPass designs integrated as V4 pages. |
| September 28 | [`ff340df`](https://github.com/huaigu/twingate/commit/ff340df0f33a89230766863d4526f13e29f184f7) | Live V4 introductions and signed wallet bonds. |
| October 1 | [`2100cda`](https://github.com/huaigu/twingate/commit/2100cda56835974b6132dac7714dedd032cbfd1b) | SignalPass-hosted Personal Agent. |
| October 2 | [`389a7af`](https://github.com/huaigu/twingate/commit/389a7afcd37015c54d15a0c917cb5d2166b892ef) | Goal refinement and consented contact sharing. |
| October 3 | [`b9a1257`](https://github.com/huaigu/twingate/commit/b9a125717950b4cc52a31351dd64146f0e8adb01), [`009b74c`](https://github.com/huaigu/twingate/commit/009b74cb4689de45c2ab45002cae520e847ce23d), [`ba22e37`](https://github.com/huaigu/twingate/commit/ba22e377303a14bf04fe718c38c0fffae2ec1e33) | Mainnet deployment/refund evidence, public TokenRhythm activation/restart verification, and public no-bond product rehearsal. |

This evidence establishes what the retained original history records; commit dates alone cannot establish when every line was first authored outside Git, independently verify ownership of supplied artwork, or quantify a percentage of original effort. The asset provenance gaps are listed in the notices. The local review checkout was reconstructed on October 1 and has different local commit IDs; use the original remote links above for chronology. Preserve original history when preparing review access.

### AI assistance and evidence boundaries

[README discloses AI coding assistance](../README.md#ai-coding-assistance). AI tools helped draft contract, domain, service and UI code; the team integrates and reviews changes. Test fixtures, local Anvil transactions, actual provider calls and public mainnet transactions prove different things. Keep their dated reports and limitations separate:

- [Hosted provider and actual API restart](reports/signalpass-tokenrhythm-2026-10-03.md).
- [Full public introduction journey with fictional participants and no bond](reports/signalpass-public-journey-2026-10-03.md).
- [Separate Monad Mainnet deployment, locks and refunds](reports/signalpass-mainnet-deployment-2026-10-03.md).
- [Public readiness-page deployment](reports/signalpass-submission-readiness-2026-10-03.md).

Illustrative profiles and rehearsal accounts are not real-community usage. External agent hosts, live Envio indexing, Dynamic embedded wallets, verified external context and Hunyuan generation are not integrated.

## Design and product references

- [Product direction](../SIGNALPASS_PRODUCT_DIRECTION.md) and [Agent Surface](SIGNALPASS_AGENT_SURFACES.md).
- [Two-person pilot guide](PILOT.md): real-participant validation, distinct from fictional test evidence.
- [V4 implementation notes](../design-explorations/signalpass-v4/README.md), [V2 design set](../design-explorations/signalpass-v2/DESIGN.md) and [V3 design set](../design-explorations/signalpass-v3/DESIGN.md).
- [Architecture diagram](architecture/signalpass-product-architecture.html).
- [Submission checklist](HACKATHON_SUBMISSION_CHECKLIST.md) and [recording briefs](HACKATHON_VIDEO_BRIEFS.md) keep event administration separate from the product README.
