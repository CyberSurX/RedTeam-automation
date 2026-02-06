# Python Gateway

Flask microservice providing web API access to Python security tools.

## 📁 Structure

```
python-gateway/
├── gateway.py         # Flask API server entry point
├── requirements.txt    # Python dependencies
├── Dockerfile          # Container configuration
├── agents/             # Security tool agents
├── core/               # Core functionality
├── reports/            # Report generation
└── payloads/           # Request/response schemas
```

---

## 🚀 Start Python Gateway

```bash
cd services/python-gateway

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python gateway.py
```

Server runs on **port 8080** by default.

---

## 🔧 Setup

### Install Dependencies

```bash
cd services/python-gateway
pip install flask requests python-dotenv
```

### Required Python Tools

| Tool | Installation | Purpose |
|------|-------------|---------|
| nmap | `sudo apt install nmap` | Port scanning |
| nuclei | `go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest` | Vulnerability scanning |
| sqlmap | `sudo apt install sqlmap` | SQL injection testing |
| ffuf | `go install github.com/ffuf/ffuf@latest` | Directory fuzzing |
| testssl | `git clone https://github.com/drwetter/testssl.sh` | SSL/TLS testing |
| amass | `go install -v github.com/owasp-amass/amass@latest` | Subdomain enumeration |
| subfinder | `go install -v github.com/projectdiscovery/subfinder/v2/subfinder@latest` | Subdomain enumeration |

---

## 📡 API Endpoints

### Port Scan

```bash
curl -X POST http://localhost:8080/scan/port \
  -H "Content-Type: application/json" \
  -d '{
    "target": "example.com",
    "ports": "80,443,8080,8443",
    "options": "--script-scan -p-80 --p-443"
  }'
```

### Vulnerability Scan

```bash
curl -X POST http://localhost:8080/scan/vuln \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://example.com",
    "templates": "xss,sqli,ssrf,lfi",
    "options": "-severity low"
  }'
```

### Subdomain Enumeration

```bash
curl -X POST http://localhost:8080/scan/recon \
  -H "Content-Type: application/json" \
  -d '{
    "target": "example.com",
    "tool": "amass",
    "options": "-passive"
  }'
```

### SQL Injection Test

```bash
curl -X POST http://localhost:8080/scan/sql \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://example.com/login",
    "options": "--batch --risk=1 --level=1"
  }'
```

### Directory Fuzzing

```bash
curl -X POST http://localhost:8080/scan/ffuf \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://example.com",
    "wordlist": "common-paths.txt",
    "options": "-fc 100 -t 50"
  }'
```

### Generate Report

```bash
curl -X POST http://localhost:8080/generate/report \
  -H "Content-Type: application/json" \
  -d '{
    "target": "example.com",
    "findings": [...],
    "format": "pdf"
  }'
```

---

## 🔧 Environment Variables

```bash
# From .env
PYTHON_GATEWAY_URL=http://localhost:8080

# Optional: Tool paths (uses system PATH if not set)
NMAP_PATH=/usr/bin/nmap
NUCLEI_PATH=/usr/bin/nuclei
SQLMAP_PATH=/usr/bin/sqlmap
```

---

## 🐳 Docker

### Build Image

```bash
cd services/python-gateway
docker build -t python-gateway .
```

### Run Container

```bash
docker run -p 8080:8080 python-gateway
```

---

## 📊 Response Format

```json
{
  "scan_id": "scan-123",
  "status": "running",
  "target": "example.com",
  "tool": "nmap",
  "started_at": "2024-01-01T00:00:00Z",
  "results": [...]
}
```

---

## 🔄 Integration with Backend

The backend calls Python gateway via API:

```typescript
// From api/routes/scan.ts
const PYTHON_GATEWAY_URL = process.env.PYTHON_GATEWAY_URL || 'http://python-gateway:8080';

const response = await axios.post(`${PYTHON_GATEWAY_URL}/scan/port`, {
  target: targetUrl,
  ports: '80,443,8080'
});
```

---

## 🐛 Common Issues

**Gateway not starting:**
```bash
# Check Python is installed
python3 --version

# Check Flask is installed
pip list | grep flask

# Check port 8080 is available
lsof -i :8080
```

**Tool not found:**
```bash
# Verify tool is installed
which nmap
which nuclei

# Install missing tools
sudo apt install nmap
go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
```