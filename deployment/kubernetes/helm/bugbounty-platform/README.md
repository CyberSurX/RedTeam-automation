# Bug Bounty Platform Helm Chart

This Helm chart deploys the complete Bug Bounty Automation Platform on Kubernetes.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Ingress   │  │  Service    │  │   Config    │         │
│  │ Controller  │  │   Mesh      │  │    Maps     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                  │                  │
│  ┌──────┴─────────────────┴─────────────────┴──────┐         │
│  │              Application Layer                   │         │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │         │
│  │  │Frontend │ │API GW   │ │Services │         │         │
│  │  │  Pods   │ │  Pods   │ │  Pods   │         │         │
│  │  └─────────┘ └─────────┘ └─────────┘         │         │
│  └─────────────────┬─────────────────┘         │         │
│                    │                              │         │
│  ┌─────────────────┴─────────────────┐         │         │
│  │         Data Layer               │         │         │
│  │  ┌─────────┐ ┌─────────┐ ┌─────┐ │         │         │
│  │  │PostgreSQL│ │  Redis  │ │PVCs │ │         │         │
│  │  │ Stateful │ │Cluster  │ │     │ │         │         │
│  │  │  Sets    │ │         │ │     │ │         │         │
│  │  └─────────┘ └─────────┘ └─────┘ │         │         │
│  └─────────────────────────────────────┘         │         │
│                                                 │         │
│  ┌─────────────────────────────────────┐         │         │
│  │      Monitoring Layer              │         │         │
│  │  ┌─────────┐ ┌─────────┐ ┌─────┐ │         │         │
│  │  │Prometheus│ │Grafana  │ │ELK  │ │         │         │
│  │  │         │ │         │ │     │ │         │         │
│  │  └─────────┘ └─────────┘ └─────┘ │         │         │
│  └─────────────────────────────────────┘         │         │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Add Helm repository
helm repo add bugbounty-platform https://charts.bugbounty-platform.com
helm repo update

# Install with default values
helm install bugbounty bugbounty-platform/bugbounty-platform \
  --namespace production \
  --create-namespace

# Install with custom values
helm install bugbounty bugbounty-platform/bugbounty-platform \
  --namespace production \
  --create-namespace \
  --values values-production.yaml
```

## Configuration

### Global Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.imageRegistry` | Global Docker image registry | `docker.io` |
| `global.imagePullSecrets` | Global Docker registry secret names | `[]` |
| `global.storageClass` | Global StorageClass for Persistent Volume Claims | `standard` |
| `global.replicaCount` | Default replica count for all services | `3` |

### Frontend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Enable frontend deployment | `true` |
| `frontend.image.repository` | Frontend Docker image repository | `bugbounty/frontend` |
| `frontend.image.tag` | Frontend Docker image tag | `latest` |
| `frontend.service.type` | Frontend service type | `ClusterIP` |
| `frontend.service.port` | Frontend service port | `80` |
| `frontend.ingress.enabled` | Enable frontend ingress | `true` |
| `frontend.ingress.hosts` | Frontend ingress hosts | `["app.bugbounty-platform.com"]` |

### API Gateway Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `apiGateway.enabled` | Enable API Gateway deployment | `true` |
| `apiGateway.image.repository` | API Gateway Docker image repository | `bugbounty/api-gateway` |
| `apiGateway.image.tag` | API Gateway Docker image tag | `latest` |
| `apiGateway.service.type` | API Gateway service type | `ClusterIP` |
| `apiGateway.service.port` | API Gateway service port | `8080` |
| `apiGateway.ingress.enabled` | Enable API Gateway ingress | `true` |
| `apiGateway.ingress.hosts` | API Gateway ingress hosts | `["api.bugbounty-platform.com"]` |

### Microservices Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `reconService.enabled` | Enable Recon Service deployment | `true` |
| `reconService.image.repository` | Recon Service Docker image repository | `bugbounty/recon-service` |
| `reconService.image.tag` | Recon Service Docker image tag | `latest` |
| `reconService.replicaCount` | Recon Service replica count | `2` |
| `scanningService.enabled` | Enable Scanning Service deployment | `true` |
| `scanningService.image.repository` | Scanning Service Docker image repository | `bugbounty/scanning-service` |
| `scanningService.image.tag` | Scanning Service Docker image tag | `latest` |
| `scanningService.replicaCount` | Scanning Service replica count | `3` |
| `exploitationService.enabled` | Enable Exploitation Service deployment | `true` |
| `exploitationService.image.repository` | Exploitation Service Docker image repository | `bugbounty/exploitation-service` |
| `exploitationService.image.tag` | Exploitation Service Docker image tag | `latest` |
| `exploitationService.replicaCount` | Exploitation Service replica count | `2` |
| `triageService.enabled` | Enable Triage Service deployment | `true` |
| `triageService.image.repository` | Triage Service Docker image repository | `bugbounty/triage-service` |
| `triageService.image.tag` | Triage Service Docker image tag | `latest` |
| `triageService.replicaCount` | Triage Service replica count | `3` |
| `reportingService.enabled` | Enable Reporting Service deployment | `true` |
| `reportingService.image.repository` | Reporting Service Docker image repository | `bugbounty/reporting-service` |
| `reportingService.image.tag` | Reporting Service Docker image tag | `latest` |
| `reportingService.replicaCount` | Reporting Service replica count | `2` |

### Database Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable PostgreSQL deployment | `true` |
| `postgresql.image.repository` | PostgreSQL Docker image repository | `postgres` |
| `postgresql.image.tag` | PostgreSQL Docker image tag | `15-alpine` |
| `postgresql.auth.username` | PostgreSQL username | `postgres` |
| `postgresql.auth.password` | PostgreSQL password | `password` |
| `postgresql.auth.database` | PostgreSQL database name | `bugbounty` |
| `postgresql.primary.persistence.enabled` | Enable PostgreSQL persistence | `true` |
| `postgresql.primary.persistence.size` | PostgreSQL persistent volume size | `100Gi` |
| `redis.enabled` | Enable Redis deployment | `true` |
| `redis.image.repository` | Redis Docker image repository | `redis` |
| `redis.image.tag` | Redis Docker image tag | `7-alpine` |
| `redis.auth.enabled` | Enable Redis authentication | `true` |
| `redis.auth.password` | Redis password | `password` |
| `redis.master.persistence.enabled` | Enable Redis persistence | `true` |
| `redis.master.persistence.size` | Redis persistent volume size | `8Gi` |

### Monitoring Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `prometheus.enabled` | Enable Prometheus deployment | `true` |
| `prometheus.image.repository` | Prometheus Docker image repository | `prom/prometheus` |
| `prometheus.image.tag` | Prometheus Docker image tag | `latest` |
| `prometheus.service.type` | Prometheus service type | `ClusterIP` |
| `prometheus.service.port` | Prometheus service port | `9090` |
| `grafana.enabled` | Enable Grafana deployment | `true` |
| `grafana.image.repository` | Grafana Docker image repository | `grafana/grafana` |
| `grafana.image.tag` | Grafana Docker image tag | `latest` |
| `grafana.service.type` | Grafana service type | `ClusterIP` |
| `grafana.service.port` | Grafana service port | `3000` |
| `grafana.adminPassword` | Grafana admin password | `admin` |

## Installation

### Basic Installation

```bash
# Install the chart with default values
helm install bugbounty ./bugbounty-platform \
  --namespace production \
  --create-namespace
```

### Production Installation

```bash
# Create namespace
kubectl create namespace production

# Create secrets
kubectl create secret generic database-credentials \
  --from-literal=username=admin \
  --from-literal=password=your-secure-password \
  --namespace production

kubectl create secret generic redis-credentials \
  --from-literal=password=your-redis-password \
  --namespace production

kubectl create secret generic api-keys \
  --from-literal=hackerone=your-hackerone-key \
  --from-literal=bugcrowd=your-bugcrowd-key \
  --from-literal=amass=your-amass-config \
  --namespace production

# Install with production values
helm install bugbounty ./bugbounty-platform \
  --namespace production \
  --values values-production.yaml
```

### Development Installation

```bash
# Install with development values
helm install bugbounty-dev ./bugbounty-platform \
  --namespace development \
  --create-namespace \
  --values values-development.yaml
```

## Upgrading

```bash
# Upgrade to new version
helm upgrade bugbounty ./bugbounty-platform \
  --namespace production \
  --values values-production.yaml

# Rollback to previous version
helm rollback bugbounty 1
```

## Uninstalling

```bash
# Uninstall the chart
helm uninstall bugbounty --namespace production

# Delete namespace (optional)
kubectl delete namespace production
```

## Configuration Examples

### High Availability Configuration

```yaml
# values-ha.yaml
global:
  replicaCount: 5

frontend:
  replicaCount: 5
  autoscaling:
    enabled: true
    minReplicas: 5
    maxReplicas: 20
    targetCPUUtilizationPercentage: 70

apiGateway:
  replicaCount: 5
  autoscaling:
    enabled: true
    minReplicas: 5
    maxReplicas: 25
    targetCPUUtilizationPercentage: 70

postgresql:
  architecture: replication
  primary:
    persistence:
      size: 500Gi
  readReplicas:
    replicaCount: 3
    persistence:
      size: 500Gi

redis:
  architecture: replication
  replica:
    replicaCount: 3
```

### Development Configuration

```yaml
# values-dev.yaml
global:
  replicaCount: 1

frontend:
  replicaCount: 1
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi

postgresql:
  primary:
    persistence:
      enabled: false

redis:
  master:
    persistence:
      enabled: false

prometheus:
  enabled: false

grafana:
  enabled: false
```

## Monitoring

### Health Checks

All services include health check endpoints:

- Frontend: `http://<frontend-service>/health`
- API Gateway: `http://<api-gateway-service>:8080/health`
- Microservices: `http://<service-name>:8080/health`
- PostgreSQL: `postgresql://<postgresql-service>:5432/bugbounty`
- Redis: `redis://<redis-service>:6379`

### Metrics

Prometheus metrics are exposed on `/metrics` endpoints:

- Application metrics (custom business logic)
- JVM metrics (for Java services)
- Node.js metrics (for Node.js services)
- System metrics (CPU, memory, disk)
- Custom metrics (recon findings, scan results, etc.)

### Dashboards

Pre-configured Grafana dashboards:

- **Application Overview**: General application health and performance
- **Microservices**: Individual service metrics and health
- **Database**: PostgreSQL performance and health metrics
- **Cache**: Redis performance and memory usage
- **Infrastructure**: Kubernetes cluster and node metrics
- **Security**: Security-related metrics and alerts

## Security

### Network Policies

Network policies are configured to:
- Restrict traffic between services
- Block external access to internal services
- Allow only necessary communication ports
- Implement zero-trust networking principles

### Pod Security Policies

Pod security policies enforce:
- Non-root container execution
- Read-only root filesystems
- Dropped capabilities
- Seccomp profiles
- AppArmor profiles

### RBAC

Role-based access control is configured for:
- Service accounts with minimal required permissions
- Namespace isolation
- Pod security admission controllers
- Network policy enforcement

## Troubleshooting

### Common Issues

1. **Pod Startup Failures**
   ```bash
   kubectl describe pod <pod-name> -n production
   kubectl logs <pod-name> -n production --previous
   ```

2. **Service Discovery Issues**
   ```bash
   kubectl get endpoints -n production
   kubectl get services -n production
   nslookup <service-name>.production.svc.cluster.local
   ```

3. **Database Connection Issues**
   ```bash
   kubectl exec -it <pod-name> -n production -- /bin/bash
   nc -zv postgresql 5432
   psql -h postgresql -U postgres -d bugbounty
   ```

4. **Redis Connection Issues**
   ```bash
   kubectl exec -it <pod-name> -n production -- /bin/bash
   redis-cli -h redis -a $REDIS_PASSWORD ping
   ```

### Debugging Commands

```bash
# Check pod status
kubectl get pods -n production

# Check service status
kubectl get services -n production

# Check ingress status
kubectl get ingress -n production

# Check logs
kubectl logs -f <pod-name> -n production

# Execute into pod
kubectl exec -it <pod-name> -n production -- /bin/bash

# Check resource usage
kubectl top pods -n production
kubectl top nodes

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'
```

## Performance Tuning

### Resource Limits

Recommended resource limits for production:

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi
```

### JVM Tuning (for Java services)

```yaml
javaOpts: "-Xms1g -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### Database Connection Pooling

```yaml
database:
  connectionPool:
    minConnections: 5
    maxConnections: 20
    connectionTimeout: 30s
    idleTimeout: 10m
```

## Backup and Recovery

### Database Backup

```bash
# Create database backup
kubectl exec -it postgresql-0 -n production -- pg_dump -U postgres bugbounty > backup.sql

# Restore database backup
kubectl exec -i postgresql-0 -n production -- psql -U postgres -d bugbounty < backup.sql
```

### Redis Backup

```bash
# Create Redis backup
kubectl exec -it redis-master-0 -n production -- redis-cli SAVE
kubectl cp production/redis-master-0:/data/dump.rdb ./redis-backup.rdb

# Restore Redis backup
kubectl cp ./redis-backup.rdb production/redis-master-0:/data/dump.rdb
kubectl exec -it redis-master-0 -n production -- redis-cli CONFIG SET dir /data
kubectl exec -it redis-master-0 -n production -- redis-cli CONFIG dbfilename dump.rdb
```

## Support

For issues and questions:
- Check the troubleshooting section above
- Review service logs for error messages
- Verify configuration values
- Check resource limits and quotas
- Contact the DevOps team for infrastructure issues
- Create GitHub issues for chart improvements