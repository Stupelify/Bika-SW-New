# syntax=docker/dockerfile:1
# Build context is the monorepo root (see docker-compose.yml). The server
# imports @bika/booking-core (compiled), which is a runtime dependency because
# tsc does not bundle — so the shared package's dist must be present in the
# runtime image and resolvable from the server's node_modules.
FROM node:20-slim AS builder

WORKDIR /app

# x86 Debian server — use debian-openssl target
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x,linux-arm64-openssl-3.0.x"

# Prisma needs OpenSSL available during generate/build
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Workspace manifests first for better install-layer caching. All workspace
# package.json files must be present so `npm ci` can build the workspace tree.
COPY package.json package-lock.json ./
COPY shared/booking-core/package.json ./shared/booking-core/package.json
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# Install the whole workspace (the server build needs the shared package and
# its build tooling).
RUN --mount=type=cache,target=/root/.npm npm ci

# Source for the parts this image builds.
COPY shared/booking-core ./shared/booking-core
COPY server ./server

# Build the shared package first (compiled output the server consumes), then
# generate the Prisma client and compile the server.
RUN npm run build --workspace=@bika/booking-core
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

# Production stage — reproduce the original server-at-/app layout so
# entrypoint.sh (node_modules/.bin/pm2-runtime dist/server.js) is unchanged.
FROM node:20-slim

WORKDIR /app

# Force Prisma CLI to use OpenSSL 3-compatible engines at runtime
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x,linux-arm64-openssl-3.0.x"

# Prisma runtime requires OpenSSL shared libraries
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Carry the already-resolved node_modules (includes pm2, @prisma/client, the
# generated .prisma client, and the @bika/booking-core workspace symlink). This
# trades image size for build-time correctness: the runtime tree is exactly the
# one that compiled successfully. Pruning is a safe follow-up once validated.
COPY --from=builder /app/node_modules ./node_modules

# The @bika symlink in node_modules points at ../../shared/booking-core, so its
# compiled output must exist at that path.
COPY --from=builder /app/shared/booking-core/package.json ./shared/booking-core/package.json
COPY --from=builder /app/shared/booking-core/dist ./shared/booking-core/dist

# Built server + Prisma schema + entrypoint, laid out as before at /app.
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Create directories for uploads and logs
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
ENTRYPOINT ["./entrypoint.sh"]
