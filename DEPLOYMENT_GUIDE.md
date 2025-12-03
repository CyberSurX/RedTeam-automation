# RedTeam Automation Platform - Deployment Guide

Thank you for purchasing the RedTeam Automation Platform! This guide will help you get the system up and running in your environment.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Docker** & **Docker Compose** (Recommended for easiest setup)
- **Node.js** (v18 or higher) - *Only if running manually*
- **PostgreSQL** (v14 or higher) - *Only if running manually*

## 🚀 Quick Start (Docker)

The easiest way to deploy is using Docker Compose. This will spin up the Frontend, Backend, and Database services automatically.

1.  **Extract the Source Code**
    Unzip the provided archive to your desired location.

2.  **Configure Environment**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and configure your settings (Database credentials, JWT Secret, etc.).

3.  **Start Services**
    Run the following command in the project root:
    ```bash
    docker-compose up -d
    ```

4.  **Access the Dashboard**
    Once running, open your browser and navigate to:
    `http://localhost:80` (or the port you configured)

## 🛠️ Manual Installation

If you prefer to run the services directly on your host machine:

### 1. Backend Setup
```bash
# Install dependencies
npm install

# Setup Database
npm run db:migrate
npm run db:seed  # Optional: Adds sample data

# Start Backend
npm run dev:backend
```

### 2. Frontend Setup
```bash
# In a new terminal
npm run dev:frontend
```

## ⚙️ Configuration Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret key for session tokens | **CHANGE_ME** |
| `HACKERONE_API_KEY` | Your HackerOne API Key | - |
| `PORT` | Backend API Port | `3001` |

## 🆘 Troubleshooting

-   **Database Connection Failed**: Ensure your PostgreSQL container is running or your `DATABASE_URL` is correct.
-   **Build Errors**: Make sure you are using Node.js v18+.
-   **Port Conflicts**: If port 80 or 3001 is taken, update `docker-compose.yml` or `.env` to use different ports.

## 📞 Support

If you encounter any issues not covered here, please contact our support team or check the `docs/` folder for more detailed architecture documentation.
