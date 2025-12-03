#!/bin/bash

# Bug Bounty Revenue Validation Script
# This script runs the automated testing for HackerOne, Bugcrowd, and DevPost

set -e

echo "🚀 Bug Bounty Revenue Validation Starting..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TEST_ENV="test"
RESULTS_DIR="./test-results"
LOG_FILE="$RESULTS_DIR/validation.log"

# Create results directory
mkdir -p $RESULTS_DIR

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Function to check if required environment variables are set
check_env() {
    local required_vars=("HACKERONE_API_KEY" "BUGCROWD_API_KEY" "DEVPOST_API_KEY")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=($var)
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "${RED}  - $var${NC}"
        done
        echo -e "${YELLOW}Please set these in your .env.test file${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ All required environment variables are set${NC}"
}

# Function to install dependencies
install_deps() {
    log "Installing dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ package.json not found${NC}"
        exit 1
    fi
}

# Function to run TypeScript compilation
compile_ts() {
    log "Compiling TypeScript..."
    
    if [ -f "tsconfig.json" ]; then
        npx tsc --build
        echo -e "${GREEN}✅ TypeScript compiled${NC}"
    else
        echo -e "${YELLOW}⚠️  tsconfig.json not found, skipping compilation${NC}"
    fi
}

# Function to run the main test
run_main_test() {
    log "Starting main bug bounty test..."
    
    # Set test environment
    export NODE_ENV=test
    export TEST_MODE=true
    export SAFE_TESTING=true
    export DRY_RUN=${DRY_RUN:-true}  # Default to dry run for safety
    
    # Run the test
    if [ -f "dist/services/testing/bug-bounty-tester.js" ]; then
        node dist/services/testing/bug-bounty-tester.js
    elif [ -f "services/testing/bug-bounty-tester.ts" ]; then
        npx ts-node services/testing/bug-bounty-tester.ts
    else
        echo -e "${RED}❌ Bug bounty tester not found${NC}"
        exit 1
    fi
}

# Function to run safety checks
safety_check() {
    log "Running safety checks..."
    
    # Check if we're in safe mode
    if [ "$SAFE_MODE" != "true" ] && [ "$DRY_RUN" != "true" ]; then
        echo -e "${YELLOW}⚠️  WARNING: Not in safe mode or dry run mode${NC}"
        echo -e "${YELLOW}This will make actual API calls and submissions${NC}"
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Test cancelled by user${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Safety checks passed${NC}"
}

# Function to analyze results
analyze_results() {
    log "Analyzing test results..."
    
    if [ -f "$RESULTS_DIR/bug-bounty-test-report.txt" ]; then
        echo -e "${GREEN}📊 Test Report Generated:${NC}"
        echo "================================"
        cat "$RESULTS_DIR/bug-bounty-test-report.txt"
        
        # Extract revenue numbers
        TOTAL_REVENUE=$(grep "Total Revenue:" "$RESULTS_DIR/bug-bounty-test-report.txt" | awk '{print $3}' | tr -d '$')
        DISCOVERED=$(grep "Total Vulnerabilities Discovered:" "$RESULTS_DIR/bug-bounty-test-report.txt" | awk '{print $4}')
        
        echo
        echo -e "${GREEN}💰 POTENTIAL REVENUE: $$TOTAL_REVENUE${NC}"
        echo -e "${GREEN}🔍 VULNERABILITIES FOUND: $DISCOVERED${NC}"
        
        if (( $(echo "$TOTAL_REVENUE > 0" | bc -l) )); then
            echo -e "${GREEN}🎉 SUCCESS: Potential revenue found!${NC}"
            echo -e "${YELLOW}💡 Next steps: Review reports and consider real submissions${NC}"
        else
            echo -e "${YELLOW}📈 No revenue found this run - try different programs or improve detection${NC}"
        fi
    else
        echo -e "${RED}❌ No test report found${NC}"
    fi
}

# Function to cleanup
cleanup() {
    log "Cleaning up..."
    
    # Reset environment
    unset NODE_ENV
    unset TEST_MODE
    unset SAFE_TESTING
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}🎯 Bug Bounty Revenue Validation${NC}"
    echo "==================================="
    
    # Load environment variables
    if [ -f ".env.test" ]; then
        export $(grep -v '^#' .env.test | xargs)
        echo -e "${GREEN}✅ Environment loaded from .env.test${NC}"
    else
        echo -e "${RED}❌ .env.test file not found${NC}"
        exit 1
    fi
    
    # Run steps
    check_env
    safety_check
    install_deps
    compile_ts
    run_main_test
    analyze_results
    cleanup
    
    echo
    echo -e "${GREEN}🎉 Revenue validation completed!${NC}"
    echo -e "${YELLOW}Check $RESULTS_DIR for detailed reports${NC}"
}

# Handle script interruption
trap cleanup EXIT INT TERM

# Run main function
main "$@"