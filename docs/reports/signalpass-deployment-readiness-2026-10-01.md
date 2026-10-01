# Deployment readiness: October 1, 2026

This follow-up prepares a persistent production deployment and closes local integration gaps. It does not claim a public URL or public Monad transactions.

## Delivered

- A Dockerfile with separate API/Web targets, pinned pnpm 10.32.1, a Compose stack with one API replica and persistent SQLite, and Caddy as the HTTPS edge. Only the edge publishes host ports. Provider and chain settings are disabled by default. Build context excludes local credentials, databases, dependencies and run artifacts.
- Production runtime validation requires an exact HTTPS `APP_ORIGIN` and explicit absolute `SIGNALPASS_DB_PATH`. API host, port and shutdown grace are validated; development binds loopback by default. Startup cannot silently use a localhost sign-in domain or repository-relative production database.
- Graceful API shutdown drains active requests and background reconciliation before closing SQLite. A bounded deadline handles stuck work. The container grace exceeds the configured API deadline.
- Public `/ready` reports SQLite query availability and returns a sanitized 503 when unavailable. It does not call the model or certify RPC availability. The existing `/health` response remains available.
- `scripts/deployment-preflight.mjs` checks a running deployment using GET requests only: API proxy/readiness, anonymous denial of private agent history, assistant HTML/assets and the declared chain mode. It does not sign in, create profiles, invoke inference, send introductions or move funds.
- A real HTTP two-person acceptance test joins agent discovery/drafting to sender edits, actual application delivery, recipient acceptance and persistent receipts. Only model inference is injected.

## Observed verification

| Check | Result and scope |
| --- | --- |
| API suite | 45/45 passed, including the new delivery journey, production config, secure session, readiness and shutdown cases. |
| API TypeScript | Passed. |
| Next production build | Passed with the current timeout/proxy configuration. |
| Native production smoke | Actual production Next server and Node API passed read-only deployment preflight through the proxy. SIWE used the configured HTTPS domain; cookies carried Secure, HttpOnly and SameSite=Lax. A signed session survived a clean API process restart against persistent SQLite. Transport was localhost HTTP; public TLS was not tested. |
| Deployment configuration | Official Docker Compose 2.39.4 validated the base stack and optional chain overlay; missing origin was rejected. Official Caddy 2.10.2 adapted and validated the HTTPS configuration. Download checksums were verified. Seven offline health-check fixtures passed. No container image was built. |
| Solidity suite | 47/47 passed using Forge/Anvil 1.7.1, Solidity 0.8.24 and the repository's exact forge-std revision. Includes 256 fuzz runs checking that bonds are preserved. |
| Current local EVM journey | Fresh Anvil chain 31337: signed identity/profile, Solidity/viem quote digest equality, exact bond lock, tamper/replay rejection, recipient-only decisions, accept/decline/expiry refunds with gas accounted separately, unchanged signed payload after follow-up, lost-callback recovery and API restart recovery all passed. |

The chain test runner now starts the API with Node's `--import tsx` directly. This avoids an unrelated global pnpm version and the tsx command's IPC requirement; contract behavior is unchanged. No Solidity source changes were needed.

The two-person test checks that model consent does not silently share the sender profile with the recipient, that private agent goals/notes/source data and superseded model wording remain private, that the recipient receives the same introduction ID and exact edited text, and that clearing agent history does not remove delivered receipts. The API submission represents explicit approval; the separate browser suite covers the confirmation interface. This is not a combined live-provider/public-browser delivery demonstration.

## Launch requirements

1. Select and connect a host with persistent storage. The [deployment guide](../DEPLOYMENT.md) gives the complete configuration, backup procedure, read-only preflight and two-person acceptance steps. Do not scale SQLite to multiple writers.
2. Configure the exact public HTTPS origin and mounted database path. Build with the correct private API upstream. Confirm public TLS and persistence across a host redeploy; local process restart is not evidence that the host's volume is mounted correctly.
3. Configure a dedicated server model key and explicit model when enabling the assistant. The earlier [live free-model report](signalpass-hosted-agent-live-2026-10-01.md) records successful inference and its failures. This follow-up did not reuse that test key or call any external model.
4. Deploy the current contracts on Monad Testnet 10143 with an authorized funded testnet wallet; configure the protected API quote signer and actual deployment manifest. Run `chain:preflight`, then record two-wallet registration, lock, decision and refund with explorer links. Local chain hashes are not public evidence.
5. Exercise the deployed journey with two consenting people before recording. The user will make the video separately.

No Docker daemon was available in the execution workspace, so native runtime validation does not certify that container images build and start successfully. No public deployment, public wallet transaction, paid inference or video was produced in this follow-up. The complete remote Git tree is preserved when publishing this patch, including artwork and submodules absent from the local text snapshot.
