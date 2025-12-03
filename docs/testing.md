# Testing Guide

Comprehensive testing guide for the RedTeam Automation Platform.

## 📋 Table of Contents

- [Testing Strategy](#-testing-strategy)
- [Quick Start](#-quick-start)
- [Test Environment Setup](#-test-environment-setup)
- [Unit Testing](#-unit-testing)
- [Integration Testing](#-integration-testing)
- [API Testing](#-api-testing)
- [Frontend Testing](#-frontend-testing)
- [Backend Testing](#-backend-testing)
- [Security Testing](#-security-testing)
- [Performance Testing](#-performance-testing)
- [End-to-End Testing](#-end-to-end-testing)
- [Test Data & Fixtures](#-test-data--fi
```

## 📈 Test Reporting and Coverage Analysis

### Coverage Configuration
```json
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/test-*.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        perFile: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
})
```

### Test Report Generation
```typescript
// tests/reports/test-report-generator.ts
import { writeFileSync } from 'fs'
import { format } from 'date-fns'

interface TestResult {
  suite: string
  test: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
}

interface TestReport {
  timestamp: string
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
  results: TestResult[]
  coverage?: {
    lines: number
    statements: number
    functions: number
    branches: number
  }
}

export class TestReportGenerator {
  private results: TestResult[] = []
  private startTime: number = Date.now()

  addResult(result: TestResult) {
    this.results.push(result)
  }

  generateReport(): TestReport {
    const duration = Date.now() - this.startTime
    const passed = this.results.filter(r => r.status === 'passed').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const skipped = this.results.filter(r => r.status === 'skipped').length

    return {
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      total: this.results.length,
      passed,
      failed,
      skipped,
      duration,
      results: this.results,
    }
  }

  generateHTMLReport(): string {
    const report = this.generateReport()
    const passRate = ((report.passed / report.total) * 100).toFixed(1)

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report - RedTeam Automation</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .metric { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
    .passed { color: #27ae60; }
    .failed { color: #e74c3c; }
    .skipped { color: #f39c12; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #34495e; color: white; }
    .status-passed { background-color: #d5f4e6; }
    .status-failed { background-color: #fadbd8; }
    .status-skipped { background-color: #fef9e7; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RedTeam Automation Test Report</h1>
    <p>Generated: ${report.timestamp}</p>
    <p>Duration: ${(report.duration / 1000).toFixed(2)}s</p>
  </div>
  
  <div class="summary">
    <div class="metric">
      <h3>Total Tests</h3>
      <h2>${report.total}</h2>
    </div>
    <div class="metric">
      <h3 class="passed">Passed</h3>
      <h2>${report.passed}</h2>
    </div>
    <div class="metric">
      <h3 class="failed">Failed</h3>
      <h2>${report.failed}</h2>
    </div>
    <div class="metric">
      <h3 class="skipped">Skipped</h3>
      <h2>${report.skipped}</h2>
    </div>
    <div class="metric">
      <h3>Pass Rate</h3>
      <h2>${passRate}%</h2>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Test Suite</th>
        <th>Test Case</th>
        <th>Status</th>
        <th>Duration (ms)</th>
        <th>Error</th>
      </tr>
    </thead>
    <tbody>
      ${report.results.map(result => `
        <tr class="status-${result.status}">
          <td>${result.suite}</td>
          <td>${result.test}</td>
          <td>${result.status.toUpperCase()}</td>
          <td>${result.duration}</td>
          <td>${result.error || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `.trim()
  }

  saveReport(filename: string) {
    const html = this.generateHTMLReport()
    writeFileSync(filename, html)
    console.log(`Test report saved to ${filename}`)
  }
}
```

### Performance Test Reporting
```javascript
// tests/reports/performance-report.js
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js'

export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-metrics.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: {
        http_req_duration: data.metrics.http_req_duration,
        http_req_failed: data.metrics.http_req_failed,
        vus: data.metrics.vus,
        iterations: data.metrics.iterations,
      },
      thresholds: data.root_group.checks || [],
    }, null, 2),
  }
}

// Performance test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
}
```

### Coverage Badge Generation
```bash
#!/bin/bash
# scripts/generate-coverage-badge.sh

# Generate coverage report
npm run test:coverage

# Extract coverage percentages
LINES=$(npx nyc report --reporter=text-summary | grep "Lines" | awk '{print $3}' | sed 's/%//')
FUNCTIONS=$(npx nyc report --reporter=text-summary | grep "Functions" | awk '{print $3}' | sed 's/%//')
BRANCHES=$(npx nyc report --reporter=text-summary | grep "Branches" | awk '{print $3}' | sed 's/%//')

# Determine badge color based on coverage
if (( $(echo "$LINES >= 90" | bc -l) )); then
    COLOR="brightgreen"
elif (( $(echo "$LINES >= 80" | bc -l) )); then
    COLOR="green"
elif (( $(echo "$LINES >= 70" | bc -l) )); then
    COLOR="yellow"
elif (( $(echo "$LINES >= 60" | bc -l) )); then
    COLOR="orange"
else
    COLOR="red"
fi

# Generate badge URL
BADGE_URL="https://img.shields.io/badge/coverage-${LINES}%25-${COLOR}"

# Download badge
curl -s "$BADGE_URL" > coverage-badge.svg

echo "Coverage badge generated: coverage-badge.svg"
echo "Lines: ${LINES}%"
echo "Functions: ${FUNCTIONS}%"
echo "Branches: ${BRANCHES}%"
```

### Test Report Dashboard
```typescript
// tests/reports/dashboard.ts
import express from 'express'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const app = express()
const PORT = process.env.PORT || 3001

interface TestRun {
  timestamp: string
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
  coverage?: any
}

app.get('/api/test-runs', (req, res) => {
  const reportsDir = join(__dirname, '../reports')
  const files = readdirSync(reportsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, 10)
  
  const runs = files.map(file => {
    const content = readFileSync(join(reportsDir, file), 'utf-8')
    return JSON.parse(content) as TestRun
  })
  
  res.json(runs)
})

app.get('/api/test-trends', (req, res) => {
  const reportsDir = join(__dirname, '../reports')
  const files = readdirSync(reportsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
  
  const trends = files.map(file => {
    const content = readFileSync(join(reportsDir, file), 'utf-8')
    const run = JSON.parse(content) as TestRun
    return {
      date: run.timestamp,
      passRate: (run.passed / run.total) * 100,
      total: run.total,
      duration: run.duration,
    }
  })
  
  res.json(trends)
})

app.use(express.static(join(__dirname, '../reports')))

app.listen(PORT, () => {
  console.log(`Test dashboard running on http://localhost:${PORT}`)
})
```

## 🔧 Troubleshooting Common Test Failures

### Database Connection Issues
```bash
# Error: Connection refused to PostgreSQL
# Solution: Check if PostgreSQL is running and accessible
psql $DATABASE_URL -c "SELECT version();"

# If connection fails, restart PostgreSQL
brew services restart postgresql  # macOS
sudo systemctl restart postgresql   # Linux

# Error: Database does not exist
# Solution: Create test database
createdb redteam_test

# Error: Permission denied
# Solution: Grant permissions to test user
psql -c "GRANT ALL PRIVILEGES ON DATABASE redteam_test TO postgres;"
```

### Redis Connection Issues
```bash
# Error: Connection refused to Redis
# Solution: Check Redis status and restart
redis-cli ping

# If connection fails
brew services restart redis  # macOS
sudo systemctl restart redis # Linux

# Error: Redis memory issues
# Solution: Increase memory limit in redis.conf
# Add to /usr/local/etc/redis.conf:
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Test Environment Issues
```bash
# Error: Environment variables not loaded
# Solution: Create proper .env.test file
cp .env.example .env.test
# Edit .env.test with test-specific values

# Error: Port already in use
# Solution: Find and kill process using port
lsof -ti:5173 | xargs kill -9  # Kill process on port 5173
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000

# Error: Module not found
# Solution: Install missing dependencies
npm install
npm install --save-dev @types packages
```

### Authentication Test Failures
```typescript
// Error: JWT token invalid or expired
// Solution: Check JWT secret and expiration
const token = jwt.sign(
  { userId: 'test-user-1', role: 'admin' },
  process.env.JWT_SECRET || 'test-secret',
  { expiresIn: '1h' }
)

// Error: User not found in database
// Solution: Ensure test user exists before auth tests
beforeEach(async () => {
  await createTestUser({
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'admin'
  })
})

// Error: Rate limiting blocking tests
// Solution: Disable rate limiting in test environment
if (process.env.NODE_ENV === 'test') {
  app.use('/api', rateLimit({ max: 10000 })) // Very high limit for tests
}
```

### API Test Failures
```typescript
// Error: Request timeout
// Solution: Increase timeout for long-running operations
const response = await request(app)
  .post('/api/jobs')
  .send({ target: 'example.com', tools: ['amass'] })
  .timeout(30000) // 30 second timeout

// Error: Database transaction conflicts
// Solution: Use separate test database or clean state
beforeEach(async () => {
  await cleanDatabase()
  await seedTestData()
})

// Error: External service dependencies
// Solution: Mock external services
jest.mock('../services/external-service', () => ({
  fetchData: jest.fn().mockResolvedValue({ status: 'ok' })
}))
```

### Frontend Test Failures
```typescript
// Error: Component not rendering
// Solution: Check required props and providers
render(
  <MemoryRouter>
    <AuthProvider>
      <Dashboard user={mockUser} />
    </AuthProvider>
  </MemoryRouter>
)

// Error: Async operations timing out
// Solution: Use proper async testing patterns
await waitFor(() => {
  expect(screen.getByText('Loading...')).toBeInTheDocument()
})

await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
}, { timeout: 5000 })

// Error: Mock functions not working
// Solution: Ensure mocks are properly configured
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>
mockedAxios.get.mockResolvedValue({ data: mockResponse })
```

### Performance Test Issues
```bash
# Error: k6 script compilation errors
# Solution: Check syntax and imports
k6 run --compatibility-mode=base tests/performance/load-test.js

# Error: Memory issues during load tests
# Solution: Reduce VU count or add memory flags
K6_VUS=100 K6_DURATION=5m k6 run tests/performance/load-test.js

# Error: Network timeouts under load
# Solution: Increase timeouts and add retries
export const options = {
  http: {
    timeout: '30s',
    retries: 3,
  },
}
```

### E2E Test Failures
```typescript
// Error: Element not found
// Solution: Add proper waits and selectors
cy.get('[data-testid="submit-button"]', { timeout: 10000 })
  .should('be.visible')
  .click()

// Error: Page load timeouts
// Solution: Increase page load timeout
cy.visit('/dashboard', { timeout: 30000 })

// Error: Authentication state lost
// Solution: Preserve auth state across tests
beforeEach(() => {
  cy.session('user-session', () => {
    cy.login('test@example.com', 'password')
  })
})
```

### Test Data Issues
```bash
# Error: Test data conflicts
# Solution: Use unique identifiers for test data
export const generateUniqueId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

# Error: Database cleanup failures
# Solution: Implement proper cleanup strategies
afterEach(async () => {
  await db.query('DELETE FROM jobs WHERE id LIKE \'test-%\'')
  await db.query('DELETE FROM users WHERE email LIKE \'%@test.example.com\'')
})

# Error: Mock data not matching real data structure
# Solution: Validate mock data against schemas
const schema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  status: Joi.string().valid('active', 'paused', 'completed')
})

const validatedMockData = schema.validate(mockProgram)
```

### CI/CD Test Failures
```yaml
# Error: GitHub Actions timeout
# Solution: Increase job timeout and optimize tests
timeout-minutes: 30
steps:
  - name: Run optimized tests
    run: npm run test:ci

# Error: Missing environment variables in CI
# Solution: Set up proper secrets and environment
env:
  DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
  JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
  REDIS_URL: ${{ secrets.TEST_REDIS_URL }}

# Error: Docker container startup failures
# Solution: Add health checks and wait conditions
services:
  postgres:
    image: postgres:15
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### Common Debugging Commands
```bash
# Check test environment
npm run test:env-check

# Run tests with verbose output
npm run test -- --verbose

# Run specific test file with debugging
node --inspect-brk ./node_modules/.bin/jest tests/api/auth.test.ts

# Check test coverage interactively
npm run test:coverage -- --watch

# Generate detailed test report
npm run test:report

# Check for memory leaks
node --trace-warnings ./node_modules/.bin/jest

# Profile test performance
node --prof ./node_modules/.bin/jest
node --prof-process isolate-*.log > profile.txt
```

### Test Maintenance Best Practices
```typescript
// Regular test health checks
const flakyTests = [
  'tests/api/jobs.test.ts:45', // Known timing issue
  'tests/e2e/workflow.test.ts:123', // External dependency
]

// Test stability metrics
interface TestMetrics {
  testId: string
  passRate: number
  avgDuration: number
  lastFailure: Date
  failureReason: string
}

// Automated test cleanup
const cleanupStaleTestData = async () => {
  const staleDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
  await db.query('DELETE FROM test_data WHERE created_at < $1', [staleDate])
}
```
```
```
```

## 🚀 CI/CD Testing Automation

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_ENV: test
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/redteam_test
  REDIS_URL: redis://localhost:6379/1
  JWT_SECRET: test-jwt-secret

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: redteam_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        npm install -g k6
    
    - name: Setup test database
      run: |
        npm run db:migrate:test
        npm run db:seed:test
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run API tests
      run: npm run test:api
    
    - name: Run security tests
      run: npm run test:security
    
    - name: Run performance tests
      run: npm run test:performance
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: |
          coverage/
          test-results/
          cypress/screenshots/
          cypress/videos/
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  e2e:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup environment
      run: |
        cp .env.example .env.test
        docker-compose -f docker-compose.test.yml up -d
    
    - name: Run E2E tests
      run: |
        npm run test:e2e:ci
    
    - name: Cleanup
      if: always()
      run: docker-compose -f docker-compose.test.yml down

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

  performance:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup k6
      run: |
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    
    - name: Run performance tests
      run: |
        npm run test:performance:ci
        k6 run tests/performance/load-test.js
```

### Docker Compose for Testing
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-api:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://postgres:postgres@test-db:5432/redteam_test
      - REDIS_URL=redis://test-redis:6379/1
      - JWT_SECRET=test-jwt-secret
    depends_on:
      - test-db
      - test-redis
    volumes:
      - ./coverage:/app/coverage
      - ./test-results:/app/test-results
    command: npm run test:all

  test-db:
    image: postgres:15
    environment:
      - POSTGRES_DB=redteam_test
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - test-postgres-data:/var/lib/postgresql/data
      - ./tests/fixtures/test-data.sql:/docker-entrypoint-initdb.d/test-data.sql

  test-redis:
    image: redis:7
    volumes:
      - test-redis-data:/data

  test-e2e:
    image: mcr.microsoft.com/playwright:v1.40.0-jammy
    working_dir: /app
    volumes:
      - .:/app
    command: |
      bash -c "
        npm ci &&
        npx playwright install &&
        npm run test:e2e
      "
    depends_on:
      - test-api
      - test-db
      - test-redis

volumes:
  test-postgres-data:
  test-redis-data:xtures)
- [CI/CD Testing](#-cicd-testing)
- [Test Reporting](#-test-reporting)
- [Troubleshooting](#-troubleshooting)
- [Best Practices](#-best-practices)

## 🧪 Testing Strategy

### Test Levels
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Service interaction testing
3. **End-to-End Tests**: Complete workflow testing
4. **Security Tests**: Vulnerability and penetration testing
5. **Performance Tests**: Load and stress testing

### Test Categories
- **API Tests**: REST API endpoint validation
- **Database Tests**: Data integrity and queries
- **Service Tests**: Microservice functionality
- **UI Tests**: Frontend component testing
- **Tool Tests**: Security tool integration
- **Integration Tests**: Cross-service communication

### Test Coverage Requirements
- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: All API endpoints and service interactions
- **Security Tests**: OWASP Top 10 vulnerability coverage
- **Performance Tests**: 1000 concurrent users baseline
- **E2E Tests**: Complete user workflows from reconnaissance to reporting

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install additional testing tools
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest @types/supertest k6
```

### Run All Tests
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test suite
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:security
pnpm test:performance
```

## 🔧 Test Environment Setup

### Environment Configuration
```bash
# Create test environment file
cat > .env.test << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/redteam_automation_test
REDIS_URL=redis://localhost:6380

# API Keys (Use test keys)
HACKERONE_API_KEY=test_hackerone_key
BUGCROWD_API_KEY=test_bugcrowd_key
JWT_SECRET=test_jwt_secret_key_for_testing_only

# Security Tools (Use mock paths)
AMASS_PATH=/usr/local/bin/amass
SUBFINDER_PATH=/usr/local/bin/subfinder
NAABU_PATH=/usr/local/bin/naabu
HTTPX_PATH=/usr/local/bin/httpx
NUCLEI_PATH=/usr/local/bin/nuclei
SQLMAP_PATH=/usr/local/bin/sqlmap

# Test Configuration
NODE_ENV=test
LOG_LEVEL=error
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
EOF
```

### Docker Test Environment
```bash
# Start test infrastructure
docker-compose -f docker-compose.test.yml up -d

# Or use individual services
docker run -d --name postgres-test -p 5432:5432 -e POSTGRES_DB=redteam_automation_test -e POSTGRES_PASSWORD=password postgres:15
docker run -d --name redis-test -p 6380:6379 redis:7-alpine
```

### Test Database Setup
```bash
# Create test database
psql -U postgres -c "CREATE DATABASE redteam_automation_test;"

# Run migrations on test database
psql -U postgres -d redteam_automation_test -f database/init.sql

# Or use migration script
pnpm migrate:test
```

## ⚙️ Backend Testing

### Jest Configuration
```javascript
// api/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
}
```

### Supertest API Testing
```typescript
// api/tests/routes/auth.test.ts
import request from 'supertest'
import { app } from '../../src/app'
import { pool } from '../../src/database'

describe('Auth Routes', () => {
  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com'])
  })

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com'])
    await pool.end()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(201)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe('test@example.com')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200)

      expect(response.body).toHaveProperty('token')
  })
```

## 🔄 End-to-End Testing

### Cypress E2E Setup
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
```

### Complete Workflow Tests
```typescript
// cypress/e2e/complete-workflow.cy.ts
describe('Complete Bug Bounty Workflow', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.login('test@example.com', 'TestPassword123!')
  })

  it('should complete reconnaissance to reporting workflow', () => {
    // 1. Create a new program
    cy.visit('/programs')
    cy.get('[data-testid="add-program"]').click()
    cy.get('[data-testid="program-name"]').type('Test Program')
    cy.get('[data-testid="program-platform"]').select('hackerone')
    cy.get('[data-testid="program-url"]').type('https://hackerone.com/test')
    cy.get('[data-testid="save-program"]').click()

    // Verify program was created
    cy.contains('Test Program').should('be.visible')

    // 2. Start reconnaissance job
    cy.visit('/reconnaissance')
    cy.get('[data-testid="target-domain"]').type('example.com')
    cy.get('[data-testid="select-tools"]').click()
    cy.get('[data-testid="tool-amass"]').check()
    cy.get('[data-testid="tool-subfinder"]').check()
    cy.get('[data-testid="start-recon"]').click()

    // Verify job started
    cy.contains('Reconnaissance job started').should('be.visible')

    // 3. Monitor job progress
    cy.visit('/jobs')
    cy.get('[data-testid="job-status"]').should('contain', 'running')

    // Wait for job completion (with timeout)
    cy.get('[data-testid="job-status"]', { timeout: 30000 })
      .should('contain', 'completed')

    // 4. Review findings
    cy.visit('/findings')
    cy.get('[data-testid="findings-table"]').should('be.visible')
    cy.get('[data-testid="finding-row"]').should('have.length.at.least', 1)

    // 5. Create report
    cy.get('[data-testid="create-report"]').click()
    cy.get('[data-testid="report-title"]').type('Security Assessment Report')
    cy.get('[data-testid="report-description"]').type('Automated security findings')
    cy.get('[data-testid="generate-report"]').click()

    // Verify report was created
    cy.contains('Report generated successfully').should('be.visible')
  })

  it('should handle job failures gracefully', () => {
    cy.visit('/reconnaissance')
    
    // Enter invalid target to trigger failure
    cy.get('[data-testid="target-domain"]').type('invalid-domain-12345')
    cy.get('[data-testid="start-recon"]').click()

    // Verify error handling
    cy.contains('Invalid domain format').should('be.visible')
    cy.get('[data-testid="job-status"]').should('contain', 'failed')
  })
})
```

## 📊 Test Data and Fixtures

### Mock Data Generation
```typescript
// tests/fixtures/mock-data.ts
export const generateMockPrograms = (count: number = 5) => {
  const platforms = ['hackerone', 'bugcrowd', 'intigriti']
  const statuses = ['active', 'paused', 'completed']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `program-${i + 1}`,
    name: `Test Program ${i + 1}`,
    platform: platforms[i % platforms.length],
    url: `https://${platforms[i % platforms.length]}.com/program-${i + 1}`,
    status: statuses[i % statuses.length],
    created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  }))
}

export const generateMockFindings = (count: number = 10) => {
  const severities = ['critical', 'high', 'medium', 'low', 'info']
  const types = ['subdomain', 'port', 'vulnerability', 'ssl_issue']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `finding-${i + 1}`,
    type: types[i % types.length],
    severity: severities[i % severities.length],
    title: `${types[i % types.length].toUpperCase()} Finding ${i + 1}`,
    description: `This is a mock ${types[i % types.length]} finding`,
    target: `target-${i % 3 + 1}.com`,
    tool: ['amass', 'nmap', 'nuclei', 'sslscan'][i % 4],
    confidence: Math.floor(Math.random() * 100),
    created_at: new Date(Date.now() - i * 60 * 60 * 1000),
  }))
}

export const generateMockJobs = (count: number = 8) => {
  const types = ['reconnaissance', 'scanning', 'exploitation', 'reporting']
  const statuses = ['pending', 'running', 'completed', 'failed', 'cancelled']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `job-${i + 1}`,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    target: `target-${i % 3 + 1}.com`,
    progress: statuses[i % statuses.length] === 'completed' ? 100 : Math.floor(Math.random() * 99),
    started_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
    completed_at: statuses[i % statuses.length] === 'completed' ? new Date() : null,
    error: statuses[i % statuses.length] === 'failed' ? 'Mock error occurred' : null,
  }))
}
```

### Database Fixtures
```sql
-- tests/fixtures/test-data.sql
-- Insert test programs
INSERT INTO programs (id, name, platform, url, status, created_at, updated_at) VALUES
('test-program-1', 'HackerOne Public Program', 'hackerone', 'https://hackerone.com/security', 'active', NOW(), NOW()),
('test-program-2', 'Bugcrowd Public Program', 'bugcrowd', 'https://bugcrowd.com/program', 'active', NOW(), NOW()),
('test-program-3', 'Intigriti Program', 'intigriti', 'https://intigriti.com/program', 'paused', NOW(), NOW());

-- Insert test users
INSERT INTO users (id, email, username, role, created_at, updated_at) VALUES
('test-user-1', 'admin@example.com', 'admin', 'admin', NOW(), NOW()),
('test-user-2', 'user@example.com', 'user', 'user', NOW(), NOW()),
('test-user-3', 'readonly@example.com', 'readonly', 'readonly', NOW(), NOW());

-- Insert test jobs
INSERT INTO jobs (id, type, status, target, progress, started_at, completed_at, user_id) VALUES
('test-job-1', 'reconnaissance', 'completed', 'example.com', 100, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'test-user-1'),
('test-job-2', 'scanning', 'running', 'example.com', 45, NOW() - INTERVAL '30 minutes', NULL, 'test-user-2'),
('test-job-3', 'exploitation', 'pending', 'test.com', 0, NULL, NULL, 'test-user-1');

-- Insert test findings
INSERT INTO findings (id, type, severity, title, description, target, tool, confidence, job_id, created_at) VALUES
('test-finding-1', 'subdomain', 'medium', 'Subdomain Discovery', 'Found 15 subdomains', 'example.com', 'amass', 95, 'test-job-1', NOW()),
('test-finding-2', 'port', 'high', 'Open Port Detection', 'Port 22 is open', 'example.com', 'nmap', 100, 'test-job-2', NOW()),
('test-finding-3', 'vulnerability', 'critical', 'SQL Injection', 'SQL injection in login form', 'example.com', 'sqlmap', 90, 'test-job-1', NOW());
```

### API Test Fixtures
```typescript
// tests/fixtures/api-fixtures.ts
export const mockAuthTokens = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTczNTY4OTYwMH0.mock',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTYwOTQ1MjAwMH0.expired',
  invalid: 'invalid-token-format',
}

export const mockApiResponses = {
  programs: {
    list: {
      data: generateMockPrograms(3),
      total: 3,
      page: 1,
      limit: 10,
    },
    single: {
      id: 'test-program-1',
      name: 'Test Program',
      platform: 'hackerone',
      url: 'https://hackerone.com/test',
      status: 'active',
    },
  },
  findings: {
    list: {
      data: generateMockFindings(5),
      total: 5,
      critical: 1,
      high: 2,
      medium: 2,
    },
  },
  jobs: {
    create: {
      id: 'new-job-123',
      type: 'reconnaissance',
      status: 'pending',
      target: 'example.com',
      progress: 0,
    },
    status: {
      id: 'running-job-456',
      type: 'scanning',
      status: 'running',
      target: 'example.com',
      progress: 67,
    },
  },
}

export const mockErrorResponses = {
  unauthorized: {
    error: 'Unauthorized',
    message: 'Invalid or expired token',
    code: 'AUTH_INVALID_TOKEN',
  },
  notFound: {
    error: 'Not Found',
    message: 'Resource not found',
    code: 'RESOURCE_NOT_FOUND',
  },
  validation: {
    error: 'Validation Error',
    message: 'Invalid input data',
    code: 'VALIDATION_ERROR',
    details: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password too weak' },
    ],
  },
  rateLimit: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },
}
```

### Test Data Management Commands
```bash
#!/bin/bash
# scripts/test-data.sh

# Load test data into database
load_test_data() {
  echo "Loading test data..."
  psql $DATABASE_URL -f tests/fixtures/test-data.sql
  echo "Test data loaded successfully"
}

# Clear test data
clear_test_data() {
  echo "Clearing test data..."
  psql $DATABASE_URL -c "
    DELETE FROM findings WHERE id LIKE 'test-%';
    DELETE FROM jobs WHERE id LIKE 'test-%';
    DELETE FROM programs WHERE id LIKE 'test-%';
    DELETE FROM users WHERE id LIKE 'test-%';
  "
  echo "Test data cleared"
}

# Generate mock data files
generate_mock_files() {
  echo "Generating mock data files..."
  node -e "
    const fs = require('fs');
    const { generateMockPrograms, generateMockFindings, generateMockJobs } = require('./tests/fixtures/mock-data');
    
    fs.writeFileSync('tests/fixtures/programs.json', JSON.stringify(generateMockPrograms(10), null, 2));
    fs.writeFileSync('tests/fixtures/findings.json', JSON.stringify(generateMockFindings(20), null, 2));
    fs.writeFileSync('tests/fixtures/jobs.json', JSON.stringify(generateMockJobs(15), null, 2));
    
    console.log('Mock data files generated');
  "
}

# Usage
if [ "$1" = "load" ]; then load_test_data
elif [ "$1" = "clear" ]; then clear_test_data
elif [ "$1" = "generate" ]; then generate_mock_files
else echo "Usage: $0 {load|clear|generate}"
fi
```
```

### Test Data Management Commands
```bash
#!/bin/bash
# scripts/test-data.sh

# Load test data into database
load_test_data() {
  echo "Loading test data..."
  psql $DATABASE_URL -f tests/fixtures/test-data.sql
  echo "Test data loaded successfully"
}

# Clear test data
clear_test_data() {
  echo "Clearing test data..."
  psql $DATABASE_URL -c "
    DELETE FROM findings WHERE id LIKE 'test-%';
    DELETE FROM jobs WHERE id LIKE 'test-%';
    DELETE FROM programs WHERE id LIKE 'test-%';
    DELETE FROM users WHERE id LIKE 'test-%';
  "
  echo "Test data cleared"
}

# Generate mock data files
generate_mock_files() {
  echo "Generating mock data files..."
  node -e "
    const fs = require('fs');
    const { generateMockPrograms, generateMockFindings, generateMockJobs } = require('./tests/fixtures/mock-data');
    
    fs.writeFileSync('tests/fixtures/programs.json', JSON.stringify(generateMockPrograms(10), null, 2));
    fs.writeFileSync('tests/fixtures/findings.json', JSON.stringify(generateMockFindings(20), null, 2));
    fs.writeFileSync('tests/fixtures/jobs.json', JSON.stringify(generateMockJobs(15), null, 2));
    
    console.log('Mock data files generated');
  "
}

# Usage
if [ "$1" = "load" ]; then load_test_data
elif [ "$1" = "clear" ]; then clear_test_data
elif [ "$1" = "generate" ]; then generate_mock_files
else echo "Usage: $0 {load|clear|generate}"
fi
```

### Multi-Service Integration Tests
```typescript
// cypress/e2e/service-integration.cy.ts
describe('Multi-Service Integration', () => {
  it('should coordinate reconnaissance and scanning workflows', () => {
    // 1. Start reconnaissance
    cy.startReconJob('target.com', ['amass'])
    
    // 2. Wait for reconnaissance to complete
    cy.waitForJobCompletion('recon')
    
    // 3. Start scanning based on recon results
    cy.startScanJob('target.com', [80, 443, 8080])
    
    // 4. Verify scanning uses reconnaissance data
    cy.getJobLogs().should('contain', 'Using reconnaissance results')
    
    // 5. Verify findings are aggregated correctly
    cy.getAggregatedFindings().should('have.length.at.least', 1)
  })

  it('should handle concurrent job execution', () => {
    // Start multiple jobs concurrently
    const jobs = [
      { type: 'recon', target: 'site1.com' },
      { type: 'recon', target: 'site2.com' },
      { type: 'scan', target: 'site3.com' },
    ]

    jobs.forEach(job => {
      cy.startJob(job)
    })

    // Verify all jobs are running
    cy.getActiveJobs().should('have.length', 3)

    // Wait for all jobs to complete
    cy.waitForAllJobs()

    // Verify no conflicts or data corruption
    cy.getCompletedJobs().should('have.length', 3)
  })
})
```

### Playwright Alternative E2E Tests
```typescript
// tests/e2e/playwright/complete-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Bug Bounty Platform E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('complete workflow from program creation to report', async ({ page }) => {
    // Create program
    await page.click('[data-testid="nav-programs"]')
    await page.click('[data-testid="add-program"]')
    await page.fill('[data-testid="program-name"]', 'E2E Test Program')
    await page.selectOption('[data-testid="program-platform"]', 'bugcrowd')
    await page.click('[data-testid="save-program"]')

    // Start reconnaissance
    await page.click('[data-testid="nav-recon"]')
    await page.fill('[data-testid="target-domain"]', 'testphp.vulnweb.com')
    await page.check('[data-testid="tool-naabu"]')
    await page.click('[data-testid="start-recon"]')

    // Wait for job completion
    await page.click('[data-testid="nav-jobs"]')
    await page.waitForSelector('[data-testid="job-status"]:has-text("completed")', { timeout: 60000 })

    // Review findings
    await page.click('[data-testid="nav-findings"]')
    const findingsCount = await page.locator('[data-testid="finding-row"]').count()
    expect(findingsCount).toBeGreaterThan(0)

    // Generate report
    await page.click('[data-testid="create-report"]')
    await page.fill('[data-testid="report-title"]', 'E2E Security Report')
    await page.click('[data-testid="generate-report"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Report generated successfully')
  })
})
```
```

## ⚡ Performance Testing

### k6 Load Testing Scripts
```javascript
// tests/performance/api-load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
}

const BASE_URL = 'http://localhost:3000'

export default function () {
  // Test authentication endpoint
  const authResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'TestPassword123!',
  })

  check(authResponse, {
    'auth status is 200': (r) => r.status === 200,
    'auth response time < 500ms': (r) => r.timings.duration < 500,
  })

  if (authResponse.status === 200) {
    const token = JSON.parse(authResponse.body).token

    // Test API endpoints with authentication
    const programsResponse = http.get(`${BASE_URL}/api/programs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    check(programsResponse, {
      'programs status is 200': (r) => r.status === 200,
      'programs response time < 300ms': (r) => r.timings.duration < 300,
    })
  }

  sleep(1)
}
```

### Database Performance Testing
```javascript
// tests/performance/database-test.js
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  scenarios: {
    database_reads: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
    database_writes: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 30 },
        { duration: '30s', target: 10 },
      ],
    },
  },
}

export function databaseReads() {
  const response = http.get('http://localhost:3000/api/programs')
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  })
}

export function databaseWrites() {
  const payload = {
    name: `Test Program ${Date.now()}`,
    platform: 'hackerone',
    url: 'https://hackerone.com/test',
  }

  const response = http.post('http://localhost:3000/api/programs', JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    },
  })

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

### Microservices Performance Testing
```javascript
// tests/performance/services-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
}

export default function () {
  // Test Recon Service
  const reconResponse = http.post('http://localhost:3001/api/jobs', {
    type: 'recon',
    target: 'example.com',
    tools: ['amass', 'subfinder'],
  })

  check(reconResponse, {
    'recon job created': (r) => r.status === 201,
    'recon response time < 2s': (r) => r.timings.duration < 2000,
  })

  // Test Scanning Service
  const scanResponse = http.post('http://localhost:3002/api/jobs', {
    type: 'scan',
    target: 'example.com',
    ports: [80, 443, 8080],
  })

  check(scanResponse, {
    'scan job created': (r) => r.status === 201,
    'scan response time < 2s': (r) => r.timings.duration < 2000,
  })

  sleep(1)
}
```

### Stress Testing
```bash
#!/bin/bash
# stress-test.sh

echo "🚀 Starting Stress Tests..."

# CPU Stress Test
echo "Testing CPU performance..."
k6 run --vus 100 --duration 5m tests/performance/cpu-stress-test.js

# Memory Stress Test
echo "Testing memory performance..."
k6 run --vus 200 --duration 3m tests/performance/memory-stress-test.js

# Database Connection Pool Test
echo "Testing database connections..."
k6 run --vus 500 --duration 2m tests/performance/db-connection-test.js

echo "✅ Stress Tests completed!"
```
```

### Service Layer Testing
```typescript
// api/tests/services/recon.test.ts
import { ReconService } from '../../src/services/recon'
import { pool } from '../../src/database'

describe('ReconService', () => {
  let reconService: ReconService

  beforeEach(() => {
    reconService = new ReconService()
  })

  describe('createJob', () => {
    it('should create a reconnaissance job', async () => {
      const jobData = {
        target_domain: 'example.com',
        tools: ['amass', 'subfinder'],
        program_id: 1,
        user_id: 1
      }

      const job = await reconService.createJob(jobData)

      expect(job).toHaveProperty('id')
      expect(job.target_domain).toBe('example.com')
      expect(job.status).toBe('pending')
      expect(job.type).toBe('recon')
    })

    it('should validate required fields', async () => {
      await expect(reconService.createJob({} as any))
        .rejects.toThrow('Target domain is required')
    })
  })

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const job = await reconService.createJob({
        target_domain: 'test.com',
        tools: ['amass'],
        program_id: 1,
        user_id: 1
      })

      const status = await reconService.getJobStatus(job.id)

      expect(status).toHaveProperty('id', job.id)
      expect(status).toHaveProperty('status')
      expect(status).toHaveProperty('progress')
    })
  })
})
```

## 🔒 Security Testing

### OWASP Top 10 Testing
```typescript
// api/tests/security/owasp.test.ts
import request from 'supertest'
import { app } from '../../src/app'

describe('OWASP Security Tests', () => {
  describe('A01: Broken Access Control', () => {
    it('should prevent unauthorized access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer user-token')
        .expect(403)
    })

    it('should prevent access to other users data', async () => {
      const response = await request(app)
        .get('/api/programs/999')
        .set('Authorization', 'Bearer user-token')
        .expect(404)
    })
  })

  describe('A02: Cryptographic Failures', () => {
    it('should enforce HTTPS in production', async () => {
      process.env.NODE_ENV = 'production'
      const response = await request(app)
        .get('/api/health')
        .expect(301) // Should redirect to HTTPS
    })

    it('should not expose sensitive data in responses', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.user).not.toHaveProperty('password')
      expect(response.body.user).not.toHaveProperty('api_key')
    })
  })

  describe('A03: Injection', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE users; --"
      
      const response = await request(app)
        .get(`/api/programs?name=${maliciousInput}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      // Should return empty array, not crash
      expect(response.body.programs).toEqual([])
    })

    it('should prevent NoSQL injection', async () => {
      const maliciousPayload = {
        username: 'admin',
        password: { $ne: '' }
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload)
        .expect(400)
    })
  })
})
```

### Authentication & Authorization Testing
```typescript
// api/tests/security/auth.test.ts
describe('Authentication Security', () => {
  describe('JWT Security', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid'
      
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
    })

    it('should reject tampered tokens', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature'
      
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401)
    })
  })

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const promises = []
      
      // Make 10 failed login attempts
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        )
      }

      const responses = await Promise.all(promises)
      const rateLimitedResponse = responses[responses.length - 1]
      
      // Should be rate limited
      expect(rateLimitedResponse.status).toBe(429)
    })
  })
})
```

### Security Headers Testing
```typescript
// api/tests/security/headers.test.ts
describe('Security Headers', () => {
  it('should set security headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
    expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
    expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block')
    expect(response.headers).toHaveProperty('strict-transport-security')
  })

  it('should set CSP headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    expect(response.headers).toHaveProperty('content-security-policy')
    expect(response.headers['content-security-policy']).toContain("default-src 'self'")
  })
})
```

### Postman Collection
Create a Postman collection with the following structure:

```json
{
  "info": {
    "name": "RedTeam Automation API",
    "description": "Bug Bounty Automation Platform API Testing",
    "version": "1.0.0"
  },
  "auth": {
    "type": "bearer",
    "bearer": [{
      "key": "token",
      "value": "{{auth_token}}",
      "type": "string"
    }]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "auth_token",
      "value": "",
      "type": "string"
    }
  ]
}
```

### Authentication Tests
```json
{
  "name": "Authentication",
  "item": [
    {
      "name": "Register User",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"testuser\",\n  \"email\": \"test@example.com\",\n  \"password\": \"TestPassword123!\"\n}"
        },
        "url": "{{base_url}}/api/auth/register"
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Status code is 201', function () {",
            "    pm.response.to.have.status(201);",
            "});",
            "pm.test('Response has token', function () {",
            "    var jsonData = pm.response.json();",
            "    pm.expect(jsonData).to.have.property('token');",
            "    pm.environment.set('auth_token', jsonData.token);",
            "});"
          ]
        }
      }]
    }
  ]
}
```

### Automated API Testing Script
```bash
#!/bin/bash
# api-test-runner.sh

BASE_URL="http://localhost:3000"
API_KEY="test_api_key"

echo "🚀 Starting API Tests..."

# Test Authentication
echo "Testing Authentication..."
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPassword123!"}'

# Test Programs API
echo "Testing Programs API..."
curl -X GET "$BASE_URL/api/programs" \
  -H "Authorization: Bearer $API_KEY"

# Test Jobs API
echo "Testing Jobs API..."
curl -X POST "$BASE_URL/api/jobs" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"recon","target":"example.com"}'

echo "✅ API Tests completed!"
```

## 🎨 Frontend Testing

### React Testing Library Setup
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

### Component Testing Examples
```typescript
// src/components/__tests__/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Login from '../../pages/Login'

const mockLogin = vi.fn()
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
}))

describe('Login Component', () => {
  it('renders login form', () => {
    render(<Login />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<Login />)
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<Login />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })
})
```

### Dashboard Component Testing
```typescript
// src/pages/__tests__/Dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Dashboard from '../Dashboard'

const mockStats = {
  totalPrograms: 10,
  activeJobs: 5,
  totalFindings: 25,
  criticalFindings: 3,
}

vi.mock('../../services/api', () => ({
  getDashboardStats: vi.fn().mockResolvedValue(mockStats),
  getRecentJobs: vi.fn().mockResolvedValue([]),
  getRecentFindings: vi.fn().mockResolvedValue([]),
}))

describe('Dashboard Component', () => {
  it('displays loading state', () => {
    render(<Dashboard />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays stats after loading', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Total Programs')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Active Jobs')).toBeInTheDocument()
    })
  })
})
```
```typescript
// api/tests/auth.test.ts
import { describe, it, expect } from 'vitest'
import { app } from '../src/app'

describe('Authentication API', () => {
  it('should register new user', async () => {
    const response = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('token')
  })
})
```

### Service Unit Tests
```typescript
// services/recon/tests/tools.test.ts
import { describe, it, expect } from 'vitest'
import { amass } from '../src/tools/amass'

describe('Amass Tool', () => {
  it('should configure with default settings', () => {
    const config = amass.configure()
    expect(config).toHaveProperty('passive', true)
    expect(config).toHaveProperty('active', false)
  })

  it('should build correct command', () => {
    const command = amass.buildCommand('example.com', {
      passive: true,
      active: false
    })
    expect(command).toContain('amass')
    expect(command).toContain('-passive')
    expect(command).toContain('-d example.com')
  })
})
```

### Frontend Unit Tests
```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## 🔗 Integration Testing

### API Integration Tests
```typescript
// api/tests/integration/programs.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { pool } from '../../src/database'

describe('Programs API Integration', () => {
  let authToken: string
  let testProgramId: number

  beforeAll(async () => {
    // Setup test data
    authToken = await createAuthToken()
  })

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM programs WHERE id = $1', [testProgramId])
  })

  it('should create and retrieve program', async () => {
    // Create program
    const createResponse = await app.request('/api/programs', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Program',
        platform: 'hackerone',
        url: 'https://hackerone.com/test'
      })
    })

    expect(createResponse.status).toBe(201)
    const { program } = await createResponse.json()
    testProgramId = program.id

    // Retrieve program
    const getResponse = await app.request(`/api/programs/${testProgramId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    })

    expect(getResponse.status).toBe(200)
    const { program: retrieved } = await getResponse.json()
    expect(retrieved.name).toBe('Test Program')
  })
})
```

### Service Integration Tests
```typescript
// tests/integration/services.test.ts
import { describe, it, expect } from 'vitest'
import { createReconJob } from '../helpers'

describe('Service Integration', () => {
  it('should process reconnaissance job', async () => {
    // Create job
    const job = await createReconJob({
      target_domain: 'example.com',
      tools: ['amass', 'subfinder'],
      program_id: 1
    })

    // Wait for job completion
    await waitForJobCompletion(job.id, 'recon')

    // Verify results
    const results = await getReconResults(job.id)
    expect(results).toHaveProperty('subdomains')
    expect(Array.isArray(results.subdomains)).toBe(true)
    expect(results.subdomains.length).toBeGreaterThan(0)
  })
})
```

## 🎭 End-to-End Testing

### Complete Workflow Test
```typescript
// tests/e2e/complete-workflow.test.ts
import { describe, it, expect } from 'vitest'

describe('Complete Bug Bounty Workflow', () => {
  it('should execute complete workflow', async () => {
    // 1. Create program
    const program = await createProgram({
      name: 'E2E Test Program',
      platform: 'hackerone',
      scope: '*.example.com'
    })

    // 2. Start reconnaissance
    const reconJob = await startReconnaissance(program.id, 'example.com')
    await waitForJobCompletion(reconJob.id, 'recon')

    // 3. Start vulnerability scanning
    const scanJob = await startScanning(program.id, reconJob.results.subdomains)
    await waitForJobCompletion(scanJob.id, 'scan')

    // 4. Validate findings
    const findings = await getFindings(program.id)
    expect(findings.length).toBeGreaterThan(0)

    // 5. Generate report
    const report = await generateReport(program.id, findings)
    expect(report).toHaveProperty('id')
    expect(report.status).toBe('generated')
  })
})
```

### UI E2E Tests
```typescript
// tests/e2e/dashboard.test.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard E2E', () => {
  test('should display dashboard metrics', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.fill('[data-testid="email"]', 'admin@example.com')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')

    // Wait for dashboard
    await page.waitForSelector('[data-testid="dashboard-metrics"]')

    // Verify metrics
    const totalPrograms = await page.textContent('[data-testid="total-programs"]')
    const totalFindings = await page.textContent('[data-testid="total-findings"]')

    expect(parseInt(totalPrograms)).toBeGreaterThan(0)
    expect(parseInt(totalFindings)).toBeGreaterThan(0)
  })
})
```

## 🔒 Security Testing

### Vulnerability Scanning
```bash
# Dependency audit
pnpm audit

# Container scanning
trivy image redteam-automation/api:latest

# Static analysis
eslint src/
sonar-scanner

# Security linting
security-lint src/
```

### Penetration Testing
```typescript
// tests/security/api-security.test.ts
import { describe, it, expect } from 'vitest'

describe('API Security', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --"
    const response = await app.request('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: maliciousInput,
        platform: 'hackerone'
      })
    })

    expect(response.status).toBe(400)
    // Verify database integrity
    const programs = await getAllPrograms()
    expect(programs.length).toBeGreaterThan(0)
  })

  it('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>'
    const response = await app.request('/api/findings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: xssPayload,
        description: 'Test finding',
        severity: 'high'
      })
    })

    const { finding } = await response.json()
    expect(finding.title).not.toContain('<script>')
  })

  it('should enforce rate limiting', async () => {
    const requests = Array(100).fill(null).map(() =>
      app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong-password'
        })
      })
    )

    const responses = await Promise.all(requests)
    const rateLimited = responses.filter(r => r.status === 429)
    expect(rateLimited.length).toBeGreaterThan(0)
  })
})
```

### Authentication Testing
```typescript
// tests/security/authentication.test.ts
import { describe, it, expect } from 'vitest'

describe('Authentication Security', () => {
  it('should prevent brute force attacks', async () => {
    const attempts = Array(10).fill(null).map(() =>
      app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'wrong-password'
        })
      })
    )

    const responses = await Promise.all(attempts)
    const blocked = responses.filter(r => r.status === 429)
    expect(blocked.length).toBeGreaterThan(0)
  })

  it('should validate JWT tokens properly', async () => {
    const invalidTokens = [
      'invalid-token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload',
      ''
    ]

    for (const token of invalidTokens) {
      const response = await app.request('/api/protected', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(response.status).toBe(401)
    }
  })
})
```

## ⚡ Performance Testing

### Load Testing
```typescript
// tests/performance/load.test.ts
import { describe, it } from 'vitest'
import autocannon from 'autocannon'

describe('Load Testing', () => {
  it('should handle 1000 concurrent requests', async () => {
    const result = await autocannon({
      url: 'http://localhost:3001/api/programs',
      connections: 100,
      duration: 30,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    expect(result.errors).toBe(0)
    expect(result.timeouts).toBe(0)
    expect(result.requests.average).toBeGreaterThan(100)
    expect(result.latency.average).toBeLessThan(500)
  })
})
```

### Stress Testing
```bash
# Using Apache Bench
ab -n 10000 -c 100 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/findings

# Using wrk
wrk -t12 -c400 -d30s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/programs
```

### Database Performance
```typescript
// tests/performance/database.test.ts
import { describe, it, expect } from 'vitest'

describe('Database Performance', () => {
  it('should handle large datasets efficiently', async () => {
    // Insert test data
    const startTime = Date.now()
    for (let i = 0; i < 1000; i++) {
      await createFinding({
        title: `Test Finding ${i}`,
        severity: 'high',
        program_id: 1
      })
    }
    const insertTime = Date.now() - startTime

    // Query performance
    const queryStart = Date.now()
    const findings = await getFindings({ severity: 'high' })
    const queryTime = Date.now() - queryStart

    expect(insertTime).toBeLessThan(5000)
    expect(queryTime).toBeLessThan(1000)
    expect(findings.length).toBe(1000)
  })
})
```

## 📊 Test Coverage

### Coverage Reports
```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html

# Coverage thresholds
# npx vitest run --coverage.thresholds.lines=80
# npx vitest run --coverage.thresholds.functions=80
# npx vitest run --coverage.thresholds.branches=70
# npx vitest run --coverage.thresholds.statements=80
```

### Coverage Configuration
```json
// vitest.config.ts
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  }
}
```

## 🛠️ Test Utilities

### Test Helpers
```typescript
// tests/helpers.ts
export async function createTestUser(overrides = {}) {
  const user = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    ...overrides
  }
  
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
  
  return response.json()
}

export async function createTestProgram(overrides = {}) {
  const program = {
    name: `Test Program ${Date.now()}`,
    platform: 'hackerone',
    url: 'https://hackerone.com/test',
    ...overrides
  }
  
  const response = await app.request('/api/programs', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(program)
  })
  
  return response.json()
}

export function waitForJobCompletion(jobId: string, service: string) {
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      const response = await app.request(`/api/jobs/${service}/${jobId}`)
      const job = await response.json()
      
      if (job.status === 'completed') {
        resolve(job)
      } else if (job.status === 'failed') {
        reject(new Error('Job failed'))
      } else {
        setTimeout(checkStatus, 1000)
      }
    }
    
    checkStatus()
  })
}
```

### Mock Data
```typescript
// tests/mockData.ts
export const mockFindings = [
  {
    title: 'Cross-Site Scripting (XSS)',
    severity: 'high',
    description: 'Reflected XSS in search parameter',
    evidence: {
      url: 'https://example.com/search?q=<script>alert(1)</script>',
      payload: '<script>alert(1)</script>'
    }
  },
  {
    title: 'SQL Injection',
    severity: 'critical',
    description: 'SQL injection in login form',
    evidence: {
      url: 'https://example.com/login',
      payload: "admin' OR '1'='1",
      error_message: 'SQL syntax error'
    }
  }
]

export const mockPrograms = [
  {
    name: 'HackerOne Public Program',
    platform: 'hackerone',
    url: 'https://hackerone.com/security',
    scope: '*.hackerone.com, hackerone.com',
    rewards: { min: 500, max: 25000 }
  },
  {
    name: 'Bugcrowd Public Program',
    platform: 'bugcrowd',
    url: 'https://bugcrowd.com/program',
    scope: '*.bugcrowd.com, bugcrowd.com',
    rewards: { min: 100, max: 5000 }
  }
]
```

## 📋 Test Checklists

### Pre-deployment Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Security tests pass
- [ ] Performance tests meet requirements
- [ ] Database migrations tested
- [ ] Environment configuration validated
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting verified

### Release Testing
- [ ] Feature functionality verified
- [ ] API compatibility maintained
- [ ] Database schema changes tested
- [ ] Performance benchmarks met
- [ ] Security vulnerabilities addressed
- [ ] Documentation updated
- [ ] Deployment procedures tested

## 🚨 Continuous Testing

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: redteam_automation_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

### Automated Security Testing
```yaml
# Security scanning
- name: Run security audit
  run: |
    pnpm audit
    npm audit fix --dry-run

- name: Static security analysis
  run: |
    npx eslint-plugin-security
    npx sonarjs

- name: Container security scan
  run: |
    trivy image redteam-automation/api:latest
```

For additional testing support, please refer to our [testing documentation](testing.md) or contact our testing team at testing@redteam-automation.com.