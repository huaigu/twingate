# Hosted Personal Agent acceptance — October 3, 2026

Five real OpenRouter calls completed with `dots-studio/dots-3-note-preview:free`, using the authorized test credential and fictional profiles. OpenRouter reported cost `0` for every response. No introduction was sent, no chain call was made, and no MON was spent in these tests.

## Measured provider results

| Isolated run | Operation | Application time | Input / output tokens | Reported cost |
| --- | --- | --- | --- | --- |
| In-memory acceptance | Discovery | 15,112 ms | 448 / 866 | 0 |
| In-memory acceptance | Draft | 25,231 ms | 489 / 2,087 | 0 |
| Temporary SQLite acceptance | Discovery | 12,515 ms | 450 / 588 | 0 |
| Temporary SQLite acceptance | Clarification | 12,495 ms | 470 / 554 | 0 |
| Temporary SQLite acceptance | Draft | 17,346 ms | 511 / 1,354 | 0 |

Every response had HTTP 200 and Responses status `completed`. Requests used the existing strict schema, 45-second deadline, explicit named free model, no provider fallback, zero-price routing caps, and `data_collection: deny`. The current official catalog listed the model with structured-output support before the tests. These results establish functional compatibility at the time of testing, not future availability or a model-quality benchmark.

## Verified boundaries

The first run used the existing two-request acceptance command and an in-memory application. It checked two exact public-profile quotes, the four draft fields, private retrieval, another account's 404, and zero introductions.

The new `pnpm agent:live:persistence:test` command used a separate temporary SQLite database, two ephemeral SIWE identities, a fictional private sender, and an opted-in public recipient. Its three provider requests checked:

- The original goal and self-contained clarification answer reached the model unchanged. Discovery and refinement produced three exact source quotes in total.
- Only the six approved profile fields reached the model; a private source-link canary was absent. The private sender profile was included with explicit consent and remained absent from public directory reads.
- Anonymous, cross-origin, missing-CSRF, missing-draft-consent, and cross-account refinement requests were rejected before inference.
- Only the owner could retrieve the draft and its history; the other account received 404 and had an empty workspace.
- Closing and recreating the API on the same SQLite database preserved signed sessions, the clarification history, the draft, and the consumed three-request quota. This was API re-instantiation within one test process, not an OS-process restart or VPS failover test.
- Clearing history removed the runs and draft. An old draft became 404, refinement of an old run became 404, and a new inference attempt remained blocked by the exhausted quota.

Both live runs avoided the deployed database, funded wallets, production users' profiles, external evaluators, and chain configuration. The temporary SQLite directory was removed after the persistence run. The test key was kept in protected server-side test storage, never in repository files, frontend assets, or application configuration; it was removed after testing.

## UI fix and regressions

Opening an older draft for person B while person A was selected previously hid the draft-context note. The draft still targeted B correctly, but the screen could look inconsistent. Reopened drafts now explicitly identify their recipient and original goal while retaining the current search, selection, refinement answer, and consent state.

All 28 Chromium hosted-agent scenarios passed against an isolated copy of the deployed public pages with the candidate patch. The new regression verifies the distinct saved-draft recipient, preserved work, correct composer handoff, and absence of additional inference or sending. Mobile layout and keyboard scenarios passed. The existing 12 V4 flow checks and 32 focused hosted-agent API/provider/product/journey tests also passed. The new persistence script passed its explicit TypeScript check and offline counted-model success/failure checks.

The browser suite used route fixtures; it did not combine a live wallet extension, the public HTTPS proxy, and the real provider in a single browser journey. Exact quotes and schema validation do not verify every personal claim in generated text. Human review remains required.

## Public deployment status

SignalPass remains live on Monad Mainnet at https://signalpass.coderbojack.space/. The saved-draft UI correction is suitable for deployment independently of provider activation.

Hosted AI remains disabled on the public application. The credential was authorized for testing; enabling a shared provider on the live service would send users' submitted goals and approved profile context to OpenRouter. That activation was blocked by automatic approval review and requires explicit authorization. A proposed limited pilot would use the same named free model, 10 attempts per account and 20 global attempts per UTC day, with existing consent and zero-price constraints.
