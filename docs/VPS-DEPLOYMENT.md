# SignalPass VPS deployment

Public URL: https://signalpass.coderbojack.space

Deployed on 2026-10-02 to the authorized OpenCloudOS 9.2 VPS. Existing applications occupy ports 80/443, so this deployment uses native Node 24.19.0 services and a dedicated Cloudflare Tunnel. The repository's Docker Compose bundle remains available for a separate host.

## Runtime

- `signalpass-api.service`: loopback `127.0.0.1:8789`, portable API bundle, private SQLite storage.
- `signalpass-web.service`: loopback `127.0.0.1:3080`, Next standalone server.
- `signalpass-tunnel.service`: encrypted outbound Cloudflare connection; public HTTPS terminates at Cloudflare.
- All three services start at boot, restart after failure, run with systemd DynamicUser, and have memory limits.
- Cloudflare redirects HTTP to HTTPS for this hostname and bypasses caching for API and cookie-bearing requests.

## Files and operations

Release: `/opt/signalpass/current`; versioned releases: `/opt/signalpass/releases`; runtime: `/opt/signalpass/runtime/node-v24.19.0-linux-x64`. Release metadata is in `RELEASE.json`.

Private API configuration: `/etc/signalpass/api.env`. Tunnel credential: `/etc/signalpass/tunnel.token`. Keep these files private and outside git. AI provider and chain settlement are disabled for this initial deployment; the earlier model key was authorized only for testing.

Use `systemctl status signalpass-api signalpass-web signalpass-tunnel` for service state. Use bounded `journalctl -u signalpass-api -n 100` logs. After API configuration changes, run `systemctl restart signalpass-api`. Public readiness uses **GET** `/api/ready`.

`signalpass-backup.timer` makes a consistent SQLite backup daily at 03:15 UTC plus up to five minutes of jitter. `/opt/signalpass/backup.py` uses SQLite's online backup API and verifies each copy. Backups are mode 0600 in `/var/lib/signalpass-backups`, retained for 14 days. Run `systemctl start signalpass-backup` before upgrades. An isolated restore and integrity check passed. These backups are on the same VPS; off-host disaster recovery is not configured.

For upgrades, build on a separate machine to avoid memory pressure: Next standalone output with the API rewrite fixed to `http://127.0.0.1:8789`, plus a Node ESM API bundle with Node builtins external. Include Next public/static files. Verify the archive checksum, install into a new release directory, retain the previous release, switch `/opt/signalpass/current`, and restart the API/web services. Never replace the database directory. Schema-changing rollbacks require a compatible database backup.

Validation passed: public HTTPS and redirect, API/private-history checks, signed SIWE login, Secure/HttpOnly/SameSite cookies, CSRF/origin enforcement, private profile exclusion, session/profile persistence after restart, and desktop/mobile pages. The temporary acceptance profile was removed. Real AI-provider calls and public-chain transactions were not performed.
