FROM node:20-slim AS builder

WORKDIR /app

# Force Prisma CLI to fetch OpenSSL 3-compatible engines on Debian arm64
ENV PRISMA_CLI_BINARY_TARGETS=linux-arm64-openssl-3.0.x

# Prisma needs OpenSSL available during generate/build
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (source snapshot does not include package-lock.json)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Force Prisma CLI to use OpenSSL 3-compatible engines at runtime
ENV PRISMA_CLI_BINARY_TARGETS=linux-arm64-openssl-3.0.x

# Prisma runtime requires OpenSSL shared libraries
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only (source snapshot does not include package-lock.json)
RUN npm install --omit=dev

# Copy Prisma Client and built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create directories for uploads and logs
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/server.js"]
