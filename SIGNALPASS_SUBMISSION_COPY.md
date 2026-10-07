# SignalPass submission copy

Prepared **October 7, 2026** as a **local release candidate, not a deployed update**. This file contains reviewer-ready copy; editing it does **not** update the submission portal. Today's portal session is signed out. The last reported portal state was **Ready for judging**, with editable entry fields and the V2 video links. Recheck the saved entry after signing in before claiming it contains this release.

**Release blocker:** automatic approval review rejected transfer of the private benchmark script to the verified SignalPass VPS and requires explicit owner permission for that source payload and destination. That transfer and hosted evaluation did not proceed. Deployment and new public media verification remain pending; no alternative transfer route is authorized by this document. The October 7 production rehearsal and historical receipt recheck below were completed separately.

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

Ordinary introductions can use the no-bond path. A sender can also explicitly approve an optional refundable commitment held by a contract on **Monad Mainnet, chain 143**. Acceptance and decline both return the full bond. An unanswered request requires a resolution transaction after expiry; it is not automatically refunded by a timer. Network gas is separate and is not returned.

The contract gives participants inspectable escrow and settlement rather than only an application balance. Monad is the initial community and deployment ecosystem. Project-owned wallets verified mainnet locks and full refunds on acceptance and decline on October 3; all four relevant transaction receipts were read again successfully on October 7. Mainnet expiry has not been exercised; the expiry path has local test coverage.

These tests establish an implementation on Monad. They do not establish reduced spam, increased reply rates, unique throughput requirements, or cheaper settlement than other chains. The deliberately tiny **0.000075 MON** test bonds were smaller than their transaction gas costs. Bond economics remain a product question to validate, not a proven advantage.

## Evidence available for review

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| October 7 production rehearsal | Two independently signed-in fictional accounts completed live AI discovery and drafting, human editing, separately approved no-bond delivery, acceptance, independent contact sharing and refresh persistence. | Real customer outcomes, bond settlement within that same introduction, or real-phone wallet compatibility. |
| Matching evaluation preparation and local baseline | Twenty frozen fictional cases passed local schema, scoring and production-route compatibility checks; the runner passed strict TypeScript validation. BM25 baseline: 15/20 strict successes and 2/4 correct abstentions. Zero hosted benchmark calls. | Hosted matching quality, an AI-versus-baseline comparison, independent human assessment, population-level quality or adoption. Hosted results remain pending below. |
| Historical mainnet receipts | Two locks and two successful refund decisions on acceptance/decline; all four receipts rechecked October 7. | Mainnet expiry, refund of gas, current dollar costs, or measured end-to-end confirmation latency. |
| Guided fictional story | A wallet-free way to understand match evidence, review, delivery, recipient decisions and separate contact choices. | Live inference, real delivery, real transactions or observed usage. |

<!-- BENCHMARK_PENDING_START -->
**BENCHMARK_PENDING:** The hosted matching evaluation has not run. Publish no hosted score or AI-versus-baseline quality claim until its complete results and methodology are checked. The [local baseline-only report](docs/reports/matching-validation-2026-10-07/report.md) records 15/20 strict successes, 2/4 correct abstentions and zero operational failures; these are keyword results, not AI results. Replace this block after the hosted run with exact counts, failures and a link to the frozen report; retain the synthetic-data limitations.
<!-- BENCHMARK_PENDING_END -->

The October 7 rehearsal used **2 hosted AI calls and 0 wallet transactions**. Observed discovery and draft response times were **3.141 seconds** and **3.568 seconds** in that run. The exact edited message reached the recipient; acceptance and both contact decisions survived refresh. The accepted receipt fit a **390px browser viewport** without horizontal overflow. Controlled injected wallets were used for sign-in; this was not a physical-phone wallet handoff test. Cleanup hid the test profiles, removed shared contacts and signed out the sessions.

## Product and reviewer links

- Live product: https://signalpass.coderbojack.space/
- Live assistant: https://signalpass.coderbojack.space/assistant?demo=0
- Guided fictional story, prepared for this release: https://signalpass.coderbojack.space/v4/walkthrough.html
- Public evidence page, prepared for this release: https://signalpass.coderbojack.space/v4/evidence.html
- Stable video watch page: https://signalpass.coderbojack.space/media/signalpass-demo-20261003.html
- Source, access required: https://github.com/huaigu/twingate

**V3 exports are completed, validated and saved; publication and public playback verification remain pending:**

- Technical demo, **172.834 seconds (2:53)**: https://signalpass.coderbojack.space/media/signalpass-live-demo-20261007-v3.mp4
- Product pitch, **111.467 seconds (1:51)**: https://signalpass.coderbojack.space/media/signalpass-product-pitch-20261007-v3.mp4

Both exports are **1920×1080 H.264/AAC**, with 30 English caption cues for the demo and 20 for the pitch. Both passed complete decode with zero errors and visual review. They use generic synthesized narration reused from V2 over edited October 7 production captures; they are not uninterrupted recordings or recordings of the founder speaking. [Validation](docs/reports/signalpass-video-validation-2026-10-07.json), [edit provenance](docs/reports/signalpass-video-edit-notes-2026-10-07.md) and [media manifest](docs/reports/signalpass-media-manifest-2026-10-07.json) record the actual outputs.

The existing V2 films remain the last confirmed published versions until V3 publishing is verified. Keep the stable watch-page URL; replace its video sources and verify public playback after publication is authorized.

## Judge access instructions — ready to paste after release verification

Start with the guided fictional story at https://signalpass.coderbojack.space/v4/walkthrough.html. No wallet is needed. It uses prepared sample text entirely within the page. Compare the evidence for Bob's offer, edit and review Alice's introduction, follow both sides of the conversation, and choose contact sharing independently. Back rewinds later sample actions; restart or reload clears edits.

Watch the production demonstration at https://signalpass.coderbojack.space/media/signalpass-demo-20261003.html. The October 7 recording uses real hosted inference and two fictional accounts, with no bond. Historical Monad transactions are presented separately. The evidence page at https://signalpass.coderbojack.space/v4/evidence.html explains the checks and their limitations.

For live use, open https://signalpass.coderbojack.space/assistant?demo=0 and sign in with an injected Ethereum wallet. The sign-in signature creates a session and does not request payment. Users do not need their own AI key. Matching depends on approved, public profiles whose owners have opted into matching; fictional rehearsal profiles were hidden after testing. An empty or unsuitable directory can correctly return no match.

A full live introduction needs two consenting participants with independent wallets. Describe a concrete goal, review the source quote, edit the private draft and confirm delivery separately. Choose **Send without a bond** for a first run. The recipient can accept, ask for context or decline; each participant then controls their own contact disclosure.

Hosted discovery, refinement and drafting use TokenRhythm within **20 inference attempts per account and 200 site-wide per UTC day**. Failed attempts count. These are request limits, not a promise of free provider billing or a monetary spend cap. Optional mainnet bonds require MON and gas; the recorded public transaction evidence can be inspected without making a transaction.

## Go-to-market and business hypothesis

Start with **one existing builder community**, with the organizer's permission, rather than asking unrelated strangers to populate a new network. Invite a small opt-in group with complementary current needs and offers. Each participant approves what becomes public and can leave the directory.

The initial workflow is deliberately assisted: collect one concrete need and one offer, help members complete their first introduction, and ask both sides whether the suggested person was relevant, whether the draft needed factual corrections and whether a useful conversation followed. Exclude test accounts from all adoption figures.

An organizer-facing paid community plan is a hypothesis. Before building more community administration or charging, ask an organizer whether this reduces the time they spend making introductions and whether they would run another cohort. No current partner, revenue, conversion rate, testimonial or real-user outcome is claimed.

## Source access and portal state

- Keep **huaigu/twingate private**, as directed by the owner. Do not change repository visibility or invitations as part of this release.
- An invitation was sent on October 3 to the organizer address `metropolis@hackathon.monad.xyz`, associated with `MonadMetropolis`. It was pending in the last verified record; today's acceptance status has not been checked.
- The earlier review found a conflict between the form's private-sharing route and Rules v3.0 §§4.1 and 7.2 requiring public source. Written organizer clarification remains unresolved. Sending an invitation does not resolve eligibility.
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
- [Baseline-only local validation](docs/reports/matching-validation-2026-10-07/report.md)
- [Release candidate verification report](docs/reports/signalpass-judge-release-2026-10-07.md)
- [Release and submission checklist](docs/HACKATHON_SUBMISSION_CHECKLIST.md)
- [Current video briefs](docs/HACKATHON_VIDEO_BRIEFS.md)
