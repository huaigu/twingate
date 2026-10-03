# SignalPass: product demonstration and first community

## The story

People worth knowing, with context. Describe a concrete collaboration goal, understand why a person might fit, review your introduction, and let the other person decide. SignalPass supplies the personal agent; users do not need their own model key, OpenClaw or Hermes installation.

The strongest demonstration is one useful connection with visible consent at each step. A source quote supports a recommendation, not a guarantee of expertise, availability or mutual interest. AI has no send, approval or payment tools.

## A focused three-minute product demonstration

Use two separate signed-in browser sessions and two consenting participants with approved profiles. The recipient must be public, open to introductions and opted into suggestions. Keep a third, different candidate available so the explanation has meaning. Label synthetic rehearsal accounts clearly; never present them as community traction.

QA cleanup left the live directory empty. Arrange consenting public profiles before a live matching demonstration; the offline `?demo=1` sample does not generate real AI suggestions or deliver introductions. For the submission videos, follow the timed [technical and pitch briefs](HACKATHON_VIDEO_BRIEFS.md); recording remains with the project owner.

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:20 | A specific goal in My agent. Sign in or finish profile setup if needed, then return to the same goal. | “I need feedback on a wallet onboarding prototype. I can offer frontend prototyping in return.” |
| 0:20–1:00 | Start discovery and show the honest waiting state. Inspect Why you two, source quotes and caveat. | “This person explicitly offers relevant help. This is a suggestion, and they still decide whether to respond.” |
| 1:00–1:25 | If the agent asks a useful clarification, answer it and refine. If it returns no question, inspect the source and caveat, then continue to the draft. | “I can narrow the request when needed.” A clarification retains the original goal; do not manufacture a question for the recording. |
| 1:25–2:05 | Explicitly allow your profile for drafting. Review the four fields and edit one sentence in the composer. | “The agent prepares private text. I decide what to say and what profile context to attach.” |
| 2:05–2:35 | Confirm the introduction. Switch to the actual recipient session, read the same wording and accept. | “Nothing reaches the other person before confirmation. They can also ask for context or decline.” |
| 2:35–3:00 | Open Continue conversation. Choose a contact or scheduling channel and explicitly share it. Refresh the other participant's view. | “Acceptance does not expose contact details. Each person chooses what to share, with this participant only.” |

AI timing varies. In the October 3 public browser rehearsal, TokenRhythm discovery took 2,937 ms and drafting 1,611 ms through the browser HTTP operations. The provider returned no clarification question. These are two observed calls, not a performance promise; earlier free-provider timings describe a different provider. Allow extra time for a live presentation or shorten the narration, label any shortened wait, and never represent saved results as a new inference. Save one genuine, reviewed run before recording as a visibly disclosed fallback. Do not refresh or repeat an uncertain send/payment. See [the public rehearsal report](reports/signalpass-public-journey-2026-10-03.md).

Keep the optional wallet-bond segment separate and name the actual network. The public product rehearsal used **Send without a bond**. Separate [Monad Mainnet (143) evidence](reports/signalpass-mainnet-deployment-2026-10-03.md) shows registration, lock, acceptance/decline and full bond refunds. Expiry has been verified locally only. Use the existing explorer links for a brief evidence segment; do not present the no-bond introduction as that mainnet transaction or imply a new funded transaction is necessary for recording.

## Rehearse recovery once

- **AI is unavailable or busy:** keep the existing results and draft; use the contextual retry or write manually. Retrying is a deliberate new attempt, never an automatic paid fallback.
- **No plausible fit:** explain the limited candidate pool, clarify the goal or browse profiles. No-match is a valid result, not a reason to fabricate a person.
- **A profile changed:** reopen its current profile and refresh the recommendation or draft. Old consent does not override a changed profile.
- **Wrong wallet:** switch back and sign in. Private goals, history and contact channels belong to the signed account.
- **Contact link removed:** it disappears from subsequent reads. Removal cannot erase a detail the participant already copied.

## Build a small consenting first community

Aim for 8–12 people with complementary offers and needs. These are recruitment targets, not a claim that users have joined.

| Role | Useful offer | Useful need |
| --- | --- | --- |
| Wallet or frontend builder | Working prototype and implementation help | Onboarding and recovery feedback |
| Product designer | Interaction review and prototypes | Real technical constraints to design around |
| Usability researcher | Test plans and interview feedback | A prototype and a concrete research question |
| Contract tester | Invariant and test-case feedback | A minimal reproducible contract example |
| Infrastructure engineer | Indexing or RPC debugging | Reproducible workloads and error reports |
| Community host | Small-session facilitation | Makers willing to exchange feedback |

Each participant should approve their own short profile, choose visibility and whether to appear in suggestions, and state one current offer and one concrete request. Use a shared link through an existing channel only after agreeing who to invite; the app does not send invitations automatically. Do not publish someone else's contact information or promise a meeting on their behalf.

For the first trial, ask whether the explanation helped the person judge the introduction, whether the draft needed factual corrections, and whether an accepted introduction led to a useful conversation. Count real attempts and outcomes with participants' agreement. Never use synthetic profiles or fixture test results as engagement statistics.

## Evaluate match quality honestly

[`agent-quality-cases.json`](../services/api/fixtures/agent-quality-cases.json) contains six explicitly fictional candidates and five cases: multiple plausible matches, reciprocal offers, weak shared interest, no match, and a clarifying answer. It is isolated from production seeding.

Automated fixtures verify validation, evidence extraction, privacy, refinement and failure behavior. They do not establish how well a live model ranks people. For an operator-run model review, use only this synthetic corpus or separately consented data, record the exact provider/model/date, and inspect:

1. Is every recommended person supplied and eligible?
2. Does the quoted source actually support the reason, beyond a shared keyword?
3. Is the contribution based on the approved sender profile, with no invented familiarity or credentials?
4. Does the clarification change the selection appropriately while retaining the original goal?
5. Does the model return no match when nobody offers the requested capability?

Do not convert this small qualitative review into a benchmark score or claim a live ranking test passed from mocked outputs.
