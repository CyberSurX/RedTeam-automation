# RedTeam Automation Orchestrator API

This is the API Integration Layer for the CyberSurhub RedTeam Automation Orchestrator. 
It provides a robust REST API for managing penetration testing missions via autonomous agents.

## Prerequisites

- Python 3.10+
- PostgreSQL
- Redis
- RabbitMQ

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and fill in the necessary values.
   ```bash
   cp .env.example .env
   ```

3. **Database and Brokers**:
   You can run the required services using docker-compose from the project root:
   ```bash
   cd ..
   docker compose up -d database redis rabbitmq
   ```

## Running the API

Start the API server using Uvicorn:
```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

## API Usage

All API endpoints require authentication via the `X-API-Key` header.

### Health Check
```bash
curl -H "X-API-Key: your-secret-api-key" http://localhost:8000/api/health
```

### Start a Scan Mission
```bash
curl -X POST http://localhost:8000/api/scan \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Acme Corp",
    "targets": ["example.com"],
    "intensity": "normal",
    "modules": ["web_scanner", "port_scanner"]
  }'
```
