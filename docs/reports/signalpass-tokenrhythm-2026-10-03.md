# TokenRhythm integration and activation status — October 3, 2026

The TokenRhythm adapter and isolated live acceptance are complete. Public activation remains blocked pending clearer operator authorization to send users' private goals and explicitly consented approved-profile context to this external provider. The deployed site still has hosted AI disabled; the staged release has not replaced the current release.

## Provider and bounds

- Explicit provider: `tokenrhythm`.
- Endpoint: `https://tokenrhythm.studio/v1/chat/completions`.
- Selected model: `deepseek-v4-flash` (accepted by the live endpoint).
- One non-streamed result with strict JSON schema, `store:false`, a 2,400 output-token ceiling, 128 KiB response cap, 45-second deadline, and no automatic retries or fallback.
- Planned public limit: 200 inference attempts per UTC day across the site, with 20 per account. Failures consume quota; clearing history and restarting do not reset it.
- These request limits are not a monetary budget. The provider did not return billing evidence for these checks; no zero-cost claim is made. `store:false` is not a retention guarantee.

The dedicated credential is protected on the VPS with root-only permissions. It is absent from source, frontend assets and this report. Public activation is designed to use a systemd credential mount rather than a frontend key or a direct plaintext process argument.

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

## Deployment status

The new API bundle is staged at `/opt/signalpass/releases/tokenrhythm-20261003/api/server.mjs`, with SHA-256 `abcc41793b7673a2adad298630d6319250fac717a857510f12762e1fba7172f8`. The previous release and protected environment backup remain available. Existing SQLite data, Monad contracts, quote signer and patched assistant frontend are preserved in the staged copy.

Automatic approval review rejected the activation action because the conversation did not clearly authorize disclosure of users' private goals and approved profile context to TokenRhythm. No configuration mutation, current-release switch or service restart from that rejected action occurred. A subsequent read-only check confirmed:

- Current release remains `mainnet-pilot-20261003`.
- Hosted provider/model remain empty; the proposed credential drop-in is absent.
- API and web services are active.
- Public `/`, `/api/health` and `/api/ready` return HTTP 200; anonymous `/api/agent/status` returns HTTP 401.

## Pending public acceptance

`services/api/scripts/agent-public-tokenrhythm-smoke.mjs` is a prepared acceptance helper, not a completed public result. It uses unfunded ephemeral signed identities, explicitly labeled fictional profiles and at most three application inference attempts. It checks actual HTTPS cookies/authentication, CSRF, recommendation evidence, refinement, private drafting and persistence across an operator-triggered API service restart. Its `verify` phase then hides both profiles, clears their history, logs out and removes its protected session journal. The protected journal is replaced atomically. Cleanup records each completed step, journals intended profiles before writes, and supports a separate `cleanup` phase if interrupted.

Before interpreting quota comparisons, verify the configured global limit and owner/global usage separately on the server, and use one UTC day with sufficient shared headroom. `/agent/status.remainingToday` is the minimum of remaining account and global capacity; unrelated public traffic can reduce it. The helper fails conservatively if those comparisons change unexpectedly.

Once activation is explicitly authorized, load the credential, select the staged release, restart services, run `start`, restart the API, then run `verify`. Public acceptance and real systemd credential loading are still unverified. Do not present the isolated result as proof that public hosted inference is active.

Public matching also needs real opted-in profiles. The public directory was empty before these checks; isolated fixtures do not establish a deployed community or recommendation quality benchmark.
