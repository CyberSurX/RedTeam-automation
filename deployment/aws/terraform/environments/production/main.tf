# Production Environment Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket         = "bugbounty-terraform-state-prod"
    key            = "production/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "bugbounty-terraform-locks"
  }
}

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      CostCenter  = "security"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  account_id = data.aws_caller_identity.current.account_id
  azs        = slice(data.aws_availability_zones.available.names, 0, 3)
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# VPC and Networking
module "vpc" {
  source = "../modules/vpc"
  
  name                 = "${var.project_name}-${var.environment}"
  cidr                 = var.vpc_cidr
  azs                  = local.azs
  private_subnets      = var.private_subnets
  public_subnets       = var.public_subnets
  database_subnets     = var.database_subnets
  elasticache_subnets  = var.elasticache_subnets
  
  enable_nat_gateway   = true
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = local.common_tags
}

# Security Groups
module "security" {
  source = "../modules/security"
  
  vpc_id             = module.vpc.vpc_id
  project_name       = var.project_name
  environment        = var.environment
  allowed_cidr_blocks  = var.allowed_cidr_blocks
  
  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "../modules/eks"
  
  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = var.kubernetes_version
  
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  public_subnets  = module.vpc.public_subnets
  
  node_groups = {
    main = {
      desired_capacity = var.eks_node_count
      max_capacity     = var.eks_node_max_count
      min_capacity     = var.eks_node_min_count
      
      instance_types = [var.eks_node_instance_type]
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "main"
      }
      
      additional_tags = local.common_tags
    }
    
    spot = {
      desired_capacity = var.enable_spot_instances ? ceil(var.eks_node_count * var.spot_instance_ratio) : 0
      max_capacity     = var.enable_spot_instances ? ceil(var.eks_node_max_count * var.spot_instance_ratio) : 0
      min_capacity     = 0
      
      instance_types = var.eks_spot_instance_types
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "spot"
        Lifecycle   = "spot"
      }
      
      additional_tags = merge(local.common_tags, {
        "k8s.io/cluster-autoscaler/node-template/label/lifecycle" = "spot"
      })
    }
  }
  
  tags = local.common_tags
}

# RDS PostgreSQL
module "rds" {
  source = "../modules/rds"
  
  identifier = "${var.project_name}-postgres-${var.environment}"
  
  engine               = "postgres"
  engine_version       = var.postgres_version
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.rds_instance_class
  
  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  storage_encrypted     = true
  storage_type          = "gp3"
  
  db_name  = var.project_name
  username = var.db_username
  password = var.db_password
  port     = 5432
  
  vpc_security_group_ids = [module.security.rds_security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group
  
  backup_retention_period = var.rds_backup_retention_period
  backup_window          = var.rds_backup_window
  maintenance_window     = var.rds_maintenance_window
  
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  
  tags = local.common_tags
}

# ElastiCache Redis
module "elasticache" {
  source = "../modules/elasticache"
  
  cluster_id         = "${var.project_name}-redis-${var.environment}"
  description        = "Redis cache for ${var.project_name}"
  
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  port                 = 6379
  parameter_group_name = "default.redis7"
  
  subnet_group_name = module.vpc.elasticache_subnet_group
  security_group_ids = [module.security.elasticache_security_group_id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = local.common_tags
}

# S3 Buckets
module "s3" {
  source = "../modules/s3"
  
  project_name = var.project_name
  environment  = var.environment
  
  tags = local.common_tags
}

# IAM Roles and Policies
module "iam" {
  source = "../modules/iam"
  
  project_name = var.project_name
  environment  = var.environment
  
  eks_cluster_name = module.eks.cluster_name
  
  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "../modules/alb"
  
  name        = "${var.project_name}-${var.environment}"
  description = "Application Load Balancer for ${var.project_name}"
  
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [module.security.alb_security_group_id]
  
  domain_name     = var.domain_name
  route53_zone_id = var.route53_zone_id
  
  ssl_certificate_arn = var.ssl_certificate_arn
  
  tags = local.common_tags
}

# WAF Configuration
module "waf" {
  source = "../modules/waf"
  
  name        = "${var.project_name}-${var.environment}"
  description = "Web Application Firewall for ${var.project_name}"
  
  alb_arn = module.alb.alb_arn
  
  tags = local.common_tags
}

# CloudWatch Alarms and Dashboards
module "monitoring" {
  source = "../modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  
  sns_topic_name = "${var.project_name}-alerts-${var.environment}"
  
  eks_cluster_name = module.eks.cluster_name
  rds_instance_id  = module.rds.db_instance_id
  alb_arn          = module.alb.alb_arn
  
  tags = local.common_tags
}

# Kubernetes Applications
module "kubernetes_apps" {
  source = "../modules/kubernetes-apps"
  
  depends_on = [module.eks, module.rds, module.elasticache]
  
  project_name = var.project_name
  environment  = var.environment
  
  # Database configuration
  database_endpoint = module.rds.db_instance_endpoint
  database_name     = var.project_name
  database_username = var.db_username
  database_password = var.db_password
  
  # Redis configuration
  redis_endpoint = module.elasticache.cache_nodes[0].address
  redis_port     = module.elasticache.cache_nodes[0].port
  
  # S3 configuration
  s3_bucket_name = module.s3.application_bucket_name
  
  # Domain configuration
  domain_name = var.domain_name
  
  # Container images
  container_images = var.container_images
  
  # Resource limits
  resource_limits = var.resource_limits
  
  tags = local.common_tags
}

# Outputs
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.cache_nodes[0].address
  sensitive   = true
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = module.alb.alb_dns_name
}

output "application_url" {
  description = "URL of the deployed application"
  value       = "https://${var.domain_name}"
}

output "monitoring_dashboard_url" {
  description = "URL to Grafana monitoring dashboard"
  value       = "https://grafana.${var.domain_name}"
}

output "cost_breakdown" {
  description = "Estimated monthly costs"
  value = {
    eks_cluster     = "$73"
    worker_nodes    = "$${var.eks_node_count * 42}"
    rds_postgres    = "$350"
    elasticache     = "$200"
    load_balancer   = "$25"
    monitoring      = "$100"
    s3_storage      = "$15"
    total           = "$${763 + var.eks_node_count * 42}"
  }
}