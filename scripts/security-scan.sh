#!/bin/bash
# Security testing script for dependency vulnerability scanning
# This script scans for known vulnerabilities in project dependencies

set -euo pipefail

echo "🔍 Starting security vulnerability scan..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if npm audit is available
if ! command -v npm &> /dev/null; then
    print_status $RED "❌ npm is not installed"
    exit 1
fi

# Create reports directory
mkdir -p security-reports

# Function to scan Node.js dependencies
scan_node_dependencies() {
    print_status $YELLOW "📦 Scanning Node.js dependencies..."
    
    # Run npm audit
    if npm audit --audit-level=moderate --json > security-reports/npm-audit.json 2>/dev/null; then
        print_status $GREEN "✅ npm audit completed successfully"
        
        # Parse results
        local vulnerabilities=$(cat security-reports/npm-audit.json | jq -r '.metadata.vulnerabilities.total // 0')
        local critical=$(cat security-reports/npm-audit.json | jq -r '.metadata.vulnerabilities.critical // 0')
        local high=$(cat security-reports/npm-audit.json | jq -r '.metadata.vulnerabilities.high // 0')
        local moderate=$(cat security-reports/npm-audit.json | jq -r '.metadata.vulnerabilities.moderate // 0')
        local low=$(cat security-reports/npm-audit.json | jq -r '.metadata.vulnerabilities.low // 0')
        
        echo "📊 Vulnerability Summary:"
        echo "  Total: $vulnerabilities"
        echo "  Critical: $critical"
        echo "  High: $high"
        echo "  Moderate: $moderate"
        echo "  Low: $low"
        
        if [ "$critical" -gt 0 ] || [ "$high" -gt 0 ]; then
            print_status $RED "⚠️  Critical or high severity vulnerabilities found!"
            return 1
        else
            print_status $GREEN "✅ No critical or high severity vulnerabilities found"
            return 0
        fi
    else
        print_status $RED "❌ npm audit failed"
        return 1
    fi
}

# Function to scan Docker images
scan_docker_images() {
    print_status $YELLOW "🐳 Scanning Docker images..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_status $YELLOW "⚠️  Docker is not installed, skipping Docker image scan"
        return 0
    fi
    
    # Build images if they don't exist
    if ! docker images | grep -q "redteam-backend"; then
        print_status $YELLOW "📦 Building backend Docker image..."
        docker build -f Dockerfile.backend -t redteam-backend .
    fi
    
    if ! docker images | grep -q "redteam-frontend"; then
        print_status $YELLOW "📦 Building frontend Docker image..."
        docker build -f Dockerfile.frontend -t redteam-frontend .
    fi
    
    # Use Trivy for container scanning if available
    if command -v trivy &> /dev/null; then
        print_status $YELLOW "🔍 Scanning with Trivy..."
        trivy image --format json --output security-reports/trivy-backend.json redteam-backend || true
        trivy image --format json --output security-reports/trivy-frontend.json redteam-frontend || true
        print_status $GREEN "✅ Trivy scan completed"
    else
        print_status $YELLOW "⚠️  Trivy is not installed, skipping container vulnerability scan"
    fi
}

# Function to check for hardcoded secrets
check_secrets() {
    print_status $YELLOW "🔑 Checking for hardcoded secrets..."
    
    # Common secret patterns
    local patterns=(
        "password\s*=\s*['\"][^'\"]{8,}['\"]"
        "api_key\s*=\s*['\"][^'\"]{16,}['\"]"
        "secret\s*=\s*['\"][^'\"]{16,}['\"]"
        "token\s*=\s*['\"][^'\"]{20,}['\"]"
        "-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----"
        "sk-[a-zA-Z0-9]{48}"
        "ghp_[a-zA-Z0-9]{36}"
    )
    
    local found_secrets=false
    
    for pattern in "${patterns[@]}"; do
        if grep -r -i -E "$pattern" --include="*.js" --include="*.ts" --include="*.json" --include="*.env*" . 2>/dev/null; then
            found_secrets=true
        fi
    done
    
    if [ "$found_secrets" = true ]; then
        print_status $RED "⚠️  Potential hardcoded secrets found! Please review the output above."
        return 1
    else
        print_status $GREEN "✅ No obvious hardcoded secrets found"
        return 0
    fi
}

# Function to check file permissions
check_file_permissions() {
    print_status $YELLOW "🔒 Checking file permissions..."
    
    local permission_issues=false
    
    # Check for world-writable files
    if find . -type f -perm -002 2>/dev/null | grep -v node_modules | grep -v .git; then
        print_status $RED "⚠️  World-writable files found (excluding node_modules and .git)"
        permission_issues=true
    fi
    
    # Check for executable files that shouldn't be
    if find . -name "*.js" -o -name "*.ts" -o -name "*.json" | xargs ls -la 2>/dev/null | grep -E "^-..x..x..x"; then
        print_status $RED "⚠️  Potentially unnecessary executable permissions on source files"
        permission_issues=true
    fi
    
    if [ "$permission_issues" = true ]; then
        return 1
    else
        print_status $GREEN "✅ File permissions look good"
        return 0
    fi
}

# Main execution
main() {
    local exit_code=0
    
    print_status $GREEN "🚀 Starting security vulnerability scan..."
    
    # Run all scans
    scan_node_dependencies || exit_code=1
    scan_docker_images || exit_code=1
    check_secrets || exit_code=1
    check_file_permissions || exit_code=1
    
    # Generate summary report
    cat > security-reports/security-summary.txt << EOF
Security Scan Summary
=====================
Date: $(date)
Exit Code: $exit_code

Reports generated:
- npm-audit.json: Node.js dependency vulnerabilities
- trivy-*.json: Container image vulnerabilities (if Trivy available)
- security-summary.txt: This summary

Exit Code: $exit_code (0 = clean, 1 = issues found)
EOF
    
    if [ $exit_code -eq 0 ]; then
        print_status $GREEN "✅ Security scan completed successfully - no critical issues found"
    else
        print_status $RED "⚠️  Security scan completed with issues - please review the reports"
    fi
    
    echo "📄 Reports saved to security-reports/ directory"
    
    exit $exit_code
}

# Run main function
main "$@"