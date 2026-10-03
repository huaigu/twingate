# SignalPass submission checklist

Updated: **2026-10-03**. Track: **Social, Attention & Culture**. Live product: [signalpass.coderbojack.space](https://signalpass.coderbojack.space/).

This checklist tracks the remaining submission work. A saved project update is not a final submission. Video recording stays with the project owner, as requested; no placeholder video links should be submitted. **Portal deadline: October 13, 2026 at 20:59 PDT (America/Los_Angeles), equivalent to October 14 at 03:59 UTC / 11:59 Asia/Shanghai.**

**Portal progress confirmed on October 3: 4 of 5 required groups complete; only the video group remains.** The portal showed **Progress saved** and **Last saved October 3, 12:28 UTC**. A full portal reload confirmed the logo, GTM text, dedicated live URL, judge instructions and removed bounty selections. The instructions now include four public mainnet transaction links and the private-repository access warning. The Social track was retained. This is not final-submission confirmation or evidence that real users have joined.

**Still required before a judge-ready final entry:** the owner's two videos, consenting live profiles for a meaningful matching walkthrough, and judge access to the code. The GitHub API confirms `huaigu/twingate` is private. The portal accepts a public repository **or access shared with `metropolis@hackathon.monad.xyz`**; code-access arrangements remain unresolved. The owner must choose the permitted route before visibility is changed or access is granted. Repository links alone do not give judges access to the code or its evidence reports.

## Completed evidence

- [x] **Public product deployed.** Hosted Personal Agent, profiles, introduction review, recipient decisions and explicit contact sharing are implemented. Current claims are in [submission copy](../SIGNALPASS_SUBMISSION_COPY.md).
- [x] **Hosted AI activated and checked — October 3.** TokenRhythm `deepseek-v4-flash`; discovery, clarification and drafting passed publicly. Sessions, drafts, history and quota survived an actual API service restart. Limits are 20 attempts per account and 200 site-wide per UTC day, including failures. [Evidence](reports/signalpass-tokenrhythm-2026-10-03.md).
- [x] **Full public no-bond rehearsal — October 3.** Two fictional accounts completed real AI → edited introduction → separate send confirmation → acceptance → explicitly shared contact options. The mobile receipt passed at 390 pixels. [Evidence](reports/signalpass-public-journey-2026-10-03.md).
- [x] **Separate Monad Mainnet settlement — October 3.** Project-owned wallets registered profiles, locked bonds, accepted/declined and received full bond refunds on chain 143. Expiry remains locally tested only. [Transactions](reports/signalpass-mainnet-deployment-2026-10-03.md).
- [x] **Current README, submission copy, Agent Surface and VPS documentation updated.** Historical reports remain dated records, not statements of the latest deployment.
- [x] **Public status page, navigation and description layout corrected and deployed — October 3, 13:05:40 UTC.** [The live status page](https://signalpass.coderbojack.space/status) reflects the hosted agent, mainnet bonds and remaining limits, with public navigation and wrapping descriptions. Full Next build/typecheck, public HTML/RSC, all 11 referenced assets and API readiness checks passed; a 1,348-pixel desktop browser check confirmed readable text and no horizontal overflow. API/tunnel processes and public asset hashes were unchanged. [Deployment evidence](reports/signalpass-submission-readiness-2026-10-03.md).
- [x] **Portal materials saved — October 3, 12:28 UTC.** Uploaded the unchanged canonical favicon rendered as a 1024 × 1024 PNG, 31,897 bytes: [logo asset](assets/signalpass-logo-1024.png). Saved GTM, the dedicated live URL and judge instructions; Envio, Dynamic and Hunyuan selections removed because no eligible integration evidence exists. Portal marks bounties optional and confirms **Progress saved**.

## Do these in order

| Order | Task | Owner | Completion evidence / status |
| --- | --- | --- | --- |
| 1 | Upload the SignalPass logo. | Operator / assistant | **Done; portal reload verified the October 3, 12:28 UTC save.** Canonical favicon rendered without redesign as 1024 × 1024 PNG, 31,897 bytes. Meets the portal's 500-pixel minimum, 4-million-pixel maximum and under-2-MB limit. |
| 2 | Save the live URL, current tagline/description, acquisition strategy and judge instructions. | Operator / assistant | **Done; portal reload verified the October 3, 12:28 UTC save.** GTM describes planned consenting recruitment, with no traction claim; it omits widget distribution. Dedicated live URL and judge instructions include offline `/discover?demo=1`, live `/assistant?demo=0` and verification evidence. Portal limits: tagline 200 characters; description, GTM and instructions 8,000 each. |
| 3 | Make the judging path usable. | Project owner + consenting participants; operator checks access | **Pending profiles and code access.** Arrange at least two real consenting people with independent wallets and approved profiles; the recipient must be public, open and matching-enabled. `huaigu/twingate` is verified private. Owner chooses public visibility or the portal's sharing route for `metropolis@hackathon.monad.xyz`; confirm access before final submission. No visibility change or judge invitation has been made by this checklist. |
| 4 | Resolve the selected sponsor entries. | Project owner / operator | **Done — October 3.** Removed Envio, Dynamic and Hunyuan selections; portal confirms bounties are optional. Social, Attention & Culture remains selected. Reconsider a bounty only if the implementation and evidence gates below are met. |
| 5 | Record and upload the technical demonstration. | **Project owner — will record later** | **Pending.** Maximum **3 minutes**; aim for 2:50. Follow [the technical brief](HACKATHON_VIDEO_BRIEFS.md#technical-demonstration--target-250-maximum-300). Verify duration, sound, legibility and judge access to the final link. |
| 6 | Record and upload the pitch. | **Project owner — will record later** | **Pending.** Maximum **2 minutes**; aim for 1:55. Follow [the pitch brief](HACKATHON_VIDEO_BRIEFS.md#pitch--target-155-maximum-200). Keep product vision, present proof and planned acquisition distinct. |
| 7 | Review the complete saved entry as a judge. | Operator / assistant + project owner | **Saved fields verified after a full reload; final access review pending.** Verify code and evidence-report access through the chosen route, then open both video links without the uploader's session. Confirm consenting profile availability and included AI usage. Finish before the stated October 13, 20:59 PDT deadline. |
| 8 | Submit the final entry and record confirmation. | Project owner / authorized operator | **Not submitted by this checklist.** Execute only when required fields, accessible videos, code access and sponsor claims are ready. Preserve the portal's actual submission status and timestamp; saving a draft or progress update does not complete this step. |

Completed portal actions above reflect **Progress saved**, the 12:28 UTC timestamp and a full reload confirming the saved fields, logo and empty bounty selection. The 4/5 indicator does not resolve the private-repository access blocker or create a live community.

## Next product validation: real participants

- [ ] **Owner: project owner.** Approach a target group of **8–12 real people** with complementary needs: Monad builders, designers and usability researchers. This is a recruitment target, not a user count.
- [ ] Ask each person to approve their profile and explicitly choose whether it may be public and used for matching. Arrange at least two consenting participants for the first real introduction; do not republish private QA records as community members.
- [ ] With their agreement, record whether the recommendation helped, whether the draft needed factual corrections and whether they chose to continue the conversation. Keep real outcomes separate from synthetic rehearsal results.

**No outreach messages have been sent as part of this checklist.** The owner chooses participants and channels; no contacts, partnerships or commitments are assumed.

## Sponsor go / no-go

These are project engineering gates, **not a substitute for each sponsor's official bounty rules**. A selected checkbox, SDK dependency, configuration skeleton or unrelated AI provider does not prove an integration.

| Optional future sponsor | Current status | Go only when | Otherwise |
| --- | --- | --- | --- |
| Envio | **Removed from selections.** Indexer code/aggregation tests exist; no live integrated index is demonstrated. | Provide a HyperSync token for the proposed integration, confirm supported network and current bounty rules, consume real contract events in the product, and retain reproducible live proof. | Keep unselected without eligible runtime evidence. |
| Dynamic | **Removed from selections.** Injected-wallet SIWE works; Dynamic embedded wallets are not integrated. | Provide a Dynamic environment ID, implement a single wallet adapter connected to the existing confirmation flow, verify real login/signing and recovery, and meet the official bounty conditions. | Do not describe injected-wallet sign-in as Dynamic. |
| Tencent Hunyuan | **Removed from selections.** Remains unconfigured by prior product decision; TokenRhythm is active. | The owner chooses to revisit that decision, obtains account/model access, demonstrates the actual Hunyuan feature and completes the bounty article with evidence of the required usage. | TokenRhythm and existing illustrations do not qualify as Hunyuan proof; keep unselected. |

## Judge access and truthful presentation

- Live AI starts at [the hosted assistant](https://signalpass.coderbojack.space/assistant?demo=0). Users sign with their own injected Ethereum wallet; sign-in itself is not a payment. Use **Send without a bond** for the first complete journey.
- Live matching needs approved, public, opted-in people. The empty directory after QA cleanup is not a model outage; arrange consenting profiles before asking judges to try matching.
- [Offline sample discovery](https://signalpass.coderbojack.space/discover?demo=1) is explicitly illustrative: no live AI generation, external delivery or payment. [Open the live assistant](https://signalpass.coderbojack.space/assistant?demo=0) to exit sample mode. These are the paths included in the saved judge instructions. Sample mode is a walkthrough fallback, not deployment proof.
- Public browser rehearsal used fictional participants and no bond. Mainnet lock/refund evidence is separate. There are no community outcome or traction figures yet.
- Mainnet funds and gas are real. Judges can inspect the recorded transactions without making a transaction. Expiry, retail-wallet compatibility and recommendation quality are not established by the synthetic browser rehearsal.
- Final submission still needs the owner's two videos and judge access to the private code/evidence, plus consenting profiles for a meaningful live matching visit. Preparation of these briefs does not satisfy either video field or the access requirement.
