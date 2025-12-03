# Deployment Guide

This guide covers various deployment options for the RedTeam Automation Platform.

## 🐳 Docker Deployment

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB+ RAM recommended
- 50GB+ storage recommended

### Quick Start
```bash
# Clone repository
git clone https://github.com/your-org/redteam-automation.git
cd redteam-automation

# Copy environment file
cp .env.example .env

# Edit configuration
nano .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Production Deployment
```bash
# Use production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# With external database
docker-compose -f docker-compose.yml -f docker-compose.external-db.yml up -d

# Scale services
docker-compose up -d --scale scanning=3 --scale recon=2
```

### SSL/TLS Configuration
```bash
# Using Let's Encrypt
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d

# Manual certificate
cp your-certificate.crt nginx/certs/
cp your-private.key nginx/certs/
docker-compose up -d
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes 1.25+
- kubectl configured
- Helm 3.0+ (optional)

### Namespace Setup
```bash
# Create namespace
kubectl create namespace redteam-automation

# Set as default
kubectl config set-context --current --namespace=redteam-automation
```

### Deploy with kubectl
```bash
# Apply configurations
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/persistent-volumes/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/

# Check deployment
kubectl get pods
kubectl get services
kubectl get ingress
```

### Deploy with Helm
```bash
# Add Helm repository
helm repo add redteam-automation https://charts.redteam-automation.com
helm repo update

# Install with custom values
helm install redteam-automation redteam-automation/redteam-automation \
  --namespace redteam-automation \
  --values values-production.yaml

# Upgrade deployment
helm upgrade redteam-automation redteam-automation/redteam-automation \
  --namespace redteam-automation \
  --values values-production.yaml
```

## 🏗️ Manual Deployment

### Server Requirements
- Ubuntu 20.04+ / CentOS 8+
- 4+ CPU cores
- 8GB+ RAM
- 100GB+ SSD storage
- Static IP address

### System Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y curl wget git build-essential

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Application Deployment
```bash
# Clone repository
git clone https://github.com/your-org/redteam-automation.git
cd redteam-automation

# Install dependencies
npm install
npm run build

# Setup database
psql -U postgres -d redteam_automation -f database/init.sql

# Configure environment
cp .env.example .env
nano .env

# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx
sudo cp nginx/nginx.conf /etc/nginx/sites-available/redteam-automation
sudo ln -s /etc/nginx/sites-available/redteam-automation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ☁️ Cloud Deployment

### AWS Deployment
```bash
# Using ECS
aws ecs create-cluster --cluster-name redteam-automation
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json
aws ecs create-service --cli-input-json file://aws/ecs-service.json

# Using EKS
eksctl create cluster --name redteam-automation --region us-west-2
eksctl utils associate-iam-oidc-provider --cluster redteam-automation --approve
kubectl apply -f k8s/

# Using Elastic Beanstalk
eb init -p docker redteam-automation
eb create redteam-automation-env
eb deploy
```

### Google Cloud Platform
```bash
# Using GKE
gcloud container clusters create redteam-automation \
  --zone us-central1-a \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10

kubectl apply -f k8s/

# Using Cloud Run
gcloud run deploy redteam-automation \
  --image gcr.io/PROJECT-ID/redteam-automation \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Deployment
```bash
# Using AKS
az aks create \
  --resource-group redteam-automation-rg \
  --name redteam-automation \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

kubectl apply -f k8s/

# Using Container Instances
az container create \
  --resource-group redteam-automation-rg \
  --name redteam-automation \
  --image redteam-automation:latest \
  --dns-name-label redteam-automation
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/redteam_automation

# Redis
REDIS_URL=redis://host:6379

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Platform APIs
HACKERONE_API_KEY=your-hackerone-key
BUGCROWD_API_KEY=your-bugcrowd-key

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=admin123

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Secrets Management
```bash
# Using Docker secrets
echo "your-secret" | docker secret create jwt_secret -
echo "your-password" | docker secret create db_password -

# Using Kubernetes secrets
kubectl create secret generic redteam-secrets \
  --from-literal=jwt-secret=your-secret \
  --from-literal=db-password=your-password

# Using HashiCorp Vault
vault kv put secret/redteam-automation jwt-secret=your-secret db-password=your-password
```

## 📊 Monitoring Setup

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'redteam-api'
    static_configs:
      - targets: ['api:3001']
  
  - job_name: 'redteam-services'
    static_configs:
      - targets: ['recon:3002', 'scanning:3003', 'exploitation:3004']
```

### Grafana Dashboards
```bash
# Import dashboards
curl -X POST \
  http://admin:admin@localhost:3002/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @monitoring/dashboards/redteam-overview.json
```

### Alerting Setup
```yaml
# alerting-rules.yml
groups:
  - name: redteam-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"
```

## 🔒 Security Hardening

### Network Security
```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Setup fail2ban
sudo apt install fail2ban
sudo cp config/fail2ban.local /etc/fail2ban/
sudo systemctl restart fail2ban
```

### Application Security
- Enable HTTPS/TLS
- Implement rate limiting
- Configure CORS properly
- Use security headers
- Regular security updates
- Vulnerability scanning

### Database Security
```sql
-- Create dedicated user
CREATE USER redteam_user WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE redteam_automation TO redteam_user;
GRANT USAGE ON SCHEMA public TO redteam_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO redteam_user;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# Automated backup
#!/bin/bash
BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres redteam_automation > "$BACKUP_DIR/redteam_$DATE.sql"

# Restore database
psql -U postgres -d redteam_automation < redteam_backup.sql
```

### Application Backup
```bash
# Backup configuration
tar -czf config_backup.tar.gz .env ecosystem.config.js

# Backup uploads
tar -czf uploads_backup.tar.gz uploads/
```

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          ssh user@production-server 'cd /app && git pull && docker-compose up -d'
```

### GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

deploy:
  stage: deploy
  script:
    - docker-compose up -d
  only:
    - main
```

## 📞 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Check connection
telnet localhost 5432
```

#### Memory Issues
```bash
# Check memory usage
free -h
docker stats

# Increase Docker memory limits
# Edit docker-compose.yml
services:
  api:
    mem_limit: 2g
    memswap_limit: 2g
```

#### Port Conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :3000
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

### Log Analysis
```bash
# Application logs
docker-compose logs -f api
docker-compose logs -f recon

# System logs
sudo journalctl -u docker
sudo tail -f /var/log/nginx/error.log
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_created_at ON findings(created_at);

-- Analyze tables
ANALYZE findings;
VACUUM ANALYZE findings;
```

### Application Optimization
```javascript
// Enable clustering
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  require('./server');
}
```

### Caching Strategy
```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache findings
const cacheKey = `findings:${programId}`;
const cached = await client.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Set cache
await client.setex(cacheKey, 3600, JSON.stringify(findings));
```

## 🎯 Best Practices

1. **Use environment-specific configurations**
2. **Implement proper logging and monitoring**
3. **Regular security updates**
4. **Backup strategy implementation**
5. **Disaster recovery planning**
6. **Performance monitoring**
7. **Capacity planning**
8. **Security hardening**

For additional support, please refer to our [troubleshooting guide](troubleshooting.md) or contact support@redteam-automation.com.