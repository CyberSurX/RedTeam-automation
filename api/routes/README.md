# API Routes

Express API route handlers organized by feature.

## 📁 Structure

```
routes/
├── ai.ts          # AI-powered analysis endpoints
├── api.ts        # Generic API routes
├── auth.ts       # Authentication (login, register)
├── findings.ts   # Vulnerability finding CRUD
├── programs.ts   # Bug bounty program management
├── scan.ts       # Scan initiation and management
├── stats.ts      # Statistics and analytics
└── users.ts      # User management
```

---

## 🔐 Authentication Routes (auth.ts)

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login with credentials | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/refresh` | Refresh access token | Yes |

### Example Usage

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📊 Program Routes (programs.ts)

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/programs` | List all programs | Yes |
| GET | `/api/programs/:id` | Get program details | Yes |
| POST | `/api/programs` | Create program | Yes (Admin) |
| PUT | `/api/programs/:id` | Update program | Yes (Admin) |
| DELETE | `/api/programs/:id` | Delete program | Yes (Admin) |

### Example Usage

```bash
# Get all programs (with JWT token)
curl -X GET http://localhost:3001/api/programs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create new program
curl -X POST http://localhost:3001/api/programs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Program","platform":"hackerone","scope":"*.example.com"}'
```

---

## 🔍 Finding Routes (findings.ts)

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/findings` | List all findings | Yes |
| GET | `/api/findings/:id` | Get finding details | Yes |
| POST | `/api/findings` | Create finding | Yes |
| PUT | `/api/findings/:id` | Update finding | Yes |
| DELETE | `/api/findings/:id` | Delete finding | Yes |
| POST | `/api/findings/:id/submit` | Submit to platform | Yes |

---

## 🎯 Scan Routes (scan.ts)

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/scan/start` | Start new scan | Yes |
| GET | `/api/scan/:id` | Get scan status | Yes |
| GET | `/api/scan` | List all scans | Yes |
| POST | `/api/scan/:id/stop` | Stop scan | Yes |

### Example Usage

```bash
# Start a scan
curl -X POST http://localhost:3001/api/scan/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target":"https://example.com","type":"recon","options":{}}'

# Get scan status
curl -X GET http://localhost:3001/api/scan/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🤖 AI Routes (ai.ts)

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/ai/analyze` | Analyze finding | Yes |
| POST | `/api/ai/triage` | AI triage findings | Yes |
| POST | `/api/ai/generate-poc` | Generate PoC | Yes |

---

## 📈 Stats Routes (stats.ts)

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/stats/overview` | Overview statistics | Yes |
| GET | `/api/stats/programs` | Program stats | Yes |
| GET | `/api/stats/findings` | Finding stats | Yes |

---

## 👤 User Routes (users.ts)

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/users` | List users | Yes (Admin) |
| GET | `/api/users/:id` | Get user details | Yes |
| PUT | `/api/users/:id` | Update user | Yes (Self/Admin) |
| DELETE | `/api/users/:id` | Delete user | Yes (Admin) |

---

## 🔒 Authentication

All endpoints (except `/api/auth/*`) require JWT authentication.

Add the header to your requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔧 Middleware Applied

- **Rate Limiting:** Applied to `/api/auth/*` routes
- **Validation:** Request body validation
- **Authorization:** JWT token verification
- **Error Handling:** Centralized error responses