# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for reconnaissance tools
RUN apk add --no-cache \
    curl \
    bash \
    git \
    go \
    make \
    gcc \
    musl-dev \
    ca-certificates

# Install Go-based reconnaissance tools
RUN go install -v github.com/owasp-amass/amass/v3/cmd/amass@latest && \
    go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest && \
    go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest && \
    go install -v github.com/projectdiscovery/naabu/v2/cmd/naabu@latest && \
    go install -v github.com/projectdiscovery/wappalyzergo/cmd/wappalyzergo@latest

# Install Python-based tools
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir whatweb

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S redteam -u 1001 -G nodejs

# Copy package files
COPY services/recon/package*.json ./services/recon/
COPY shared/package*.json ./shared/

# Install dependencies
RUN cd shared && npm ci --only=production && cd ../services/recon && npm ci --only=production

# Copy source code
COPY services/recon/ ./services/recon/
COPY shared/ ./shared/

# Set proper permissions
RUN chown -R redteam:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER redteam

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start the service
CMD ["node", "services/recon/src/server.js"]