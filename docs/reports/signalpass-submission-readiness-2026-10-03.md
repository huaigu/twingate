# Public status page deployment — October 3, 2026

The public [status page](https://signalpass.coderbojack.space/status) now describes the deployed hosted agent, wallet sign-in, persistent data and optional Monad Mainnet bond accurately. It separates the public AI/product rehearsal from mainnet settlement evidence, identifies integrations that are not enabled, and states the remaining limits of verification. Its navigation identifies the page as public and links to the home, sample tour and live agent without displaying a fictional signed-in identity. Long descriptions use wrapping paragraphs beside short status labels. This was a website copy, navigation and layout update, not a new provider or contract deployment.

Browser review of the first status-copy release found that the inherited legacy navigation still displayed “Alex Chen.” A second reviewed change gives `/status` its own public navigation while retaining the shell behavior of every other route. Review of that release then found long descriptions inside nonwrapping pills, overflowing even a desktop viewport. The final release uses flexible grouped rows, short pills and normal wrapping paragraphs. It supersedes the copy activation at 12:36:45 UTC and navigation activation at 12:59:00 UTC.

## Release and scope

- Final activation: **2026-10-03 13:05:40 UTC**; public HTTP verification completed at **13:05:41 UTC**.
- Active release: `/opt/signalpass/releases/status-readiness-20261003-v3`.
- Previous release retained: `/opt/signalpass/releases/status-readiness-20261003-v2`; earlier releases are also retained.
- Source changes: `apps/web/app/status/page.tsx` and the isolated `/status` branch in `apps/web/components/Shell.tsx`, reviewed on repository baseline `0c2bdfff` before the final documentation/source merge.
- Status source SHA-256: `a8c5ddf497e3a45e8d9ece23ab94ede61e97a09038fd0895c2fd2e7c52d98b25`.
- Shell source SHA-256: `958c56866ce1db591bed8692cc21ac93b875ac341c498ee9a57f7e403928edb2`.
- Next build ID: `ngCI10gNlRQuBB_3VIFF0`.
- Transferred tar.xz build archive: 435,056 bytes; SHA-256 `b8ce493321a7858d1eb29dab193173ed0ba0f4c8dba555b43fcf18d0eb075882`.

The existing Node 24 / Next 15.5.25 build workspace produced a complete fresh standalone build, including type checking and static generation. The payload replaced the entire Next build and its generated server/package files. It did not edit isolated generated HTML or RSC files. The API rewrite remains `http://127.0.0.1:8789`.

All 1,915 dependency-file and symlink entries matched between the fresh build, prior standalone output and live VPS. Those verified dependencies were reused to reduce the transfer size. Dependency-manifest SHA-256: `e16443a90c3a1ae7e815bf43032c70b9d7170ee83b6723ee0361225d827ee61c`.

The new release was cloned from the running release. Its live `web/apps/web/public` tree was preserved byte for byte, including the existing wallet and assistant scripts; the older build workspace's public files were not deployed. The API bundle was also preserved. Only `signalpass-web` restarted after an atomic release-link switch. API provider settings, credentials, mainnet configuration, SQLite storage and Cloudflare routing were not changed.

## Preservation checks

| Check | Before final activation | After |
| --- | --- | --- |
| API process ID | 3406514 | 3406514 |
| Cloudflare Tunnel process ID | 3155031 | 3155031 |
| Website process ID | 3462058 | 3463707 |
| API bundle SHA-256 | `abcc41793b7673a2adad298630d6319250fac717a857510f12762e1fba7172f8` | Same |
| Public tree, 78 files | `e610e136f4affedbbd29544db51a0df0f542f591b2c0e581fe87b0d3ef2615ba` | Same |
| API environment file hash | Captured privately before switch | Same |
| Public chain configuration and API health response | Captured before switch | Same |

The public-tree digest hashes each sorted relative filename, a NUL separator, its file-content SHA-256, and a newline. Dependency-manifest entries use content hashes for files and `link:` plus the stored link target for symlinks; the sorted compact JSON manifest is then hashed.

## Verification

A temporary standalone server on loopback port 3081 passed before activation. Both its HTML and RSC responses contained the new status claims and “Verified with limits” label without the fictional “Alex Chen” identity or “View your agent profile” control. Its HTML contained the public navigation and the Sample tour / Live agent links. All 11 referenced Next assets loaded successfully. Its assistant page, API proxy/readiness, unchanged mainnet configuration and anonymous denial of private history passed. The temporary service was stopped before activation.

The same read-only checks then passed through the public HTTPS domain:

| Request | Result |
| --- | --- |
| `/status` HTML and RSC | 200; updated content; “Alex Chen,” “View your agent profile” and stale “Not wired” text absent |
| `/status` navigation in HTML | Public navigation label and Sample tour / Live agent links present |
| All 11 Next assets referenced by `/status` | 200; nonempty; no HTML fallback |
| `/` and `/assistant` | 200; expected assistant control present |
| `/api/ready` | 200; SQLite readiness confirmed |
| `/api/health` | 200; unchanged service state |
| `/api/chain/config` | 200; unchanged configuration |
| Anonymous `/api/agent/workspace` | 401; `authentication_required` |

Public checks used the existing `SignalPass-Readiness-Verification/1.0` monitoring-client identifier. The first v2 activation attempt used Python urllib's default client identifier and received HTTP 403 with a 17-byte plain-text response, which triggered the planned rollback. The established monitoring client received HTTP 200 with `CF-Cache-Status: DYNAMIC`; subsequent activation and checks passed using that same client consistently. The final v3 activation required no rollback. This is a client-specific verification limitation; the 403 alone does not establish its cause. No Cloudflare rule, cache setting or access configuration was changed.

An independent desktop browser check reloaded the actual public `/status` after the final activation. Its accessibility tree showed the grouped status rows and public navigation. Read-only DOM measurements reported a 1,348-pixel viewport, document scroll width of 1,348 pixels and body width of 1,348 pixels: no horizontal page overflow. The screenshot `signalpass-public-status-final-1791032767344.jpg` visually confirmed readable wrapping paragraphs and short labels. This check covers that desktop viewport; it does not establish mobile layout coverage.

The production website and API still listen on loopback ports 3080 and 8789; temporary port 3081 was closed. No API restart, AI inference, sign-in/profile mutation or blockchain transaction was performed for this update. These checks verify the deployed copy, desktop layout, navigation, build assets and surrounding read-only service behavior; they do not add a new AI or wallet acceptance run.

## Recovery

The prior release is retained. To reverse the final layout update, atomically repoint `/opt/signalpass/current` to `/opt/signalpass/releases/status-readiness-20261003-v2` and restart only `signalpass-web`. That release contains the corrected status copy and public navigation but retains the overflowing description layout. No database restore is required for this website change. The release's `RELEASE.json` records both approved source hashes and the build ID; its status-copy Git commit can be filled in after the reviewed source/documentation merge.
