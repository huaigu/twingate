# Matching evaluation

SignalPass includes a reproducible, **synthetic engineering benchmark** for its discovery flow. It contains 20 requests and 15 fictional profiles. The expected acceptable and unacceptable candidates are written in the fixture before a hosted-model run. This is not an independent human assessment, a user study, or evidence of customer traction.

The fixture is at `services/api/fixtures/matching-benchmark.json`; the runner is at `services/api/scripts/matching-benchmark.ts`. A local fixture-validation run does not measure the hosted model. Only a completed `--live` report can establish hosted results, and it applies only to its recorded model, source hashes, and fixture hash.

## Recorded local validation — 2026-10-07

All 20 local route checks passed with zero hosted requests, and a strict TypeScript check including the runner passed. The fixture SHA-256 is `a3b918abbacbb5ce99aa23c7c1de1d9061e09016971b2af91bb8bd250fc37d0b`.

| Frozen keyword baseline metric | Result |
|---|---:|
| Strict case success | 15/20 |
| Acceptable returned recommendations | 15/18 |
| First recommendation relevant on positive cases | 13/16 |
| Positive cases with at least one relevant recommendation | 14/16 |
| Correct required abstentions | 2/4 |
| Operational failures | 0 |

The baseline missed the indirect keyboard-accessibility request, the numerical-model-versus-dashboard distinction, the independent-audit requirement, the certified-medical-translation requirement, and the Chinese Android request. At this validation stage the hosted model had not been run; the separate first live run is recorded below.

## First live run — 2026-10-07

The authorized live run used TokenRhythm `deepseek-v4-flash`, with the unchanged fixture above and the actual production discovery route/provider sources. It completed from **07:20:14.835 to 07:21:07.357 UTC**, making exactly 20 sequential provider calls, with no retries and no operational failures. It did not create production profiles, send introductions, or make blockchain transactions.

| Metric | Keyword baseline | Hosted model |
|---|---:|---:|
| Strict case success | 15/20 | **14/20** |
| Acceptable returned recommendations | 15/18 (83.3%) | **17/27 (63.0%)** |
| First recommendation relevant on positive cases | 13/16 | **16/16** |
| Positive cases with at least one relevant recommendation | 14/16 | **16/16** |
| Correct required abstentions | 2/4 | **4/4** |
| Unacceptable secondary or primary selections | 3 | **10** |
| Operational failures | 0 | 0 |
| Median latency | 0.639 ms | 2,348.264 ms |
| p95 latency | 3.127 ms | 3,651.450 ms |

**The hosted model did not beat this baseline on overall strict success or recommendation relevance.** Its strengths were first-choice relevance and required abstention. All six selection failures came from adding weak secondary recommendations despite already having a correct first choice. The 20 cases are too small and hand-authored to support population-level accuracy claims.

The labels require direct task fit; the production prompt permits clearly qualified exploratory suggestions in some circumstances. Some misses therefore reflect that product-policy difference, rather than fabricated facts. The separate manual review distinguishes caveated adjacent suggestions from actual unsupported claims or contradictory evidence.

Provider-reported usage was 32,413 input tokens and 3,959 output tokens. Raw evidence quotes matched their fields in 38/38 checks, and the narrow automated claim heuristic flagged zero phrases. **Manual review nevertheless found unsupported and contradictory text**, including a Solidity recommendation justified only by an iOS disclaimer and a reorg specialist incorrectly described as lacking reorg-specific scope. Exact substrings are not proof that an explanation follows from its source.

Retained evidence: [complete results](reports/matching-live-2026-10-07/results.json), [generated report](reports/matching-live-2026-10-07/report.md), and [manual review of all 20 cases](reports/matching-live-2026-10-07/claim-review.md). The original fixture, labels, baseline, and first-run results were not rewritten after observing model output. No production behavior changed as part of this evaluation.

The report records pinned source revision `9a5e56461d051c12b8c85a1f5d449063d0564411` and exact loaded hashes: route `c327bdb9068964b8cc9fe30fc3331592b27202668a21d23e8815a48037f3d715`; provider `fe024c541c83ab47cba60fda2209a1ce0c8a66afa5b8270647f980930f12889c`; evidence ordering `c7713eb1d0e109351f4a49af3dedf9a1772b8584105cb2a9af3c38a9c8df1418`. These match the existing remote source files and the pinned local source after normalizing the extra terminal newline introduced during local restoration.

## What is evaluated

Each case supplies the same declared candidate pool to both methods:

1. The real application `/agent/discover` route, production instructions, exact-quote validation, evidence ordering, and configured hosted provider.
2. A deterministic BM25 keyword baseline using the exact public profiles supplied to that model request.

The runner creates an isolated in-memory application and uses its authentication and profile routes to load fictional profiles. Each case gets a fresh database and a fresh locally signed identity. It does not contact the deployed SignalPass API, use its database, publish profiles, send introductions, invoke chain RPCs, or transfer funds. In live mode, the only external requests are the hosted model calls through the existing provider adapter.

The 20 cases cover wallet UX, accessibility, browser-test isolation, activation analytics, developer-documentation translation, Solidity tests, blockchain event processing, community programs, account deletion, AMM mathematics, brand animation, Android wallet handoffs, and SDK references. They also include misleading keyword overlap, two acceptable reviewers, a Chinese request against English profiles, and four cases that must return nobody because expertise, certification, location, availability, or an investment offer is absent.

Every case has a complete partition of its candidate pool into `acceptableHandles` and `unacceptableHandles`, plus a plain-language rationale. A successful positive case needs **at least one** acceptable recommendation and **no** unacceptable recommendation. It does not need to return every acceptable candidate. A successful negative case must return no candidates and no follow-up question. A failed provider/API call is a failure, never a correct abstention.

These labels are author judgments and can be challenged. Review them before running the model; do not revise them afterward merely because the result is inconvenient. If a label is genuinely wrong, retain the original result and publish the correction and a new fixture version separately.

## Frozen baseline

BM25 uses `k1=1.2`, `b=0.75`, case-insensitive Unicode tokens, a fixed English stopword list, and simple English suffix normalization. Each profile document combines its work, offer, desired connections, and interests. It does not read expected labels.

To avoid forcing recommendations on every request, a candidate must match at least two distinct query terms and at least 20% of the filtered query terms, and score at least 60% of the highest candidate score. Up to three candidates are returned. These are frozen heuristic thresholds, not parameters fitted against these 20 labels. Scores and query coverage for **every** candidate are saved, including candidates below the threshold.

This is a transparent lexical reference, not an optimized search system. Its lack of translation matters on the Chinese case. The report must not imply superiority over all retrieval systems, embedding search, or a tuned commercial search product. A larger follow-up should use a separate development set for baseline calibration, more held-out queries, and reviewers who did not write the system.

## Run without model calls

Use the existing monorepo dependencies and Node 22.13 or later; Node 24 is suitable. The runtime needs `node:sqlite`. No new packages or environment files are required.

From the repository root:

```bash
pnpm --filter @signalpass/api exec node --import tsx scripts/matching-benchmark.ts --validate
```

This validates the fixture schema and label partitions, checks scoring invariants, calculates the baseline, and sends each baseline result through the real local discovery route to check fixture compatibility. It exercises all 20 cases with **zero hosted-model requests**. It prints the fixture SHA-256 and baseline summary. It does not output an AI score.

To retain a validation report, add `--out /absolute/path/to/a-new-validation-directory`. The path must not already exist; the runner refuses to overwrite evidence.

## Run the actual hosted model

Use an approved server environment with the same explicit `SIGNALPASS_AGENT_PROVIDER`, `SIGNALPASS_AGENT_MODEL`, and `SIGNALPASS_AGENT_API_KEY` or `SIGNALPASS_AGENT_API_KEY_FILE` settings as the application. The existing provider's key-file restrictions and timeouts apply. The runner does not load `.env` automatically, inspect service credentials itself, print secrets, or use an ambient OpenAI key. Keep credentials in the server's existing secret mechanism; do not paste them into source, shell command history, reports, or chat.

First review and freeze the fixture and run `--validate`. Then substitute the emitted SHA-256 below:

```bash
pnpm --filter @signalpass/api exec node --import tsx scripts/matching-benchmark.ts \
  --live \
  --fixture-sha REVIEWED_FIXTURE_SHA256 \
  --out /absolute/path/to/a-new-live-result-directory
```

The run is capped at **20 provider requests, concurrency 1, no retries or fallback added by the runner**. A case's provider timeout is the existing adapter timeout; the whole run can therefore take several minutes. In-memory application limits allow exactly one generation per case. Usage does not increment the deployed application's user/day counter because this is an isolated process; it **does** consume the configured provider account's quota or billable usage. The cap is a request bound, not a guarantee of free inference.

The complete fixture and a manifest are written before the first hosted request. The manifest includes the fixture hash, baseline settings, start time, provider/model identifier, pinned source revision, and hashes of the route, provider, and evidence-ordering sources actually loaded. `results.partial.json` is updated after each case. The runner writes final `results.json` and `report.md` only after completing all cases. Retain failed or interrupted runs; never present partial results as the full evaluation or silently rerun only failed cases.

The exit code is nonzero for preflight/runtime problems or provider/API failures. Quality misses remain visible in the report and do not prevent writing the complete results. No automatic retries occur. Any future run must use a new output directory and be reported as another run.

## Read the results

| Field | Meaning |
|---|---|
| `strictCaseSuccess` | Positive cases with at least one relevant recommendation and no irrelevant ones; negative cases with correct abstention. Includes every evaluated case in the denominator. |
| `recommendationRelevance` | Acceptable returned recommendations divided by all returned recommendations. Empty/failed cases create no recommendations, so also read coverage and failures. |
| `firstRecommendationRelevant` | Positive cases with a relevant first recommendation, divided by all positive cases, including failures. |
| `atLeastOneRelevantRecommendation` | Positive cases returning any acceptable recommendation, divided by all positive cases, including failures. |
| `correctAbstention` | Required-abstention cases returning no candidates and no question, divided by all required-abstention cases. Failures count against this. |
| `unsupportedCandidateSelections` | Recommended profiles that fail the predeclared relevance/constraint label. This is a support proxy, not a factuality verdict. |
| `hostedAudit.quoteMismatches` | Raw model evidence quotes not found exactly in the stated profile field, before the production route rejects them. |
| `hostedAudit.specificClaimFlagCount` | Narrow lexical flags for a few unstated credentials, guarantees, locations, availability, or durations in the model's reason. Requires manual review. |
| `failures`, `noRawResponse`, `invalidRawFormats` | Operational/API failures, missing provider output, and received output failing the expected schema. These are distinct from match-quality misses. |
| `latencyMs` | Median and p95 across all attempted case responses. Hosted timing includes the local discovery route and remote model; baseline timing is local lexical computation only. |

Case-level output includes the request, expected labels/rationale, actual model candidate order, complete baseline ranking, validated hosted reasons/caveats/evidence, bounded parsed raw proposals, raw quote checks, usage tokens, failure category, and timing. Raw provider errors, HTTP headers, keys, signatures, cookies, and environment values are not retained.

An exact quote can still be irrelevant, cherry-picked, or misleading. The small claim-flag heuristic can miss unsupported claims or flag legitimate text; a zero value is **not** a zero-hallucination claim. The expected-label check does not verify all free-text explanations. Human review is still needed to decide whether each reason follows from the quoted evidence and preserves limitations or negations. The report retains both raw and displayed evidence so that review can be performed.

## How to use this in the product demo

Only quote numbers from a completed, retained live report. State the sample size, fictional nature, model, and label provenance. For example, after measuring: “On 20 author-labelled fictional scenarios, this model satisfied all expected constraints in X cases; the frozen keyword baseline did so in Y. Z requests failed. These are engineering checks, not a user study.”

Show one successful semantic match and one honest no-match result. If a difficult case fails, record it and fix the underlying issue in a separate change rather than hiding it. Keep the current report when running the improved version so the comparison is visible.

The benchmark does not establish real recommendation usefulness, adoption, spam reduction, transaction settlement reliability, mobile compatibility, prompt-injection resistance, or scalability beyond the 40-candidate retrieval limit. Those require separate evidence.
