# Case-by-case review of the first live matching evaluation

**The hosted model found an acceptable first choice in every positive case and abstained in all four required no-match cases. It also added ten unsupported secondary choices, and some explanations contradicted or went beyond the quoted profiles.**

This is a qualitative review by the coding assistant that helped write the benchmark, not an independent or blinded human assessment. The review covers all 20 cases, all 27 returned recommendations, and all eight returned follow-up questions in [the unchanged first-run results](/v4/evaluation-results.json). It did not change labels, rerun the model, or modify production behavior.

All 38 evidence quotes are exact substrings of their stated profile fields. That check does **not** prove that the quotes support the accompanying reason. The automated specific-claim heuristic reported zero flags; the findings below demonstrate why that narrow heuristic cannot be described as a factuality or hallucination score.

The frozen labels require a direct, explicitly supported fit for the requested task. The current production prompt also allows some exploratory shared-interest matches when clearly described that way. Therefore, several secondary-choice misses expose a difference between the benchmark's stricter desired behavior and the product's permissive suggestion policy; they are not all fabricated facts or clear prompt violations. Bob's tentative design help alongside analytics is more defensible as an optional adjacent conversation than the reentrancy/iOS evidence error. This distinction should remain visible in public summaries.

Severity below describes likely product impact, not a security classification. **High** means a claimed ability or evidence link could direct the user toward the wrong specialist; **medium** means a weak recommendation, source contradiction, or misleading follow-up; **low** means avoidable confusion or overstatement. “No material issue found” applies only to this output and its fictional source, not to the person's real-world expertise.

## Findings that change the interpretation of the score

| Case / recommendation | Model claim or behavior | Supplied source | Review |
|---|---|---|---|
| `contract-invariants` / Dara | Suggests wallet-handoff reproduction “may relate to reentrancy test failures if wallet interaction is involved.” Its only evidence quote is “I do not test iOS apps.” | Dara offers Android deep-link and connection-state reproduction. There is no Solidity or reentrancy offer. | **High.** An irrelevant exact quote passes the quote validator while substantiating none of the claimed connection. The model invented an additional scenario to justify a weak match. |
| `keyboard-trap` / Leo | “He can automate checks for keyboard reachability and popup return paths as regression tests.” | Leo offers debugging of flaky Playwright tests, selectors, race conditions, and CI isolation. No accessibility or focus-path offer appears. | **High.** A plausible transfer of general browser-test skill is stated as a specific capability. The user asked for a keyboard-accessibility review; Maya already directly offers it. |
| `keyboard-trap` / Bob | Rejected-request recovery “directly mirrors your need to return to the page after a popup.” | Bob offers wallet UX, approval wording, and rejected-request recovery screens. | **Medium.** The model conflates wallet error recovery with keyboard focus recovery. Its caveat admits mouse-free testing is not established, but the recommendation still fails the frozen label. |
| `flaky-browser-tests` / Ivy and follow-up | Adds Solidity testing as a transferable skill; asks whether this is a wallet/browser-extension test and says otherwise it may not find a match in the directory. The entire response switches to Chinese despite the English request. | Leo explicitly offers the requested Playwright CI isolation, without requiring a wallet or extension context. Ivy offers Solidity tests. | **Medium.** The extra recommendation is outside the requested specialty. The follow-up introduces an unsupported restriction on an already direct match, and the unexplained language switch impairs usability. |
| `activation-funnel` / Bob | Adds wallet usability as an exploratory contributor to SaaS activation analysis. | Bob offers wallet UX; Nia directly offers event instrumentation, funnels, and drop-off investigation. | **Medium.** The tentative wording is honest about uncertainty, but the adjacent design role does not meet the requested analytics task. A caveat does not make this an acceptable second recommendation. |
| `contract-invariants` / Leo | General race-condition debugging “could transfer,” while acknowledging there is no Solidity evidence. | Leo's offer is browser automation and CI; Ivy directly offers Solidity invariants and reentrancy coverage. | **Medium.** The model expands the requested specialization without a user request to broaden it. |
| `reorg-duplicates` / Chen | Caveat says the offer is general backend reliability rather than blockchain-specific reorg logic and may not cover that nuance. | Work: “Operating blockchain event ingestion services.” Offer explicitly includes “indexer reorg handling.” | **Medium.** The caveat contradicts the exact source. This case passes the selection metric, showing that a correct candidate can still receive a misleading explanation. |
| `android-handoff` / Bob and Nia | Adds UX review and analytics instrumentation beside the Android specialist. | Bob's stated scope is desktop wallet UX; Nia's scope is subscription-product activation analytics. Dara explicitly offers the requested handoff reproduction and recovery. | **Medium.** Both extras fail the requested technical task. The follow-up then invites the user to choose tasks introduced by these extras rather than resolving an ambiguity in the original request. |
| `android-chinese-paraphrase` / Bob and Jules | Adds a wallet UX reviewer and a crypto-discussion newcomer host. States Bob “cannot test technical deep-link logic.” Responds in English to a Chinese request. | Bob lists UX services but does not state he is incapable of technical testing. Jules explicitly has not built wallets or backend services. | **Medium.** Both extra choices are outside the requested debugging task. The claim about Bob's incapability is stronger than “his profile does not establish it.” Language should follow the request. |
| `community-program` / Rosa | Caveat suggests peer-learning communities may not include the builder group requested. | Work explicitly says “peer-learning communities for builders.” | **Low.** The availability caveat is appropriate; the additional distinction unnecessarily undermines a directly stated fit. Technical depth is unconfirmed, but the user did not require it. |
| `lp-simulation` / Sana | Calls Sana “not a formal auditor or advisor.” | The profile says she studies AMMs and does not give investment recommendations. It does not establish every professional qualification she does or does not hold. | **Low.** Use “no audit qualification is stated” when relevant. The request concerns simulation help, not certification; this disclaimer adds little. |

## Complete case review

“Pass” and “miss” below use the original frozen candidate-selection rule. They do not override the free-text findings.

| Case | Selection outcome | Explanation / question review |
|---|---|---|
| `wallet-wording` | Pass: Bob | Direct support for the request. Asking to see the actual copy is a reasonable next step. The profile is self-reported; no externally verified competence is established. |
| `keyboard-trap` | Miss: Maya correct; Bob and Leo extra | Maya's lead reason is grounded. Bob's analogy and Leo's specific accessibility claim are unsupported. Maya's caveat speculates about browser-testing coverage. |
| `flaky-browser-tests` | Miss: Leo correct; Ivy extra | Scope expansion, misleading wallet-only follow-up, and English-to-Chinese switch described above. |
| `activation-funnel` | Miss: Nia correct; Bob extra | Nia's reason is grounded. Bob's tentative analytics fit is outside the requested task. |
| `chinese-dev-guide` | Pass: Omar | Translation and terminology support are explicit. Naming-convention question is relevant to execution, although it does not change the sole direct candidate. |
| `contract-invariants` | Miss: Ivy correct; Dara and Leo extra | Ivy's reason is grounded. Dara's quote is irrelevant; Leo is a speculative transfer. |
| `reorg-duplicates` | Pass: Chen | Directly relevant choice, but the caveat contradicts stated reorg expertise. |
| `community-program` | Pass: Rosa | Grounded match and reasonable needs/offers question; unnecessary doubt about builder-community scope. |
| `account-erasure` | Pass: Finn | Engineering reason is grounded. Conditional legal caveat is not a fabricated credential, but is unnecessary for this explicitly non-legal request. |
| `lp-simulation` | Pass: Sana | Numerical simulation support is explicit. Negative professional-status claim should be softened to an absence of stated qualifications. |
| `landing-motion` | Pass: Theo | Grounded visual deliverables. Broader-brand-support question is within the offer but not needed to resolve the match. |
| `android-handoff` | Miss: Dara correct; Bob and Nia extra | Dara's reason is grounded. Added UX/analytics paths broaden the task; no wallet/browser-specific availability is established. |
| `sdk-reference` | Pass: Ravi | Grounded offer. Mock-versus-live example question is relevant to doing the work, though unnecessary for choosing Ravi. |
| `liquidity-keyword-trap` | Pass: Sana | Correctly follows numerical-model scope instead of dashboard keywords. Explanation is verbose, but no material unsupported capability was identified. |
| `independent-security-audit` | Pass: abstain | Correctly declines to infer independent audit/certification from a testing offer. No recommendation or question to review. |
| `medical-spanish` | Pass: abstain | Correctly refuses to infer Spanish/medical/certified capability from developer-documentation translation. |
| `confirmed-local-availability` | Pass: abstain | Does not invent location or next-day availability. |
| `committed-investor` | Pass: abstain | Does not infer an investment offer from builder interests. |
| `two-complementary-reviews` | Pass: Bob and Maya | Both match one of the user's explicit alternatives. Caveats correctly distinguish their areas; web-versus-native scope remains a reasonable uncertainty. |
| `android-chinese-paraphrase` | Miss: Dara correct; Bob and Jules extra | Understands the Chinese need and ranks Dara first, but returns two unwanted alternatives, an unsupported inability claim, and the wrong response language. |

## Public interpretation

The defensible description is: **“In one run of 20 author-labelled fictional cases, the model ranked an acceptable person first on all 16 positive cases and abstained on all four required no-match cases. It nevertheless added ten unacceptable secondary recommendations, giving 14/20 strict successes versus the keyword baseline's 15/20. Manual review also found unsupported or contradictory explanations.”**

Do not call this an overall win over keyword search, a 100% accurate matcher, zero hallucinations, independent human validation, or evidence of customer usefulness. Report the first-choice and abstention strengths together with the secondary-choice and explanation weaknesses.

A future improvement should keep suggestions tied to an explicit offer for the requested task, preserve positive evidence when writing caveats, and follow the user's language. Any change informed by these results needs a new evaluation with clearly labelled revision history and a fresh held-out set. This first run remains unchanged; there were no additional model calls during this review.
