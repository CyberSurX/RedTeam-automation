# Scripts

Shell scripts for security testing, building, and deployment.

## 📁 Structure

```
scripts/
├── api-security-test.sh    # Backend security testing
└── security-scan.sh        # Comprehensive security scan
```

---

## 🔐 api-security-test.sh

### Purpose
Automated security testing for the backend API endpoints.

### Usage

```bash
cd scripts
chmod +x api-security-test.sh
./api-security-test.sh
```

### Tests Performed

| Test | Description |
|------|-------------|
| SQL Injection | Tests for SQL injection vulnerabilities |
| XSS (Cross-Site Scripting) | Tests for XSS vulnerabilities |
| CORS | Tests CORS configuration |
| Rate Limiting | Tests rate limiting implementation |
| Authentication | Tests authentication flows |
| Authorization | Tests role-based access control |
| Input Validation | Tests input sanitization |

### Output

```bash
# Example output
Testing SQL Injection...
✓ SQL injection test passed

Testing XSS...
✓ XSS test passed

Testing CORS...
✓ CORS configuration correct

[Security Summary]
Total Tests: 10
Passed: 8
Failed: 0
Warnings: 2
```

---

## 🛡️ security-scan.sh

### Purpose
Comprehensive security scan of the entire codebase.

### Usage

```bash
cd scripts
chmod +x security-scan.sh
./security-scan.sh
```

### Scans Performed

1. **Dependency Vulnerabilities** - `npm audit`
2. **Secret Detection** - TruffleHog, GitLeaks
3. **CodeQL** - Static code analysis
4. **Container Scanning** - Trivy (if Docker images exist)

### Output

```bash
[Security Scan Report]
================================

1. Dependency Audit
   Found: 0 vulnerabilities
   Status: ✅ Clean

2. Secret Detection
   Scanned: 120 files
   Secrets found: 0
   Status: ✅ Clean

3. CodeQL Analysis
   Status: ✅ Clean

4. Container Scan
   Images scanned: 3
   Vulnerabilities: 0
   Status: ✅ Clean

Overall Status: SECURE
```

---

## 🔧 Running Scripts

### From Root Directory

```bash
# Run API security test
npm run test:security

# Run comprehensive security scan
./scripts/security-scan.sh
```

### Manual Execution

```bash
# Dependency audit (quick check)
npm audit --audit-level=moderate

# Full audit (all vulnerabilities)
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

---

## 📊 Security Reports

Security scan reports are saved to:

| File | Description |
|------|-------------|
| `security-reports/npm-audit.json` | NPM audit results |
| `security-reports/scan-summary.txt` | Scan summary |
| `security-reports/potential-secrets.txt` | Potential secrets found |

---

## 🔑 Environment Variables

Required for security scripts:

```bash
# API URL
API_URL=http://localhost:3001

# Test user credentials
TEST_USERNAME=testuser
TEST_PASSWORD=testpass
```

---

## 🐛 Troubleshooting

**Script not executable:**
```bash
chmod +x scripts/*.sh
```

**Permission denied:**
```bash
bash scripts/api-security-test.sh
```

**Dependencies missing:**
```bash
npm install
```