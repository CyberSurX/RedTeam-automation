FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for networking tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    nmap \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/reports/output

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

# Run the gateway
CMD ["uvicorn", "gateway:app", "--host", "0.0.0.0", "--port", "8080"]
