# Hosted Personal Agent: live acceptance, October 1, 2026

Live discovery and drafting passed through SignalPass's actual signed-session API routes using OpenRouter's `dots-studio/dots-3-note-preview:free`. Two complete runs passed. This is functional integration evidence with fictional profiles, not a public deployment, community outcome or model-quality benchmark.

## Scope and observed results

The acceptance command created two temporary SIWE identities and two approved fictional profiles in an in-memory database. It used explicit sender-profile consent, validated the returned recipient and exact public-profile quotes, created a four-field private draft, retrieved it as its owner and verified that another account received 404. Each complete run made two real provider calls. There were zero introductions, payments or chain calls.

| Attempt | Result |
| --- | --- |
| Qwen `qwen/qwen3.8-27b:free` | HTTP 429 before a usable result. No automatic retry or model fallback. |
| Dots with the initial 15-second deadline | HTTP 200 headers, but the response body exceeded the deadline. No usable result. |
| Dots, first complete run | Discovery 19,990 ms; draft 16,703 ms. Two exact public-profile quotes. Both calls completed; OpenRouter reported cost `0` for each. |
| Dots, first run after draft prompt revision | Discovery 26,817 ms with one exact quote. Draft returned HTTP 200 with status `incomplete` and reason `content_filter`; the application rejected it. OpenRouter reported cost `0` for both responses. |
| Dots, final run after draft prompt revision | Discovery 26,347 ms; draft 19,267 ms. One exact public-profile quote. Both calls completed; OpenRouter reported cost `0` for each. Ownership and no-delivery checks passed. |

All model selections were explicit named free variants. Requests required parameter support, disabled provider fallback, requested no input-data collection and capped prompt, completion, request and image prices at zero. There was no paid-model fallback. The authorized test key existed only in the test subprocess environment and was not saved to repository files or application configuration. No real users' profiles were sent.

## Draft quality and resulting fixes

The initial successful draft used fragments such as “Propose a brief test session.” The revised instructions ask for concise, sendable sentences, a recipient-specific reason, a supported contribution and a modest invitation phrased as a question.

The final run produced this next step:

> Would you be interested in testing my prototype in exchange for some frontend and product feedback?

Its validated recommendation quoted the fictional recipient's `canOffer` field exactly:

> Usability reviews and tests of Monad wallet onboarding prototypes.

However, the draft also invented “I've been following your work,” despite instructions forbidding invented familiarity. Its notes were empty. This demonstrates why schema validation and exact evidence checks do not establish the truth of every generated sentence. The assistant and composer now show their own reminder to check personal claims and prior familiarity, independent of model notes. The sender must edit unsupported wording before explicitly confirming delivery. No automatic factual verification is claimed.

The slow free responses also exposed three timeout limits. The OpenRouter default is now 45 seconds; OpenAI retains 15 seconds. Operators may set `SIGNALPASS_AGENT_TIMEOUT_MS` between 1,000 and 60,000. Browser discover/draft requests and the Next rewrite proxy allow 65 seconds. Other browser API calls retain their 18-second budget. A real Next proxy check returned HTTP 200 after 32,009 ms using one local fixture request and zero model calls.

## Verification and remaining demo work

- 36 API tests passed, including provider deadline/configuration, signed-session privacy, quotas, output validation and the live acceptance gate's offline fixtures.
- 10 V4 regressions and 5 wallet quote regressions passed.
- 14 Chromium scenarios passed, with desktop/mobile screenshots inspected.
- API and Web TypeScript checks passed.
- The separate delayed-response Next proxy smoke passed.

Browser coverage checks the fixed review reminder with empty model notes, the editable handoff and separate send confirmation at desktop and mobile widths. Visual inspection also exposed a mobile profile-sharing panel layout conflict; its flex layout now keeps the explanation and context control readable.

Free-provider capacity and output completion remain variable. A successful run does not guarantee demo availability. Run the acceptance command against the configured model shortly before recording, show failures honestly, and keep the manual directory/editor available. Human review remains necessary for unsupported claims.

Next product evidence: a deployed, two-person journey from a real goal to an edited introduction and explicit send. The public Monad lock/decision/refund flow needs separate explorer-backed evidence. Hunyuan and paid OpenAI inference were not tested; no public deployment, funded transaction or video recording was performed in this acceptance session.
