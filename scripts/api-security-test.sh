#!/bin/bash

# API Security Testing Script
# Tests for common API security vulnerabilities

set -e

echo "🔐 Starting API Security Tests..."
echo "=================================="

# Create security reports directory
mkdir -p security-reports

# Check for security headers in Express configuration
echo "🛡️  Checking for security headers configuration..."
HELMET_FOUND=$(grep -r "helmet()" --include="*.ts" --include="*.js" api/ || echo "")
if [ -z "$HELMET_FOUND" ]; then
    echo "⚠️  WARNING: Helmet middleware not found in API configuration"
    echo "security-headers: NOT_CONFIGURED" > security-reports/api-security-headers.txt
else
    echo "✅ Helmet security middleware detected"
    echo "security-headers: CONFIGURED" > security-reports/api-security-headers.txt
fi

# Check for rate limiting
echo "🚦 Checking for rate limiting..."
RATE_LIMIT_FOUND=$(grep -r "rateLimit\|express-rate-limit" --include="*.ts" --include="*.js" api/ || echo "")
if [ -z "$RATE_LIMIT_FOUND" ]; then
    echo "⚠️  WARNING: Rate limiting not found in API configuration"
    echo "rate-limiting: NOT_CONFIGURED" > security-reports/api-rate-limiting.txt
else
    echo "✅ Rate limiting detected"
    echo "rate-limiting: CONFIGURED" > security-reports/api-rate-limiting.txt
fi

# Check for CORS configuration
echo "🌐 Checking CORS configuration..."
CORS_FOUND=$(grep -r "cors()" --include="*.ts" --include="*.js" api/ || echo "")
if [ -z "$CORS_FOUND" ]; then
    echo "⚠️  WARNING: CORS not found in API configuration"
    echo "cors: NOT_CONFIGURED" > security-reports/api-cors.txt
else
    echo "✅ CORS middleware detected"
    echo "cors: CONFIGURED" > security-reports/api-cors.txt
fi

# Check for input validation
echo "✔️  Checking for input validation..."
VALIDATOR_FOUND=$(grep -r "express-validator\|joi\|yup" --include="*.ts" --include="*.js" api/ || echo "")
if [ -z "$VALIDATOR_FOUND" ]; then
    echo "⚠️  WARNING: Input validation library not found"
    echo "input-validation: NOT_CONFIGURED" > security-reports/api-validation.txt
else
    echo "✅ Input validation library detected"
    echo "input-validation: CONFIGURED" > security-reports/api-validation.txt
fi

# Check for SQL injection prevention (parameterized queries)
echo "💉 Checking for SQL injection prevention..."
RAW_QUERY_COUNT=$(grep -r "\.query(.*\${" --include="*.ts" --include="*.js" api/ 2>/dev/null | wc -l || echo "0")
if [ "$RAW_QUERY_COUNT" -gt 0 ]; then
    echo "⚠️  WARNING: Found $RAW_QUERY_COUNT potential SQL injection risks (template literals in queries)"
    grep -rn "\.query(.*\${" --include="*.ts" --include="*.js" api/ > security-reports/api-sql-injection-risks.txt 2>/dev/null || true
else
    echo "✅ No obvious SQL injection patterns detected"
fi
echo "sql-injection-risks: $RAW_QUERY_COUNT" > security-reports/api-sql-injection.txt

# Check for authentication middleware
echo "🔑 Checking for authentication middleware..."
AUTH_FOUND=$(grep -r "authenticate\|verifyToken\|passport" --include="*.ts" --include="*.js" api/middleware/ api/routes/ 2>/dev/null || echo "")
if [ -z "$AUTH_FOUND" ]; then
    echo "⚠️  WARNING: Authentication middleware not clearly identified"
    echo "authentication: NOT_CLEAR" > security-reports/api-authentication.txt
else
    echo "✅ Authentication middleware detected"
    echo "authentication: CONFIGURED" > security-reports/api-authentication.txt
fi

# Check for sensitive data exposure in logs
echo "📝 Checking for sensitive data in logging..."
SENSITIVE_LOGGING=$(grep -rE "(password|token|secret|apiKey|api_key).*console\.log|logger\.(info|debug).*password" \
    --include="*.ts" --include="*.js" api/ 2>/dev/null || echo "")
if [ -n "$SENSITIVE_LOGGING" ]; then
    echo "⚠️  WARNING: Potential sensitive data logging detected"
    echo "$SENSITIVE_LOGGING" > security-reports/api-sensitive-logging.txt
else
    echo "✅ No obvious sensitive data logging detected"
    echo "No sensitive logging found" > security-reports/api-sensitive-logging.txt
fi

# Check for error handling that might leak information
echo "⚠️  Checking error handling..."
STACK_TRACE_EXPOSED=$(grep -r "\.stack" --include="*.ts" --include="*.js" api/routes/ api/middleware/ 2>/dev/null | grep -v "test" || echo "")
if [ -n "$STACK_TRACE_EXPOSED" ]; then
    echo "⚠️  WARNING: Potential stack trace exposure in error responses"
    echo "$STACK_TRACE_EXPOSED" > security-reports/api-error-handling.txt
else
    echo "✅ No obvious stack trace exposure detected"
fi

# Generate API security summary
echo "📊 Generating API security summary..."
cat > security-reports/api-security-summary.txt << EOF
API Security Test Summary
=========================
Date: $(date)

Security Checks Performed:
---------------------------
✓ Security Headers (Helmet)
✓ Rate Limiting
✓ CORS Configuration
✓ Input Validation
✓ SQL Injection Prevention
✓ Authentication Middleware
✓ Sensitive Data Logging
✓ Error Handling

Results:
--------
Security Headers: $(cat security-reports/api-security-headers.txt)
Rate Limiting: $(cat security-reports/api-rate-limiting.txt)
CORS: $(cat security-reports/api-cors.txt)
Input Validation: $(cat security-reports/api-validation.txt)
SQL Injection Risks: $(cat security-reports/api-sql-injection.txt)
Authentication: $(cat security-reports/api-authentication.txt)

Action Items:
-------------
- Review all WARNING items above
- Ensure all API endpoints have proper authentication
- Implement rate limiting on all public endpoints
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Avoid logging sensitive information

EOF

echo "✅ API security tests complete!"
echo "📁 Reports saved to: security-reports/"
cat security-reports/api-security-summary.txt

# Exit successfully (these are checks, not strict requirements)
exit 0
