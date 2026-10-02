# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# The repository requires pnpm 10; never use an ambient/global pnpm 11 install.
RUN npm install --global pnpm@10.32.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY services/api/package.json ./services/api/package.json
COPY packages/core/package.json ./packages/core/package.json
# Keep the virtual store inside /app so workspace symlinks survive stage copies.
# tsx is a development dependency but is also the API's current TS runtime.
RUN pnpm install --frozen-lockfile --filter @signalpass/web... --filter @signalpass/api... --config.enable-global-virtual-store=false --config.package-import-method=copy

FROM dependencies AS sources
COPY tsconfig.base.json ./
COPY packages/core ./packages/core
COPY services/api ./services/api
COPY apps/web ./apps/web
COPY deploy/healthcheck.mjs ./deploy/healthcheck.mjs

FROM sources AS web-build
# Next compiles this rewrite into its build. Runtime-only changes are insufficient.
# These are public routing values, never provider credentials.
ARG SIGNALPASS_API_ORIGIN=http://api:8789
ENV SIGNALPASS_API_ORIGIN=${SIGNALPASS_API_ORIGIN} NEXT_PUBLIC_API_URL=/api
RUN pnpm --filter @signalpass/web build

FROM sources AS api
ENV NODE_ENV=production API_HOST=0.0.0.0 API_PORT=8789 SIGNALPASS_DB_PATH=/data/signalpass.sqlite
# Docker copies this ownership into a newly created named volume.
RUN mkdir -p /data && chown node:node /data && chmod 0700 /data
USER node
WORKDIR /app/services/api
EXPOSE 8789
CMD ["node", "--import", "tsx", "src/index.ts"]

FROM node:24-bookworm-slim AS web
ARG SIGNALPASS_API_ORIGIN=http://api:8789
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 SIGNALPASS_API_ORIGIN=${SIGNALPASS_API_ORIGIN} NEXT_PUBLIC_API_URL=/api
# Retain pnpm's workspace layout; no standalone-output config change is required.
COPY --from=web-build --chown=node:node /app /app
USER node
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
