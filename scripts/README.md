# `scripts/` — Utility & Security Scripts

## Purpose

Shell scripts for automated security testing and dependency vulnerability scanning. These are designed to run in CI/CD pipelines or as pre-deployment gates.

## Directory Structure

```
scripts/
├── security-scan.sh        # Dependency vulnerability scanner
└── api-security-test.sh    # API endpoint security test suite
```

## Script Details

### `security-scan.sh`

- **Purpose**: Scans npm dependencies for known vulnerabilities
- **Usage**: `./scripts/security-scan.sh`
- **When to run**: Pre-commit, CI pipeline, before deployment
- **Output**: Vulnerability report with severity levels

### `api-security-test.sh`

- **Purpose**: Tests API endpoints for common security issues (auth bypass, injection, rate limit effectiveness, CORS misconfiguration)
- **Usage**: `./scripts/api-security-test.sh`
- **Prerequisite**: Backend server running on `http://localhost:5000`
- **Output**: Pass/fail results per endpoint test

## Integration Points

- Called by GitHub Actions workflows (`.github/workflows/`)
- Referenced in root `package.json` scripts: `npm run test:security`
- Results can be piped to `mega_audit_out/` for archival
