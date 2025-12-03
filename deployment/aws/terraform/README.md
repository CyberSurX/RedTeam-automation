# AWS Infrastructure as Code Templates

This directory contains Terraform and CloudFormation templates for deploying the Bug Bounty Automation Platform on AWS.

## Directory Structure

```
aws/
├── terraform/
│   ├── modules/
│   │   ├── vpc/
│   │   ├── eks/
│   │   ├── rds/
│   │   ├── elastiCache/
│   │   ├── s3/
│   │   ├── iam/
│   │   ├── security/
│   │   └── monitoring/
│   ├── environments/
│   │   ├── production/
│   │   ├── staging/
│   │   └── development/
│   └── main.tf
├── cloudformation/
│   ├── network.yaml
│   ├── eks-cluster.yaml
│   ├── rds-database.yaml
│   ├── security-groups.yaml
│   └── iam-roles.yaml
└── scripts/
    ├── deploy.sh
    ├── destroy.sh
    └── validate.sh
```

## Quick Start

### Using Terraform (Recommended)

```bash
# Initialize Terraform
cd terraform/environments/production
terraform init

# Plan deployment
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Destroy infrastructure (when needed)
terraform destroy
```

### Using CloudFormation

```bash
# Deploy network stack
aws cloudformation create-stack \
  --stack-name bugbounty-network \
  --template-body file://cloudformation/network.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production

# Deploy EKS cluster
aws cloudformation create-stack \
  --stack-name bugbounty-eks \
  --template-body file://cloudformation/eks-cluster.yaml \
  --capabilities CAPABILITY_IAM
```

## Configuration

### Environment Variables

```bash
# AWS Configuration
export AWS_REGION=us-west-2
export AWS_PROFILE=bugbounty-prod

# Terraform Variables
export TF_VAR_environment=production
export TF_VAR_region=us-west-2
export TF_VAR_project_name=bugbounty-platform

# Database Configuration
export TF_VAR_db_password=your-secure-password
export TF_VAR_db_username=admin

# SSL Certificate
export TF_VAR_domain_name=api.bugbounty-platform.com
```

### Terraform Variables File

Create `terraform.tfvars`:

```hcl
environment     = "production"
region          = "us-west-2"
project_name    = "bugbounty-platform"
domain_name     = "api.bugbounty-platform.com"

# Instance configurations
eks_node_instance_type = "t3.large"
eks_node_count        = 6
rds_instance_class    = "db.r5.xlarge"
redis_node_type       = "cache.r5.xlarge"

# Security
db_password = "your-secure-password"

# Cost optimization
enable_spot_instances = true
spot_instance_ratio   = 0.3
```

## Security Best Practices

1. **Use IAM Roles**: All services use IAM roles instead of access keys
2. **Encryption at Rest**: All data is encrypted using AWS KMS
3. **Network Isolation**: Services are deployed in private subnets
4. **Security Groups**: Minimal required permissions only
5. **WAF Protection**: Web Application Firewall for all public endpoints
6. **Secrets Manager**: All secrets stored in AWS Secrets Manager

## Cost Optimization

1. **Spot Instances**: Use spot instances for worker nodes (configurable)
2. **Reserved Instances**: Purchase RIs for predictable workloads
3. **Auto-scaling**: Horizontal pod autoscaling based on metrics
4. **Resource Tagging**: All resources tagged for cost tracking
5. **Lifecycle Policies**: S3 lifecycle policies for data retention

## Monitoring and Alerting

1. **CloudWatch**: Native AWS monitoring and alerting
2. **Prometheus**: Kubernetes-native monitoring
3. **Grafana**: Visualization and dashboards
4. **AWS X-Ray**: Distributed tracing
5. **Security Hub**: Security compliance monitoring

## Backup and Recovery

1. **RDS Automated Backups**: 30-day retention with point-in-time recovery
2. **S3 Cross-Region Replication**: Critical data replicated across regions
3. **EKS Snapshots**: Regular cluster state backups
4. **Disaster Recovery**: Multi-AZ deployment with failover capabilities

## Compliance

1. **CIS Benchmarks**: Automated compliance checking
2. **PCI DSS**: Payment card industry compliance
3. **SOC 2**: Security controls implementation
4. **GDPR**: Data protection and privacy controls

## Support

For issues or questions:
- Check the troubleshooting section in the main README
- Review AWS service limits and quotas
- Contact the DevOps team for infrastructure issues
- Create GitHub issues for template improvements