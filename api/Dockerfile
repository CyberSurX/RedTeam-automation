# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for security tools
RUN apk add --no-cache \
    curl \
    bash \
    git \
    nmap \
    nmap-scripts \
    masscan \
    python3 \
    py3-pip \
    ruby \
    ruby-dev \
    build-base \
    libffi-dev \
    openssl-dev

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S redteam -u 1001 -G nodejs

# Copy package files first for better caching
COPY api/package*.json ./api/
COPY shared/package*.json ./shared/

# Install dependencies
RUN cd shared && npm ci --only=production && cd ../api && npm ci --only=production

# Copy source code
COPY api/ ./api/
COPY shared/ ./shared/

# Set proper permissions
RUN chown -R redteam:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER redteam

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "api/src/server.js"]