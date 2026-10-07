# SignalPass synthetic matching evaluation

Synthetic engineering benchmark; fictional profiles; author-defined labels; not independent human validation, customer traction, or a production usage study.

Mode: **validate**. Fixture SHA-256: `a3b918abbacbb5ce99aa23c7c1de1d9061e09016971b2af91bb8bd250fc37d0b`.

**The hosted model was not run. These are baseline and local route-validation results only.**

| Metric | Keyword baseline | Hosted model |
|---|---:|---:|
| strictCaseSuccess | 15/20 (75%) | Not run |
| recommendationRelevance | 15/18 (83.3%) | Not run |
| firstRecommendationRelevant | 13/16 (81.3%) | Not run |
| atLeastOneRelevantRecommendation | 14/16 (87.5%) | Not run |
| correctAbstention | 2/4 (50%) | Not run |
| failures | 0 | Not run |

Hosted latency includes the in-process discovery route and remote inference; baseline latency covers only local lexical scoring. They are not equal-compute measurements.

Recommendation relevance uses returned recommendations as its denominator. Empty/failed results do not improve strict-case, positive-case, or abstention scores; those denominators include every evaluated case of that type.

Raw exact-quote mismatches: Not measured. Narrow specific-claim flags: Not measured.

Exact quotes do not establish entailment, qualifications, availability, or usefulness. Unacceptable candidate selections are a constraint-support proxy, not a factuality score. Specific-claim flags are a small lexical heuristic with false positives and false negatives. Read the case-level reasons, quotes, caveats, and expected-label rationale in results.json before making claims.

| Case | Expected acceptable | Keyword result | Hosted result |
|---|---|---|---|
| wallet-wording | bench-bob | bench-bob — PASS | Not run |
| keyboard-trap | bench-maya | Abstain — MISS | Not run |
| flaky-browser-tests | bench-leo | bench-leo — PASS | Not run |
| activation-funnel | bench-nia | bench-nia — PASS | Not run |
| chinese-dev-guide | bench-omar | bench-omar — PASS | Not run |
| contract-invariants | bench-ivy | bench-ivy — PASS | Not run |
| reorg-duplicates | bench-chen | bench-chen — PASS | Not run |
| community-program | bench-rosa | bench-rosa — PASS | Not run |
| account-erasure | bench-finn | bench-finn — PASS | Not run |
| lp-simulation | bench-sana | bench-sana — PASS | Not run |
| landing-motion | bench-theo | bench-theo — PASS | Not run |
| android-handoff | bench-dara | bench-dara — PASS | Not run |
| sdk-reference | bench-ravi | bench-ravi — PASS | Not run |
| liquidity-keyword-trap | bench-sana | bench-tess, bench-sana — MISS | Not run |
| independent-security-audit | Must abstain | bench-ivy — MISS | Not run |
| medical-spanish | Must abstain | bench-omar — MISS | Not run |
| confirmed-local-availability | Must abstain | Abstain — PASS | Not run |
| committed-investor | Must abstain | Abstain — PASS | Not run |
| two-complementary-reviews | bench-bob, bench-maya | bench-bob, bench-maya — PASS | Not run |
| android-chinese-paraphrase | bench-dara | Abstain — MISS | Not run |

Limitations: 20 hand-authored cases, 15 fictional profiles, one fixed candidate pool per case, one hosted sample per case, no independent human grading, no deployment/session/phone test, no statistically validated population estimate, and no evidence of adoption. English-heavy labels and a non-translating baseline matter for the multilingual case. The 40-candidate retrieval cap is not exercised. Baseline thresholds were frozen heuristics; this is not a claim to beat every lexical or embedding retrieval system.

Expected labels, baseline settings, production source hashes, timestamp, call count, individual failures, and token usage are included in results.json. Fixture and source hashes make later changes detectable; they do not substitute for independent preregistration.
