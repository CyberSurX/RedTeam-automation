# Backend Configuration

Configuration files for database, authentication, caching, and service initialization.

## 📁 Structure

```
config/
├── data-source.ts    # TypeORM data source configuration
├── database.ts       # Database connection utilities
├── redis.ts          # Redis client configuration
└── auth.ts           # Authentication and JWT configuration
```

---

## 🗄️ Data Source (data-source.ts)

### Purpose
TypeORM DataSource configuration for PostgreSQL connection and entity management.

### Configuration

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [User, Program, Finding, Report],
  subscribers: [],
  migrations: [],
})
```

### Key Settings

| Setting | Description |
|---------|-------------|
| synchronize | Auto-create schema in development |
| logging | SQL query logging in development |
| entities | Database entity classes |

### Functions

```typescript
// Initialize database connection
await AppDataSource.initialize()

// Close database connection
await AppDataSource.destroy()
```

---

## 🔗 Database (database.ts)

### Purpose
Database connection utilities and helper functions.

### Functions

| Function | Description |
|----------|-------------|
| `initializeDatabase()` | Initialize TypeORM connection |
| `getConnection()` | Get active database connection |
| `closeDatabase()` | Close database connection |

### Usage

```typescript
import { initializeDatabase } from './database';

// Initialize on server start
await initializeDatabase();
```

---

## 🔴 Redis (redis.ts)

### Purpose
Redis client configuration for caching and job queue.

### Configuration

```typescript
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
```

### Usage

```typescript
// Set value
await redis.set('key', 'value');

// Get value
const value = await redis.get('key');

// Set with expiration
await redis.set('key', 'value', 'EX', 3600);

// Delete key
await redis.del('key');

// Check connection
await redis.ping(); // Returns 'PONG'
```

### Redis Patterns Used

| Pattern | Purpose | Example |
|---------|---------|---------|
| Caching | Store frequently accessed data | `cache:user:${userId}` |
| Session Store | User session data | `session:${sessionId}` |
| Job Queue | Bull queue storage | `bull:scan:*` |
| Rate Limiting | Request rate limiting | `ratelimit:${ip}` |

---

## 🔐 Auth (auth.ts)

### Purpose
JWT authentication configuration and helper functions.

### Configuration

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
```

### Functions

| Function | Description |
|----------|-------------|
| `generateToken(payload)` | Generate JWT token |
| `verifyToken(token)` | Verify and decode JWT token |
| `hashPassword(password)` | Hash password with bcrypt |
| `comparePassword(password, hash)` | Compare password with hash |

### Usage

```typescript
import { generateToken, verifyToken } from './auth';

// Generate token
const token = generateToken({
  userId: user.id,
  username: user.username,
  role: user.role
});

// Verify token
const decoded = verifyToken(token);
// Returns: { userId, username, role, iat, exp }

// Hash password
const hashedPassword = await hashPassword('password123');

// Compare password
const isValid = await comparePassword('password123', hashedPassword);
```

---

## 🔑 Environment Variables

Required configuration:

```bash
# Database (PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=myz21
POSTGRES_PASSWORD=postgres
POSTGRES_DB=redteam_automation

# Database (TypeORM format)
DATABASE_URL=postgresql://myz21:postgres@localhost:5432/redteam_automation

# Redis
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

---

## 🚀 Initialization Order

Configuration is initialized in this order in `server.ts`:

1. Load environment variables (`dotenv`)
2. Configure TypeORM data source
3. Initialize database connection (non-blocking)
4. Configure Redis client
5. Set up JWT authentication
6. Start Express server

---

## 🐛 Troubleshooting

**Database connection failed:**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Redis connection failed:**
```bash
# Check Redis is running
brew services list | grep redis

# Test connection
redis-cli ping
```

**JWT verification failed:**
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Ensure token is not expired
# Tokens expire after JWT_EXPIRES_IN (default: 7 days)
```