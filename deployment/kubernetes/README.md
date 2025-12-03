# Bug Bounty Platform - Kubernetes Deployment Guide

This guide provides comprehensive instructions for deploying the Bug Bounty Automation Platform on Kubernetes using Helm charts.

## Architecture Overview

The platform is deployed as a set of microservices on Kubernetes with the following components:

### Core Services
- **Frontend**: React-based web UI
- **API Gateway**: Express.js API gateway
- **Recon Service**: Subdomain discovery and enumeration
- **Scanning Service**: Vulnerability scanning
- **Exploitation Service**: Automated exploitation testing
- **Triage Service**: Vulnerability triage and analysis
- **Reporting Service**: Report generation and distribution

### Infrastructure Components
- **PostgreSQL**: Primary database
- **Redis**: Caching and message queuing
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## Prerequisites

### Required Tools
- Kubernetes cluster (1.19+)
- Helm 3.0+
- kubectl configured for your cluster
- Container registry access

### Cluster Requirements
- Minimum 4 CPU cores
- 8GB RAM
- 100GB storage
- Load balancer support
- Persistent volume support

## Quick Start

### 1. Add Helm Repository
```bash
helm repo add bugbounty-platform https://charts.bugbounty-platform.com
helm repo update
```

### 2. Install with Default Values
```bash
helm install bugbounty-platform bugbounty-platform/bugbounty-platform \
  --namespace bugbounty \
  --create-namespace
```

### 3. Install with Custom Values
```bash
helm install bugbounty-platform bugbounty-platform/bugbounty-platform \
  --namespace bugbounty \
  --create-namespace \
  -f custom-values.yaml
```

## Configuration

### Required Configuration
Create a `values.yaml` file with your specific configuration:

```yaml
global:
  # Container registry configuration
  imageRegistry: "your-registry.com"
  imagePullSecrets:
    - name: registry-credentials
  
  # Domain configuration
  domain: "bugbounty.yourcompany.com"
  
  # Security configuration
  jwtSecret: "your-jwt-secret-here"
  apiSecret: "your-api-secret-here"
  encryptionKey: "your-encryption-key-here"

# Database configuration
postgresql:
  auth:
    postgresPassword: "your-postgres-password"
    database: "bugbounty_platform"

# Redis configuration
redis:
  auth:
    password: "your-redis-password"

# Service-specific configurations
frontend:
  config:
    apiUrl: "https://api.bugbounty.yourcompany.com"
    
apiGateway:
  config:
    corsOrigins: ["https://bugbounty.yourcompany.com"]
```

### Advanced Configuration

#### Resource Limits
```yaml
apiGateway:
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 100m
      memory: 128Mi
```

#### Autoscaling
```yaml
apiGateway:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80
```

#### Ingress Configuration
```yaml
frontend:
  ingress:
    enabled: true
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-prod
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
    hosts:
      - host: bugbounty.yourcompany.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: bugbounty-tls
        hosts:
          - bugbounty.yourcompany.com
```

## Deployment Steps

### 1. Prepare Namespace
```bash
kubectl create namespace bugbounty
kubectl label namespace bugbounty istio-injection=enabled  # If using Istio
```

### 2. Create Secrets
```bash
# Create registry secret if using private registry
kubectl create secret docker-registry registry-credentials \
  --docker-server=your-registry.com \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email \
  --namespace=bugbounty
```

### 3. Install Dependencies
```bash
# Add required Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 4. Deploy Platform
```bash
helm install bugbounty-platform ./helm/bugbounty-platform \
  --namespace bugbounty \
  -f values.yaml \
  --wait
```

### 5. Verify Deployment
```bash
# Check pod status
kubectl get pods -n bugbounty

# Check services
kubectl get services -n bugbounty

# Check ingress
kubectl get ingress -n bugbounty
```

## Monitoring and Observability

### Prometheus Metrics
The platform exposes metrics on `/metrics` endpoints for all services. Key metrics include:

- HTTP request rate and latency
- Error rates by service
- Database connection pool status
- Redis connection status
- Queue depths and processing rates
- Vulnerability discovery rates

### Grafana Dashboards
Access Grafana dashboards for comprehensive monitoring:

```bash
# Get Grafana admin password
kubectl get secret --namespace bugbounty bugbounty-platform-grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward to access Grafana
kubectl port-forward --namespace bugbounty svc/bugbounty-platform-grafana 3000:80
```

Default dashboards include:
- Platform Overview
- Service Performance
- Database Metrics
- Security Scanning Status
- Vulnerability Trends

### Alerting
Pre-configured alerts for:
- Service downtime
- High error rates
- High latency
- Resource exhaustion
- Security events

## Security Configuration

### Network Policies
Network policies are automatically configured to:
- Restrict database access to application services
- Isolate service-to-service communication
- Block external access to internal services
- Allow only HTTPS traffic

### Pod Security
Pods are configured with:
- Non-root user execution
- Read-only root filesystem
- Dropped capabilities
- Security context constraints

### RBAC
Role-based access control is configured for:
- Service accounts with minimal permissions
- Namespace isolation
- Secret access controls

## Backup and Recovery

### Database Backup
```bash
# Create manual backup
kubectl exec -n bugbounty deployment/bugbounty-platform-postgresql -- pg_dump -U postgres bugbounty_platform > backup.sql

# Schedule automated backups
kubectl apply -f backup-cronjob.yaml
```

### Disaster Recovery
1. **Database Recovery**:
   ```bash
   # Restore from backup
   kubectl exec -i -n bugbounty deployment/bugbounty-platform-postgresql -- psql -U postgres bugbounty_platform < backup.sql
   ```

2. **Configuration Recovery**:
   ```bash
   # Backup configuration
   helm get values bugbounty-platform -n bugbounty > platform-config-backup.yaml
   ```

## Scaling and Performance

### Horizontal Pod Autoscaling
All services support HPA based on:
- CPU utilization
- Memory utilization
- Custom metrics (queue depth, request rate)

### Vertical Pod Autoscaling
Configure VPA for automatic resource optimization:
```yaml
apiGateway:
  verticalPodAutoscaler:
    enabled: true
    updateMode: "Auto"
```

### Cluster Autoscaling
Configure cluster autoscaler for node scaling:
```yaml
# Add to your cluster autoscaler configuration
apiGateway:
  nodeSelector:
    node-type: compute-optimized
  tolerations:
    - key: "compute-optimized"
      operator: "Equal"
      value: "true"
      effect: "NoSchedule"
```

## Troubleshooting

### Common Issues

#### Pod Startup Failures
```bash
# Check pod logs
kubectl logs -n bugbounty deployment/bugbounty-platform-api-gateway

# Check events
kubectl get events -n bugbounty --sort-by=.metadata.creationTimestamp
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
kubectl exec -n bugbounty deployment/bugbounty-platform-postgresql -- pg_isready

# Check connection strings
kubectl get configmap -n bugbounty bugbounty-platform-config -o yaml
```

#### Service Discovery Issues
```bash
# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never --namespace=bugbounty -- sh
# Inside pod: nslookup bugbounty-platform-api-gateway
```

### Performance Tuning

#### Database Performance
- Configure connection pooling
- Optimize queries
- Add database indexes
- Configure read replicas

#### Application Performance
- Tune JVM parameters (if applicable)
- Configure thread pools
- Optimize caching strategies
- Enable compression

## Upgrades

### Rolling Updates
```bash
# Upgrade to new version
helm upgrade bugbounty-platform ./helm/bugbounty-platform \
  --namespace bugbounty \
  -f values.yaml \
  --wait
```

### Blue-Green Deployments
```bash
# Deploy to staging namespace
helm install bugbounty-platform-staging ./helm/bugbounty-platform \
  --namespace bugbounty-staging \
  -f staging-values.yaml

# Switch traffic after testing
kubectl patch service bugbounty-platform-frontend \
  -n bugbounty \
  -p '{"spec":{"selector":{"version":"v2"}}}'
```

## Maintenance

### Log Management
```bash
# View logs for specific service
kubectl logs -f -n bugbounty deployment/bugbounty-platform-api-gateway

# View logs for all services
kubectl logs -n bugbounty -l app.kubernetes.io/name=bugbounty-platform -f
```

### Health Checks
```bash
# Check service health
kubectl get pods -n bugbounty -o wide

# Check endpoint health
curl -k https://api.bugbounty.yourcompany.com/health
```

### Resource Cleanup
```bash
# Cleanup completed jobs
kubectl delete jobs --field-selector status.successful=1 -n bugbounty

# Cleanup old replicasets
kubectl delete replicasets --field-selector status.replicas=0 -n bugbounty
```

## Support

### Getting Help
- Check the [troubleshooting guide](#troubleshooting)
- Review service logs
- Check monitoring dashboards
- Contact support team

### Documentation
- [API Documentation](https://docs.bugbounty-platform.com/api)
- [Architecture Guide](https://docs.bugbounty-platform.com/architecture)
- [Security Guide](https://docs.bugbounty-platform.com/security)

## License

This deployment is licensed under the same terms as the Bug Bounty Automation Platform.