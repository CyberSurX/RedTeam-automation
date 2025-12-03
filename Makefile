# RedTeam Automation Platform - Makefile
# Comprehensive build and development automation

# Variables
NODE_VERSION := 18
DOCKER_COMPOSE := docker-compose
NPM := npm
PNPM := pnpm
PROJECT_NAME := redteam-automation
BACKEND_PORT := 3001
FRONTEND_PORT := 5173

# Colors
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)RedTeam Automation Platform - Development Commands$(NC)"
	@echo "=================================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development Commands
.PHONY: dev
dev: ## Start development environment (frontend + backend)
	@echo "$(BLUE)Starting development environment...$(NC)"
	@$(NPM) run dev

.PHONY: dev-frontend
dev-frontend: ## Start frontend development server only
	@echo "$(BLUE)Starting frontend development server...$(NC)"
	@$(NPM) run dev:frontend

.PHONY: dev-backend
dev-backend: ## Start backend development server only
	@echo "$(BLUE)Starting backend development server...$(NC)"
	@$(NPM) run dev:backend

# Installation Commands
.PHONY: install
install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@$(NPM) install

.PHONY: install-pnpm
install-pnpm: ## Install dependencies using pnpm
	@echo "$(BLUE)Installing dependencies with pnpm...$(NC)"
	@$(PNPM) install

# Build Commands
.PHONY: build
build: ## Build both frontend and backend
	@echo "$(BLUE)Building application...$(NC)"
	@$(NPM) run build

.PHONY: build-frontend
build-frontend: ## Build frontend only
	@echo "$(BLUE)Building frontend...$(NC)"
	@$(NPM) run build:frontend

.PHONY: build-backend
build-backend: ## Build backend only
	@echo "$(BLUE)Building backend...$(NC)"
	@$(NPM) run build:backend

# Testing Commands
.PHONY: test
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@$(NPM) test

.PHONY: test-unit
test-unit: ## Run unit tests
	@echo "$(BLUE)Running unit tests...$(NC)"
	@$(NPM) run test:unit

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "$(BLUE)Running integration tests...$(NC)"
	@$(NPM) run test:integration

.PHONY: test-security
test-security: ## Run security tests
	@echo "$(BLUE)Running security tests...$(NC)"
	@chmod +x scripts/security-scan.sh scripts/api-security-test.sh
	@./scripts/security-scan.sh
	@./scripts/api-security-test.sh

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@$(NPM) run test:coverage

# Database Commands
.PHONY: db-setup
db-setup: ## Setup database (migrate + seed)
	@echo "$(BLUE)Setting up database...$(NC)"
	@$(NPM) run db:migrate
	@$(NPM) run db:seed

.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@$(NPM) run db:migrate

.PHONY: db-seed
db-seed: ## Seed database with test data
	@echo "$(BLUE)Seeding database...$(NC)"
	@$(NPM) run db:seed

.PHONY: db-reset
db-reset: ## Reset database (drop + migrate + seed)
	@echo "$(YELLOW)Resetting database...$(NC)"
	@$(NPM) run db:reset

.PHONY: db-clean
db-clean: ## Clean database (remove all data)
	@echo "$(RED)Cleaning database...$(NC)"
	@$(NPM) run db:clean

# Docker Commands
.PHONY: docker-build
docker-build: ## Build all Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	@$(DOCKER_COMPOSE) build

.PHONY: docker-up
docker-up: ## Start all services with Docker
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@$(DOCKER_COMPOSE) up -d

.PHONY: docker-down
docker-down: ## Stop all Docker services
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	@$(DOCKER_COMPOSE) down

.PHONY: docker-logs
docker-logs: ## View Docker logs
	@$(DOCKER_COMPOSE) logs -f

.PHONY: docker-clean
docker-clean: ## Clean Docker containers and images
	@echo "$(YELLOW)Cleaning Docker resources...$(NC)"
	@$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans

# Security Commands
.PHONY: security-scan
security-scan: ## Run security vulnerability scan
	@echo "$(BLUE)Running security scan...$(NC)"
	@chmod +x scripts/security-scan.sh
	@./scripts/security-scan.sh

.PHONY: api-security-test
api-security-test: ## Run API security tests
	@echo "$(BLUE)Running API security tests...$(NC)"
	@chmod +x scripts/api-security-test.sh
	@./scripts/api-security-test.sh

# Code Quality Commands
.PHONY: lint
lint: ## Run ESLint
	@echo "$(BLUE)Running linter...$(NC)"
	@$(NPM) run lint

.PHONY: lint-fix
lint-fix: ## Fix ESLint issues automatically
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	@$(NPM) run lint:fix

.PHONY: format
format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	@$(NPM) run format

.PHONY: type-check
type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running type check...$(NC)"
	@$(NPM) run type-check

# Production Commands
.PHONY: start
start: ## Start production server
	@echo "$(BLUE)Starting production server...$(NC)"
	@$(NPM) start

.PHONY: serve
serve: ## Serve built application
	@echo "$(BLUE)Serving built application...$(NC)"
	@$(NPM) run serve

# Utility Commands
.PHONY: clean
clean: ## Clean build artifacts and node_modules
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf dist build node_modules .next
	@rm -rf api/dist api/node_modules
	@rm -rf frontend/dist frontend/node_modules

.PHONY: clean-all
clean-all: ## Clean everything including Docker
	@echo "$(RED)Cleaning everything...$(NC)"
	@$(MAKE) clean
	@$(MAKE) docker-clean

.PHONY: health-check
health-check: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	@curl -f http://localhost:$(BACKEND_PORT)/api/health || echo "$(RED)Backend health check failed$(NC)"
	@curl -f http://localhost:$(FRONTEND_PORT) || echo "$(RED)Frontend health check failed$(NC)"

# Release Commands
.PHONY: version
version: ## Show version information
	@echo "$(GREEN)RedTeam Automation Platform$(NC)"
	@echo "Version: $(shell node -p "require('./package.json').version")"
	@echo "Node.js: $(shell node --version)"
	@echo "NPM: $(shell npm --version)"

.PHONY: release-check
release-check: ## Run pre-release checks
	@echo "$(BLUE)Running pre-release checks...$(NC)"
	@$(MAKE) lint
	@$(MAKE) type-check
	@$(MAKE) test
	@$(MAKE) security-scan
	@$(MAKE) build

# Development Utilities
.PHONY: generate-types
generate-types: ## Generate TypeScript types from database
	@echo "$(BLUE)Generating TypeScript types...$(NC)"
	@$(NPM) run generate-types

.PHONY: generate-docs
generate-docs: ## Generate API documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@$(NPM) run generate-docs

.PHONY: update-deps
update-deps: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@$(NPM) update
	@$(NPM) audit fix

# CI/CD Commands
.PHONY: ci-test
ci-test: ## Run tests in CI environment
	@echo "$(BLUE)Running CI tests...$(NC)"
	@$(NPM) ci
	@$(MAKE) lint
	@$(MAKE) type-check
	@$(MAKE) test-coverage

.PHONY: ci-build
ci-build: ## Build in CI environment
	@echo "$(BLUE)Running CI build...$(NC)"
	@$(MAKE) build
	@$(MAKE) docker-build

# Monitoring Commands
.PHONY: monitor
monitor: ## Start monitoring tools
	@echo "$(BLUE)Starting monitoring...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.monitoring.yml up -d

.PHONY: stop-monitor
stop-monitor: ## Stop monitoring tools
	@echo "$(BLUE)Stopping monitoring...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.monitoring.yml down

# Backup Commands
.PHONY: backup-db
backup-db: ## Backup database
	@echo "$(BLUE)Backing up database...$(NC)"
	@$(DOCKER_COMPOSE) exec database pg_dump -U postgres redteam_automation > backup_$(shell date +%Y%m%d_%H%M%S).sql

.PHONY: restore-db
restore-db: ## Restore database (requires BACKUP_FILE parameter)
	@echo "$(BLUE)Restoring database from $(BACKUP_FILE)...$(NC)"
	@$(DOCKER_COMPOSE) exec -T database psql -U postgres redteam_automation < $(BACKUP_FILE)