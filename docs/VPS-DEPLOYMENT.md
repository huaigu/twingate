# SignalPass VPS deployment

Public URL: https://signalpass.coderbojack.space

Initially deployed on 2026-10-02 to the authorized OpenCloudOS 9.2 VPS; status updated 2026-10-03. Existing applications occupy ports 80/443, so this deployment uses native Node 24.19.0 services and a dedicated Cloudflare Tunnel. The repository's Docker Compose bundle remains available for a separate host.

## Current public configuration

- **Settlement:** Monad Mainnet, chain `143`, using [the deployed manifest](../deployments/monad-mainnet.json). Real profile registration, lock, acceptance, decline and full bond refunds passed. Expiry refunds are verified in the local EVM suite only. See [the mainnet deployment report](reports/signalpass-mainnet-deployment-2026-10-03.md) for transaction evidence and pilot terms.
- **Hosted agent:** TokenRhythm `deepseek-v4-flash` is enabled following operator approval. Limits are 200 inference attempts per site and 20 per account per UTC day. Failed attempts count; restart and history clearing do not reset quota. SignalPass sponsors these requests; limits do not establish a provider cost or monetary cap. See [activation and public acceptance](reports/signalpass-tokenrhythm-2026-10-03.md).
- **Current release:** `/opt/signalpass/releases/tokenrhythm-20261003`. It retains the existing SQLite data, mainnet contracts, quote signer and assistant frontend. The prior release remains available for recovery.
- **Public browser journey:** two independently signed-in fictional accounts completed real AI → edited introduction → separate send review → acceptance → explicit contact sharing on the HTTPS site. The [Chromium rehearsal](reports/signalpass-public-journey-2026-10-03.md) used the no-bond option and made no MON transaction; mainnet settlement and the three-call agent/restart check remain separate evidence.

## Runtime

- `signalpass-api.service`: loopback `127.0.0.1:8789`, portable API bundle, private SQLite storage.
- `signalpass-web.service`: loopback `127.0.0.1:3080`, Next standalone server.
- `signalpass-tunnel.service`: encrypted outbound Cloudflare connection; public HTTPS terminates at Cloudflare.
- All three services start at boot, restart after failure, run with systemd DynamicUser, and have memory limits.
- Cloudflare redirects HTTP to HTTPS for this hostname and bypasses caching for API and cookie-bearing requests.

## Files and operations

Release: `/opt/signalpass/current`; versioned releases: `/opt/signalpass/releases`; runtime: `/opt/signalpass/runtime/node-v24.19.0-linux-x64`. Release metadata is in `RELEASE.json`.

Private API configuration: `/etc/signalpass/api.env`. Tunnel credential: `/etc/signalpass/tunnel.token`. Keep these files private and outside git. The initial deployment left AI and settlement disabled; both are now enabled as described above. The current dedicated provider credential is distinct from earlier test-only credentials.

The API receives provider and quote-signing credentials through systemd. The provider credential is copied at service start into an API-owned, mode-0600 regular file inside its private runtime directory; systemd removes that copy when the service stops. This preserves the application's strict key-file guard with DynamicUser. Set the provider key-file path, never the key itself, in environment configuration. Follow [the exact hosted-agent systemd setup](HOSTED_AGENT.md#tokenrhythm-setup); do not weaken permissions or place secrets in frontend variables. The API does not receive the deployer key.

Use `systemctl status signalpass-api signalpass-web signalpass-tunnel` for service state. Use bounded `journalctl -u signalpass-api -n 100` logs. After API configuration changes, run `systemctl restart signalpass-api`. Public readiness uses **GET** `/api/ready`.

`signalpass-backup.timer` makes a consistent SQLite backup daily at 03:15 UTC plus up to five minutes of jitter. `/opt/signalpass/backup.py` uses SQLite's online backup API and verifies each copy. Backups are mode 0600 in `/var/lib/signalpass-backups`, retained for 14 days. Run `systemctl start signalpass-backup` before upgrades. An isolated restore and integrity check passed. These backups are on the same VPS; off-host disaster recovery is not configured.

For upgrades, build on a separate machine to avoid memory pressure: Next standalone output with the API rewrite fixed to `http://127.0.0.1:8789`, plus a Node ESM API bundle with Node builtins external. Include Next public/static files. Verify the archive checksum, install into a new release directory, retain the previous release, switch `/opt/signalpass/current`, and restart the API/web services. Never replace the database directory. Schema-changing rollbacks require a compatible database backup.

## Verification record

The initial October 2 checks covered public HTTPS and redirect, API/private-history checks, signed SIWE login, Secure/HttpOnly/SameSite cookies, CSRF/origin enforcement, private profile exclusion, persistence and desktop/mobile pages. They did not exercise real inference or public-chain settlement.

The October 3 [mainnet report](reports/signalpass-mainnet-deployment-2026-10-03.md) records actual lock/accept/refund and lock/decline/refund transactions with two project-owned wallets. The separate [TokenRhythm report](reports/signalpass-tokenrhythm-2026-10-03.md) records three public provider calls—discovery, clarification and private drafting—and an actual `signalpass-api` process restart. Signed sessions, refinement history, private drafts and consumed quota survived; cross-account draft reads returned 404. Public health/readiness returned 200 and anonymous agent status returned 401 after cleanup.

The provider acceptance sent no introductions and made no blockchain transactions. Its fictional profiles were made private with matching disabled, history cleared and sessions logged out; private database records remain because there is no profile-deletion endpoint.

The separate [public browser rehearsal](reports/signalpass-public-journey-2026-10-03.md), at 10:01:26–10:01:52 UTC on October 3, used Chromium 147.0.7727.15 and two fictional signed-in accounts. Two real TokenRhythm calls produced recommendations and a draft; no clarification was needed because the model returned no question. The sender edited the draft and confirmed a no-bond introduction, the recipient received that exact text and accepted, and both participants previewed and explicitly shared example contact links. Accepted state and contacts persisted after refresh; a 390-pixel receipt had no horizontal overflow, anonymous receipt/contact reads returned 401 and no browser errors were recorded. This was one introduction and zero MON transactions.

Browser-rehearsal cleanup hid both profiles with matching disabled, removed the shared contacts, cleared AI history, logged out both sessions and removed the recovery journal. No rehearsal profile remains public. These checks demonstrate the product path with synthetic participants, not community traction, model-ranking quality or a single AI-to-mainnet settlement run.
