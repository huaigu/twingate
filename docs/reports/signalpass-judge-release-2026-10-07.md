# October 7 judge release — prepared, not deployed

This release candidate makes SignalPass easier to evaluate: one guided introduction story, a reproducible matching benchmark, current production captures in two concise films, and a public page separating what was tested from what remains a hypothesis.

## Completed

- Ten-step fictional walkthrough with explicit candidate selection, an editable and reviewed draft, sender confirmation, context question and reply, acceptance, and independent contact sharing. No API calls, storage, real messages or wallet requests are made by the walkthrough.
- Eleven browser checks passed, covering all ten scenes at 320, 390, 768 and 1280 pixels, all four contact-sharing combinations, review invalidation after edits, text escaping, rewind/restart/reload and absence of external or mutating requests. Screenshots were reviewed. These checks used an isolated test server, not the undeployed public URL.
- Twenty predeclared matching cases and fifteen fictional profiles. All cases passed local schema, scoring and production-route compatibility checks. The benchmark script passed strict TypeScript validation. Zero hosted evaluation requests were made.
- Frozen BM25 baseline: 15/20 strict case successes; 15/18 returned recommendations acceptable; 13/16 first recommendations relevant; 14/16 positive cases with at least one relevant recommendation; 2/4 required abstentions; zero operational failures. No AI superiority claim is made.
- A fresh public production rehearsal completed with two fictional accounts, real hosted discovery and draft calls, edited-message delivery, acceptance, separately approved contacts, refresh persistence and a 390px receipt check. Discovery took 3.141s and drafting 3.568s in this one run. No chain transaction. Test profiles were hidden, contacts removed and sessions signed out afterward. Controlled sign-in wallets do not establish real-phone wallet compatibility.
- Four historical mainnet receipts were re-read successfully. Acceptance and decline each returned a 0.000075 MON bond. Gas exceeded this intentionally tiny test bond. Mainnet expiry, improved response rates and anti-spam economics are unproven.
- V3 demo: 172.834 seconds, 1920×1080 H.264/AAC, 30 English caption cues. V3 pitch: 111.467 seconds, same format, 20 cues. Both decode without errors. They are edited production captures with fictional participants and separate historical mainnet evidence, not uninterrupted recordings.

## Evidence

- [Baseline case-level report](matching-validation-2026-10-07/report.md) and [JSON](matching-validation-2026-10-07/results.json)
- [Evaluation methodology](../MATCHING_EVALUATION.md)
- [Current production rehearsal](signalpass-public-journey-2026-10-07.json)
- [Historical receipt recheck](signalpass-mainnet-receipt-recheck-2026-10-07.json)
- [Video validation and hashes](signalpass-video-validation-2026-10-07.json)
- [Video edit provenance](signalpass-video-edit-notes-2026-10-07.md)

The benchmark's pinned production revision is `9a5e56461d051c12b8c85a1f5d449063d0564411`. Local restored source files have an extra trailing newline compared with GitHub; the validation manifest records the exact bytes executed. Removing that single extra newline matches the existing VPS source. No production route/provider behavior was changed in this release.

## Remaining release steps

Automatic approval review rejected transferring the private benchmark script to the connected SignalPass VPS, asking for explicit user authorization for that source and destination. The agent stopped remote writes. The fixture had already been copied to an isolated test directory; the benchmark script was not transferred, no hosted benchmark calls were made, and no deployment occurred.

After authorization, transfer the reviewed runner to the verified SignalPass VPS, run one bounded 20-call hosted evaluation using the existing provider configuration and an isolated in-memory database, and retain every case outcome. Do not print or copy provider secrets. Keep the baseline-only report and publish the hosted run separately with its exact hashes; do not tune labels or rerun failures to improve the score.

Then add the measured results to the evidence page and submission copy, publish the V3 media and static pages in a new release directory, verify a canary and signed-out mobile/desktop links, and switch the website with rollback available. The existing API and production database do not need replacement. The homepage, guided story and evidence page links must be verified together.

The submission portal is currently signed out. Its last previously observed status was Ready for judging; the current field values have not been verified in this run. New URLs must not be described as saved to the portal until sign-in and verification succeed. The private repository remains private; private-source eligibility clarification and an actual phone-wallet check remain open.

A source review also corrected primary-link text contrast on the evidence page and allowed its header and the video tabs to wrap at narrow widths.

The earlier two-line wallet-loading request is included: initial session checking and wallet-connection waiting both have deliberate two-line copy; wallet pending disables repeat clicks, sets aria-busy and restores retry on errors. Syntax/cache-reference checks passed. A final browser check for this narrow change remains in the deployment gate. Generated shared CSS was rebuilt and its reproducibility check passed; referenced hashes were refreshed.
