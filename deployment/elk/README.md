# ELK Stack Configuration for Log Aggregation

This guide provides comprehensive log aggregation setup using Elasticsearch, Logstash, and Kibana (ELK) for the Bug Bounty Automation Platform.

## Architecture Overview

### Components
- **Elasticsearch**: Log storage and search
- **Logstash**: Log processing and transformation
- **Kibana**: Log visualization and analysis
- **Filebeat**: Log shipping from nodes
- **Metricbeat**: Metrics collection
- **Heartbeat**: Uptime monitoring
- **Auditbeat**: Security event monitoring

### Log Flow
```
Application Logs → Filebeat → Logstash → Elasticsearch → Kibana
     ↓
Kubernetes Logs → Filebeat → Logstash → Elasticsearch → Kibana
     ↓
Security Events → Auditbeat → Logstash → Elasticsearch → Kibana
```

## Quick Start

### 1. Install ELK Stack
```bash
# Add Elastic Helm repository
helm repo add elastic https://helm.elastic.co
helm repo update

# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace elastic-system \
  --create-namespace \
  -f elasticsearch-values.yaml

# Install Kibana
helm install kibana elastic/kibana \
  --namespace elastic-system \
  -f kibana-values.yaml

# Install Logstash
helm install logstash elastic/logstash \
  --namespace elastic-system \
  -f logstash-values.yaml

# Install Beats
helm install filebeat elastic/filebeat \
  --namespace elastic-system \
  -f filebeat-values.yaml

helm install metricbeat elastic/metricbeat \
  --namespace elastic-system \
  -f metricbeat-values.yaml
```

## Configuration

### Elasticsearch Configuration
Create `elasticsearch-values.yaml`:

```yaml
clusterName: "bugbounty-elasticsearch"
nodeGroup: "master"

# Resource configuration
resources:
  requests:
    cpu: "1000m"
    memory: "2Gi"
  limits:
    cpu: "2000m"
    memory: "4Gi"

# Persistence configuration
volumeClaimTemplate:
  accessModes: ["ReadWriteOnce"]
  storageClassName: "fast-ssd"
  resources:
    requests:
      storage: 100Gi

# Security configuration
security:
  enabled: true
  auth:
    createSystemUsers: true
    elasticsearchPassword: "your-elasticsearch-password"
    existingSecret: ""
  tls:
    enabled: true
    verificationMode: "certificate"
    certificateSecret: "elasticsearch-tls-secret"

# Cluster configuration
replicas: 3
minimumMasterNodes: 2

# JVM configuration
esJavaOpts: "-Xms2g -Xmx2g"

# Node roles
roles:
  master: "true"
  data: "true"
  ingest: "true"
  ml: "false"
  remote_cluster_client: "false"
  transform: "false"

# Index lifecycle management
lifecycle:
  enabled: true
  policies:
    bugbounty-logs:
      phases:
        hot:
          actions:
            rollover:
              max_age: "7d"
              max_size: "50GB"
            set_priority:
              priority: 100
        warm:
          min_age: "7d"
          actions:
            shrink:
              number_of_shards: 1
            force_merge:
              max_num_segments: 1
            set_priority:
              priority: 50
        cold:
          min_age: "30d"
          actions:
            set_priority:
              priority: 0
        delete:
          min_age: "90d"
          actions:
            delete: {}
```

### Kibana Configuration
Create `kibana-values.yaml`:

```yaml
# Kibana configuration
kibanaConfig:
  kibana.yml: |
    server.name: bugbounty-kibana
    server.host: 0.0.0.0
    server.publicBaseUrl: https://logs.bugbounty.yourcompany.com
    elasticsearch:
      hosts: ["https://elasticsearch-master:9200"]
      username: "elastic"
      password: "your-elasticsearch-password"
      ssl:
        certificateAuthorities: /usr/share/kibana/config/certs/elastic-certificate.crt
        verificationMode: certificate
    
    # Security configuration
    xpack.security.enabled: true
    xpack.security.authc.providers:
      basic.basic1:
        order: 0
      saml.saml1:
        order: 1
        realm: saml1
    
    # Logging configuration
    logging:
      appenders:
        file:
          type: file
          fileName: /usr/share/kibana/logs/kibana.log
          layout:
            type: json
      root:
        appenders: [default, file]
        level: info

# Resource configuration
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "1000m"
    memory: "2Gi"

# Persistence configuration
persistence:
  enabled: true
  storageClass: "fast-ssd"
  accessModes: ["ReadWriteOnce"]
  size: 10Gi

# Service configuration
service:
  type: ClusterIP
  port: 5601
  annotations: {}
  
# Ingress configuration
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: logs.bugbounty.yourcompany.com
      paths:
        - path: /
            pathType: Prefix
  tls:
    - secretName: kibana-tls
      hosts:
        - logs.bugbounty.yourcompany.com

# Security context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

# Health checks
healthCheckPath: /api/status
```

### Logstash Configuration
Create `logstash-values.yaml`:

```yaml
# Logstash configuration
logstashConfig:
  logstash.yml: |
    http.host: 0.0.0.0
    xpack.monitoring.enabled: true
    xpack.monitoring.elasticsearch.hosts: ["https://elasticsearch-master:9200"]
    xpack.monitoring.elasticsearch.username: "elastic"
    xpack.monitoring.elasticsearch.password: "your-elasticsearch-password"
    xpack.monitoring.elasticsearch.ssl.certificate_authority: /usr/share/logstash/config/certs/elastic-certificate.crt

# Pipeline configuration
logstashPipeline:
  logstash.conf: |
    input {
      beats {
        port => 5044
        ssl => true
        ssl_certificate_authorities => ["/usr/share/logstash/config/certs/elastic-certificate.crt"]
        ssl_certificate => "/usr/share/logstash/config/certs/logstash.crt"
        ssl_key => "/usr/share/logstash/config/certs/logstash.key"
        ssl_verify_mode => "force_peer"
      }
    }
    
    filter {
      # Application logs parsing
      if [fields][log_type] == "application" {
        grok {
          match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
        }
        
        # Parse JSON logs
        json {
          source => "message"
          target => "json"
        }
        
        # Add metadata
        mutate {
          add_field => { "service" => "%{[fields][service_name]}" }
          add_field => { "environment" => "%{[fields][environment]}" }
          add_field => { "namespace" => "%{[kubernetes][namespace]}" }
          add_field => { "pod_name" => "%{[kubernetes][pod][name]}" }
        }
        
        # Parse security events
        if [json][event_type] == "security" {
          mutate {
            add_tag => ["security_event"]
          }
          
          # Extract CVE information
          if [json][cve] {
            mutate {
              add_field => { "cve_id" => "%{[json][cve]}" }
            }
          }
          
          # Extract vulnerability severity
          if [json][severity] {
            mutate {
              add_field => { "vulnerability_severity" => "%{[json][severity]}" }
            }
          }
        }
      }
      
      # Kubernetes logs parsing
      if [fields][log_type] == "kubernetes" {
        # Parse container logs
        grok {
          match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
        }
        
        # Add Kubernetes metadata
        mutate {
          add_field => { "component" => "kubernetes" }
          add_field => { "kubernetes_namespace" => "%{[kubernetes][namespace]}" }
          add_field => { "kubernetes_pod_name" => "%{[kubernetes][pod][name]}" }
          add_field => { "kubernetes_container_name" => "%{[kubernetes][container][name]}" }
        }
      }
      
      # Nginx logs parsing
      if [fields][log_type] == "nginx" {
        grok {
          match => { "message" => "%{NGINXACCESS}" }
        }
        
        # Convert response time to milliseconds
        if [request_time] {
          mutate {
            convert => { "request_time" => "float" }
          }
          mutate {
            add_field => { "response_time_ms" => "%{request_time}" }
          }
        }
        
        # Add web server tag
        mutate {
          add_tag => ["web_server"]
        }
      }
      
      # Date parsing
      date {
        match => [ "timestamp", "ISO8601" ]
        target => "@timestamp"
      }
      
      # GeoIP lookup for security events
      if "security_event" in [tags] and [json][source_ip] {
        geoip {
          source => "[json][source_ip]"
          target => "geoip"
          database => "/usr/share/logstash/config/GeoLite2-City.mmdb"
        }
      }
    }
    
    output {
      # Send to Elasticsearch
      elasticsearch {
        hosts => ["https://elasticsearch-master:9200"]
        user => "elastic"
        password => "your-elasticsearch-password"
        ssl => true
        ssl_certificate_verification => true
        truststore => "/usr/share/logstash/config/certs/elastic-certificate.crt"
        
        # Index configuration
        index => "bugbounty-%{+YYYY.MM.dd}"
        document_type => "_doc"
        
        # Template management
        template_name => "bugbounty-logs"
        template_pattern => "bugbounty-*"
        template => "/usr/share/logstash/config/templates/bugbounty-template.json"
        template_overwrite => true
      }
      
      # Debug output (optional)
      if "debug" in [tags] {
        stdout {
          codec => rubydebug
        }
      }
    }

# Resource configuration
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "1000m"
    memory: "2Gi"

# Persistence configuration
persistence:
  enabled: true
  storageClass: "fast-ssd"
  accessModes: ["ReadWriteOnce"]
  size: 10Gi

# Service configuration
service:
  type: ClusterIP
  ports:
    - name: beats
      port: 5044
      protocol: TCP
      targetPort: 5044
    - name: http
      port: 9600
      protocol: TCP
      targetPort: 9600

# Security context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
```

### Filebeat Configuration
Create `filebeat-values.yaml`:

```yaml
# Filebeat configuration
filebeatConfig:
  filebeat.yml: |
    filebeat.inputs:
      # Application logs
      - type: container
        paths:
          - /var/log/containers/*_bugbounty_*.log
        processors:
          - add_kubernetes_metadata:
              host: ${NODE_NAME}
              matchers:
                - logs_path:
                    logs_path: "/var/log/containers/"
          - decode_json_fields:
              fields: ["message"]
              target: "json"
              overwrite_keys: true
          - add_fields:
              target: fields
              fields:
                log_type: application
                service_name: bugbounty-platform
                environment: production
        
      # Kubernetes system logs
      - type: container
        paths:
          - /var/log/containers/*_kube-system_*.log
        processors:
          - add_kubernetes_metadata:
              host: ${NODE_NAME}
              matchers:
                - logs_path:
                    logs_path: "/var/log/containers/"
          - add_fields:
              target: fields
              fields:
                log_type: kubernetes
                component: kube-system
        
      # Nginx ingress logs
      - type: container
        paths:
          - /var/log/containers/*ingress-nginx*controller*.log
        processors:
          - add_kubernetes_metadata:
              host: ${NODE_NAME}
              matchers:
                - logs_path:
                    logs_path: "/var/log/containers/"
          - add_fields:
              target: fields
              fields:
                log_type: nginx
                component: ingress
    
    # Output configuration
    output.logstash:
      hosts: ["logstash-logstash-beats:5044"]
      ssl.certificate_authorities: ["/usr/share/filebeat/config/certs/elastic-certificate.crt"]
      ssl.certificate: "/usr/share/filebeat/config/certs/filebeat.crt"
      ssl.key: "/usr/share/filebeat/config/certs/filebeat.key"
    
    # Monitoring configuration
    monitoring:
      enabled: true
      elasticsearch:
        hosts: ["https://elasticsearch-master:9200"]
        username: "elastic"
        password: "your-elasticsearch-password"
        ssl.certificate_authorities: ["/usr/share/filebeat/config/certs/elastic-certificate.crt"]
    
    # Logging configuration
    logging.level: info
    logging.to_files: true
    logging.files:
      path: /var/log/filebeat
      name: filebeat
      keepfiles: 7
      permissions: 0644

# Resource configuration
resources:
  requests:
    cpu: "100m"
    memory: "100Mi"
  limits:
    cpu: "500m"
    memory: "200Mi"

# Security context
securityContext:
  runAsUser: 0
  privileged: true

# DaemonSet configuration
daemonset:
  enabled: true
  
# RBAC configuration
rbac:
  create: true
  serviceAccountName: filebeat

# Extra volumes for certificates
extraVolumes:
  - name: certs
    secret:
      secretName: elastic-certificates
      
extraVolumeMounts:
  - name: certs
    mountPath: /usr/share/filebeat/config/certs
    readOnly: true

# Node selector
nodeSelector:
  kubernetes.io/os: linux
```

## Log Processing Pipelines

### Security Events Pipeline
```yaml
# Security events processing
processors:
  - script:
      lang: javascript
      source: |
        function process(event) {
          // Extract CVE information
          var message = event.Get("message");
          var cveMatch = message.match(/CVE-\d{4}-\d{4,}/g);
          if (cveMatch) {
            event.Put("cve_ids", cveMatch);
          }
          
          // Extract IP addresses
          var ipMatch = message.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g);
          if (ipMatch) {
            event.Put("ip_addresses", ipMatch);
          }
          
          // Extract domains
          var domainMatch = message.match(/\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g);
          if (domainMatch) {
            event.Put("domains", domainMatch);
          }
          
          // Extract URLs
          var urlMatch = message.match(/https?:\/\/[^\s]+/g);
          if (urlMatch) {
            event.Put("urls", urlMatch);
          }
        }
```

### Vulnerability Data Pipeline
```yaml
# Vulnerability data processing
processors:
  - script:
      lang: javascript
      source: |
        function process(event) {
          var json = event.Get("json");
          if (json && json.vulnerability) {
            // Normalize severity
            var severity = json.vulnerability.severity;
            if (severity) {
              severity = severity.toLowerCase();
              switch(severity) {
                case 'critical':
                case 'high':
                case 'medium':
                case 'low':
                case 'info':
                  event.Put("vulnerability.severity_normalized", severity);
                  break;
                default:
                  event.Put("vulnerability.severity_normalized", "unknown");
              }
            }
            
            // Calculate CVSS score
            var cvss = json.vulnerability.cvss_score;
            if (cvss) {
              event.Put("vulnerability.cvss_score", parseFloat(cvss));
              
              // Categorize by CVSS score
              if (cvss >= 9.0) {
                event.Put("vulnerability.severity_category", "critical");
              } else if (cvss >= 7.0) {
                event.Put("vulnerability.severity_category", "high");
              } else if (cvss >= 4.0) {
                event.Put("vulnerability.severity_category", "medium");
              } else {
                event.Put("vulnerability.severity_category", "low");
              }
            }
          }
        }
```

## Kibana Dashboards

### Security Operations Dashboard
```json
{
  "version": "7.15.0",
  "objects": [
    {
      "id": "security-operations-overview",
      "type": "dashboard",
      "attributes": {
        "title": "Security Operations - Overview",
        "description": "Overview of security events and vulnerability data",
        "panelsJSON": "[{\"version\":\"7.15.0\",\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15},\"panelIndex\":\"1\",\"embeddableConfig\":{\"enhancements\":{}},\"panelRefName\":\"panel_1\"}]",
        "optionsJSON": "{\"useMargins\":true,\"hidePanelTitles\":false}",
        "version": 1,
        "timeRestore": false,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
        }
      },
      "references": [
        {
          "name": "panel_1",
          "type": "visualization",
          "id": "vulnerability-severity-chart"
        }
      ]
    }
  ]
}
```

### Vulnerability Analysis Dashboard
```json
{
  "version": "7.15.0",
  "objects": [
    {
      "id": "vulnerability-analysis-dashboard",
      "type": "dashboard",
      "attributes": {
        "title": "Vulnerability Analysis",
        "description": "Detailed analysis of discovered vulnerabilities",
        "panelsJSON": "[{\"version\":\"7.15.0\",\"gridData\":{\"x\":0,\"y\":0,\"w\":48,\"h\":20},\"panelIndex\":\"1\",\"embeddableConfig\":{\"enhancements\":{}},\"panelRefName\":\"panel_1\"}]",
        "optionsJSON": "{\"useMargins\":true,\"hidePanelTitles\":false}",
        "version": 1,
        "timeRestore": false,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"query\":{\"query\":\"vulnerability.severity_normalized : *\",\"language\":\"kuery\"},\"filter\":[]}"
        }
      }
    }
  ]
}
```

## Security and Compliance

### Audit Logging
```yaml
# Audit log configuration
processors:
  - add_fields:
      target: audit
      fields:
        timestamp: "%{@timestamp}"
        user: "%{user.name}"
        action: "%{event.action}"
        resource: "%{resource.name}"
        result: "%{event.outcome}"
        
  - script:
      lang: javascript
      source: |
        function process(event) {
          // Add compliance tags
          var action = event.Get("event.action");
          if (action) {
            if (action.includes("login") || action.includes("auth")) {
              event.Put("compliance.category", "authentication");
            } else if (action.includes("create") || action.includes("update") || action.includes("delete")) {
              event.Put("compliance.category", "data_modification");
            } else if (action.includes("scan") || action.includes("vulnerability")) {
              event.Put("compliance.category", "security_operation");
            }
          }
          
          // Add retention policy
          event.Put("retention.policy", "security_audit_logs_7_years");
          event.Put("retention.period", "2555d"); // 7 years
        }
```

### Data Retention Policies
```json
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "7d",
            "max_size": "50GB"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "force_merge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "searchable_snapshot": {
            "snapshot_repository": "security_audit_snapshots"
          }
        }
      },
      "delete": {
        "min_age": "2555d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

## Performance Optimization

### Index Optimization
```yaml
# Index template for optimal performance
index_template:
  index_patterns: ["bugbounty-*"]
  template:
    settings:
      number_of_shards: 3
      number_of_replicas: 1
      refresh_interval: "30s"
      index.translog.durability: "async"
      index.translog.sync_interval: "30s"
      index.codec: "best_compression"
      routing.allocation.total_shards_per_node: 2
      
    mappings:
      properties:
        "@timestamp":
          type: "date"
        message:
          type: "text"
          fields:
            keyword:
              type: "keyword"
              ignore_above: 256
        kubernetes:
          properties:
            namespace:
              type: "keyword"
            pod:
              properties:
                name:
                  type: "keyword"
        vulnerability:
          properties:
            severity:
              type: "keyword"
            cvss_score:
              type: "float"
            cve_ids:
              type: "keyword"
        geoip:
          properties:
            location:
              type: "geo_point"
```

### Query Performance
```yaml
# Optimized queries for common use cases
queries:
  recent_vulnerabilities:
    index: "bugbounty-*"
    query:
      bool:
        must:
          - range:
              "@timestamp":
                gte: "now-24h"
          - exists:
              field: "vulnerability.severity"
        filter:
          - terms:
              "vulnerability.severity": ["critical", "high"]
    sort:
      - "@timestamp":
          order: desc
    size: 100
    
  security_events:
    index: "bugbounty-*"
    query:
      bool:
        must:
          - range:
              "@timestamp":
                gte: "now-1h"
          - term:
              "compliance.category": "security_operation"
    aggregations:
      events_by_type:
        terms:
          field: "event.action"
          size: 20
```

## Maintenance and Troubleshooting

### Index Management
```bash
# Check cluster health
curl -u elastic:your-password -X GET "https://elasticsearch:9200/_cluster/health?pretty"

# Check index stats
curl -u elastic:your-password -X GET "https://elasticsearch:9200/_stats?pretty"

# Force merge old indices
curl -u elastic:your-password -X POST "https://elasticsearch:9200/bugbounty-2023.01.*/_forcemerge?max_num_segments=1"

# Delete old indices
curl -u elastic:your-password -X DELETE "https://elasticsearch:9200/bugbounty-2022.*"
```

### Performance Monitoring
```bash
# Check node stats
curl -u elastic:your-password -X GET "https://elasticsearch:9200/_nodes/stats?pretty"

# Check thread pools
curl -u elastic:your-password -X GET "https://elasticsearch:9200/_cat/thread_pool?v"

# Check slow queries
curl -u elastic:your-password -X GET "https://elasticsearch:9200/bugbounty-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"term": {"type": "search"}},
        {"range": {"took": {"gte": 1000}}}
      ]
    }
  },
  "sort": [{"timestamp": {"order": "desc"}}],
  "size": 10
}'
```

### Logstash Troubleshooting
```bash
# Check Logstash logs
kubectl logs -f logstash-logstash-0 -n elastic-system

# Test Logstash configuration
kubectl exec -it logstash-logstash-0 -n elastic-system -- /usr/share/logstash/bin/logstash --config.test_and_exit -f /usr/share/logstash/pipeline/logstash.conf

# Monitor pipeline performance
kubectl exec -it logstash-logstash-0 -n elastic-system -- curl -X GET "localhost:9600/_node/stats/pipelines?pretty"
```

### Kibana Troubleshooting
```bash
# Check Kibana logs
kubectl logs -f kibana-kibana-xxx -n elastic-system

# Reset Kibana admin password
kubectl exec -it elasticsearch-master-0 -n elastic-system -- bin/elasticsearch-reset-password -u elastic -i

# Check Kibana status
kubectl exec -it kibana-kibana-xxx -n elastic-system -- curl -u elastic:your-password -X GET "https://elasticsearch:9200/_cluster/health?pretty"
```

## Security Best Practices

### Certificate Management
```bash
# Generate certificates
kubectl exec -it elasticsearch-master-0 -n elastic-system -- bin/elasticsearch-certutil ca --pem --out /usr/share/elasticsearch/config/certs/elastic-stack-ca.zip
kubectl exec -it elasticsearch-master-0 -n elastic-system -- bin/elasticsearch-certutil cert --ca /usr/share/elasticsearch/config/certs/elastic-stack-ca.zip --pem --out /usr/share/elasticsearch/config/certs/elastic-certificates.zip

# Create Kubernetes secrets
kubectl create secret generic elastic-certificates --from-file=elastic-certificates.p12 --namespace=elastic-system
```

### Access Control
```yaml
# Role-based access control
roles:
  security_analyst:
    cluster: ["monitor"]
    indices:
      - names: ["bugbounty-security-*"]
        privileges: ["read", "view_index_metadata"]
        field_security:
          grant: ["*"]
        
  platform_admin:
    cluster: ["all"]
    indices:
      - names: ["bugbounty-*"]
        privileges: ["all"]
        
  auditor:
    cluster: ["monitor"]
    indices:
      - names: ["bugbounty-audit-*"]
        privileges: ["read", "view_index_metadata"]
```

### Audit Logging
```yaml
# Enable audit logging
xpack.security.audit:
  enabled: true
  outputs: [index, logfile]
  
  index:
    events:
      include: [authentication_success, authentication_failed, access_granted, access_denied]
    
  logfile:
    events:
      include: [authentication_success, authentication_failed, access_granted, access_denied]
    
    rotate:
      every: 24h
      keep: 30
      size: 100MB
```

## Cost Optimization

### Storage Optimization
```yaml
# Index lifecycle management for cost optimization
index_lifecycle:
  hot:
    max_age: "3d"
    max_size: "30GB"
    priority: 100
    
  warm:
    min_age: "3d"
    priority: 50
    shrink:
      number_of_shards: 1
    force_merge:
      max_num_segments: 1
      
  cold:
    min_age: "30d"
    priority: 0
    searchable_snapshot:
      snapshot_repository: "cost_optimized_snapshots"
      
  delete:
    min_age: "365d"
```

### Resource Optimization
```yaml
# Node roles for cost optimization
node_roles:
  data_hot:
    node_type: "hot"
    resources:
      requests:
        cpu: "2000m"
        memory: "4Gi"
      limits:
        cpu: "4000m"
        memory: "8Gi"
    storage: "fast-ssd"
    
  data_warm:
    node_type: "warm"
    resources:
      requests:
        cpu: "1000m"
        memory: "2Gi"
      limits:
        cpu: "2000m"
        memory: "4Gi"
    storage: "standard"
    
  data_cold:
    node_type: "cold"
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
      limits:
        cpu: "1000m"
        memory: "2Gi"
    storage: "cold-storage"
```