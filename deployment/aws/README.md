# AWS Production Deployment Guide

This guide provides comprehensive instructions for deploying the Bug Bounty Automation Platform on AWS with enterprise-grade security, scalability, and reliability.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud Infrastructure                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Route 53   │  │ CloudFront  │  │    WAF      │         │
│  │     (DNS)    │  │    (CDN)    │  │ (Security)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                  │                  │
│  ┌──────┴─────────────────┴─────────────────┴──────┐         │
│  │              Application Load Balancer            │         │
│  └─────────────────┬───────────────────────────────┘         │
│                    │                                           │
│  ┌─────────────────┴─────────────────┐                         │
│  │         EKS Cluster (K8s)         │                         │
│  │  ┌─────────┐ ┌─────────┐ ┌────────┐ │                         │
│  │  │Frontend │ │Backend │ │Worker  │ │                         │
│  │  │  Pods   │ │  Pods  │ │ Pods   │ │                         │
│  │  └─────────┘ └─────────┘ └────────┘ │                         │
│  └─────────────────┬─────────────────┘                         │
│                    │                                           │
│  ┌─────────────────┴─────────────────┐                         │
│  │         Data Layer               │                         │
│  │  ┌─────────┐ ┌─────────┐ ┌─────┐ │                         │
│  │  │  RDS    │ │ ElastiCache│ │ S3  │ │                         │
│  │  │(PostgreSQL)│ │ (Redis) │ │(Storage)│                         │
│  │  └─────────┘ └─────────┘ └─────┘ │                         │
│  └─────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS CLI configured with appropriate permissions
- kubectl and eksctl installed
- Docker and Docker Compose
- Terraform >= 1.0
- Helm >= 3.0

## Infrastructure Setup

### 1. Network Infrastructure

```bash
# Create VPC and networking
aws cloudformation create-stack \
  --stack-name bugbounty-network \
  --template-body file://infrastructure/network.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production

# Create security groups
aws cloudformation create-stack \
  --stack-name bugbounty-security \
  --template-body file://infrastructure/security.yaml
```

### 2. EKS Cluster Setup

```bash
# Create EKS cluster
eksctl create cluster -f infrastructure/eks-cluster.yaml

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name bugbounty-prod

# Install cluster autoscaler
kubectl apply -f infrastructure/cluster-autoscaler.yaml
```

### 3. Database Infrastructure

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier bugbounty-postgres-prod \
  --db-instance-class db.r5.xlarge \
  --engine postgres \
  --master-username admin \
  --master-user-password $DB_PASSWORD \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name bugbounty-db-subnet-group

# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id bugbounty-redis-prod \
  --cache-node-type cache.r5.xlarge \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxxx
```

## Application Deployment

### 1. Container Registry

```bash
# Create ECR repositories
aws ecr create-repository --repository-name bugbounty/frontend
aws ecr create-repository --repository-name bugbounty/api-gateway
aws ecr create-repository --repository-name bugbounty/recon-service
aws ecr create-repository --repository-name bugbounty/scanning-service
aws ecr create-repository --repository-name bugbounty/exploitation-service
aws ecr create-repository --repository-name bugbounty/triage-service
aws ecr create-repository --repository-name bugbounty/reporting-service

# Build and push images
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build images
docker build -t $ECR_REGISTRY/bugbounty/frontend:latest -f services/frontend/Dockerfile .
docker build -t $ECR_REGISTRY/bugbounty/api-gateway:latest -f services/api-gateway/Dockerfile .
# ... build other services

# Push images
docker push $ECR_REGISTRY/bugbounty/frontend:latest
docker push $ECR_REGISTRY/bugbounty/api-gateway:latest
# ... push other services
```

### 2. Kubernetes Deployment

```bash
# Install Helm charts
helm install bugbounty ./helm/bugbounty-platform \
  --namespace production \
  --create-namespace \
  --values helm/values-production.yaml

# Verify deployment
kubectl get pods -n production
kubectl get services -n production
```

### 3. Load Balancer and SSL

```bash
# Create application load balancer
aws elbv2 create-load-balancer \
  --name bugbounty-alb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --security-groups sg-xxxxxxxxx

# Create SSL certificate
aws acm request-certificate \
  --domain-name api.bugbounty-platform.com \
  --validation-method DNS
```

## Security Configuration

### 1. IAM Roles and Policies

```bash
# Create service roles
aws iam create-role --role-name bugbounty-eks-role --assume-role-policy-document file://iam/eks-trust-policy.json
aws iam create-role --role-name bugbounty-rds-role --assume-role-policy-document file://iam/rds-trust-policy.json

# Attach policies
aws iam attach-role-policy --role-name bugbounty-eks-role --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
aws iam attach-role-policy --role-name bugbounty-eks-role --policy-arn arn:aws:iam::aws:policy/AmazonEKSVPCResourceController
```

### 2. Secrets Management

```bash
# Create secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name bugbounty/database-credentials \
  --secret-string file://secrets/database-creds.json

aws secretsmanager create-secret \
  --name bugbounty/api-keys \
  --secret-string file://secrets/api-keys.json

# Create Kubernetes secrets from AWS Secrets Manager
kubectl create secret generic database-credentials \
  --from-literal=username=admin \
  --from-literal=password=$DB_PASSWORD \
  --namespace production
```

### 3. WAF Configuration

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name bugbounty-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=bugbounty-waf-metrics
```

## Monitoring and Alerting

### 1. CloudWatch Setup

```bash
# Create CloudWatch log groups
aws logs create-log-group --log-group-name /aws/eks/bugbounty/cluster
aws logs create-log-group --log-group-name /aws/eks/bugbounty/application

# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name bugbounty-high-cpu \
  --alarm-description "High CPU utilization" \
  --metric-name CPUUtilization \
  --namespace AWS/EKS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 2. Prometheus and Grafana

```bash
# Install Prometheus Operator
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values monitoring/prometheus-values.yaml

# Install Grafana dashboards
kubectl apply -f monitoring/grafana-dashboards.yaml
```

## Backup and Disaster Recovery

### 1. Database Backups

```bash
# Enable RDS automated backups
aws rds modify-db-instance \
  --db-instance-identifier bugbounty-postgres-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00"

# Create snapshot
aws rds create-db-snapshot \
  --db-snapshot-identifier bugbounty-postgres-snapshot-$(date +%Y%m%d) \
  --db-instance-identifier bugbounty-postgres-prod
```

### 2. S3 Backup Strategy

```bash
# Create S3 bucket for backups
aws s3api create-bucket \
  --bucket bugbounty-backups-prod \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

# Enable versioning and lifecycle policies
aws s3api put-bucket-versioning \
  --bucket bugbounty-backups-prod \
  --versioning-configuration Status=Enabled

# Create lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket bugbounty-backups-prod \
  --lifecycle-configuration file://s3-lifecycle.json
```

## Cost Optimization

### 1. Resource Tagging

```bash
# Tag all resources for cost tracking
aws tag-resources \
  --resource-arn-list $(aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=bugbounty --query 'ResourceTagMappingList[*].ResourceARN' --output text) \
  --tags Environment=production,Project=bugbounty,CostCenter=security
```

### 2. Reserved Instances

```bash
# Purchase reserved instances for predictable workloads
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --instance-count 10
```

## Security Compliance

### 1. Security Hub

```bash
# Enable Security Hub
aws securityhub enable-security-hub --region us-west-2

# Enable CIS AWS Foundations Benchmark
aws securityhub enable-standards --standards-arn arn:aws:securityhub:us-west-2::standards/cis-aws-foundations-benchmark/v/1.2.0

# Enable PCI DSS
aws securityhub enable-standards --standards-arn arn:aws:securityhub:us-west-2::standards/pci-dss/v/3.2.1
```

### 2. GuardDuty

```bash
# Enable GuardDuty
aws guardduty create-detector --enable --region us-west-2

# Create threat intelligence set
aws guardduty create-threat-intel-set \
  --detector-id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --name bugbounty-threat-intel \
  --format TXT \
  --location s3://bugbounty-security/threat-intel.txt \
  --activate
```

## Performance Monitoring

### 1. Application Performance Monitoring

```bash
# Install AWS X-Ray daemon
kubectl apply -f monitoring/xray-daemon.yaml

# Configure application instrumentation
kubectl apply -f monitoring/apm-config.yaml
```

### 2. Load Testing

```bash
# Install k6 for load testing
brew install k6

# Run load tests
k6 run --vus 100 --duration 5m load-tests/api-load-test.js
k6 run --vus 50 --duration 10m load-tests/frontend-load-test.js
```

## Troubleshooting

### Common Issues

1. **Pod Startup Failures**
   ```bash
   kubectl describe pod <pod-name> -n production
   kubectl logs <pod-name> -n production --previous
   ```

2. **Database Connection Issues**
   ```bash
   kubectl exec -it <pod-name> -n production -- /bin/bash
   nc -zv <rds-endpoint> 5432
   ```

3. **SSL Certificate Issues**
   ```bash
   openssl s_client -connect api.bugbounty-platform.com:443 -servername api.bugbounty-platform.com
   ```

### Health Checks

```bash
# Check cluster health
kubectl get nodes
kubectl get pods --all-namespaces

# Check service endpoints
curl -f https://api.bugbounty-platform.com/health
curl -f https://app.bugbounty-platform.com/health

# Check database connectivity
kubectl exec -it <postgres-pod> -- psql -h <rds-endpoint> -U admin -d bugbounty
```

## Maintenance Procedures

### 1. Rolling Updates

```bash
# Update deployment
kubectl set image deployment/api-gateway api-gateway=$ECR_REGISTRY/bugbounty/api-gateway:v2.0.0 -n production

# Check rollout status
kubectl rollout status deployment/api-gateway -n production

# Rollback if needed
kubectl rollout undo deployment/api-gateway -n production
```

### 2. Certificate Renewal

```bash
# Check certificate expiration
aws acm describe-certificate --certificate-arn arn:aws:acm:us-west-2:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Renew certificate (auto-renewal should be enabled)
aws acm request-certificate --domain-name api.bugbounty-platform.com --validation-method DNS
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
| EKS Cluster | Control Plane | 1 | $73 |
| Worker Nodes | t3.large | 6 | $250 |
| RDS PostgreSQL | db.r5.xlarge | 1 | $350 |
| ElastiCache Redis | cache.r5.xlarge | 1 | $200 |
| Application Load Balancer | - | 1 | $25 |
| CloudWatch | - | - | $100 |
| S3 Storage | Standard | 500GB | $15 |
| **Total** | | | **$1,013** |

## Next Steps

1. Review and customize configurations for your specific requirements
2. Set up monitoring dashboards and alerts
3. Configure backup verification procedures
4. Implement additional security measures as needed
5. Plan for disaster recovery testing
6. Optimize costs based on actual usage patterns