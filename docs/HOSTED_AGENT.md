# SignalPass-hosted Personal Agent

SignalPass supplies the model connection and private workspace. Users sign in, describe a goal, consider recommendations and review an introduction before sending. They do not install an agent host or supply an API key. OpenClaw and Hermes remain optional future clients.

## Implemented scope

`/assistant` provides two bounded operations: discover people and draft an introduction. It is not an autonomous background agent. The first adapter uses OpenAI Responses with strict structured output; `AgentModel` keeps the workflow independent of that provider.

1. A signed-in user enters a goal. Using their approved profile is an unchecked, explicit option.
2. The server filters public, approved profiles that allow matching and are open to introductions, excluding the requester. Goal terms select at most 40 candidates; the model can recommend at most three of those supplied handles. This is a bounded shortlist, not an exhaustive semantic search.
3. Each recommendation includes a reason, caveat and exact public-profile quote. The server validates the handle and quote against the supplied source. Quotes are traceable; generated interpretations and self-reported profile claims are not independently verified.
4. Drafting requires consent to use the sender's approved profile. The model writes the four Introduction Card fields and review notes.
5. The user opens the existing composer, edits the draft, independently chooses what profile context to share, reviews delivery and confirms sending. Existing wallet-bond confirmation remains in that flow. The model cannot send, accept, publish or spend.

Conversational profile creation, recipient inbox assistance, long-term memory, external host adapters, private-profile matching and source verification are not implemented by this change. Hunyuan remains unconfigured. Hosted discovery/drafting does not enable or charge an introduction evaluation fee.

## Server setup

Use Node >=22.13 and the repository's pinned pnpm version. Export the following in the API process environment; `.env` is not loaded automatically:

```sh
export SIGNALPASS_AGENT_PROVIDER=openai
export SIGNALPASS_AGENT_MODEL='<model supporting Responses and strict JSON schema>'
# Set SIGNALPASS_AGENT_API_KEY using your deployment's secret store.
pnpm dev
```

Never put the key in frontend variables, source control or the user interface. `OPENAI_API_KEY` is deliberately not reused. A missing provider leaves the feature visibly disabled; an explicitly selected provider with missing/invalid settings fails API startup with a sanitized configuration error. No error substitutes simulated recommendations.

| Setting | Default / constraint |
| --- | --- |
| `SIGNALPASS_AGENT_PROVIDER` | Empty disables AI; currently accepts `openai`. |
| `SIGNALPASS_AGENT_API_KEY` | Required dedicated server-side key when enabled. |
| `SIGNALPASS_AGENT_MODEL` | Required explicit model; select one with compatible structured output. |
| `SIGNALPASS_AGENT_BASE_URL` | `https://api.openai.com/v1`; HTTPS required except HTTP loopback for local fixtures. A custom endpoint receives the configured key and authorized inputs, so only use an operator-trusted endpoint. |
| `SIGNALPASS_AGENT_DAILY_USER_LIMIT` | 20 inference attempts per account per UTC day; allowed 1–1000. |
| `SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT` | 200 inference attempts per UTC day across accounts; allowed 1–10000. |

Attempts include provider failures. SQLite reserves quota before inference; clearing history and restarting the API do not reset it. Inference is limited to one concurrent call per account and two globally. Leases expire after 120 seconds if the process dies. These are usage bounds, not a dollar spending ceiling; configure a provider project budget as appropriate for deployment. Wallet accounts are not unique-human identities.

The provider has a 15-second deadline, a 2,400 output-token ceiling, a 128 KiB response cap and no automatic retries. Refusals, incomplete responses, invalid JSON, unsupported handles, fabricated quotes and schema violations fail closed. Test model compatibility with the exact schema before a public demo.

## Data and consent

All `/agent/*` endpoints require the existing verified SIWE session; writes also require same-origin and CSRF checks. The browser uses `/api/agent/*` through the existing proxy. No test authentication bypass is introduced.

Model input contains the goal and a minimal profile projection: handle, display name, building, can offer, wants to meet and interests. Candidate data must be public and matching-enabled. The user's own approved profile is included only with consent; its visibility need not be public. Wallet addresses, imported source links, private source text, inbox messages and gate policy internals are not sent. Treat every submitted field as untrusted data. The model receives no executable tools.

Runs and drafts belong to the signed-in account in the existing SQLite database. History is capped at 50 combined records per account and pruned on activity for records older than seven days; this is not a scheduled deletion guarantee for inactive accounts. Drafts expire after 30 minutes. Reads and writes recheck profile versions and recipient eligibility. Clearing history deletes the account's saved runs/drafts, blocks in-flight requests from restoring them, and clears agent-derived local compose drafts on that browser. It does not erase sent introductions or reset usage.

The database uses access controls, not application-level encryption at rest. Draft edits in the composer also use the existing account-scoped browser storage. The provider request uses `store:false`; this is not a promise of zero provider retention. Review the chosen provider's data policy for deployment. The feature does not provide end-to-end encryption.

## API surface

| Method and path | Purpose |
| --- | --- |
| `GET /agent/status` | Availability, provider/model and remaining included requests. |
| `GET /agent/workspace` | Account's recent runs and currently valid drafts. |
| `POST /agent/discover` | `{goal, useProfile}` → a run with recommendations and pool counts. |
| `POST /agent/draft` | `{runId, recipientHandle, useProfile}` → a private four-field draft. The Web client always sends current explicit consent. |
| `GET /agent/drafts/:id` | Fetch an owned, unexpired draft with current profile versions. |
| `POST /agent/history/clear` | Delete the current account's history without resetting quota. |

## Verification and demo acceptance

The API test suite includes signed-session privacy/consent, output validation, stale profiles, expiry, ownership, persistent quotas, concurrent reservations, in-flight deletion and bounded history. Provider tests use injected transport and loopback fixtures: structured-output requests, reasoning items before answers, failure sanitization, refusal, incomplete output, timeout, size limits and configuration. These prove implementation behavior without paid inference.

```sh
pnpm --filter @signalpass/api test
pnpm -r typecheck
pnpm v4:flow:test
pnpm exec playwright install chromium
pnpm agent:ui:test
```

The browser suite serves the actual V4 pages with mocked HTTP responses and stops at the user-confirmed delivery request. It verifies desktop/mobile behavior and failure states without claiming real model output, real wallet sign-in or real delivery. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an installed Chromium; screenshots default to `.run/agent-ui-qa`. Existing bitmap artwork is excluded from this targeted test.

Before claiming a live model demonstration:

1. Configure the dedicated server key and a compatible model. Confirm `/assistant` identifies the provider and available quota.
2. Use two separately signed-in, consenting accounts with approved profiles. Ensure the intended candidate is public, open and matching-enabled.
3. Enter a real goal. Inspect the returned reason, caveat and source quote; verify profile consent is opt-in and the result corresponds to actual published context.
4. Prepare the draft, edit it in the composer and confirm nothing reaches the recipient before the final send. Verify the recipient receives the reviewed wording only after confirmation.
5. Record provider/model, date and measured behavior without exposing the key or private context. Any chain segment needs its own public-network transaction evidence.

No live paid inference or public deployment is claimed from fixture tests. OpenAI adapter references: [Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses) and [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
