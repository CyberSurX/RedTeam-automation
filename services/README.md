# Services - External Integrations

External service integrations for bug bounty platforms and Python tools.

## 📁 Structure

```
services/
├── platform-clients/      # Bug bounty platform APIs
│   ├── hackerone.ts       # HackerOne integration
│   ├── bugcrowd.ts        # Bugcrowd integration
│   └── devpost.ts         # Devpost integration
└── python-gateway/        # Python security tools gateway
    ├── gateway.py         # Flask API server
    ├── requirements.txt    # Python dependencies
    ├── agents/             # Scan agents
    ├── core/               # Core logic
    ├── reports/            # Report generation
    └── Dockerfile          # Container build
```

---

## 📋 platform-clients/ - Bug Bounty Platform APIs

### Purpose
Integrate with external bug bounty platforms to:
- Fetch program information
- Submit findings automatically
- Retrieve scope details
- Track bounty payouts

### Usage

```typescript
import { HackerOneClient } from '../services/platform-clients/hackerone';

const client = new HackerOneClient({
  apiKey: process.env.HACKERONE_API_KEY,
  email: process.env.HACKERONE_EMAIL,
  username: process.env.HACKERONE_USERNAME
});

// Get programs
const programs = await client.getPrograms();

// Submit finding
await client.submitFinding({
  programId: 'program-id',
  title: 'XSS vulnerability',
  description: '...',
  severity: 'medium'
});
```

### Environment Variables

```bash
HACKERONE_API_KEY=your-hackerone-api-key
HACKERONE_EMAIL=your-email@example.com
HACKERONE_USERNAME=your-username

BUGCROWD_API_KEY=your-bugcrowd-api-key
BUGCROWD_EMAIL=your-email@example.com

DEVPOST_API_KEY=your-devpost-api-key
```

---

## 🐍 python-gateway/ - Python Security Tools Gateway

### Purpose
Flask-based microservice that wraps Python security tools for web API access.

### Supported Tools

| Tool | Purpose |
|------|---------|
| nmap | Port scanning |
| nuclei | Vulnerability scanning |
| sqlmap | SQL injection testing |
| ffuf | Directory fuzzing |
| testssl.sh | SSL/TLS testing |
| amass | Subdomain enumeration |
| subfinder | Subdomain enumeration |

### Start Python Gateway

```bash
cd services/python-gateway

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python gateway.py
```

Gateway runs on **port 8080** by default.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scan/port` | Run nmap port scan |
| POST | `/scan/vuln` | Run nuclei vulnerability scan |
| POST | `/scan/recon` | Run subdomain enumeration |
| POST | `/scan/sql` | Run SQL injection test |
| POST | `/scan/ffuf` | Run directory fuzzing |
| POST | `/generate/report` | Generate security report |

### Example Usage

```bash
# Port scan
curl -X POST http://localhost:8080/scan/port \
  -H "Content-Type: application/json" \
  -d '{"target": "example.com", "ports": "80,443,8080"}'

# Vulnerability scan
curl -X POST http://localhost:8080/scan/vuln \
  -H "Content-Type: application/json" \
  -d '{"target": "https://example.com", "templates": "xss,sqli"}'
```

### Environment Variables

```bash
PYTHON_GATEWAY_URL=http://localhost:8080
```

---

## 🔧 Dependencies

### Platform Clients
| Package | Purpose |
|---------|---------|
| axios | HTTP requests |
| dotenv | Environment variables |

### Python Gateway
| Package | Purpose |
|---------|---------|
| flask | Web framework |
| requests | HTTP requests |
| python-dotenv | Environment variables |

---

## 📊 Integration Flow

```
Frontend → Backend API → Python Gateway → Security Tools
                                   ↓
                              Bug Bounty Platforms
```

1. Frontend initiates scan via Backend API
2. Backend calls Python Gateway
3. Python Gateway runs security tools
4. Results returned to Backend
5. Backend stores in database
6. Frontend displays results