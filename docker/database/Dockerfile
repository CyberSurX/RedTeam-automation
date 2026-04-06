# Database service Dockerfile
FROM postgres:15-alpine

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Set environment variables
ENV POSTGRES_DB=redteam_automation \
    POSTGRES_USER=postgres \
    POSTGRES_PASSWORD=postgres

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD pg_isready -U postgres -d redteam_automation || exit 1

# Expose PostgreSQL port
EXPOSE 5432

# Use custom entrypoint script if needed
# COPY ./docker/postgres-entrypoint.sh /usr/local/bin/
# RUN chmod +x /usr/local/bin/postgres-entrypoint.sh