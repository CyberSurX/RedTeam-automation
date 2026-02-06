# Docker Configurations

Docker container configurations for development and production deployment.

## 📁 Structure

```
docker/
├── backend/
│   └── Dockerfile          # Backend container
├── frontend/
│   └── Dockerfile          # Frontend container
└── database/
    └── Dockerfile          # PostgreSQL container
```

## 🚀 Quick Start

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📦 Container Images

| Container | Base Image | Port | Purpose |
|-----------|-------------|------|---------|
| backend | node:20-alpine | 3001 | Express API |
| frontend | nginx:alpine | 80 | React frontend |
| database | postgres:16-alpine | 5432 | PostgreSQL |

---

## 🔧 Backend Dockerfile

Located in `docker/backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:backend

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/api/node_modules ./api/node_modules
EXPOSE 3001
CMD ["node", "dist/api/server.js"]
```

### Build Backend Image

```bash
cd docker/backend
docker build -t redteam-backend .
```

---

## 🎨 Frontend Dockerfile

Located in `docker/frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:frontend

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build Frontend Image

```bash
cd docker/frontend
docker build -t redteam-frontend .
```

---

## 🗄️ Database Dockerfile

Located in `docker/database/Dockerfile`

```dockerfile
FROM postgres:16-alpine
ENV POSTGRES_USER=redteam
ENV POSTGRES_PASSWORD=redteam
ENV POSTGRES_DB=redteam_automation
COPY init.sql /docker-entrypoint-initdb.d/
EXPOSE 5432
```

---

## 🐳 Docker Compose

Located at `docker-compose.yml`

```yaml
version: '3.8'
services:
  backend:
    build: ./docker/backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://redteam:redteam@database:5432/redteam_automation
    depends_on:
      - database
      - redis

  frontend:
    build: ./docker/frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  database:
    build: ./docker/database
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Start All Services

```bash
docker-compose up -d
```

### Stop All Services

```bash
docker-compose down
```

### Remove All Data

```bash
docker-compose down -v
```

---

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Backend port | 3001 |
| DATABASE_URL | PostgreSQL connection | - |
| REDIS_URL | Redis connection | - |

---

## 🐛 Common Issues

**Container not starting:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Database connection refused:**
- Check database container is running: `docker-compose ps`
- Verify environment variables in docker-compose.yml

**Port already in use:**
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:80 | xargs kill -9
```