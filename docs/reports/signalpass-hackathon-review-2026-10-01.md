# SignalPass hackathon review — 2026-10-01

Reviewed `main` at `bd0b7107e8045470815e7df4f7e917131c0c1ee6` ("ship award-ready illustrated experience"). This review covers the current V4 client, API, evaluator, domain and contract source, and the existing submission/readiness documents. Source and selected runtime checks were available; this is not a completed browser or contract audit.

## Main judgment

SignalPass has a useful foundation: user-approved profiles, wallet-backed sessions, independent sender/recipient accounts, context requests, recipient decisions, durable records and a locally tested refundable-bond flow. The people-first proposition is clear: **People worth knowing, with context.** Monad builders are a focused first community.

The largest competitive gap is proving the Personal Agent promise and the public Monad outcome in one journey. Current V4 discovery filters profiles; importing an agent means pasting JSON. The wallet flow is human review with zero AI fee. A judge should be able to see why a particular connection is useful, how an agent improves the introduction, who approves it, and where the bond goes.

The September 29 readiness report already identifies the major work packages. This pass fixes concrete defects and narrows the next delivery gates; it does not count the existing plan as newly delivered functionality. Hunyuan stays unconfigured, consistent with the recorded decision.

## Changes in this review branch

| Finding | Impact | Change |
| --- | --- | --- |
| Compose assumed every candidate had two interests | A valid one-interest profile threw before the compose flow initialized | Safe, readable starter text for zero/one interests; regression exercises the shipped script with zero, one and two interests |
| Signing in changed the draft storage key from guest to wallet | A first-time user could lose the visible profile draft after doing onboarding work | Copy profile/source draft fields only after verified matching-wallet sign-in, only into an account without a profile or existing draft; keep approval false; do not import prior action state |
| "Limited" promised a restricted audience | API semantics actually allow anyone with a link to read that profile | Rename the UI to "Unlisted" and explain link visibility; keep the existing `limited` wire value |
| Evaluation omitted shared profile and follow-up reply | Re-evaluation could ignore the answer to the requested question | Forward the saved consented snapshot plus question/reply, use replies in mock evaluation and bind receipt hashes to evaluated context; never read current private source settings |
| Submission and direction mixed future integrations with implemented behavior | Judges could reasonably read the submission as claiming integrations that were not running | Current-state copy, explicit Personal Agent vision, local/public network distinction, exact fee/refund and privacy boundaries |

The evaluator change repairs an existing interface. It does **not** connect a real model to V4, enable Hunyuan, charge an AI fee or turn on automatic matching. No smart contracts or deployment settings changed.

## Delivery priorities

| Order | Deliverable | Evidence needed to call it done |
| --- | --- | --- |
| 1 | Public product and Monad settlement | Reachable UI/API with persistent storage; current signed-quote contracts; preflight passes; two independent wallets complete lock, accept/decline and refund; receipt links resolve on the correct explorer |
| 2 | One meaningful Personal Agent path | A natural-language goal yields a few authorized profiles with concrete source-based reasons; the agent prepares the four-part draft; the person reviews it; the same introduction ID reaches the recipient and receipt. Use one working host/model first. Show errors honestly. |
| 3 | A small real community trial | Invite a consenting initial group through the team, observe friction and collect actual reasons for accepting/declining. Report observed outcomes and sample size; do not manufacture traction. |
| 4 | Submission and recording | Pin the reviewed code; confirm judge access and exact submission/bounty requirements; record the working journey with network and sample/live labels visible. Claim integrations only after demonstrating them. |

The [official registration portal](https://hackathon.monad.xyz/) displays September 1–October 13 and a $250,000+ prize pool (checked October 1). Exact closing time/timezone, detailed scoring, required video length and sponsor conditions were not verified through the public page. Confirm these in the registered event account. The timing below is a presentation recommendation, not an official video limit.

## Demo narrative

The existing [90-second runbook](../DEMO_RUNBOOK.md) is the truthful baseline today: approved profile → four-part introduction → explicit bond approval → confirmed delivery → recipient decision → refund receipt.

Once the real agent and public network gates pass, a three-minute version should spend roughly 45 seconds finding a relevant person and explaining why, 30 seconds improving the request, 30 seconds reviewing disclosure and funding, 45 seconds on the recipient's question/decision, and 30 seconds on settlement and next steps. Keep the same introduction ID visible. A decline with a correct refund is a useful backup demonstration of the rules.

Be prepared to answer:

- **Why does this need Monad?** Show independently checkable attention commitments and refunds. Public transaction evidence must support the claim.
- **What does the agent actually improve?** Show an unhelpful first draft becoming a specific, grounded invitation. Profile filtering and JSON import alone do not prove this.
- **What does the bond prevent?** It constrains outstanding bonded requests. It does not buy acceptance or eliminate Sybil spam; V4 currently allows unbonded requests too. Decide whether recipient-controlled bond requirements are needed after observing use.
- **What happens after acceptance?** Explain the actual next step or handoff. Do not imply an implemented private chat network.

## Remaining engineering findings

The initial review identified the following source-level findings. Both are resolved in the subsequent hosted-agent branch follow-up; they remain here to preserve the review rationale:

1. **Fresh signatures can retain stale bond pricing.** `services/api/src/chain-routes.ts:70–93` issues a new signature through `ChainService.quote`, which reads `intro.quote.attentionBond` (`services/api/src/chain.ts:93`). Drafts created before later declines/congestion can keep the older price. Recalculate when issuing a new signed quote while preserving an already-valid approved quote. Reproduce with two drafts, decline the first funded request, then obtain the second funding quote; also cover quote expiry. This weakens adaptive pricing; it is not evidence of lost escrow funds.
2. **Evaluation policy version can be mislabeled after a policy edit.** `services/api/src/evaluation.ts` reads the latest policy but hashes the introduction's original `policyVersion`. Snapshot the policy at submission, or require an explicit new review when the policy changes. Add a submit → edit recipient policy → evaluate regression before relying on these receipts as policy-version evidence.

No critical ownership or refund-loss defect was established in the reviewed supported EOA/manual-review path. This is not a security certification, and the unchanged contracts were not executed in this environment.

### Follow-up resolution and verification

- Funding quotes now recalculate current queue pressure, prior declines and unresolved limits when issuing the first or an expired signature. A still-valid signed quote is reused without repricing. The persisted introduction, receipt amount and wallet approval use the same bond. `services/api/src/chain-quotes.test.ts` verifies real EIP-712 signatures and decoded calldata with controlled RPC observations; `scripts/wallet-quote-test.mjs` exercises the shipped wallet script. These checks do not replace real EVM settlement tests.
- Evaluation rejects a missing or changed recipient policy with a clear 409 response before provider work. Receipts bind the exact captured policy version and hash, including when an edit occurs during inference. `services/api/src/evaluation-policy.test.ts` covers both timing cases. Existing manual recipient decisions remain available; the sender must review a new introduction to evaluate under changed terms.
- OpenRouter now has an explicit free-only adapter and `pnpm agent:live:test` for two signed synthetic accounts through the real discover/draft routes. The current public model catalog was reachable; an anonymous Responses request returned 401. No authorized key was configured, so successful live inference is still unverified. The CLI correctly fails before inference when credentials are missing.
- Follow-up verification: all 34 API tests, 5 wallet quote regressions, 8 existing V4 regressions and the API typecheck pass. The earlier hosted-agent implementation also passed its 14 browser scenarios, five TypeScript projects and production build. The follow-up does not claim a new public deployment, contract execution or video recording.

## Verification performed in this pass

| Check | Result |
| --- | --- |
| `node --test scripts/v4-flow-test.mjs` | 8/8 pass; controlled DOM/API fixtures execute shipped client/app scripts, including failed login and account-isolation cases |
| Pinned pnpm 10.32.1 recursive typecheck | All five configured TypeScript projects pass |
| API: `node --import tsx --test src/*.test.ts` in `services/api` | 5/5 pass, including external request capture, consent true/false, saved snapshot and reply-sensitive receipts |
| Indexer: `node --import tsx --test src/aggregate.test.ts` in `services/indexer` | 8/8 pass |
| Standalone evaluator HTTP smoke | Short request asks for context; substantive reply produces review; a reply above 1,000 characters is rejected with 400 |
| JavaScript syntax and `git diff --check` | Pass |

Dependency installation used the repository-pinned pnpm 10.32.1 and a scratch store with hardlink imports because default copy operations failed in this environment. Tests used Node's `--import tsx` loader because the `tsx` CLI's IPC pipe was unavailable. No dependency or lockfile change is included.

Not run here: Foundry/Anvil tests (Forge unavailable), full browser/E2E, visual layout checks or production build. The local review snapshot contains text/code; required binary assets were not fetched. The GitHub patch is based on the complete upstream tree and preserves those assets. Prior verification in the repository is historical evidence, not a rerun by this review.
