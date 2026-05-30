# syntax=docker/dockerfile:1
# Build context is the monorepo root (see docker-compose.yml). The client
# imports @bika/booking-core only at build time — Next bundles it into .next —
# so it is a client devDependency and is NOT needed in the runtime image.
FROM node:20-alpine AS builder

WORKDIR /app

# Workspace manifests first for better install-layer caching. All workspace
# package.json files must be present so `npm ci` can build the workspace tree.
COPY package.json package-lock.json ./
COPY shared/booking-core/package.json ./shared/booking-core/package.json
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

# Install the whole workspace (build needs the shared package + its tooling).
RUN --mount=type=cache,target=/root/.npm npm ci

# Source for the parts this image builds.
COPY shared/booking-core ./shared/booking-core
COPY client ./client

# Build the shared package first so Next can bundle its compiled output.
RUN npm run build --workspace=@bika/booking-core

# Build arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Ensure optional static asset directory exists for multi-stage COPY
WORKDIR /app/client
RUN mkdir -p public

# Build Next.js app
RUN npm run build

# Production stage — client runs at /app exactly as before; the shared package
# is already bundled into .next so the runtime needs no workspace wiring.
FROM node:20-alpine

WORKDIR /app

# Reuse production node_modules from the builder (avoids npm trying to resolve
# workspace-only packages like @bika/booking-core at runtime).
COPY --from=builder /app/client/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/.next ./.next
COPY --from=builder /app/client/public ./public
COPY --from=builder /app/client/next.config.mjs ./

# Expose port
EXPOSE 3000

# Set to production
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js
CMD ["npm", "start"]
