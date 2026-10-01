# Deploy SignalPass on one host

This bundle runs the Next.js website, the Hono API and Caddy on a Linux host with Docker Engine and Docker Compose v2.24 or later. Caddy is the only service with published ports: HTTP 80, HTTPS 443 and HTTP/3 443/UDP. The API and website communicate over a private Docker bridge; the API still has outbound access for an explicitly configured provider. Node 24 supplies the SQLite runtime, and builds install exactly pnpm 10.32.1.

Use **one API replica with one persistent SQLite volume**. This configuration is for one host, not a multi-replica or serverless deployment. Keep the Compose project name `signalpass` stable: changing it selects different named volumes. Do not scale the API or share its database volume between deployments.

## Prepare the host

Point a domain's DNS records at the host and allow inbound TCP 80/443; UDP 443 is optional for HTTP/3. Caddy needs outbound connectivity for certificate issuance and renewal. Remove obsolete AAAA records if the host does not serve IPv6. Keep any provider key, chain signer key and runtime configuration outside the checkout.

From the repository root, make a private runtime configuration:

```sh
install -d -m 700 "$HOME/.config/signalpass"
install -m 600 deploy/.env.example "$HOME/.config/signalpass/runtime.env"
deploy_env="$HOME/.config/signalpass/runtime.env"
```

Edit that file with your editor. Set `APP_ORIGIN` to the **exact** public browser origin, for example `https://signalpass.your-domain.com`, without a trailing slash, path, credentials or query. This bundle uses standard HTTPS port 443. The same value configures both the API's signed-login/CSRF origin and Caddy's TLS site; there is no second hostname setting to synchronize. Production API startup rejects an invalid origin or missing persistent database path.

Leave the agent settings blank for the initial deployment. Manual introductions work without an AI provider. Hosted generation returns an explicit unavailable response until configured. The default deployment has no chain connection, no signer and no external evaluator. The off-chain evaluator is the application's local mock; this is not a funded wallet-bond deployment or a verified live Hunyuan integration.

## Build and start

```sh
docker compose --env-file "$deploy_env" config --quiet
docker compose --env-file "$deploy_env" build --pull
docker compose --env-file "$deploy_env" up --detach --wait --wait-timeout 180
docker compose --env-file "$deploy_env" ps
node scripts/deployment-preflight.mjs https://signalpass.your-domain.com
```

`config --quiet` checks configuration without printing interpolated credentials. Avoid pasting the output of plain `docker compose config`, container inspection or the runtime environment into logs or support chats. Runtime credentials reach only the API container through an explicit environment allowlist. They are not build arguments, browser variables, or sent to the web/Caddy containers. The `.dockerignore` excludes runtime files and secrets from the build context; never place credentials inside an allowlisted source file.

The web build **bakes in** `SIGNALPASS_API_ORIGIN=http://api:8789` for Next's `/api` rewrite and `NEXT_PUBLIC_API_URL=/api` for the legacy client. The service name `api` and its port must therefore remain stable in this Compose setup. For a platform with different private DNS, supply the non-secret build argument `--build-arg SIGNALPASS_API_ORIGIN=http://your-private-api:8789` when building the `web` target. Rebuild when the upstream changes; setting a runtime environment variable alone does not change the compiled rewrite. This is not an already configured deployment on another hosting platform. The image keeps the workspace dependency layout because the API and shared core currently execute TypeScript using `tsx`.

API readiness calls `/ready` and checks SQLite. Web readiness checks the proxied `/api/ready` and the live assistant HTML. Caddy's container health checks its private, loopback admin endpoint. These checks do **not** verify DNS, public certificates, wallet functionality, AI credentials, provider availability or chain RPC. Run the public preflight after DNS/TLS is ready; it performs read-only checks and no paid inference.

Node services run as UID/GID `1000:1000`. New `sqlite` volumes inherit the image's `/data` ownership and private permissions. If migrating an existing root-owned volume, stop the stack first and repair only that volume:

```sh
docker compose --env-file "$deploy_env" stop caddy web api
docker compose --env-file "$deploy_env" run --rm --no-deps --user 0 --entrypoint sh api -c 'chown -R 1000:1000 /data && chmod 700 /data'
docker compose --env-file "$deploy_env" up --detach --wait
```

Keep host-managed bind mounts owned/readable by UID 1000 if you replace the named volume. Do not solve write errors by running the API as root or making its database world-readable.

## Enable hosted drafting explicitly

Update only the private runtime file, then recreate the API with `docker compose --env-file "$deploy_env" up --detach --wait api`. Changing a server-side provider configuration does not require a web rebuild.

For the optional free OpenRouter test path:

```dotenv
SIGNALPASS_AGENT_PROVIDER=openrouter
SIGNALPASS_AGENT_API_KEY=YOUR_OWN_AUTHORIZED_KEY
SIGNALPASS_AGENT_MODEL=dots-studio/dots-3-note-preview:free
SIGNALPASS_AGENT_BASE_URL=
SIGNALPASS_AGENT_TIMEOUT_MS=45000
SIGNALPASS_AGENT_DAILY_USER_LIMIT=20
SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT=200
```

The model above passed a synthetic acceptance test during development; availability can change. Select an explicit current `vendor/model:free` entry supporting structured output. The adapter requires zero-price routing, `data_collection: deny`, supported parameters and no fallback; it fails if no eligible provider is available. Shared/publicly found API keys are not appropriate. A free model can still be rate-limited or unavailable, so a failed request must not be presented as a successful draft. Use only authorized accounts and context for a live test.

Alternatively, `SIGNALPASS_AGENT_PROVIDER=openai` requires your own key and explicit compatible model; those calls may be billable. Neither provider reuses ambient credentials. An explicitly selected provider with missing key/model fails API startup; a blank provider disables the feature. The timeout defaults are 45 seconds for OpenRouter and 15 seconds for OpenAI; an explicit value must be an integer from 1000 through 60000 milliseconds. User/global limits count attempts, including failed calls, and persist across restarts.

Generated introductions still require human review. Exact discovery quotes are checked against supplied profiles; generated draft claims are not independently fact-verified. Provider privacy routing is not a guarantee that no operational records exist at the provider.

## Back up and restore SQLite

Back up before upgrades. The database uses WAL, so copying only `signalpass.sqlite` from a running container is unsafe. This small deployment uses a short maintenance window: stop incoming traffic and both Node services, then archive the entire named data volume. `stop` honors the configured drain periods. Keep backups private and copy them to separate storage.

```sh
umask 077
install -d -m 700 "$HOME/.local/share/signalpass-backups"
backup_file="$HOME/.local/share/signalpass-backups/sqlite-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
docker compose --env-file "$deploy_env" stop caddy web api
docker compose --env-file "$deploy_env" run --rm --no-deps -T --entrypoint sh api -c 'tar -C /data -czf - .' > "$backup_file"
tar -tzf "$backup_file"
docker compose --env-file "$deploy_env" up --detach --wait
```

Check the archive command's exit status before treating the backup as complete. Do not restart the API until the archive finishes. Protect the runtime configuration and Caddy's `caddy_data`/`caddy_config` volumes separately; the SQLite archive does not contain them. Caddy's data includes certificate private keys.

To restore, use a clean host/project with **an empty SQLite volume**, the same application version initially, and your trusted archive. Build the image but do not start services. The command below refuses a nonempty target; it does not erase an existing database:

```sh
docker compose --env-file "$deploy_env" run --rm --no-deps -T --entrypoint sh api -c 'test -z "$(ls -A /data)" && tar -C /data -xzf -' < "$backup_file"
docker compose --env-file "$deploy_env" up --detach --wait
node scripts/deployment-preflight.mjs https://signalpass.your-domain.com
```

Test recovery on an isolated host/domain before relying on a backup. `docker compose down` preserves named volumes; **do not use `down --volumes` or `down -v`** for an ordinary restart or upgrade. Those commands delete the persistent database and certificate state.

## Optional chain connection

Chain configuration is deliberately excluded from the default stack. First deploy and verify the supported testnet contracts using the repository's chain workflow. Do not reuse a local development signer or expose an Anvil port to the Internet.

Put the completed deployment manifest and quote-signer key in existing files outside the checkout. The key must be readable by container UID 1000, with private host permissions. Use the shape in `deployments/monad-testnet.example.json`; the manifest must describe the actual verified deployment and a reachable RPC URL, not `localhost` inside a container.

Add their **absolute host paths** to the private runtime file:

```dotenv
SIGNALPASS_CHAIN_MANIFEST_FILE=/absolute/private/path/chain.json
SIGNALPASS_CHAIN_SIGNER_FILE=/absolute/private/path/quote-signer.key
```

Review the supplied overlay and run it explicitly:

```sh
docker compose --env-file "$deploy_env" -f compose.yaml -f deploy/chain.compose.yaml.example config --quiet
docker compose --env-file "$deploy_env" -f compose.yaml -f deploy/chain.compose.yaml.example up --detach --wait
```

The overlay mounts both files read-only; missing files fail rather than creating directories. Use the same two `-f` arguments for subsequent operations on that chain-enabled deployment. No deployment or wallet transaction is performed by this bundle. Chain quotes and user-approved transactions still require the application's existing validation and testnet workflow.

## Operate and upgrade

The provider request deadline is at most 60 seconds; Next's proxy allows 65 seconds, Caddy waits up to 70 seconds for response headers, and the API's shutdown grace is 70 seconds. Containers receive 75 seconds before forced termination. A graceful stop allows in-flight requests to finish but is not a substitute for retry handling during failure or host loss.

Review bounded service logs with `docker compose --env-file "$deploy_env" logs --tail 100 api web caddy`. An unhealthy status requires investigation; Docker's restart policy restarts exited processes, not every unhealthy process. Monitor public readiness and storage capacity externally. Builds use maintained Node 24/Caddy 2 tags; record and pin tested image digests in your release process when you need immutable rollbacks.

For an upgrade, first take the stopped-volume backup, keep the previous source revision/images available, build the new revision, and recreate the services. Run the public preflight and a signed-in manual browser check. If a future revision changes the database format, restore a compatible backup when rolling back rather than assuming old code can read the new data.

This bundle has no hosted deployment, DNS change, public certificate issuance or container-image build implied by its presence. Run the build/start/verification commands on the destination host before calling the release deployed.

Primary references: [Docker Compose service configuration](https://docs.docker.com/reference/compose-file/services/), [Docker build context exclusions](https://docs.docker.com/build/concepts/context/#dockerignore-files), [Docker volume backup/restore](https://docs.docker.com/engine/storage/volumes/#back-up-restore-or-migrate-data-volumes), [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https), and [Caddy reverse proxy timeouts](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#the-http-transport).
