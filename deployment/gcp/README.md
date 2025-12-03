# GCP Production Deployment Guide

This guide provides comprehensive instructions for deploying the Bug Bounty Automation Platform on Google Cloud Platform with enterprise-grade security, scalability, and reliability.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google Cloud Infrastructure                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Cloud DNS    │  │Cloud CDN    │  │Cloud Armor  │         │
│  │   (DNS)     │  │   (CDN)     │  │ (Security)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                  │                  │
│  ┌──────┴─────────────────┴─────────────────┴──────┐         │
│  │          Cloud Load Balancer (HTTPS)           │         │
│  └─────────────────┬───────────────────────────────┘         │
│                    │                                           │
│  ┌─────────────────┴─────────────────┐                         │
│  │         GKE Cluster (K8s)         │                         │
│  │  ┌─────────┐ ┌─────────┐ ┌────────┐ │                         │
│  │  │Frontend │ │Backend │ │Worker  │ │                         │
│  │  │  Pods   │ │  Pods  │ │ Pods   │ │                         │
│  │  └─────────┘ └─────────┘ └────────┘ │                         │
│  └─────────────────┬─────────────────┘                         │
│                    │                                           │
│  ┌─────────────────┴─────────────────┐                         │
│  │         Data Layer               │                         │
│  │  ┌─────────┐ ┌─────────┐ ┌─────┐ │                         │
│  │  │Cloud SQL│ │Memorystor│ │Cloud│ │                         │
│  │  │(PostgreSQL)│ │  (Redis) │ │Storage│                         │
│  │  └─────────┘ └─────────┘ └─────┘ │                         │
│  └─────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Google Cloud SDK (gcloud) installed and configured
- kubectl and gke-gcloud-auth-plugin
- Docker and Docker Compose
- Terraform >= 1.0
- Helm >= 3.0

## Infrastructure Setup

### 1. Project and Billing Setup

```bash
# Set project ID
export PROJECT_ID="bugbounty-platform-prod"
export REGION="us-central1"
export ZONE="us-central1-a"

# Create new project (if needed)
gcloud projects create $PROJECT_ID --name="Bug Bounty Platform"

# Link billing account
gcloud beta billing projects link $PROJECT_ID --billing-account="YOUR_BILLING_ACCOUNT_ID"

# Set as default project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

### 2. Network Infrastructure

```bash
# Create VPC network
gcloud compute networks create bugbounty-vpc \
  --subnet-mode=custom \
  --mtu=1460 \
  --bgp-routing-mode=regional

# Create subnets
gcloud compute networks subnets create bugbounty-subnet-private \
  --network=bugbounty-vpc \
  --range=10.0.1.0/24 \
  --region=$REGION \
  --enable-private-ip-google-access

gcloud compute networks subnets create bugbounty-subnet-public \
  --network=bugbounty-vpc \
  --range=10.0.2.0/24 \
  --region=$REGION

gcloud compute networks subnets create bugbounty-subnet-database \
  --network=bugbounty-vpc \
  --range=10.0.3.0/24 \
  --region=$REGION \
  --enable-private-ip-google-access

# Create firewall rules
gcloud compute firewall-rules create bugbounty-allow-internal \
  --network=bugbounty-vpc \
  --allow=tcp,udp,icmp \
  --source-ranges=10.0.0.0/16 \
  --priority=1000

gcloud compute firewall-rules create bugbounty-allow-health-check \
  --network=bugbounty-vpc \
  --allow=tcp:80,tcp:443 \
  --source-ranges=35.191.0.0/16,130.211.0.0/22 \
  --priority=1000

gcloud compute firewall-rules create bugbounty-allow-ssh \
  --network=bugbounty-vpc \
  --allow=tcp:22 \
  --source-ranges=35.235.240.0/20 \
  --priority=1000
```

### 3. GKE Cluster Setup

```bash
# Create GKE cluster
gcloud container clusters create bugbounty-cluster \
  --region=$REGION \
  --node-locations=$REGION-a,$REGION-b,$REGION-c \
  --network=bugbounty-vpc \
  --subnetwork=bugbounty-subnet-private \
  --cluster-version=latest \
  --num-nodes=2 \
  --min-nodes=1 \
  --max-nodes=10 \
  --enable-autoscaling \
  --enable-autorepair \
  --enable-autoupgrade \
  --machine-type=n2-standard-4 \
  --disk-type=pd-ssd \
  --disk-size=100 \
  --enable-stackdriver-kubernetes \
  --enable-ip-alias \
  --addons=HorizontalPodAutoscaling,HttpLoadBalancing,CloudRun \
  --enable-shielded-nodes \
  --shielded-secure-boot \
  --shielded-integrity-monitoring \
  --workload-pool=$PROJECT_ID.svc.id.goog \
  --enable-workload-identity \
  --release-channel=stable

# Get cluster credentials
gcloud container clusters get-credentials bugbounty-cluster --region=$REGION

# Create node pools
gcloud container node-pools create high-memory-pool \
  --cluster=bugbounty-cluster \
  --region=$REGION \
  --machine-type=n2-highmem-4 \
  --num-nodes=1 \
  --min-nodes=0 \
  --max-nodes=5 \
  --enable-autoscaling \
  --node-taints=workload-type=memory-intensive:NoSchedule \
  --node-labels=workload-type=memory-intensive

gcloud container node-pools create spot-pool \
  --cluster=bugbounty-cluster \
  --region=$REGION \
  --machine-type=n2-standard-2 \
  --num-nodes=1 \
  --min-nodes=0 \
  --max-nodes=10 \
  --enable-autoscaling \
  --spot \
  --node-taints=cloud.google.com/spot=true:NoSchedule \
  --node-labels=cloud.google.com/spot=true
```

### 4. Database Infrastructure

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create bugbounty-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-standard-4 \
  --region=$REGION \
  --storage-size=100GB \
  --storage-type=SSD \
  --storage-auto-increase \
  --availability-type=REGIONAL \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --backup-start-time=03:00 \
  --backup-location=us \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7 \
  --enable-point-in-time-recovery \
  --storage-encryption-key=projects/$PROJECT_ID/locations/global/keyRings/bugbounty-ring/cryptoKeys/bugbounty-key \
  --network=bugbounty-vpc \
  --no-assign-ip \
  --root-password=$DB_PASSWORD

# Create database
gcloud sql databases create bugbounty --instance=bugbounty-postgres

# Create users
gcloud sql users create bugbounty-app --instance=bugbounty-postgres --password=$APP_DB_PASSWORD

# Create Memorystore Redis instance
gcloud redis instances create bugbounty-redis \
  --size=5 \
  --tier=STANDARD_HA \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --network=bugbounty-vpc \
  --connect-mode=PRIVATE_SERVICE_ACCESS \
  --reserved-ip-range=10.0.4.0/29 \
  --transit-encryption-mode=SERVER_AUTHENTICATION \
  --auth-enabled \
  --auth-string=$REDIS_PASSWORD
```

### 5. Storage and CDN

```bash
# Create Cloud Storage buckets
gsutil mb -p $PROJECT_ID -c STANDARD -l US -b on gs://bugbounty-artifacts-prod
gsutil mb -p $PROJECT_ID -c NEARLINE -l US -b on gs://bugbounty-backups-prod
gsutil mb -p $PROJECT_ID -c STANDARD -l US -b on gs://bugbounty-reports-prod

# Set lifecycle policies
cat > lifecycle.json <<EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 90}
    }
  ]
}
EOF
gsutil lifecycle set lifecycle.json gs://bugbounty-artifacts-prod

# Create CDN
gcloud compute backend-services create bugbounty-cdn-backend \
  --protocol=HTTPS \
  --port-name=https \
  --timeout=30s \
  --enable-cdn \
  --health-checks=bugbounty-health-check \
  --global

# Create SSL certificate
gcloud compute ssl-certificates create bugbounty-ssl-cert \
  --domains=api.bugbounty-platform.com,app.bugbounty-platform.com \
  --global
```

## Application Deployment

### 1. Container Registry

```bash
# Create Artifact Registry repository
gcloud artifacts repositories create bugbounty-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Bug Bounty Platform Container Registry"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and push images
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/bugbounty-repo/frontend:latest -f services/frontend/Dockerfile .
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/bugbounty-repo/api-gateway:latest -f services/api-gateway/Dockerfile .
# ... build other services

# Push images
docker push us-central1-docker.pkg.dev/$PROJECT_ID/bugbounty-repo/frontend:latest
docker push us-central1-docker.pkg.dev/$PROJECT_ID/bugbounty-repo/api-gateway:latest
# ... push other services
```

### 2. Kubernetes Deployment

```bash
# Install Helm charts
helm install bugbounty ./helm/bugbounty-platform \
  --namespace production \
  --create-namespace \
  --values helm/values-gcp-production.yaml

# Verify deployment
kubectl get pods -n production
kubectl get services -n production
```

### 3. Load Balancer Configuration

```bash
# Create global load balancer
gcloud compute url-maps create bugbounty-url-map \
  --default-service=bugbounty-backend-service

# Create HTTPS proxy
gcloud compute target-https-proxies create bugbounty-https-proxy \
  --url-map=bugbounty-url-map \
  --ssl-certificates=bugbounty-ssl-cert

# Create forwarding rule
gcloud compute forwarding-rules create bugbounty-https-rule \
  --global \
  --target-https-proxy=bugbounty-https-proxy \
  --ports=443 \
  --ip-protocol=TCP
```

## Security Configuration

### 1. IAM and Service Accounts

```bash
# Create service accounts
gcloud iam service-accounts create bugbounty-eks-sa \
  --display-name="Bug Bounty Platform EKS Service Account"

gcloud iam service-accounts create bugbounty-sql-sa \
  --display-name="Bug Bounty Platform Cloud SQL Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:bugbounty-eks-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:bugbounty-sql-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Create workload identity binding
kubectl create serviceaccount --namespace production bugbounty-ksa
gcloud iam service-accounts add-iam-policy-binding \
  bugbounty-sql-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:$PROJECT_ID.svc.id.goog[production/bugbounty-ksa]"
kubectl annotate serviceaccount --namespace production bugbounty-ksa \
  iam.gke.io/gcp-service-account=bugbounty-sql-sa@$PROJECT_ID.iam.gserviceaccount.com
```

### 2. Secret Management

```bash
# Create secrets in Secret Manager
gcloud secrets create bugbounty-database-credentials \
  --data-file=secrets/database-creds.json

gcloud secrets create bugbounty-api-keys \
  --data-file=secrets/api-keys.json

# Grant access to service accounts
gcloud secrets add-iam-policy-binding bugbounty-database-credentials \
  --member="serviceAccount:bugbounty-sql-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Create Kubernetes secrets
kubectl create secret generic database-credentials \
  --from-literal=username=bugbounty-app \
  --from-literal=password=$APP_DB_PASSWORD \
  --namespace production
```

### 3. Cloud Armor Security Policy

```bash
# Create security policy
gcloud compute security-policies create bugbounty-security-policy \
  --description="Security policy for Bug Bounty Platform"

# Add rules
gcloud compute security-policies rules create 1000 \
  --security-policy=bugbounty-security-policy \
  --expression="true" \
  --action="allow" \
  --description="Allow all traffic"

# Add rate limiting rule
gcloud compute security-policies rules create 2000 \
  --security-policy=bugbounty-security-policy \
  --expression="true" \
  --action="rate-based-ban" \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=600 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP \
  --description="Rate limit requests"

# Add OWASP rules
gcloud compute security-policies rules create 3000 \
  --security-policy=bugbounty-security-policy \
  --expression="evaluatePreconfiguredExpr('xss-stable')" \
  --action="deny-403" \
  --description="Block XSS attacks"

# Apply to backend service
gcloud compute backend-services update bugbounty-backend-service \
  --security-policy=bugbounty-security-policy \
  --global
```

## Monitoring and Alerting

### 1. Cloud Monitoring Setup

```bash
# Create alerting policies
gcloud alpha monitoring policies create --policy-from-file=monitoring/alert-policies/high-cpu.yaml
gcloud alpha monitoring policies create --policy-from-file=monitoring/alert-policies/high-memory.yaml
gcloud alpha monitoring policies create --policy-from-file=monitoring/alert-policies/database-connections.yaml

# Create uptime check
gcloud alpha monitoring uptime create bugbounty-uptime-check \
  --display-name="Bug Bounty Platform Uptime" \
  --uri="https://api.bugbounty-platform.com/health" \
  --check-interval=60s \
  --timeout=10s \
  --content-type="application/json" \
  --expected-response="{\"status\":\"ok\"}"

# Create notification channels
gcloud alpha monitoring channels create --channel-content-from-file=monitoring/notification-channels/email.yaml
gcloud alpha monitoring channels create --channel-content-from-file=monitoring/notification-channels/slack.yaml
```

### 2. Logging Configuration

```bash
# Create log sinks
gcloud logging sinks create bugbounty-security-sink \
  bigquery.googleapis.com/projects/$PROJECT_ID/datasets/bugbounty_logs \
  --log-filter='resource.type="k8s_cluster" AND (severity>=WARNING OR protoPayload.methodName="io.k8s.authorization.rbac.v1.roles.create")'

gcloud logging sinks create bugbounty-audit-sink \
  storage.googleapis.com/bugbounty-audit-logs \
  --log-filter='logName:"cloudaudit.googleapis.com"'

# Create log-based metrics
gcloud logging metrics create bugbounty-error-rate \
  --description="Error rate for Bug Bounty Platform" \
  --log-filter='resource.type="k8s_cluster" AND severity>=ERROR'

gcloud logging metrics create bugbounty-response-time \
  --description="Response time for Bug Bounty Platform" \
  --log-filter='resource.type="k8s_cluster" AND jsonPayload.response_time>1000'
```

### 3. Prometheus and Grafana

```bash
# Install Prometheus Operator
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values monitoring/prometheus-gcp-values.yaml

# Install Grafana dashboards
kubectl apply -f monitoring/gcp-dashboards.yaml
```

## Backup and Disaster Recovery

### 1. Database Backups

```bash
# Enable automated backups
gcloud sql instances patch bugbounty-postgres \
  --backup-start-time=03:00 \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7

# Create manual backup
gcloud sql backups create --instance=bugbounty-postgres \
  --description="Manual backup $(date +%Y%m%d)"

# Export to Cloud Storage
gcloud sql export sql bugbounty-postgres gs://bugbounty-backups-prod/database-$(date +%Y%m%d).sql \
  --database=bugbounty
```

### 2. Cross-Region Backup Strategy

```bash
# Create regional backup
gcloud compute snapshots create bugbounty-disk-snapshot \
  --source-disk=bugbounty-persistent-disk \
  --source-disk-zone=$ZONE \
  --storage-location=us-central1

# Create disaster recovery cluster
gcloud container clusters create bugbounty-dr-cluster \
  --region=us-east1 \
  --node-locations=us-east1-a,us-east1-b,us-east1-c \
  --network=bugbounty-dr-vpc \
  --cluster-version=latest \
  --num-nodes=1 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5 \
  --machine-type=n2-standard-4
```

## Cost Optimization

### 1. Resource Management

```bash
# Create budget alerts
gcloud billing budgets create \
  --billing-account="YOUR_BILLING_ACCOUNT_ID" \
  --display-name="Bug Bounty Platform Budget" \
  --budget-amount=5000 \
  --calendar-period=month \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100 \
  --email-recipients=finance@company.com

# Enable committed use discounts
gcloud compute commitments create bugbounty-commitment \
  --region=$REGION \
  --resources=vcpu=24,memory=96GB \
  --plan=12-month \
  --type=general-purpose
```

### 2. Autoscaling Configuration

```bash
# Configure cluster autoscaling
gcloud container clusters update bugbounty-cluster \
  --enable-autoscaling \
  --min-nodes=3 \
  --max-nodes=30 \
  --zone=$ZONE

# Configure horizontal pod autoscaling
kubectl autoscale deployment api-gateway --cpu-percent=70 --min=3 --max=10 -n production
kubectl autoscale deployment frontend --cpu-percent=80 --min=2 --max=8 -n production
```

## Security Compliance

### 1. Security Command Center

```bash
# Enable Security Command Center
gcloud scc settings enable --organization=YOUR_ORGANIZATION_ID

# Create security sources
gcloud scc sources create bugbounty-security-source \
  --organization=YOUR_ORGANIZATION_ID \
  --display-name="Bug Bounty Platform Security" \
  --description="Security findings for Bug Bounty Platform"

# Configure notification
gcloud scc notifications create bugbounty-security-notifications \
  --organization=YOUR_ORGANIZATION_ID \
  --pubsub-topic=bugbounty-security-topic \
  --filter="severity="HIGH" OR severity="CRITICAL""
```

### 2. Binary Authorization

```bash
# Enable Binary Authorization
gcloud container clusters update bugbounty-cluster \
  --enable-binary-authorization \
  --zone=$ZONE

# Create attestor
gcloud container binauthz attestors create bugbounty-attestor \
  --attestor-type=pgp \
  --pgp-public-key-file=security/pubkey.asc

# Create policy
gcloud container binauthz policy import security/binary-auth-policy.yaml
```

## Performance Monitoring

### 1. Application Performance Monitoring

```bash
# Install Google Cloud Profiler
gcloud services enable cloudprofiler.googleapis.com

# Install Google Cloud Trace
gcloud services enable cloudtrace.googleapis.com

# Configure application instrumentation
kubectl apply -f monitoring/apm-config-gcp.yaml
```

### 2. Load Testing

```bash
# Install k6 for load testing
brew install k6

# Run load tests with Cloud Load Balancing
k6 run --vus 100 --duration 5m load-tests/gcp-load-test.js
k6 cloud run load-tests/gcp-cloud-test.js
```

## Troubleshooting

### Common Issues

1. **Pod Startup Failures**
   ```bash
   kubectl describe pod <pod-name> -n production
   kubectl logs <pod-name> -n production --previous
   gcloud logging read "resource.type=\"k8s_cluster\" AND severity>=ERROR" --limit=50
   ```

2. **Database Connection Issues**
   ```bash
   kubectl exec -it <pod-name> -n production -- /bin/bash
   nc -zv <cloud-sql-ip> 5432
   gcloud sql connect bugbounty-postgres --user=bugbounty-app
   ```

3. **Load Balancer Issues**
   ```bash
   gcloud compute backend-services get-health bugbounty-backend-service --global
   gcloud compute url-maps validate --source=url-map-config.yaml
   ```

### Health Checks

```bash
# Check cluster health
gcloud container clusters describe bugbounty-cluster --region=$REGION
kubectl get nodes
kubectl get pods --all-namespaces

# Check service endpoints
curl -f https://api.bugbounty-platform.com/health
curl -f https://app.bugbounty-platform.com/health

# Check database connectivity
gcloud sql connect bugbounty-postgres --user=bugbounty-app --database=bugbounty
```

## Maintenance Procedures

### 1. Rolling Updates

```bash
# Update deployment
kubectl set image deployment/api-gateway api-gateway=us-central1-docker.pkg.dev/$PROJECT_ID/bugbounty-repo/api-gateway:v2.0.0 -n production

# Check rollout status
kubectl rollout status deployment/api-gateway -n production

# Rollback if needed
kubectl rollout undo deployment/api-gateway -n production
```

### 2. Certificate Management

```bash
# Check certificate expiration
gcloud compute ssl-certificates describe bugbounty-ssl-cert --global

# Renew certificate (auto-renewal should be enabled)
gcloud compute ssl-certificates create bugbounty-ssl-cert-v2 \
  --domains=api.bugbounty-platform.com,app.bugbounty-platform.com \
  --global
```

## Support and Escalation

### Contact Information
- **Technical Support**: support@bugbounty-platform.com
- **Security Team**: security@bugbounty-platform.com
- **On-call Engineer**: +1-xxx-xxx-xxxx

### Escalation Matrix
1. **Level 1**: Automated monitoring alerts
2. **Level 2**: DevOps team (15-minute response)
3. **Level 3**: Senior engineers (30-minute response)
4. **Level 4**: Architecture team (1-hour response)

## Cost Breakdown (Monthly)

| Service | Instance Type | Quantity | Monthly Cost |
|---------|---------------|----------|--------------|
| GKE Cluster | Control Plane | 1 | $74 |
| Worker Nodes | n2-standard-4 | 6 | $240 |
| Cloud SQL PostgreSQL | db-standard-4 | 1 | $400 |
| Memorystore Redis | 5GB Standard | 1 | $250 |
| Load Balancer | Global | 1 | $30 |
| Cloud Monitoring | - | - | $50 |
| Cloud Storage | Multi-region | 500GB | $20 |
| **Total** | | | **$1,064** |

## Next Steps

1. Review and customize configurations for your specific requirements
2. Set up monitoring dashboards and alerts
3. Configure backup verification procedures
4. Implement additional security measures as needed
5. Plan for disaster recovery testing
6. Optimize costs based on actual usage patterns