# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git \
    python3 \
    py3-pip \
    build-base

# Install Python packages for report generation
RUN pip3 install --no-cache-dir \
    jinja2 \
    markdown \
    pdfkit \
    weasyprint

# Install wkhtmltopdf for PDF generation
RUN apk add --no-cache wkhtmltopdf

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S redteam -u 1001 -G nodejs

# Copy package files
COPY services/reporting/package*.json ./services/reporting/
COPY shared/package*.json ./shared/

# Install dependencies
RUN cd shared && npm ci --only=production && cd ../services/reporting && npm ci --only=production

# Copy source code
COPY services/reporting/ ./services/reporting/
COPY shared/ ./shared/

# Set proper permissions
RUN chown -R redteam:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER redteam

# Expose port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3006/health || exit 1

# Start the service
CMD ["node", "services/reporting/src/server.js"]