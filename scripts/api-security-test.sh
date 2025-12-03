#!/bin/bash
# API security testing script
# Tests authentication, authorization, and common security vulnerabilities

set -euo pipefail

echo "🔒 Starting API security testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
TEST_REPORT_DIR="security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create reports directory
mkdir -p "$TEST_REPORT_DIR"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to make HTTP requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local headers=""
    if [ -n "$token" ]; then
        headers="-H \"Authorization: Bearer $token\""
    fi
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "$API_BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data" \
            -w "\n%{http_code}"
    else
        curl -s -X "$method" "$API_BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -w "\n%{http_code}"
    fi
}

# Test 1: Authentication bypass attempts
test_authentication_bypass() {
    print_status $BLUE "🔐 Testing authentication bypass..."
    
    local endpoints=("/api/auth/profile" "/api/programs" "/api/reports")
    local bypass_attempts=("" "Bearer invalid_token" "Bearer null" "Basic dGVzdDp0ZXN0")
    
    for endpoint in "${endpoints[@]}"; do
        for auth in "${bypass_attempts[@]}"; do
            local response=$(make_request "GET" "$endpoint" "" "$auth")
            local http_code=$(echo "$response" | tail -n1)
            local body=$(echo "$response" | head -n -1)
            
            if [ "$http_code" -eq 200 ]; then
                print_status $RED "❌ Authentication bypass possible on $endpoint with auth: $auth"
                echo "Response: $body" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
                return 1
            fi
        done
    done
    
    print_status $GREEN "✅ Authentication bypass tests passed"
    return 0
}

# Test 2: SQL Injection attempts
test_sql_injection() {
    print_status $BLUE "💉 Testing SQL injection vulnerabilities..."
    
    local sql_payloads=(
        "' OR '1'='1"
        "' OR 1=1--"
        "'; DROP TABLE users;--"
        "' UNION SELECT null,null,null--"
        "admin'--"
        "admin' #"
        "admin'/*"
        "' or 1=1#"
        "' or 1=1--"
        "' or 1=1/*"
    )
    
    for payload in "${sql_payloads[@]}"; do
        # Test login endpoint
        local login_data="{\"email\":\"$payload\",\"password\":\"test\"}"
        local response=$(make_request "POST" "/api/auth/login" "$login_data")
        local http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" -eq 500 ]; then
            print_status $RED "❌ Potential SQL injection vulnerability detected with payload: $payload"
            echo "SQL injection test failed with payload: $payload" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
            return 1
        fi
    done
    
    print_status $GREEN "✅ SQL injection tests passed"
    return 0
}

# Test 3: XSS vulnerabilities
test_xss_vulnerabilities() {
    print_status $BLUE "🛡️  Testing XSS vulnerabilities..."
    
    local xss_payloads=(
        "<script>alert('XSS')</script>"
        "javascript:alert('XSS')"
        "<img src=x onerror=alert('XSS')>"
        "<svg onload=alert('XSS')>"
        "'"><script>alert('XSS')</script>"
    )
    
    for payload in "${xss_payloads[@]}"; do
        # Test registration endpoint
        local reg_data="{\"email\":\"test@example.com\",\"password\":\"test123\",\"name\":\"$payload\"}"
        local response=$(make_request "POST" "/api/auth/register" "$reg_data")
        local http_code=$(echo "$response" | tail -n1)
        local body=$(echo "$response" | head -n -1)
        
        if echo "$body" | grep -q "$payload"; then
            print_status $RED "❌ Potential XSS vulnerability detected with payload: $payload"
            echo "XSS test failed with payload: $payload" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
            return 1
        fi
    done
    
    print_status $GREEN "✅ XSS vulnerability tests passed"
    return 0
}

# Test 4: Rate limiting
test_rate_limiting() {
    print_status $BLUE "⚡ Testing rate limiting..."
    
    local success_count=0
    local total_requests=20
    
    for i in $(seq 1 $total_requests); do
        local response=$(make_request "POST" "/api/auth/login" '{"email":"test@example.com","password":"wrong"}')
        local http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" -eq 429 ]; then
            print_status $GREEN "✅ Rate limiting working (blocked after $i requests)"
            return 0
        elif [ "$http_code" -eq 401 ]; then
            success_count=$((success_count + 1))
        fi
        
        # Small delay to avoid overwhelming the server
        sleep 0.1
    done
    
    if [ "$success_count" -eq "$total_requests" ]; then
        print_status $YELLOW "⚠️  Rate limiting might not be working properly (all $total_requests requests succeeded)"
        echo "Rate limiting test: all $total_requests requests succeeded" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
        return 1
    fi
    
    return 0
}

# Test 5: Input validation
test_input_validation() {
    print_status $BLUE "🔍 Testing input validation..."
    
    local invalid_inputs=(
        '{"email":"invalid-email","password":"short"}'
        '{"email":"","password":""}'
        '{"email":"a@b.c","password":"1234567"}'
        '{"email":"valid@example.com"}'
        '{"password":"validpassword123"}'
    )
    
    for input in "${invalid_inputs[@]}"; do
        local response=$(make_request "POST" "/api/auth/register" "$input")
        local http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" -eq 200 ]; then
            print_status $RED "❌ Input validation failed for: $input"
            echo "Input validation test failed for: $input" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
            return 1
        fi
    done
    
    print_status $GREEN "✅ Input validation tests passed"
    return 0
}

# Test 6: Authorization
test_authorization() {
    print_status $BLUE "🛡️  Testing authorization..."
    
    # Create a regular user token (mock)
    local user_token="mock_user_token"
    
    # Try to access admin endpoints
    local admin_endpoints=("/api/admin/users" "/api/admin/programs" "/api/admin/reports")
    
    for endpoint in "${admin_endpoints[@]}"; do
        local response=$(make_request "GET" "$endpoint" "" "$user_token")
        local http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" -eq 200 ]; then
            print_status $RED "❌ Authorization bypass possible on admin endpoint: $endpoint"
            echo "Authorization test failed for endpoint: $endpoint" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
            return 1
        fi
    done
    
    print_status $GREEN "✅ Authorization tests passed"
    return 0
}

# Main execution
main() {
    local exit_code=0
    
    print_status $GREEN "🚀 Starting API security tests..."
    echo "API Security Test Report" > "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
    echo "========================" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
    echo "Date: $(date)" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
    echo "API Base URL: $API_BASE_URL" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
    echo "" >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
    
    # Run all tests
    test_authentication_bypass || exit_code=1
    test_sql_injection || exit_code=1
    test_xss_vulnerabilities || exit_code=1
    test_rate_limiting || exit_code=1
    test_input_validation || exit_code=1
    test_authorization || exit_code=1
    
    # Generate summary
    cat >> "$TEST_REPORT_DIR/api-security-$TIMESTAMP.log" << EOF

Test Summary
============
Exit Code: $exit_code
Tests Run: 6
Passed: $([ $exit_code -eq 0 ] && echo "6" || echo "< 6")
Failed: $([ $exit_code -eq 0 ] && echo "0" || echo "> 0")

Exit Code: $exit_code (0 = all tests passed, 1 = some tests failed)
EOF
    
    if [ $exit_code -eq 0 ]; then
        print_status $GREEN "✅ All API security tests passed"
    else
        print_status $RED "⚠️  Some API security tests failed - check the report"
    fi
    
    echo "📄 Detailed report saved to: $TEST_REPORT_DIR/api-security-$TIMESTAMP.log"
    
    exit $exit_code
}

# Run main function
main "$@"