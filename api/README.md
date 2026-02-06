# Backend API Server

Express.js + TypeScript backend with TypeORM and PostgreSQL.

## 📁 Structure

```
api/
├── server.ts              # Main server entry point
├── nodemon.json           # Hot-reload configuration
├── package.json           # Dependencies
├── middleware/            # Express middleware
├── monitoring/            # Health checks and alerts
├── routes/                # API endpoints
├── src/
│   ├── entities/          # TypeORM database models
│   ├── services/          # Business logic
│   ├── config/            # Configuration
│   └── utils/             # Utility functions
├── tests/                 # Backend tests
├── types/                 # TypeScript type definitions
├── utils/                 # Shared utilities
└── logs/                  # Application logs
```

## 🚀 Start Development Server

```bash
# From root directory
npm run dev:backend

# Or directly from api directory
cd api
npm run dev
```

Server runs on **port 3001** by default.

## 🧪 Run Tests

```bash
cd api
npm test
```

## 🔧 Environment Variables

Required in `.env`:

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=redteam_automation
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT
JWT_SECRET=your-jwt-secret

# Redis
REDIS_URL=redis://localhost:6379
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/readiness` | Readiness probe |
| GET | `/metrics` | Application metrics |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/programs` | List programs |
| GET | `/api/findings` | List findings |
| POST | `/api/scan` | Start scan |
| GET | `/api/stats` | Statistics |
| POST | `/api/ai/*` | AI endpoints |

## 📊 Monitoring

- **Health:** http://localhost:3001/health
- **Metrics:** http://localhost:3001/metrics
- **Logs:** `api/logs/combined.log`

## 🔑 Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| typeorm | ORM |
| pg | PostgreSQL client |
| redis | Cache/Queue |
| socket.io | Real-time communication |
| jwt | Authentication |
| winston | Logging |

## 🐛 Common Issues

**Database not connecting:**
- Check PostgreSQL is running: `brew services list | grep postgres`
- Verify credentials in `.env`

**Redis not connecting:**
- Check Redis is running: `brew services list | grep redis`

**Port already in use:**
```bash
lsof -ti:3001 | xargs kill -9
```