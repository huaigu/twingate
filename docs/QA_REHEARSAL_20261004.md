# Two-person rehearsal — 4 October 2026

This was a synthetic production rehearsal, not real-user traction or validation of broad matching quality.

## Scenario and result

Two new, unfunded fictional accounts used the public HTTPS API with separate SIWE sessions. Alice wanted feedback on a Monad wallet onboarding prototype and offered frontend prototyping. Bob explicitly offered reviews of wallet connection and first approval screens.

The hosted TokenRhythm `deepseek-v4-flash` provider recommended Bob with exact public-profile quotes. Alice obtained a private draft, edited its next step and explicitly submitted one offchain introduction. Bob asked a question, Alice explicitly replied, and Bob accepted. Neither acceptance nor drafting disclosed contacts. Each participant then explicitly shared a fictional example.com contact; fresh authenticated reads confirmed both shares.

The unrelated antique-instrument-restoration request returned no matches. Making Bob private removed him from discovery; the resulting empty directory did not consume an AI request. Unauthenticated receipt/contact reads were denied, and Bob could not read Alice's private draft.

- Production rehearsal: **passed**.
- Actual model calls: **3**, across **4** agent endpoint requests.
- Introductions submitted: **1**, offchain and without a bond.
- Wallet transactions: **0**. Service restarts during the rehearsal: **0**.
- Baseline source: `6a0493e950f872e29acb62c1f140469ad64d0d17`.
- Window: 08:29:04–08:29:14 UTC.

Cleanup made both profiles private and disabled matching, removed both contact shares, cleared both private AI histories, logged out both sessions and removed the temporary session journal. The public directory returned to zero profiles. Private profile records and the accepted synthetic introduction remain; this is not a claim that all test account data was deleted.

A separate signed-out browser walkthrough covered the explicitly fictional, device-local sample: discovery, edited composition, review/confirmation, recipient context question and acceptance. It did not test live wallet UI authentication or the live contact-preview interface.

## Improvements from the review

- Homepage identifies SignalPass as an AI introduction assistant and separates the live wallet-sign-in path from a clearly labelled wallet-free fictional sample.
- The signed-out assistant offers that sample directly.
- After a completed AI search, people can add context even if the model returned no follow-up question. The original goal and current profile permission are preserved. Every refinement requires an explicit submission, with the existing three-answer limit.
- Empty directories remain honest and do not offer a pointless AI refinement. At the refinement limit, people can review or change their goal without automatically making a new request.

Validation: eight focused Node/DOM refinement tests and the existing 24 V4 flow/wallet-quote tests passed; assistant JavaScript syntax passed. This focused static-web change does not alter API or contract behavior.

## Follow-up quality questions

1. The model supplied a useful `canOffer` quote but put the fictional-rehearsal disclaimer first. The API's primary evidence currently picks the first non-interest quote. Improve evidence prioritization using a varied evaluation set, including real, consenting profiles.
2. The unrelated no-match response correctly declined the match, but asked about geography as though more experts could be searched. Keep follow-up wording explicitly within the opted-in directory; evaluate model behavior before claiming this is solved.
3. Recruit a small consenting pilot. The production directory was empty before and after this rehearsal. Synthetic success demonstrates the workflow, not that real participants find the matches useful.
