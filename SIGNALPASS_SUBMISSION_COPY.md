# SignalPass submission copy

Updated **October 12, 2026**. The owner made **huaigu/twingate public**, and its Public status was verified in GitHub. The V3 films, guided story and evidence are live. The October 12 release makes **Send without a bond** the live default; six mocked browser scenarios and 15 origin deployment checks passed. This file is the prepared submission copy; editing it does **not** update the portal. The existing entry uses Google sign-in, and the account-selection request was declined on October 12. No portal fields were changed. The last reported state remains **Ready for judging** with V2 links; current saved fields and deadline still require read-back after sign-in.

**Release status:** the owner authorized the private-source transfer and deployment on October 7. The hosted matching evaluation is complete, and the V3 films, guided story, evidence downloads and two-line wallet-loading fix are live. All **16 canary checks**, **20 local release checks** and **5 final public checks** passed. Both films played in the public browser; the existing API process remained unchanged. A returning browser also showed the new homepage, story, evidence and watch-page content. See [deployment evidence](docs/reports/signalpass-deployment-2026-10-07.json) and [release QA](docs/reports/signalpass-release-qa-2026-10-07.json). The October 7 portal update was not completed. The October 12 sign-in attempt was declined and the prepared copy still needs to be saved.

## Name and one-line description

**SignalPass**

An AI introduction assistant for builder communities: find someone relevant, understand why they fit, and send a first message you approve.

**People worth knowing, with context.**

## Product description

A builder community can have the right person in it and still fail to make the connection. Members describe themselves differently, useful offers get buried, and a vague first message gives the recipient little reason to respond.

SignalPass helps turn a specific need into a thoughtful introduction. A member describes what they want help with. The assistant considers eligible public profiles and explains each suggestion with exact profile quotes. It distinguishes a relevant offer from a shared interest, shows uncertainty and can return no suitable match. Its search is limited to the available directory.

The sender reviews a private draft, changes the wording and separately approves delivery. The recipient can ask for context, accept or decline. After acceptance, each person decides whether to reveal a contact or scheduling option. AI cannot send a message, accept an introduction or spend money on a person's behalf.

For example, Alice needs feedback on a wallet prototype. Bob explicitly offers reviews of wallet connection and approval screens. The useful part is the reason to approach Bob and a clear, modest request that he can evaluate. Our recorded example uses fictional participants on the live product; it is not customer traction.

The first market hypothesis is existing builder communities, starting with the Monad ecosystem. Community organizers already spend time connecting members and could become buyers and distribution partners. That customer and payment hypothesis still needs validation. Our broader vision is personal agents helping people find worthwhile connections while people retain the final decision.

## Why Monad is part of the product

Ordinary introductions default to **Send without a bond**. A sender can also explicitly approve an optional refundable commitment held by a contract on **Monad Mainnet, chain 143**. Acceptance and decline both return the full bond. An unanswered request requires a resolution transaction after expiry; it is not automatically refunded by a timer. Network gas is separate and is not returned.

The contract gives participants inspectable escrow and settlement rather than only an application balance. Monad is the initial community and deployment ecosystem. Project-owned wallets verified mainnet locks and full refunds on acceptance and decline on October 3; all four relevant transaction receipts were read again successfully on October 7. Mainnet expiry has not been exercised; the expiry path has local test coverage.

These tests establish an implementation on Monad. They do not establish reduced spam, increased reply rates, unique throughput requirements, or cheaper settlement than other chains. The deliberately tiny **0.000075 MON** test bonds were smaller than their transaction gas costs. Bond economics remain a product question to validate, not a proven advantage.

## Evidence available for review

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| October 7 production rehearsal | Two independently signed-in fictional accounts completed live AI discovery and drafting, draft editing, separately approved no-bond delivery, acceptance, independent contact sharing and refresh persistence. | Real customer outcomes, bond settlement within that same introduction, or real-phone wallet compatibility. |
| Matching evaluation | One completed 20-call hosted run on the frozen fictional cases, compared with BM25 using identical candidates. Hosted strict success: 14/20; BM25: 15/20. First-match relevance and abstention improved, while excess secondary suggestions reduced overall precision. | Independent human assessment, population-level quality, overall superiority to the baseline, perfect factuality or adoption. |
| Historical mainnet receipts | Two locks and two successful refund decisions on acceptance/decline; all four receipts rechecked October 7. | Mainnet expiry, refund of gas, current dollar costs, or measured end-to-end confirmation latency. |
| Guided fictional story | A wallet-free way to understand match evidence, review, delivery, recipient decisions and separate contact choices. | Live inference, real delivery, real transactions or observed usage. |

### Completed matching evaluation — mixed results

The frozen 20-case evaluation made **20 sequential hosted calls with zero operational failures and no retries** through the production discovery route. Expected labels were set before inference; candidates were identical for both methods.

| Metric | Hosted agent | BM25 keyword baseline |
| --- | --- | --- |
| Strict case success | **14/20 (70%)** | **15/20 (75%)** |
| First recommendation relevant, positive cases | **16/16** | **13/16** |
| Correct no-match response | **4/4** | **2/4** |
| Relevant returned recommendations | **17/27 (63%)** | **15/18 (83.3%)** |

The agent found a relevant first result in every positive case and correctly abstained in all four no-match cases. However, it added **10 unwanted secondary suggestions across six positive cases**, producing a lower strict-success score and lower recommendation precision than this baseline. These results do **not** show an overall win over keyword matching.

All **38 quoted evidence fragments** appeared exactly in their source fields. A [qualitative review by the coding assistant](docs/reports/matching-live-2026-10-07/claim-review.md), not an independent human assessment, nevertheless found unsupported or contradictory generated prose. Exact quotation is not a hallucination test, and the narrow automated claim check missed those semantic issues. Some secondary-choice misses also reflect a stricter benchmark requirement for direct task fit than the production prompt's allowance for exploratory suggestions; not every miss is a fabricated fact. The next quality task is to suppress weak secondary suggestions and require each explanation to follow from its evidence.

Hosted median latency was **2,348.264ms**, with **3,651.450ms p95** in this run; this includes the in-process route and remote inference and is not comparable to local keyword CPU time. The set contains 20 team-authored fictional cases and 15 profiles, with one hosted sample per case, no independent human grading and no adoption evidence. See the [complete report](docs/reports/matching-live-2026-10-07/report.md) and [case-level results](docs/reports/matching-live-2026-10-07/results.json).

The October 7 rehearsal used **2 hosted AI calls and 0 wallet transactions**. Observed discovery and draft response times were **3.141 seconds** and **3.568 seconds** in that run. The exact edited message reached the recipient; acceptance and both contact decisions survived refresh. The accepted receipt fit a **390px browser viewport** without horizontal overflow. Controlled injected wallets were used for sign-in; this was not a physical-phone wallet handoff test. Cleanup hid the test profiles, removed shared contacts and signed out the sessions.

## Product and reviewer links

- Live product: https://signalpass.coderbojack.space/
- Live assistant: https://signalpass.coderbojack.space/assistant?demo=0
- Guided fictional story: https://signalpass.coderbojack.space/v4/walkthrough.html
- Public evidence page: https://signalpass.coderbojack.space/v4/evidence.html
- Stable video watch page: https://signalpass.coderbojack.space/media/signalpass-demo-20261003.html
- Source, access required: https://github.com/huaigu/twingate

**V3 films are published and public playback is verified:**

- Technical demo, **172.834 seconds (2:53)**: https://signalpass.coderbojack.space/media/signalpass-live-demo-20261007-v3.mp4
- Product pitch, **111.467 seconds (1:51)**: https://signalpass.coderbojack.space/media/signalpass-product-pitch-20261007-v3.mp4

Both exports are **1920×1080 H.264/AAC**, with 30 English caption cues for the demo and 20 for the pitch. Both passed complete decode with zero errors and visual review. They use generic synthesized narration reused from V2 over edited October 7 production captures; they are not uninterrupted recordings or recordings of the founder speaking. [Validation](docs/reports/signalpass-video-validation-2026-10-07.json), [edit provenance](docs/reports/signalpass-video-edit-notes-2026-10-07.md) and [media manifest](docs/reports/signalpass-media-manifest-2026-10-07.json) record the actual outputs.

The stable watch page now plays V3. Existing V2 direct URLs were preserved, so previously shared links remain available. The portal's dedicated video fields have not been updated in this signed-out session.

## Judge access instructions — ready to paste into the portal

Start with the guided fictional story at https://signalpass.coderbojack.space/v4/walkthrough.html. No wallet is needed. It uses prepared sample text entirely within the page. Compare the evidence for Bob's offer, edit and review Alice's introduction, follow both sides of the conversation, and choose contact sharing independently. Back rewinds later sample actions; restart or reload clears edits.

Watch the production demonstration at https://signalpass.coderbojack.space/media/signalpass-demo-20261003.html. The October 7 recording uses real hosted inference and two fictional accounts, with no bond. Historical Monad transactions are presented separately. The evidence page at https://signalpass.coderbojack.space/v4/evidence.html explains the checks and their limitations.

For live use, open https://signalpass.coderbojack.space/assistant?demo=0 and sign in with an injected Ethereum wallet. The sign-in signature creates a session and does not request payment. Users do not need their own AI key. Matching depends on approved, public profiles whose owners have opted into matching; fictional rehearsal profiles were hidden after testing. An empty or unsuitable directory can correctly return no match.

A full live introduction needs two consenting participants with independent wallets. Describe a concrete goal, review the source quote, edit the private draft and confirm delivery separately. **Send without a bond** is preselected for a first run; leave it selected to avoid payment. The recipient can accept, ask for context or decline; each participant then controls their own contact disclosure.

Hosted discovery, refinement and drafting use TokenRhythm within **20 inference attempts per account and 200 site-wide per UTC day**. Failed attempts count. These are request limits, not a promise of free provider billing or a monetary spend cap. Optional mainnet bonds require MON and gas; the recorded public transaction evidence can be inspected without making a transaction.

## Go-to-market and business hypothesis

Start with **one existing builder community**, with the organizer's permission, rather than asking unrelated strangers to populate a new network. Invite a small opt-in group with complementary current needs and offers. Each participant approves what becomes public and can leave the directory.

The initial workflow is deliberately assisted: collect one concrete need and one offer, help members complete their first introduction, and ask both sides whether the suggested person was relevant, whether the draft needed factual corrections and whether a useful conversation followed. Exclude test accounts from all adoption figures.

An organizer-facing paid community plan is a hypothesis. Before building more community administration or charging, ask an organizer whether this reduces the time they spend making introductions and whether they would run another cohort. No current partner, revenue, conversion rate, testimonial or real-user outcome is claimed.

## Source access and portal state

- **Public source:** https://github.com/huaigu/twingate. The owner changed visibility on October 12, and GitHub visibly confirmed Public. The earlier private-source instruction is superseded.
- An invitation was sent on October 3 to the organizer address `metropolis@hackathon.monad.xyz`, associated with `MonadMetropolis`. It was pending in the last verified record; today's acceptance status has not been checked.
- Making the repository public removes the previously recorded private-versus-public source conflict. This does not assert that every other eligibility condition has been independently re-audited.
- The last recorded primary track was **Social, Attention & Culture**. Unsupported Envio, Dynamic and Hunyuan bounty selections were removed in the earlier portal update. Do not claim new sponsor integrations.
- The last reported portal state was **Ready for judging**, still editable, using V2 material. The portal is signed out in today's session, so this local copy and the new media must still be saved and read back after access is restored.
- The previously recorded deadline was **October 13, 2026, 20:59 PDT**, equivalent to **October 14, 11:59 China time**. This is a prior portal observation, not a fresh deadline verification.

## Scope boundaries for every submission field

- Exact quotes are self-reported profile evidence, not verified qualifications or proof that every generated explanation is correct.
- The guided story is deterministic prepared content. The production recording uses live inference. The benchmark is a separate synthetic evaluation. Keep all three labels clear.
- Do not call fictional participants customers or count rehearsals as adoption.
- Contact information typed voluntarily into a message is part of that message. Profile contact options are not shared automatically on acceptance.
- Private records have participant access controls; SignalPass does not provide end-to-end encrypted chat or application-level encryption at rest.
- Hosted discovery/drafting, optional escrow bonds and a future sender-funded evaluation service are separate. Current manual bond review charges zero AI evaluation fee; gas still applies.
- Recipient inbox AI, direct OpenClaw/Hermes integration, Dynamic, live Envio indexing, Nansen verification and Hunyuan generation are not shipped claims.

## Repository evidence

- [October 7 production rehearsal](docs/reports/signalpass-public-journey-2026-10-07.json)
- [October 7 read-only receipt recheck](docs/reports/signalpass-mainnet-receipt-recheck-2026-10-07.json)
- [October 3 original mainnet report](docs/reports/signalpass-mainnet-deployment-2026-10-03.md)
- [Matching evaluation methodology](docs/MATCHING_EVALUATION.md)
- [Completed hosted evaluation](docs/reports/matching-live-2026-10-07/report.md) and [case-level results](docs/reports/matching-live-2026-10-07/results.json)
- [Baseline-only local validation](docs/reports/matching-validation-2026-10-07/report.md)
- [Release verification report](docs/reports/signalpass-judge-release-2026-10-07.md)
- [Deployment evidence](docs/reports/signalpass-deployment-2026-10-07.json) and [public release QA](docs/reports/signalpass-release-qa-2026-10-07.json)
- [Release and submission checklist](docs/HACKATHON_SUBMISSION_CHECKLIST.md)
- [Current video briefs](docs/HACKATHON_VIDEO_BRIEFS.md)

