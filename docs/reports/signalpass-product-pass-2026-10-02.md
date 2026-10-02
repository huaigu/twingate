# SignalPass product pass — October 2, 2026

## Outcome

The pre-deployment product pass joins the hosted assistant to a complete introduction journey: preserve a goal through setup, understand the evidence for a person, refine the goal, review a private draft, confirm delivery, receive a decision and explicitly choose how to continue. It retains the paper, portrait and indigo visual direction.

## Changes

- **Uninterrupted setup:** tab-scoped, time-bounded goal and selected-person state survives verified sign-in and approved-profile setup. Returns use a fixed application route, not user-controlled URLs. State is owner checked, cleared on logout/account changes and never restores inference consent or triggers generation automatically.
- **Clear product navigation and privacy:** My agent consistently opens `/assistant`; `/agent` is Profile & privacy. Public interests and provider context are described accurately. “Appear in suggestions” controls candidacy without blocking the user's own search. Profile setup collects required fields in one reviewable form.
- **Why you two:** the original goal, recipient's public offer, consented sender offer and a suggested first step are shown with their sources. Exact profile quotes remain visible; interest-only evidence is explicitly exploratory. None of these fields asserts mutual interest or verified expertise.
- **Refinement:** up to three owned, bounded clarification answers retain the original goal and influence the candidate shortlist. Empty eligible pools make no model call and consume no inference quota.
- **Recovery and draft quality:** timeout, busy-provider and incomplete-output categories have deliberate retry/manual paths. Earlier results and drafts survive a failed replacement. A conservative guard rejects recognizable unsupported personal claims. A regression ensures a supplied “Built…” achievement can become “I built…” without allowing invented achievements or stripping negation.
- **After acceptance:** private connection routes let each party review and share one email, contact URL or scheduling URL, replace it or remove it. No contact is disclosed merely by accepting. Contacts stay outside public profiles, ordinary receipt/inbox projections and model context. Only the accepted introduction's participants can access the dedicated endpoint.
- **Demo preparation:** the product guide covers the full journey and a small consenting first-community plan. Six fictional evaluation profiles and five comparative cases are isolated from production data. No invitations or messages were sent to real people.

## Verification

| Check | Result |
| --- | --- |
| API tests, including signed two-person journey | 57 passed |
| Node flow and wallet-quote regressions | 17 passed |
| Assistant Chromium scenarios | 23 passed |
| Accepted-contact Chromium scenarios | 10 passed |
| API TypeScript check | Passed |
| Production Next build and type validation | Passed |
| Diff whitespace check | Passed |

The API suite, focused browser suites and production build are run against the resulting source. Browser tests use the actual HTML/JavaScript with explicitly mocked HTTP and wallet responses; they are not evidence of fresh live inference or a public deployment. The HTTP journey uses real signed sessions, real routes and persistent SQLite, with inference alone injected.

The real HTTP journey covers private draft → sender edits → confirmed offchain delivery → identical recipient receipt → acceptance → empty contact state → explicit contact share → counterpart read → process restart → contact removal. It verifies that contact information never appears in ordinary receipt, inbox or public-profile responses.

Desktop (1440px) and mobile (390px) screenshots were captured and visually inspected for assistant recommendations and the accepted-contact flow. The browser checks also cover keyboard interaction, error focus, no horizontal overflow, unsafe-text rendering, sign-in/profile continuation, cross-account isolation, refinement failure, contact review, duplicate-submit prevention and session expiry. Test screenshots omit unrelated bitmap assets; they are regression evidence for these flows, not a complete site-wide visual audit.

## Limits and launch work

This pass does not establish live model ranking quality. The synthetic multi-candidate tests validate contracts and evidence handling; a current provider run still needs semantic inspection before the public demo. The claim guard is intentionally limited, may reject some supported paraphrases, and is not a general fact checker. People still review their message.

Private data uses the existing session access controls and SQLite persistence, not application-level encryption at rest. Removing a shared contact affects subsequent reads; it cannot erase details the counterpart already copied.

Public hosting, funded Monad testnet deployment and recruitment of real consenting participants remain separate launch work. No deployment, contract change, real outreach, video recording or new live-provider charge is part of this product pass. The previous local-chain verification remains documented in the deployment-readiness report.

See [the product demo and first-community guide](../HACKATHON_PRODUCT_DEMO.md), [hosted-agent behavior and API](../HOSTED_AGENT.md), and [deployment guide](../DEPLOYMENT.md).
