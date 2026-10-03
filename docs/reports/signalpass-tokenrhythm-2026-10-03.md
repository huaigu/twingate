# TokenRhythm integration and activation status — October 3, 2026

TokenRhythm is enabled on the public SignalPass site following explicit operator approval. Discovery, clarification and private drafting passed through the public HTTPS application, and saved history, sessions, quotas and drafts survived an actual API service restart. Cleanup completed with exit code zero. The earlier activation block described below has been resolved.

## Provider and bounds

- Explicit provider: `tokenrhythm`.
- Endpoint: `https://tokenrhythm.studio/v1/chat/completions`.
- Selected model: `deepseek-v4-flash` (accepted by the live endpoint).
- One non-streamed result with strict JSON schema, `store:false`, a 2,400 output-token ceiling, 128 KiB response cap, 45-second deadline, and no automatic retries or fallback.
- Configured public limit: 200 inference attempts per UTC day across the site, with 20 per account. Failures consume quota; clearing history and restarting do not reset it.
- These request limits are not a monetary budget. The provider did not return billing evidence for these checks; no zero-cost claim is made. `store:false` is not a retention guarantee.

The dedicated credential is protected on the VPS with root-only permissions. It is absent from source, frontend assets and this report. The service loads it with systemd, then copies it into its private, ephemeral runtime directory as a regular file owned by the API user with mode 0600. This preserves the application’s strict key-file checks without placing the secret in frontend variables or plaintext environment values. The runtime directory is removed when the service stops.

## Completed verification

All 75 API tests passed, with no skipped or failed tests. API TypeScript and a strict standalone typecheck of the live persistence script passed. Regression coverage includes provider transport/errors/bounds, protected key files, UTC midnight account/global quotas, and an audience phrase that was incorrectly treated as employment. Unsupported employment claims remain rejected.

A schema probe returned HTTP 200 with a valid structured result. The first isolated three-call acceptance completed discovery and clarification but rejected the draft at application validation, despite a completed HTTP 200 provider response. The exact cause of that first rejection was not established. A separately invoked second three-call acceptance passed discovery, clarification and drafting. There was no automatic retry.

| Passing isolated operation | Application time | Prompt tokens | Completion tokens |
| --- | ---: | ---: | ---: |
| Discovery | 2,688 ms | 462 | 162 |
| Clarification | 1,292 ms | 483 | 118 |
| Draft | 5,146 ms | 521 | 122 |

The passing run checked signed sessions and CSRF, explicit sender-profile consent, an opted-in public fictional recipient, five exact source quotes across discovery/clarification, preservation of the original goal, private draft ownership, SQLite reopen persistence, and history deletion without a quota reset. It used a temporary database and removed it afterward. It created zero introductions and made zero chain calls or transactions.

The entire session used seven TokenRhythm inference calls: one schema probe plus two isolated three-call runs. Those calls were outside the deployed application's production quota. A models-catalog read was not an inference call.

## Public deployment and acceptance

The current release is `/opt/signalpass/releases/tokenrhythm-20261003`. API bundle SHA-256: `abcc41793b7673a2adad298630d6319250fac717a857510f12762e1fba7172f8`. Provider code was merged in PR #11 at `08e8c92265328d3e7e5071f7e0c9379a03e02dac`. The previous release and protected environment backup remain available. Existing SQLite data, Monad contracts, quote signer and patched assistant frontend were preserved.

Automatic approval review initially blocked activation because authorization for external sharing of submitted goals and consented profile context was unclear. The operator explicitly approved enabling it after that disclosure. The first activation failed closed at startup: systemd’s mounted credential was mode 0440, incompatible with the app’s owner-only key-file guard. The healthy previous release was restored. An isolated DynamicUser check then verified an API-owned mode-0600 runtime copy; the corrected service setup activated successfully without weakening the application guard.

`services/api/scripts/agent-public-tokenrhythm-smoke.mjs` ran against the actual Cloudflare HTTPS site using two unfunded ephemeral signed identities and explicitly fictional profiles. Both phases exited zero.

| Public operation | HTTPS application time |
| --- | ---: |
| Discovery | 1,704 ms |
| Clarification | 2,502 ms |
| Draft | 2,634 ms |

The public acceptance verified:

- The configured provider/model, 20-account limit, Secure/HttpOnly session cookies, anonymous HTTP 401, and missing-CSRF HTTP 403 without consuming inference quota.
- Explicit sender-profile consent, a public opted-in fictional recipient, exact source evidence, clarification retaining the original goal, and a complete private draft.
- Cross-account draft access returning HTTP 404.
- Three consumed account attempts, leaving 17 for the test account.
- An actual `systemctl restart signalpass-api` changing the API PID from 3406237 to 3406514. The same signed sessions, private draft, refinement history and quota survived.
- Zero introductions for either test identity. History clearing invalidated the saved draft while retaining usage.
- Completed cleanup: both fictional profiles set private with matching disabled, history cleared, both sessions logged out, and the protected recovery journal removed. The synthetic profiles remain private database records; the application has no profile-deletion endpoint.

A separate read-only server check confirmed provider `tokenrhythm`, model `deepseek-v4-flash`, global limit 200 and account limit 20. SQLite showed three global attempts and three attempts for the test account on the same UTC day. The API runtime key remained owner-only after the restart. API state was active/running with zero automatic restarts after the final explicit restart.

The final public `/`, `/assistant`, `/api/health` and `/api/ready` returned HTTP 200; anonymous `/api/agent/status` returned HTTP 401. The public directory contained zero QA profiles and zero public profiles after cleanup.

These checks made three production provider calls, zero introduction submissions and zero blockchain transactions, spending no MON. Read-only chain reconciliation may occur during introduction-list checks; this public acceptance does not claim zero chain RPC calls or prove blockchain settlement. Real mainnet settlement was tested separately in the mainnet pilot report. The combined TokenRhythm session used ten inference calls: seven isolated/probe calls before activation and three public application calls afterward. No automatic provider retries were used, and no provider billing amount was established.

## Scope and next step

This verifies a real public provider flow and service restart persistence, not recommendation quality across a deployed community or the exhaustion of all 200 daily requests. Offline tests cover account/global exhaustion, failed attempts and the UTC midnight boundary. The public helper’s quota assertions were interpreted alongside separate server usage/configuration checks; remaining availability can otherwise change under shared traffic.

The public directory is empty after fixture cleanup. Real recommendations require approved profiles that explicitly allow public matching. Publish a profile, invite another participant to opt in, and then try a real goal at `/assistant`. Introduction delivery still requires the user to review the card and explicitly confirm the wallet transaction.
