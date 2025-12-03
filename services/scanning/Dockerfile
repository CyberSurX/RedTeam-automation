# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for scanning tools
RUN apk add --no-cache \
    curl \
    bash \
    git \
    go \
    make \
    gcc \
    musl-dev \
    ca-certificates \
    nmap \
    nmap-scripts \
    masscan \
    python3 \
    py3-pip \
    ruby \
    ruby-dev \
    build-base \
    libffi-dev \
    openssl-dev \
    libxml2-dev \
    libxslt-dev \
    zlib-dev

# Install Go-based scanning tools
RUN go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest && \
    go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest && \
    go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest

# Install Python-based tools
RUN pip3 install --no-cache-dir \
    python-nmap \
    zapcli

# Install OWASP ZAP
RUN wget -O zap.tar.gz https://github.com/zaproxy/zaproxy/releases/download/v2.12.0/ZAP_2.12.0_Linux.tar.gz && \
    tar -xzf zap.tar.gz && \
    mv ZAP_2.12.0 /opt/zap && \
    rm zap.tar.gz

# Install Nikto
RUN git clone https://github.com/sullo/nikto.git /opt/nikto

# Install testssl.sh
RUN git clone https://github.com/drwetter/testssl.sh.git /opt/testssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S redteam -u 1001 -G nodejs

# Copy package files
COPY services/scanning/package*.json ./services/scanning/
COPY shared/package*.json ./shared/

# Install dependencies
RUN cd shared && npm ci --only=production && cd ../services/scanning && npm ci --only=production

# Copy source code
COPY services/scanning/ ./services/scanning/
COPY shared/ ./shared/

# Set proper permissions
RUN chown -R redteam:nodejs /app && \
    chmod -R 755 /app && \
    chown -R redteam:nodejs /opt/zap /opt/nikto /opt/testssl && \
    chmod -R 755 /opt/zap /opt/nikto /opt/testssl

# Switch to non-root user
USER redteam

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Start the service
CMD ["node", "services/scanning/src/server.js"]