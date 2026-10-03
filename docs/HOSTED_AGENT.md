# SignalPass-hosted Personal Agent

SignalPass supplies the model connection and private workspace. Users sign in, describe a goal, consider recommendations and review an introduction before sending. They do not install an agent host or supply an API key. OpenClaw and Hermes remain optional future clients.

## Implemented scope

`/assistant` provides two bounded operations: discover people and draft an introduction. It is not an autonomous background agent. OpenAI and the free-model OpenRouter adapter use Responses; TokenRhythm uses Chat Completions. All request a strict JSON schema, and the application independently validates the returned fields and evidence. `AgentModel` keeps the workflow independent of the provider.

1. A signed-in user enters a goal. Using their approved profile is an unchecked, explicit option.
2. The server filters public, approved profiles that allow matching and are open to introductions, excluding the requester. Goal terms select at most 40 candidates; the model can recommend at most three of those supplied handles. This is a bounded shortlist, not an exhaustive semantic search.
3. Each recommendation includes a reason, caveat and exact public-profile quote. The Why you two card combines the original goal, a validated recipient quote, the sender’s exact approved offer when consented, and a clearly tentative first step. Interest-only evidence is marked exploratory. The server validates the handle and quote against the supplied source; it does not independently verify self-reported claims or mutual interest.
4. Answer the agent’s clarification to refine the same goal, up to three times. Each answer is bounded to 600 characters. The server resolves the original owned run and keeps its goal, applies clarification terms to the bounded shortlist and sends the answer history with the new request. An empty eligible pool makes no provider call and consumes no inference quota.
5. Drafting requires consent to use the sender's approved profile. The model writes the four Introduction Card fields and review notes.
6. The user opens the existing composer, edits the draft, independently chooses what profile context to share, reviews delivery and confirms sending. Existing wallet-bond confirmation remains in that flow. The model cannot send, accept, publish or spend.
7. After acceptance, either participant can explicitly share one email, contact link or scheduling link in the private receipt. Nothing is shared automatically and neither party can publish the other’s channel. Removal takes effect on future reads; it cannot undo a copy already made by the other participant.

Conversational profile creation, recipient inbox assistance, long-term memory, external host adapters, private-profile matching and source verification are not implemented by this change. Hunyuan remains unconfigured. Hosted discovery/drafting does not enable or charge an introduction evaluation fee.

## Server setup

Use Node >=22.13 and the repository's pinned pnpm version. Export the following in the API process environment; `.env` is not loaded automatically:

```sh
export SIGNALPASS_AGENT_PROVIDER=openai
export SIGNALPASS_AGENT_MODEL='<model supporting Responses and strict JSON schema>'
# Set SIGNALPASS_AGENT_API_KEY using your deployment's secret store.
pnpm dev
```

Never put the key in frontend variables, source control or the user interface. Ambient `OPENAI_API_KEY` and `OPENROUTER_API_KEY` are deliberately not reused. A missing provider leaves the feature visibly disabled; an explicitly selected provider with missing/invalid settings fails API startup with a sanitized configuration error. No error substitutes simulated recommendations.

| Setting | Default / constraint |
| --- | --- |
| `SIGNALPASS_AGENT_PROVIDER` | Empty disables AI; accepts `openai`, `openrouter` or `tokenrhythm`. |
| `SIGNALPASS_AGENT_API_KEY` | Dedicated server-side key; use this or the protected key-file setting. |
| `SIGNALPASS_AGENT_API_KEY_FILE` | Alternative regular, owner-only key file (0400/0600), owned by root or the API user, at most 8 KiB. Do not also set a nonempty direct key. A systemd credential mount is supported. |
| `SIGNALPASS_AGENT_MODEL` | Required explicit model supporting structured output. OpenRouter accepts only a named `vendor/model:free` variant; router aliases and paid models are rejected. |
| `SIGNALPASS_AGENT_BASE_URL` | Empty selects `https://api.openai.com/v1`, `https://openrouter.ai/api/v1` or `https://tokenrhythm.studio/v1`. HTTPS required except HTTP loopback for local fixtures. A custom endpoint receives the configured key and authorized inputs, so only use an operator-trusted endpoint. |
| `SIGNALPASS_AGENT_TIMEOUT_MS` | Optional integer 1000–60000; blank defaults to 15000 for OpenAI and 45000 for OpenRouter/TokenRhythm. |
| `SIGNALPASS_AGENT_DAILY_USER_LIMIT` | 20 inference attempts per account per UTC day; allowed 1–1000. |
| `SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT` | 200 inference attempts per UTC day across accounts; allowed 1–10000. |

Attempts include provider failures. SQLite reserves quota before inference; clearing history and restarting the API do not reset it. Inference is limited to one concurrent call per account and two globally. Leases expire after 120 seconds if the process dies. These are usage bounds, not a dollar spending ceiling; configure a provider project budget as appropriate for deployment. Wallet accounts are not unique-human identities.

The provider has a bounded deadline (15 seconds for OpenAI, 45 seconds for OpenRouter/TokenRhythm by default), a 2,400 output-token ceiling, a 128 KiB response cap and no automatic retries. Browser discovery/draft requests and the Next API proxy allow up to 65 seconds for a configured provider deadline of at most 60 seconds; other browser API requests retain their 18-second timeout. Refusals, incomplete responses, invalid JSON, unsupported handles, fabricated quotes and schema violations fail closed. Exact source quotes are checked. A conservative draft guard rejects recognizable unsupported familiarity, quantitative career/scale claims, credentials and completed achievements against supplied context. This closes the observed invented-familiarity case; it is not general fact verification, may reject some legitimate paraphrases, and does not cover every language or possible claim. The draft and composer still require the sender to review personal claims. Safe timeout, capacity and incomplete-response categories support deliberate retry or manual composition while preserving existing work; no raw provider response is returned. Test model compatibility with the exact schema before a public demo.

### Free OpenRouter acceptance test

Free models still need a legitimate OpenRouter account API key. On October 1, 2026, an authorized, transient test key completed live discovery and drafting with `dots-studio/dots-3-note-preview:free` through the actual signed-session API routes and fictional profiles. OpenRouter reported zero cost for both calls. The key was not saved in the repository or application configuration. See [the acceptance report](reports/signalpass-hosted-agent-live-2026-10-01.md) for timings, repeat-run failures and exact scope. There is no bundled or shared credential.

Select a named `:free` model whose current catalog entry supports structured output. The adapter requires parameter support, disables provider fallback, caps prompt/completion/request/image pricing at zero, and requests providers that do not collect input data. If no endpoint satisfies those constraints, the request fails; it never upgrades to paid inference or a random model. Free-provider availability varies: the acceptance session also observed a rate limit, a timeout and an incomplete response. Recheck the chosen model before a demo. Hunyuan is not selected or configured automatically.

```sh
export SIGNALPASS_AGENT_PROVIDER=openrouter
export SIGNALPASS_AGENT_MODEL='<vendor/model:free from the current catalog>'
unset SIGNALPASS_AGENT_BASE_URL
# Set SIGNALPASS_AGENT_API_KEY securely in this process, then:
pnpm agent:live:test
```

This command uses two temporary signed identities and fictional approved profiles in an in-memory database. It makes at most two model requests through the real discovery/draft routes, checks source evidence and ownership, and verifies that no introduction was sent. It does not load production profiles, use funded wallets or persist test history. Missing credentials, unsupported outputs and inference failures exit nonzero; fixture success cannot be mistaken for live success. It is a functional acceptance check, not a model-quality benchmark.

For clarification and SQLite persistence coverage, run `pnpm agent:live:persistence:test` with the same explicit test settings. It also supports the official TokenRhythm endpoint with `SIGNALPASS_AGENT_PROVIDER=tokenrhythm` and `SIGNALPASS_AGENT_MODEL=deepseek-v4-flash`. This separate check makes at most three provider calls using a fictional private sender and public opted-in recipient. It checks authentication, consent, exact evidence, ownership, API re-instantiation on the same temporary database, and history deletion without a quota reset. It removes the temporary database on completion or failure and never accesses the deployed database or chain. The [October 3 acceptance report](reports/signalpass-hosted-agent-live-2026-10-03.md) records the OpenRouter results. Passing either command does not enable AI on the public application.

### TokenRhythm setup

Use `SIGNALPASS_AGENT_PROVIDER=tokenrhythm`, `SIGNALPASS_AGENT_MODEL=deepseek-v4-flash` and the authorized server-side credential. The default endpoint is `https://tokenrhythm.studio/v1/chat/completions`. The adapter requests one non-streamed strict-schema result, caps output at 2,400 tokens, and rejects incomplete, refused, tool-call or malformed results without retries. It requests `store:false`; this is not a guarantee about provider retention or billing.

For the planned public pilot, the site-wide limit is 200 inference attempts per UTC day, with 20 per account. The application reserves attempts in SQLite before calling the provider, including failed calls. The quota is a request limit, not a financial spending cap. Profiles are included only under the consent and public-matching rules below. See the [TokenRhythm activation report](reports/signalpass-tokenrhythm-2026-10-03.md) for verification and deployment status.

References: [OpenRouter quickstart](https://openrouter.ai/docs/quickstart), [free variants](https://openrouter.ai/docs/guides/routing/model-variants/free), and [provider routing constraints](https://openrouter.ai/docs/guides/routing/provider-selection).

## Data and consent

All `/agent/*` endpoints require the existing verified SIWE session; writes also require same-origin and CSRF checks. The browser uses `/api/agent/*` through the existing proxy. No test authentication bypass is introduced.

Model input contains the goal and a minimal profile projection: handle, display name, building, can offer, wants to meet and interests. Candidate data must be public and matching-enabled. The user's own approved profile is included only with consent; its visibility need not be public. Wallet addresses, imported source links, private source text, inbox messages and gate policy internals are not sent. Treat every submitted field as untrusted data. The model receives no executable tools.

A pending goal and selected person are retained in tab-scoped browser session storage for onboarding return, bounded to 24 hours and the signed owner. Inference consent is not restored as an automatic approval. Logout or an account change clears return state.

Runs and drafts belong to the signed-in account in the existing SQLite database. History is capped at 50 combined records per account and pruned on activity for records older than seven days; this is not a scheduled deletion guarantee for inactive accounts. Drafts expire after 30 minutes. Reads and writes recheck profile versions and recipient eligibility. Clearing history deletes the account's saved runs/drafts, blocks in-flight requests from restoring them, and clears agent-derived local compose drafts on that browser. It does not erase sent introductions or reset usage.

Contact channels use a separate SQLite collection and never enter public profiles, ordinary receipt/inbox projections or model inputs. Accepted-introduction participants alone can read them through the private connection endpoint.

The database uses access controls, not application-level encryption at rest. Draft edits in the composer also use the existing account-scoped browser storage. The provider request uses `store:false`; this is not a promise of zero provider retention. Review the chosen provider's data policy for deployment. The feature does not provide end-to-end encryption.

## API surface

| Method and path | Purpose |
| --- | --- |
| `GET /agent/status` | Availability, provider/model and remaining included requests. |
| `GET /agent/workspace` | Account's recent runs and currently valid drafts. |
| `POST /agent/discover` | `{goal, useProfile}` or `{parentRunId, answer, useProfile}` → an owned run with original goal, bounded clarifications, evidence cards and pool counts. |
| `POST /agent/draft` | `{runId, recipientHandle, useProfile}` → a private four-field draft. The Web client always sends current explicit consent. |
| `GET /agent/drafts/:id` | Fetch an owned, unexpired draft with current profile versions. |
| `POST /agent/history/clear` | Delete the current account's history without resetting quota. |
| `GET /introductions/:id/connection` | Accepted-introduction parties only; returns own and explicitly shared counterpart contact. |
| `POST /introductions/:id/connection` | Explicitly share/replace own `{type, label, value}`; type is `email`, `contact_url` or `scheduling_url`. URL channels require HTTPS. |
| `POST /introductions/:id/connection/remove` | `{}` removes only the current participant’s contact. |

## Verification and demo acceptance

The API test suite includes signed-session privacy/consent, output validation, stale profiles, expiry, ownership, persistent quotas, concurrent reservations, in-flight deletion and bounded history. Provider tests use injected transport and loopback fixtures: structured-output requests, reasoning items before answers, failure sanitization, refusal, incomplete output, timeout, size limits and configuration. These prove implementation behavior without paid inference.

```sh
pnpm --filter @signalpass/api test
pnpm -r typecheck
pnpm v4:flow:test
pnpm exec playwright install chromium
pnpm agent:ui:test
node scripts/agent-proxy-smoke.mjs
```

The browser suite serves the actual V4 pages with mocked HTTP responses and stops at the user-confirmed delivery request. It verifies desktop/mobile behavior and failure states without claiming real model output, real wallet sign-in or real delivery. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an installed Chromium; screenshots default to `.run/agent-ui-qa`. Existing bitmap artwork is excluded from this targeted test. The separate proxy smoke starts real Next with a localhost fixture and verifies a response delayed beyond 30 seconds; it needs no model key.

See [the product demo and first-community guide](HACKATHON_PRODUCT_DEMO.md) for the complete journey, synthetic comparative cases and rehearsal criteria. Those fixture cases do not constitute a live model-ranking benchmark.

The synthetic live acceptance proves model integration, not a deployed community workflow. Before a public product demonstration:

1. Configure the dedicated server key and a compatible model. Confirm `/assistant` identifies the provider and available quota.
2. Use two separately signed-in, consenting accounts with approved profiles. Ensure the intended candidate is public, open and matching-enabled.
3. Enter a real goal. Inspect the returned reason, caveat and source quote; verify profile consent is opt-in and the result corresponds to actual published context.
4. Prepare the draft, edit it in the composer and confirm nothing reaches the recipient before the final send. Verify the recipient receives the reviewed wording only after confirmation.
5. Record provider/model, date and measured behavior without exposing the key or private context. Any chain segment needs its own public-network transaction evidence.

No live paid inference or public deployment is claimed from fixture tests. OpenAI adapter references: [Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses) and [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
