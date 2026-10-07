# October 7 judge release — deployed and publicly verified

This deployed release makes SignalPass easier to evaluate: one guided introduction story, a reproducible matching benchmark, current production captures in two concise films, and a public page separating what was tested from what remains a hypothesis.

## Completed

- Ten-step fictional walkthrough with explicit candidate selection, an editable and reviewed draft, sender confirmation, context question and reply, acceptance, and independent contact sharing. No API calls, storage, real messages or wallet requests are made by the walkthrough.
- Eleven browser checks passed, covering all ten scenes at 320, 390, 768 and 1280 pixels, all four contact-sharing combinations, review invalidation after edits, text escaping, rewind/restart/reload and absence of external or mutating requests. Screenshots were reviewed. These initial checks used an isolated test server. Subsequent canary and public checks are recorded below.
- Twenty predeclared matching cases and fifteen fictional profiles passed local schema, scoring and production-route compatibility checks. The benchmark script passed strict TypeScript validation. After explicit owner authorization, one hosted run made **20 sequential calls**, with **zero operational failures and no retries**.
- Hosted versus frozen BM25: strict case success **14/20 versus 15/20**; returned recommendation relevance **17/27 versus 15/18**; first-match relevance **16/16 versus 13/16**; at least one relevant match **16/16 versus 14/16**; correct abstention **4/4 versus 2/4**. The agent added **10 unwanted secondary suggestions across six positive cases**. Hosted median latency was **2,348.264ms**, p95 **3,651.450ms**; hosted route/inference time is not comparable to local keyword CPU time.
- All **38 evidence quotes** matched source fields. The coding assistant's qualitative review nevertheless found unsupported or contradictory prose, which the narrow automated claim heuristic missed. This is not independent human grading. Some extra-choice misses also expose a difference between the frozen direct-fit labels and the production prompt's permissive exploratory policy; not every miss is a fabricated fact. No zero-hallucination or overall AI-superiority claim is made; exact quotations do not establish entailment.
- A fresh public production rehearsal completed with two fictional accounts, real hosted discovery and draft calls, edited-message delivery, acceptance, separately approved contacts, refresh persistence and a 390px receipt check. Discovery took 3.141s and drafting 3.568s in this one run. No chain transaction. Test profiles were hidden, contacts removed and sessions signed out afterward. Controlled sign-in wallets do not establish real-phone wallet compatibility.
- Four historical mainnet receipts were re-read successfully. Acceptance and decline each returned a 0.000075 MON bond. Gas exceeded this intentionally tiny test bond. Mainnet expiry, improved response rates and anti-spam economics are unproven.
- V3 demo: 172.834 seconds, 1920×1080 H.264/AAC, 30 English caption cues. V3 pitch: 111.467 seconds, same format, 20 cues. Both decode without errors. They are edited production captures with fictional participants and separate historical mainnet evidence, not uninterrupted recordings.

## Evidence

- [Hosted case-level report](matching-live-2026-10-07/report.md), [JSON](matching-live-2026-10-07/results.json) and [frozen fixture](matching-live-2026-10-07/fixture.json)
- [Baseline case-level report](matching-validation-2026-10-07/report.md) and [JSON](matching-validation-2026-10-07/results.json)
- [Qualitative case and claim review](matching-live-2026-10-07/claim-review.md)
- [Evaluation methodology](../MATCHING_EVALUATION.md)
- [Current production rehearsal](signalpass-public-journey-2026-10-07.json)
- [Historical receipt recheck](signalpass-mainnet-receipt-recheck-2026-10-07.json)
- [Video validation and hashes](signalpass-video-validation-2026-10-07.json)
- [Video edit provenance](signalpass-video-edit-notes-2026-10-07.md)
- [Deployment record](signalpass-deployment-2026-10-07.json) and [release QA](signalpass-release-qa-2026-10-07.json)

The benchmark's pinned production revision is `9a5e56461d051c12b8c85a1f5d449063d0564411`. Local restored source files have an extra trailing newline compared with GitHub; the validation manifest records the exact bytes executed. Removing that single extra newline matches the existing VPS source. No production route/provider behavior was changed in this release.

## Deployment and public verification

Automatic approval review initially rejected transfer of the private benchmark script to the connected SignalPass VPS, and remote writes stopped. The owner explicitly authorized that source transfer and deployment on October 7. The reviewed runner completed one bounded 20-call hosted evaluation against an isolated in-memory database with the existing provider configuration. The original frozen labels and every result were retained; no retry or relabelling was used to improve the score. The baseline-only report remains separate.

The release switched successfully at **2026-10-07T07:41:13.215281Z**. All **16 canary checks**, **20 local release checks** and **5 final public checks** passed. The existing API process remained unchanged. The public evidence page serves the complete results, report, methodology, manifest, frozen fixture and qualitative review.

Both V3 films decoded and played in the public browser, with observed durations **172.833979 seconds** and **111.466667 seconds**. Public health and readiness returned HTTP 200. The demo byte-range check returned HTTP 206, `Content-Range: bytes 0-1023/7690254`, and a 1,024-byte body. The stable watch page uses V3; old V2 direct URLs were preserved.

A returning browser reloaded and followed **homepage → walkthrough → evidence → watch page**, showing the new content, exact benchmark scores and current film durations. Public browser checks confirmed two-line initial-session and actual wallet-pending states, rejected-request retry and no overflow at 320, 390 and 1280px. Evidence-page primary-action contrast was at least 4.5:1, and layout and downloadable resources passed.

Earlier rollout attempts recovered through rollback: a Python check client received Cloudflare 403/1010 even though ordinary browsers loaded successfully, and a subsequent restart wait was shorter than the existing systemd graceful-stop timeout. The final helper waited for the configured service cycle and verified the public site with ordinary browsers. No security controls were changed to obtain these results.

## Remaining owner-dependent steps

The submission portal is currently signed out. Its last previously observed status was Ready for judging; the current field values have not been verified in this run. New URLs must not be described as saved to the portal until sign-in and verification succeed. The private repository remains private; private-source eligibility clarification and an actual phone-wallet check remain open.


The two-line wallet-loading request is complete: session checking and wallet-connection waiting use deliberate two-line copy; wallet pending disables duplicate clicks, sets `aria-busy` and restores retry after rejection. Shared CSS reproducibility and cache references passed, followed by the public browser checks above.
