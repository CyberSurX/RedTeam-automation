# Monitoring and Alerting Setup

This guide provides comprehensive monitoring and alerting configuration for the Bug Bounty Automation Platform using Prometheus, Grafana, and Alertmanager.

## Architecture Overview

### Components
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and management
- **Node Exporter**: System metrics
- **Kube State Metrics**: Kubernetes resource metrics
- **Blackbox Exporter**: Endpoint monitoring
- **Loki**: Log aggregation (optional)

### Metrics Collection Strategy
- Application-level metrics from all microservices
- Infrastructure metrics (CPU, memory, disk, network)
- Kubernetes cluster metrics
- Business metrics (vulnerabilities found, scan success rates)
- Custom security metrics

## Quick Start

### 1. Install Monitoring Stack
```bash
# Add Prometheus Community Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f monitoring-values.yaml
```

### 2. Configure Platform Monitoring
```bash
# Apply monitoring configuration
kubectl apply -f monitoring/
```

## Configuration

### Prometheus Configuration
Create `monitoring-values.yaml`:

```yaml
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: fast-ssd
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi
    resources:
      requests:
        memory: 2Gi
        cpu: 500m
      limits:
        memory: 4Gi
        cpu: 1000m
    additionalScrapeConfigs:
      - job_name: 'bugbounty-platform'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - bugbounty
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name
            
      - job_name: 'kubernetes-pods-slow'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape_slow]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
        scrape_interval: 5m
        scrape_timeout: 30s

alertmanager:
  config:
    global:
      resolve_timeout: 5m
      slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'default'
      routes:
        - match:
            severity: critical
          receiver: 'critical'
          continue: true
        - match:
            severity: warning
          receiver: 'warning'
          continue: true
    receivers:
      - name: 'default'
        slack_configs:
          - send_resolved: true
            channel: '#alerts'
            title: 'Bug Bounty Platform Alert'
            text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'
      - name: 'critical'
        slack_configs:
          - send_resolved: true
            channel: '#critical-alerts'
            title: '🔥 CRITICAL: Bug Bounty Platform Alert'
            text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'
        email_configs:
          - to: 'security-team@yourcompany.com'
            from: 'alerts@yourcompany.com'
            smarthost: 'smtp.yourcompany.com:587'
            auth_username: 'alerts@yourcompany.com'
            auth_password: 'your-smtp-password'
            subject: 'CRITICAL: Bug Bounty Platform Alert'
      - name: 'warning'
        slack_configs:
          - send_resolved: true
            channel: '#warnings'
            title: '⚠️ WARNING: Bug Bounty Platform Alert'
            text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'
```

### Grafana Configuration
Create `grafana-values.yaml`:

```yaml
datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://monitoring-kube-prometheus-prometheus:9090
        access: proxy
        isDefault: true
      - name: Loki
        type: loki
        url: http://loki:3100
        access: proxy

dashboardProviders:
  dashboardproviders.yaml:
    apiVersion: 1
    providers:
      - name: 'default'
        orgId: 1
        folder: ''
        type: file
        disableDeletion: false
        editable: true
        options:
          path: /var/lib/grafana/dashboards/default

dashboards:
  default:
    platform-overview:
      url: https://raw.githubusercontent.com/your-org/bugbounty-platform/main/monitoring/dashboards/platform-overview.json
    service-performance:
      url: https://raw.githubusercontent.com/your-org/bugbounty-platform/main/monitoring/dashboards/service-performance.json
    security-metrics:
      url: https://raw.githubusercontent.com/your-org/bugbounty-platform/main/monitoring/dashboards/security-metrics.json
    infrastructure:
      url: https://raw.githubusercontent.com/your-org/bugbounty-platform/main/monitoring/dashboards/infrastructure.json

persistence:
  enabled: true
  storageClassName: fast-ssd
  accessModes: ["ReadWriteOnce"]
  size: 10Gi

resources:
  requests:
    memory: 256Mi
    cpu: 100m
  limits:
    memory: 512Mi
    cpu: 500m
```

## Custom Dashboards

### Platform Overview Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Bug Bounty Platform - Overview",
    "tags": ["bugbounty", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Service Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"bugbounty-platform.*\"}",
            "legendFormat": "{{job}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "options": {
                  "0": {"text": "DOWN", "color": "red"},
                  "1": {"text": "UP", "color": "green"}
                },
                "type": "value"
              }
            ]
          }
        }
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=~\"bugbounty-platform.*\"}[5m])",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=~\"bugbounty-platform.*\",status=~\"5..\"}[5m])",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "id": 4,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=~\"bugbounty-platform.*\"}[5m]))",
            "legendFormat": "95th percentile - {{job}}"
          }
        ]
      }
    ]
  }
}
```

### Security Metrics Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Bug Bounty Platform - Security Metrics",
    "tags": ["bugbounty", "security"],
    "panels": [
      {
        "id": 1,
        "title": "Vulnerabilities Found (Last 24h)",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(bugbounty_vulnerabilities_found_total[24h])",
            "legendFormat": "Total"
          }
        ]
      },
      {
        "id": 2,
        "title": "Critical Vulnerabilities",
        "type": "stat",
        "targets": [
          {
            "expr": "bugbounty_vulnerabilities_by_severity{severity=\"critical\"}",
            "legendFormat": "Critical"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "red", "value": 1}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Scan Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(bugbounty_scans_completed_total[1h]) / rate(bugbounty_scans_started_total[1h]) * 100",
            "legendFormat": "Success Rate %"
          }
        ]
      },
      {
        "id": 4,
        "title": "Active Scans",
        "type": "graph",
        "targets": [
          {
            "expr": "bugbounty_active_scans",
            "legendFormat": "Active Scans"
          }
        ]
      }
    ]
  }
}
```

## Alerting Rules

### Critical Alerts
```yaml
groups:
  - name: bugbounty-platform-critical
    rules:
      - alert: PlatformServiceDown
        expr: up{job=~"bugbounty-platform.*"} == 0
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Bug Bounty Platform service is down"
          description: "Service {{ $labels.job }} has been down for more than 5 minutes."
          runbook_url: "https://docs.bugbounty-platform.com/runbooks/service-down"
          
      - alert: CriticalVulnerabilityFound
        expr: increase(bugbounty_critical_vulnerabilities_found_total[1h]) > 0
        for: 0m
        labels:
          severity: critical
          team: security
        annotations:
          summary: "Critical vulnerability detected"
          description: "Critical vulnerability found in target {{ $labels.target }}."
          
      - alert: DatabaseConnectionFailure
        expr: increase(db_connection_failures_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Database connection failures"
          description: "More than 10 database connection failures in the last 5 minutes."
```

### Warning Alerts
```yaml
groups:
  - name: bugbounty-platform-warnings
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{job=~"bugbounty-platform.*",status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High error rate in Bug Bounty Platform"
          description: "Service {{ $labels.job }} has error rate above 10% for more than 5 minutes."
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=~"bugbounty-platform.*"}[5m])) > 2
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High latency in Bug Bounty Platform"
          description: "Service {{ $labels.job }} has 95th percentile latency above 2 seconds for more than 5 minutes."
          
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes{pod=~"bugbounty-platform.*"} / container_spec_memory_limit_bytes > 0.9
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High memory usage in Bug Bounty Platform"
          description: "Pod {{ $labels.pod }} is using more than 90% of its memory limit."
          
      - alert: ScanQueueBacklog
        expr: bugbounty_scan_queue_size > 100
        for: 15m
        labels:
          severity: warning
          team: security
        annotations:
          summary: "Scan queue backlog"
          description: "Scan queue has more than 100 pending items for more than 15 minutes."
```

## Log Aggregation with Loki

### Install Loki
```bash
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --create-namespace \
  -f loki-values.yaml
```

### Loki Configuration
```yaml
loki:
  persistence:
    enabled: true
    storageClassName: fast-ssd
    size: 50Gi
  
  resources:
    requests:
      memory: 1Gi
      cpu: 500m
    limits:
      memory: 2Gi
      cpu: 1000m

promtail:
  enabled: true
  config:
    clients:
      - url: http://loki:3100/loki/api/v1/push
    snippets:
      pipelineStages:
        - cri: {}
        - labeldrop:
            - filename
            - stream
```

## Performance Monitoring

### Application Performance Monitoring (APM)
```yaml
# Jaeger configuration for distributed tracing
jaeger:
  enabled: true
  storage:
    type: elasticsearch
    elasticsearch:
      server-urls: http://elasticsearch:9200
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: 500m
```

### Custom Application Metrics
Add to your application code:

```javascript
// Prometheus client for Node.js
const promClient = require('prom-client');

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const vulnerabilitiesFound = new promClient.Counter({
  name: 'bugbounty_vulnerabilities_found_total',
  help: 'Total number of vulnerabilities found',
  labelNames: ['severity', 'type']
});

const scanQueueSize = new promClient.Gauge({
  name: 'bugbounty_scan_queue_size',
  help: 'Current size of the scan queue'
});

// Middleware to track HTTP metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

## Maintenance and Troubleshooting

### Prometheus Maintenance
```bash
# Check Prometheus targets
curl http://prometheus:9090/api/v1/targets

# Check alert status
curl http://prometheus:9090/api/v1/alerts

# Manual data cleanup
kubectl exec -it prometheus-monitoring-kube-prometheus-prometheus-0 -- rm -rf /prometheus/data/
```

### Grafana Troubleshooting
```bash
# Check Grafana logs
kubectl logs -f deployment/monitoring-grafana -n monitoring

# Reset admin password
kubectl exec -it deployment/monitoring-grafana -n monitoring -- grafana-cli admin reset-admin-password newpassword
```

### Alertmanager Troubleshooting
```bash
# Check alert status
kubectl logs -f alertmanager-monitoring-kube-prometheus-alertmanager-0 -n monitoring

# Test alert routing
kubectl port-forward service/monitoring-kube-prometheus-alertmanager 9093:9093
# Open http://localhost:9093
```

## Best Practices

### 1. Metric Naming
- Use consistent naming conventions
- Include units in metric names
- Use labels for dimensions
- Keep metric names descriptive but concise

### 2. Alert Fatigue Prevention
- Set appropriate thresholds
- Use `for` clauses to prevent flapping
- Group related alerts
- Provide actionable alert descriptions

### 3. Dashboard Design
- Focus on key metrics
- Use appropriate visualization types
- Include context and thresholds
- Make dashboards actionable

### 4. Performance Considerations
- Limit cardinality of metrics
- Use recording rules for complex queries
- Configure appropriate retention policies
- Monitor monitoring system performance

## Security Considerations

### Access Control
- Secure Grafana with strong authentication
- Use RBAC for Prometheus access
- Encrypt metrics in transit
- Restrict network access to monitoring components

### Data Protection
- Sanitize sensitive data from metrics
- Encrypt stored metrics data
- Implement audit logging
- Regular security updates

## Cost Optimization

### Storage Optimization
- Configure appropriate retention periods
- Use compression for historical data
- Implement data archiving strategies
- Monitor storage usage

### Resource Optimization
- Right-size monitoring components
- Use auto-scaling for high-load scenarios
- Optimize query performance
- Regular resource usage reviews