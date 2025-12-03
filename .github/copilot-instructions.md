# RedTeam Automation Platform - Copilot Instructions

## 🎯 Project Overview
Bug bounty automation platform for security testing workflows. Monorepo with React frontend (`src/`), Express backend (`api/`), Prisma PostgreSQL (`prisma/`), and microservices (`services/`). Focus: program management, scanning/recon/exploitation, HackerOne integration, revenue tracking.

## 🏗️ Architecture
```
Frontend (Vite+React+TS) → API Gateway (Express+TS) → Services (scanning/recon/exploitation/reporting)
↑
Dashboard ↔ PostgreSQL (Prisma) + Redis (cache/queue)
```
- Data flow: JWT auth → RBAC → Services use `platform-clients/hackerone.ts` for API calls.
- Key: `api/server.ts` (entry), `prisma/schema.prisma` (models: User, Program), `services/platform-clients/` (integrations).

## 🔧 Critical Workflows
- **Dev**: `npm run dev` (concurrent FE/BE) or `make dev`. Ports: FE=5173, BE=3001.
- **Build**: `npm run build` → `dist/`.
- **DB**: `npm run db:migrate && npm run db:seed` (uses `prisma/seed.ts`).
- **Test**: `npm test` (Vitest), `npm run test:security` (scripts/*.sh), `make test-security`.
- **Docker**: `docker-compose up -d` (FE:80, BE:3001, DB:5432, Redis:6379). See `docker-compose.yml`.
- **Security Scan**: `./scripts/security-scan.sh`, HackerOne tests: `node test-hackerone-enhanced.js`.
- **Revenue Validation**: `./revenue-validation.sh` (uses `.env.test`).

## ⚙️ Conventions & Patterns
- **Paths**: `@/*` → `src/*` (vite.config.ts aliases).
- **Auth**: JWT (`jsonwebtoken`), roles (ADMIN/RESEARCHER/USER in schema.prisma). Middleware: `api/middleware/auth.ts`.
- **Validation**: `express-validator` in routes (e.g., `api/routes/programs.ts`).
- **Security**: Helmet, rate-limit-redis, CORS. Always validate HackerOne scope: `hackerOne.validateScope(programHandle, target)`.
- **State**: Zustand (`src/contexts/`), no Redux.
- **Tests**: Vitest + RTL. Mock Prisma: `vi.mock('@prisma/client')`.
- **Commits**: Conventional (use `npm run lint` pre-commit via eslint.config.js).

## 📂 Key Files/Dirs
| Purpose | Files |
|---------|-------|
| Entry | `api/server.ts`, `src/main.tsx` |
| DB | `prisma/schema.prisma`, `prisma/seed.ts` |
| HackerOne | `services/platform-clients/hackerone.ts` (Client class, dryRun mode) |
| Services | `services/{recon,scanning,exploitation}/` (tool configs) |
| UI | `src/pages/` (Reconnaissance.tsx, Exploitation.tsx patterns) |
| Deploy | `deployment/{aws,gcp,kubernetes}/`, `Dockerfile.*` |
| Scripts | `scripts/{security-scan.sh, api-security-test.sh}` |

## 🛡️ Security Patterns
- Scope validation before reports: `services/platform-clients/hackerone.ts#validateScope`.
- Revenue events: `services/revenue/revenue-tracker.ts` (trackDiscovery/trackSubmission).
- Env: `.env` → `dotenv`. HackerOne: `.env.thundernight` (DEBUG_HACKERONE=true).

## 🧪 Testing Patterns
```
npm test:unit → vitest.config.ts (coverage >80%)
make test-security → scripts/*.sh + HackerOne mocks
```
E2E: Playwright in `tests/e2e/`. CI: `.github/workflows/ci-cd.yml`.

Follow ADR in `docs/adr.md` (e.g., ADR-001 stack). Edit via `replace_string_in_file` with 3+ lines context.

Feedback? Unclear sections on services/microservices or deployment?