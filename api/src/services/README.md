# Backend Services

Business logic layer containing all core service modules for the RedTeam automation platform.

## 📁 Structure

```
services/
├── scanningService.ts        # Port and vulnerability scanning
├── reconService.ts           # Subdomain and reconnaissance
├── exploitationService.ts    # Exploit testing and validation
├── reportingService.ts       # Report generation and management
├── triageService.ts          # Finding triage and prioritization
├── exportService.ts          # Data export functionality
├── aiService.ts              # AI-powered analysis
├── autonomousService.ts      # Autonomous workflow orchestration
└── jobQueue.ts               # Background job processing
```

---

## 🔍 Scanning Service (scanningService.ts)

### Purpose
Manages port scanning and vulnerability detection using integrated security tools.

### Methods

| Method | Description |
|--------|-------------|
| `scanPorts(target, ports)` | Perform port scan on target |
| `scanVulnerabilities(target)` | Run vulnerability scan with templates |
| `getScanResults(scanId)` | Retrieve scan results |

### Integration
- Calls Python Gateway for nmap and nuclei execution
- Stores results in Finding entity
- Queues long-running scans via jobQueue

---

## 🔎 Recon Service (reconService.ts)

### Purpose
Automated reconnaissance including subdomain enumeration and asset discovery.

### Methods

| Method | Description |
|--------|-------------|
| `enumerateSubdomains(target, tool)` | Enumerate subdomains using amass/subfinder |
| `discoverAssets(target)` | Discover web assets and infrastructure |
| `checkActiveHosts(subdomains)` | Verify which hosts are active |

### Integration
- Uses platform-clients for target scope
- Calls Python Gateway for amass/subfinder
- Results stored in database for tracking

---

## 💥 Exploitation Service (exploitationService.ts)

### Purpose
Validate and test exploits in a controlled environment.

### Methods

| Method | Description |
|--------|-------------|
| `validateExploit(finding)` | Validate exploit exists |
| `testExploit(payload, target)` | Test exploit against target |
| `getExploitDetails(cveId)` | Fetch exploit details from database |

### Safety
- Only runs in authorized testing environments
- Requires explicit user confirmation
- Results logged for audit purposes

---

## 📄 Reporting Service (reportingService.ts)

### Purpose
Generate and manage security assessment reports.

### Methods

| Method | Description |
|--------|-------------|
| `generateReport(data)` | Generate report from findings |
| `exportReport(reportId, format)` | Export to PDF, HTML, or JSON |
| `getReport(reportId)` | Retrieve report details |
| `listReports(filters)` | List reports with filtering |

### Report Types
- Vulnerability Assessment
- Penetration Test
- Compliance Audit
- Executive Summary

---

## 🎯 Triage Service (triageService.ts)

### Purpose
Prioritize and classify findings based on severity and context.

### Methods

| Method | Description |
|--------|-------------|
| `triageFinding(finding)` | Classify and prioritize finding |
| `getTriageQueue()` | Get pending triage items |
| `updateTriageStatus(id, status)` | Update triage status |

### Severity Levels
- Critical
- High
- Medium
- Low
- Informational

---

## 📤 Export Service (exportService.ts)

### Purpose
Export data in various formats for external systems and reporting.

### Methods

| Method | Description |
|--------|-------------|
| `exportFindings(format, filters)` | Export findings to CSV/JSON |
| `exportPrograms(format)` | Export program data |
| `exportReports(format)` | Export report summaries |

### Supported Formats
- CSV
- JSON
- XML
- Excel

---

## 🤖 AI Service (aiService.ts)

### Purpose
AI-powered analysis for vulnerability assessment and report generation.

### Methods

| Method | Description |
|--------|-------------|
| `analyzeFinding(finding)` | AI analysis of finding |
| `suggestRemediation(finding)` | Suggest fix recommendations |
| `generateSummary(findings)` | Generate executive summary |
| `classifyVulnerability(description)` | Classify vuln type from description |

### Integration
- Can integrate with external AI APIs
- Uses pattern matching for classification
- Results cached for performance

---

## 🔄 Autonomous Service (autonomousService.ts)

### Purpose
Orchestrates automated security testing workflows without manual intervention.

### Methods

| Method | Description |
|--------|-------------|
| `start()` | Start autonomous testing |
| `stop()` | Stop autonomous testing |
| `getStatus()` | Get current workflow status |
| `configureWorkflow(config)` | Configure testing workflow |

### Workflow Stages
1. Reconnaissance (subdomain discovery)
2. Scanning (port and vulnerability)
3. Exploitation (safe validation)
4. Triage (finding prioritization)
5. Reporting (automated generation)

### Configuration
```typescript
const workflow = {
  enableRecon: true,
  enableScanning: true,
  enableExploitation: false,  // Safe mode
  autoSubmit: false,
  schedule: 'daily'
}
```

---

## 📦 Job Queue (jobQueue.ts)

### Purpose
Background job processing using Bull (Redis-based queue).

### Job Types

| Type | Description | Priority |
|------|-------------|----------|
| scan | Port/vulnerability scan | High |
| recon | Subdomain enumeration | Medium |
| report | Report generation | Low |
| export | Data export | Low |

### Methods

| Method | Description |
|--------|-------------|
| `addJob(type, data)` | Add job to queue |
| `getJobStatus(jobId)` | Get job status |
| `cancelJob(jobId)` | Cancel running job |
| `getQueueStats()` | Get queue statistics |

### Configuration
```typescript
// Queue settings
concurrency: 3          // Max concurrent jobs
defaultJobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 10,
  removeOnFail: 5
}
```

---

## 🔧 Service Dependencies

| Service | Dependency |
|---------|------------|
| All Services | TypeORM (database access) |
| All Services | Redis (caching/queue) |
| Scanning Service | Python Gateway |
| Recon Service | Python Gateway |
| AI Service | External AI API (optional) |

---

## 🚀 Usage Example

```typescript
import { scanningService } from '../services/scanningService';

// Start a port scan
const scanId = await scanningService.scanPorts('example.com', '80,443,8080');

// Get results
const results = await scanningService.getScanResults(scanId);

// Queue a vulnerability scan
await jobQueue.addJob('scan', {
  target: 'example.com',
  type: 'vulnerability'
});
```

---

## 📊 Error Handling

All services implement consistent error handling:

```typescript
try {
  const result = await service.execute(params);
} catch (error) {
  if (error.code === 'JOB_NOT_FOUND') {
    // Handle job not found
  } else if (error.code === 'SCAN_FAILED') {
    // Handle scan failure
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| JOB_NOT_FOUND | Job ID not found |
| SCAN_FAILED | Scan execution failed |
| INVALID_TARGET | Target not reachable |
| UNAUTHORIZED | Not authorized for action |
| RATE_LIMITED | Rate limit exceeded |

---

## 🔑 Environment Variables

Required for services:

```bash
# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# AI Service (optional)
AI_API_KEY=your-ai-api-key
AI_API_URL=https://api.ai-service.com

# Python Gateway
PYTHON_GATEWAY_URL=http://python-gateway:8080
```