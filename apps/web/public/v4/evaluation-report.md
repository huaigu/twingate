# SignalPass synthetic matching evaluation

Synthetic engineering benchmark; fictional profiles; author-defined labels; not independent human validation, customer traction, or a production usage study.

Mode: **live**. Fixture SHA-256: `a3b918abbacbb5ce99aa23c7c1de1d9061e09016971b2af91bb8bd250fc37d0b`.

Hosted provider: tokenrhythm; model: deepseek-v4-flash. 20 calls; concurrency 1; no retries.

| Metric | Keyword baseline | Hosted model |
|---|---:|---:|
| strictCaseSuccess | 15/20 (75%) | 14/20 (70%) |
| recommendationRelevance | 15/18 (83.3%) | 17/27 (63%) |
| firstRecommendationRelevant | 13/16 (81.3%) | 16/16 (100%) |
| atLeastOneRelevantRecommendation | 14/16 (87.5%) | 16/16 (100%) |
| correctAbstention | 2/4 (50%) | 4/4 (100%) |
| failures | 0 | 0 |

Hosted latency includes the in-process discovery route and remote inference; baseline latency covers only local lexical scoring. They are not equal-compute measurements.

Recommendation relevance uses returned recommendations as its denominator. Empty/failed results do not improve strict-case, positive-case, or abstention scores; those denominators include every evaluated case of that type.

Raw exact-quote mismatches: 0/38 (0%). Narrow specific-claim flags: 0.

Exact quotes do not establish entailment, qualifications, availability, or usefulness. Unacceptable candidate selections are a constraint-support proxy, not a factuality score. Specific-claim flags are a small lexical heuristic with false positives and false negatives. Read the case-level reasons, quotes, caveats, and expected-label rationale in results.json before making claims.

| Case | Expected acceptable | Keyword result | Hosted result |
|---|---|---|---|
| wallet-wording | bench-bob | bench-bob — PASS | bench-bob — PASS |
| keyboard-trap | bench-maya | Abstain — MISS | bench-maya, bench-bob, bench-leo — MISS |
| flaky-browser-tests | bench-leo | bench-leo — PASS | bench-leo, bench-ivy — MISS |
| activation-funnel | bench-nia | bench-nia — PASS | bench-nia, bench-bob — MISS |
| chinese-dev-guide | bench-omar | bench-omar — PASS | bench-omar — PASS |
| contract-invariants | bench-ivy | bench-ivy — PASS | bench-ivy, bench-dara, bench-leo — MISS |
| reorg-duplicates | bench-chen | bench-chen — PASS | bench-chen — PASS |
| community-program | bench-rosa | bench-rosa — PASS | bench-rosa — PASS |
| account-erasure | bench-finn | bench-finn — PASS | bench-finn — PASS |
| lp-simulation | bench-sana | bench-sana — PASS | bench-sana — PASS |
| landing-motion | bench-theo | bench-theo — PASS | bench-theo — PASS |
| android-handoff | bench-dara | bench-dara — PASS | bench-dara, bench-bob, bench-nia — MISS |
| sdk-reference | bench-ravi | bench-ravi — PASS | bench-ravi — PASS |
| liquidity-keyword-trap | bench-sana | bench-tess, bench-sana — MISS | bench-sana — PASS |
| independent-security-audit | Must abstain | bench-ivy — MISS | Abstain — PASS |
| medical-spanish | Must abstain | bench-omar — MISS | Abstain — PASS |
| confirmed-local-availability | Must abstain | Abstain — PASS | Abstain — PASS |
| committed-investor | Must abstain | Abstain — PASS | Abstain — PASS |
| two-complementary-reviews | bench-bob, bench-maya | bench-bob, bench-maya — PASS | bench-bob, bench-maya — PASS |
| android-chinese-paraphrase | bench-dara | Abstain — MISS | bench-dara, bench-bob, bench-jules — MISS |

Limitations: 20 hand-authored cases, 15 fictional profiles, one fixed candidate pool per case, one hosted sample per case, no independent human grading, no deployment/session/phone test, no statistically validated population estimate, and no evidence of adoption. English-heavy labels and a non-translating baseline matter for the multilingual case. The 40-candidate retrieval cap is not exercised. Baseline thresholds were frozen heuristics; this is not a claim to beat every lexical or embedding retrieval system.

Expected labels, baseline settings, production source hashes, timestamp, call count, individual failures, and token usage are included in results.json. Fixture and source hashes make later changes detectable; they do not substitute for independent preregistration.
