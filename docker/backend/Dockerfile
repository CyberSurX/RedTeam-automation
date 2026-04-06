# docker/backend/Dockerfile — Consolidated Backend
# Sources merged: Dockerfile.backend (root), api/Dockerfile, docker/backend/Dockerfile
FROM node:18-alpine AS base

# Security updates + required tools (from api/Dockerfile + docker/backend/Dockerfile)
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    bash \
    git \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package manifests
COPY package*.json ./
# api/package.json does not exist; dependencies are in root package.json

# Install production dependencies
RUN npm install --omit=dev && npm cache clean --force

# ── Development Stage ─────────────────────────────────────────
FROM base AS development
RUN npm install && npm cache clean --force
COPY . .
ENV PORT=3001
EXPOSE 3001
CMD ["dumb-init", "npm", "run", "dev:backend"]

# ── Production Stage ──────────────────────────────────────────
FROM base AS production

# Create required directories
RUN mkdir -p /app/logs /app/dist && chmod 755 /app/logs /app/dist

# Non-root user (from api/Dockerfile)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S redteam -u 1001 -G nodejs

COPY --chown=redteam:nodejs . .

# Install dev dependencies for build, then remove them
RUN npm install && npm cache clean --force

# Build TypeScript backend
RUN npx tsc -p api/tsconfig.json

# Remove dev dependencies to reduce image size
RUN npm prune --production && npm cache clean --force

USER redteam

# Health check (from api/Dockerfile + docker/backend/Dockerfile)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

# dumb-init for proper signal handling (from docker/backend/Dockerfile)
CMD ["dumb-init", "node", "dist/api/server.js"]