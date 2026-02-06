# Monitoring

Health checks, metrics collection, and alerting for the RedTeam automation platform.

## 📁 Structure

```
monitoring/
├── health.ts        # Health check endpoints
├── metrics.ts       # Prometheus metrics collection
├── monitor.ts       # Background monitoring service
└── alerts.ts        # Alert configuration and handlers
```

---

## 💚 Health Checks (health.ts)

### Purpose
Provides health status for all system components.

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Overall system health |
| `/health/readiness` | Readiness probe (Kubernetes) |
| `/health/liveness` | Liveness probe (Kubernetes) |

### Health Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "12ms"
    },
    "redis": {
      "status": "healthy",
      "responseTime": "5ms"
    }
  }
}
```

### Health Status Values

| Status | Description |
|--------|-------------|
| healthy | Component responding normally |
| unhealthy | Component has errors |
| unavailable | Component cannot be reached |

---

## 📊 Metrics (metrics.ts)

### Purpose
Collect and expose Prometheus metrics for observability.

### Metrics Tracked

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_ms` | Histogram | Request duration in ms |
| `http_errors_total` | Counter | Total HTTP errors |
| `scans_completed_total` | Counter | Total scans completed |
| `scan_duration_ms` | Histogram | Scan execution time |
| `database_queries_total` | Counter | Database queries |
| `database_query_duration_ms` | Histogram | Query execution time |

### Endpoint

```
GET /metrics
```

### Usage

```typescript
import { register } from './metrics';

// Record a scan completion
register.getSingleMetric('scans_completed_total')?.inc();

// Record HTTP request
register.getSingleMetric('http_requests_total')?.inc({ method: 'GET', route: '/api/programs' });
```

---

## 📡 Monitor Service (monitor.ts)

### Purpose
Background service that monitors system health and performance.

### Functions

| Function | Description |
|----------|-------------|
| `startMonitoring()` | Start background monitoring |
| `stopMonitoring()` | Stop monitoring |
| `getSystemStats()` | Get current system statistics |

### Monitoring Intervals

| Metric | Interval |
|--------|----------|
| Health checks | 60 seconds |
| Metrics collection | 10 seconds |
| Resource usage | 30 seconds |

---

## 🚨 Alerts (alerts.ts)

### Purpose
Configure and handle system alerts.

### Alert Types

| Type | Description | Severity |
|------|-------------|----------|
| database_down | Database unavailable | Critical |
| redis_down | Redis unavailable | Critical |
| high_error_rate | Error rate > 5% | Warning |
| slow_response | P95 latency > 1s | Warning |
| queue_backlog | Queue size > 100 | Info |

### Alert Configuration

```typescript
const alertThresholds = {
  highErrorRate: 0.05,    // 5% error rate
  slowResponse: 1000,     // 1 second
  queueBacklog: 100,      // 100 jobs
  diskUsage: 0.8          // 80% disk usage
};
```

### Alert Handlers

```typescript
// Send alert to configured channels
await sendAlert({
  type: 'database_down',
  severity: 'critical',
  message: 'Database connection failed',
  timestamp: new Date()
});
```

---

## 🔧 Environment Variables

```bash
# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_ENABLED=true
ALERT_ENABLED=true

# Alert Channels (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EMAIL_ALERTS_TO=admin@example.com
```

---

## 🐳 Docker Integration

Health checks are configured for Docker containers:

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## 📈 Prometheus Integration

Configure Prometheus to scrape metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'redteam-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['redteam-api:3001']
```

---

## 🚨 Setting Up Alerts

### Slack Alerts

```bash
# Set Slack webhook
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Email Alerts

```bash
# Configure email
export EMAIL_ALERTS_TO=admin@example.com
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
```

---

## 📊 System Stats

Get current system statistics:

```bash
curl http://localhost:3001/metrics
```

Metrics exposed in Prometheus format:

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/programs",status="200"} 45

# HELP http_request_duration_ms HTTP request duration in milliseconds
# TYPE http_request_duration_ms histogram
http_request_duration_ms_bucket{le="10"} 23
http_request_duration_ms_bucket{le="50"} 42
http_request_duration_ms_bucket{le="+Inf"} 45
```