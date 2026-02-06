# Middleware

Express middleware functions for security, logging, performance, and validation.

## 📁 Structure

```
middleware/
├── assets.ts          # Static asset serving
├── authorize.ts       # Authorization middleware
├── cache.ts           # Caching layer
├── errorHandler.ts    # Global error handling
├── performance.ts     # Performance monitoring
├── rateLimit.ts       # Rate limiting
├── requestLogger.ts   # HTTP request logging
└── validation.ts      # Request body validation
```

---

## 🔒 Authorization (authorize.ts)

### Purpose
Check if user has required permissions/roles before accessing protected routes.

### Usage

```typescript
import { authorize } from '../middleware/authorize';

// Require specific role
app.get('/admin', authorize(['admin']), adminHandler);

// Require multiple roles
app.post('/reports', authorize(['admin', 'user']), reportHandler);
```

### Roles

| Role | Description |
|------|-------------|
| admin | Full access to all resources |
| user | Limited access to own resources |
| viewer | Read-only access |

---

## 🚦 Rate Limiting (rateLimit.ts)

### Purpose
Limit number of requests to prevent abuse.

### Configuration

```typescript
// Auth routes: 5 requests per 15 minutes
rateLimiter: {
  windowMs: 15 * 60 * 1000,
  max: 5
}

// All API routes: 100 requests per 15 minutes
rateLimiter: {
  windowMs: 15 * 60 * 1000,
  max: 100
}
```

### Usage

```typescript
import { rateLimiter } from '../middleware/performance';

app.use('/api/', rateLimiter);
```

---

## ✅ Validation (validation.ts)

### Purpose
Validate request bodies using express-validator.

### Example

```typescript
import { body, validationResult } from 'express-validator';

export const validateProgram = [
  body('name').isString().trim().notEmpty(),
  body('platform').isIn(['hackerone', 'bugcrowd', 'devpost']),
  body('scope').isString().notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Use in routes
app.post('/programs', validateProgram, createProgram);
```

---

## 📝 Request Logging (requestLogger.ts)

### Purpose
Log all HTTP requests with timing and response status.

### Output

```json
{
  "method": "GET",
  "url": "/api/programs",
  "status": 200,
  "duration": "45ms",
  "ip": "::1",
  "userAgent": "curl/8.7.1"
}
```

---

## 💾 Caching (cache.ts)

### Purpose
Cache responses to reduce database load.

### Usage

```typescript
import { cache } from '../middleware/cache';

// Cache response for 5 minutes
app.get('/api/stats', cache(5 * 60 * 1000), getStats);
```

---

## 🚨 Error Handling (errorHandler.ts)

### Purpose
Centralized error handling and consistent error responses.

### Error Response Format

```json
{
  "error": "Resource not found",
  "message": "Program with id 123 does not exist",
  "status": 404,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 📊 Performance (performance.ts)

### Purpose
Track response times and slow endpoints.

### Usage

```typescript
import { slowDown } from '../middleware/performance';

// Slow down by 500ms in development (for testing)
if (process.env.NODE_ENV === 'development') {
  app.use(slowDown(500));
}
```

---

## 🔧 Global Middleware Order

Applied in `server.ts`:

1. CORS headers
2. Compression
3. JSON body parser
4. Request logger
5. Security headers
6. Rate limiting (production)
7. API routes