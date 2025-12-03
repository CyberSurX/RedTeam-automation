# RedTeam Automation Platform

A comprehensive bug bounty automation platform designed to streamline security testing workflows, program management, and automated vulnerability discovery.

## 🚀 Features

- **Program Management**: Centralized bug bounty program tracking and management
- **Automated Scanning**: Integrated security scanning with safety controls
- **Finding Management**: Organized vulnerability tracking and reporting
- **Authentication**: Secure JWT-based authentication with role-based access
- **Real-time Monitoring**: Live dashboard with analytics and reporting
- **API Integration**: Seamless integration with HackerOne, Bugcrowd, and other platforms

## 🌐 Enterprise Features

- **Scalable Architecture**: Horizontal scaling with Kubernetes/Docker Swarm support
- **Compliance Ready**: GDPR, SOC2, HIPAA compliant data handling
- **Advanced RBAC**: Multi-tenant support with fine-grained permissions
- **SIEM Integration**: Splunk, ELK Stack, Azure Sentinel integration
- **Custom Workflows**: Plugin system for custom scanning/exploitation modules
- **SLA Monitoring**: 99.99% uptime monitoring with alerting
- **White-labeling**: Custom branding for MSP/consulting firms
- **API-First**: Full REST/GraphQL APIs for integration with SIEM/SOAR

**Contact for Enterprise**: sales@redteam-automation.com | +1-800-SECURE-01

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+ or Docker
- Git

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd RedTeam-automation
cp .env.example .env
```

### 2. Environment Configuration

Edit `.env` file with your configuration:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/redteam_automation

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# API Keys (optional)
HACKERONE_API_KEY=your-hackerone-api-key
BUGCROWD_API_KEY=your-bugcrowd-api-key
```

### 3. Install Dependencies

```bash
# Install all dependencies
npm install

# Or using pnpm
pnpm install
```

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### 5. Start Development Server

```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:frontend
npm run dev:backend
```

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Services

```bash
# Frontend only
docker build -f Dockerfile.frontend -t redteam-frontend .
docker run -p 80:80 redteam-frontend

# Backend only
docker build -f Dockerfile.backend -t redteam-backend .
docker run -p 3001:3001 redteam-backend

# Database
docker build -f Dockerfile.database -t redteam-database .
docker run -p 5432:5432 redteam-database
```

## 🔧 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### Program Management Endpoints

#### Get All Programs
```http
GET /api/programs?page=1&limit=10&status=active
Authorization: Bearer <jwt_token>
```

#### Create Program
```http
POST /api/programs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Bug Bounty Program",
  "description": "Security testing program",
  "platform": "hackerone",
  "program_id": "program-123"
}
```

#### Update Program
```http
PUT /api/programs/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Program Name",
  "status": "paused"
}
```

#### Delete Program
```http
DELETE /api/programs/:id
Authorization: Bearer <jwt_token>
```

## 💼 Pricing Tiers

| Tier | Users | Features | Monthly |
|------|-------|----------|---------|
| Starter | 1-5 | Core scanning | $99 |
| Pro | 6-25 | + Custom tools | $499 |
| Enterprise | 26+ | Full suite + Support | Custom

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Security tests
npm run test:security
```

### Security Testing
```bash
# Run security vulnerability scan
./scripts/security-scan.sh

# Run API security tests
./scripts/api-security-test.sh
```

## 📊 Monitoring & Analytics

The platform includes built-in monitoring and analytics:

- **Real-time Dashboard**: Live metrics and status updates
- **Security Scanning**: Automated vulnerability detection
- **Performance Monitoring**: API response times and error rates
- **Audit Logging**: Complete activity tracking

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting and DDoS protection
- Security headers and CORS configuration
- Dependency vulnerability scanning
- API security testing

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   cp .env.example .env.production
   # Edit production environment variables
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Database Migration**
   ```bash
   npm run db:migrate:prod
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

### Cloud Deployment Options

- **Vercel**: Serverless deployment for frontend
- **AWS**: ECS, Lambda, or EC2 deployment
- **Google Cloud**: Cloud Run or Compute Engine
- **DigitalOcean**: App Platform or Droplets

See [deployment guide](docs/deployment.md) for detailed instructions.

## 📁 Project Structure

```
RedTeam-automation/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   └── lib/                # Utility functions
├── api/                    # Backend API
│   ├── routes/             # API routes
│   ├── src/                # Backend source code
│   │   ├── entities/       # Database entities
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration files
│   └── tests/              # Backend tests
├── services/               # Microservices
│   ├── scanning/           # Security scanning service
│   ├── recon/              # Reconnaissance service
│   ├── exploitation/       # Exploitation service
│   └── reporting/          # Report generation service
├── scripts/                # Utility scripts
├── docs/                   # Documentation
├── supabase/               # Database migrations
└── deployment/             # Deployment configurations
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [documentation](docs/)
- Review the [testing guide](docs/testing.md)

## 🔗 Links

- [Documentation](docs/)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guidelines](docs/security.md)