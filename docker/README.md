# `docker/` — Container Orchestration

## Purpose

The `docker/` directory contains **production-grade Dockerfiles** for each service in the platform. All containers are designed with multi-stage builds, non-root users, health checks, and proper signal handling via `dumb-init`.

## Directory Structure

```
docker/
├── backend/
│   └── Dockerfile          # Express API container (3-stage: base → dev → prod)
├── frontend/
│   └── Dockerfile          # React app container (3-stage: base → build → nginx)
└── database/
    └── Dockerfile          # PostgreSQL 15 container with migration auto-loading
```

## Orchestration

All services are orchestrated via `docker-compose.yml` at the project root:

```bash
# Start full stack
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Development mode (uses development stage target)
docker-compose --profile dev up -d
```

## Container Details

### Backend (`docker/backend/Dockerfile`)

| Aspect | Value |
|---|---|
| Base image | `node:18-alpine` |
| Stages | `base` → `development` → `production` |
| Port | 5000 |
| User | `redteam:nodejs` (non-root) |
| Signal handling | `dumb-init` |
| Health check | `curl -f http://localhost:5000/health` |

### Frontend (`docker/frontend/Dockerfile`)

| Aspect | Value |
|---|---|
| Base image | `node:18-alpine` (build) → `nginx:alpine` (serve) |
| Stages | `base` → `development` → `build` → `production` |
| Port | 80 |
| User | `nginx:nginx` (non-root) |
| Signal handling | `dumb-init` |
| Health check | `curl -f http://localhost:80/` |

### Database (`docker/database/Dockerfile`)

| Aspect | Value |
|---|---|
| Base image | `postgres:15-alpine` |
| Default DB | `redteam_automation` |
| User | `postgres` |
| Migrations | Auto-loaded from `supabase/migrations/*.sql` |
| Health check | `pg_isready -U postgres -d redteam_automation` |

## File Interactions

- `docker-compose.yml` references these Dockerfiles for build contexts
- `nginx.conf` (root) is copied into the frontend production container
- Database migrations from `supabase/migrations/` are COPY'd into the PostgreSQL init directory
