# Healthcare AI Clinical Data Analyzer - Hackathon Demo

## Overview

This is a **2-3 day hackathon demo** of an AI-powered clinical decision support tool. The application demonstrates how AI can analyze patient clinical data and generate risk assessments with treatment recommendations for chronic kidney disease (CKD).

This hackathon version implements **18 essential tasks** to create a working demo, focusing on:
- Full-stack TypeScript application (React + Express)
- Docker containerization for easy deployment
- AI-powered risk analysis using Claude API
- Mock patient data with realistic clinical scenarios

## Project Status

**Current Phase:** Infrastructure Complete (Phase H1 Done ✅)
**Hackathon Timeline:** 2-3 days (16 essential tasks)
**Progress:** 5/18 tasks completed (27.78%)
**Next Phase:** Database & AI features (H009-H037)

## Hackathon Demo Features

### ✅ Completed (Phase H1: Infrastructure)
- **H001**: Monorepo project structure (backend, frontend, infrastructure)
- **H002**: Backend initialized (Express + TypeScript + Anthropic SDK)
- **H003**: Frontend initialized (React 19 + Vite + Tailwind CSS)
- **H004**: Production-ready Dockerfiles (multi-stage builds, Alpine, non-root users)
- **H005**: Docker Compose orchestration (postgres, backend, frontend with health checks)

### 🚧 In Progress
- **H006**: Documentation (README, CONTRIBUTING, .env.example)

### 📋 Planned (Remaining 12 tasks)
- **H009**: PostgreSQL with 5 mock patients (realistic CKD data)
- **H012**: Database connection from backend
- **H024-H025**: Mock patient & clinical data services
- **H030**: Claude AI integration for risk analysis
- **H032-H033**: AI processing service + API endpoint
- **H035-H037**: React components (Risk Analysis Button, Assessment Display, Risk Indicator)

## What This Demo Shows

By the end of the hackathon, you'll have a working application that:
1. ✅ **Runs with one command**: `docker-compose up` starts everything
2. 🎯 **AI Risk Analysis**: Click button → Claude analyzes patient data → Returns risk assessment
3. 📊 **Visual Risk Indicators**: Color-coded risk levels (low/medium/high)
4. 🏥 **Realistic Mock Data**: 5 patients with clinical observations and conditions
5. 🐳 **Production-Ready**: Containerized, health checks, proper error handling

## 🤖 NEW: Doctor Assistant Agent

**AI-Powered Clinical Decision Support for Primary Care Doctors**

We've added an intelligent chat interface that helps doctors manage their patients:

### Key Features
- **💬 AI Chat Interface**: Ask questions about patients, clinical guidelines, or treatment recommendations
- **🔔 Real-Time Alerts**: Automatic notifications when patient status changes significantly
- **🎯 Context-Aware**: The AI has access to complete patient history, lab results, and risk assessments
- **⚡ Proactive Monitoring**: Continuous monitoring of all patients with AI-powered analysis of changes

### What It Does
1. **Answer Clinical Questions**: "What are the KDIGO guidelines for this patient?" or "Should I start an SGLT2 inhibitor?"
2. **Smart Notifications**: Get alerted about critical lab values, eGFR decline, or treatment gaps
3. **Patient-Specific Insights**: Click on a patient, then ask the AI for analysis and recommendations
4. **Priority-Based Alerts**: Notifications are categorized as CRITICAL, HIGH, or MODERATE

### How to Use
1. Click the blue chat button in the bottom-right corner
2. Select a patient to provide context, or ask general questions
3. Check the notification bell for important alerts
4. Click alerts to get AI-powered explanations and recommendations

📖 **Full Documentation**: See [DOCTOR_ASSISTANT_AGENT.md](./DOCTOR_ASSISTANT_AGENT.md) for complete setup and usage guide.

## Project Structure

```
/home/user/hackathon_BI_CKD/
├── backend/                      # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts             # Server entry point
│   │   ├── api/                 # API routes (to be added)
│   │   ├── services/            # Business logic (AI, DB)
│   │   ├── models/              # Database models
│   │   ├── ai/                  # Claude integration
│   │   ├── config/              # Configuration
│   │   ├── types/               # TypeScript types
│   │   └── middleware/          # Express middleware
│   ├── Dockerfile               # Multi-stage production build
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx              # Main app component
│   │   ├── main.tsx             # Entry point
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── api/                 # API client
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # Frontend services
│   │   ├── types/               # TypeScript types
│   │   └── styles/              # Global styles
│   ├── Dockerfile               # Multi-stage build + nginx
│   ├── nginx.conf               # nginx config for SPA
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── infrastructure/
│   └── postgres/
│       └── init.sql             # Database initialization
│
├── tests/                       # Test scripts
│   ├── T001_structure_test.sh   # H001 tests
│   ├── T002_backend_test.sh     # H002 tests
│   ├── T003_frontend_test.sh    # H003 tests
│   ├── T004_dockerfiles_test.sh # H004 tests
│   └── T005_dockercompose_test.sh # H005 tests
│
├── log_files/                   # Implementation logs
│   ├── T001_MonorepoSetup_Log.md
│   ├── T002_BackendInit_Log.md
│   ├── T003_FrontendInit_Log.md
│   ├── T004_DockerFiles_Log.md
│   └── T005_DockerCompose_Log.md
│
├── log_tests/                   # Test result logs
│   ├── T001_MonorepoSetup_TestLog.md
│   ├── T002_BackendInit_TestLog.md
│   ├── T003_FrontendInit_TestLog.md
│   ├── T004_DockerFiles_TestLog.md
│   └── T005_DockerCompose_TestLog.md
│
├── log_learn/                   # Educational guides
│   ├── T001_MonorepoSetup_Guide.md
│   ├── T002_BackendInit_Guide.md
│   ├── T003_FrontendInit_Guide.md
│   ├── T004_DockerFiles_Guide.md
│   └── T005_DockerCompose_Guide.md
│
├── .specify/                    # Hackathon planning
│   └── memory/
│       ├── hackathon-tasks.md   # 18 hackathon tasks
│       └── hackathon-implementation-plan.md
│
├── docker-compose.yml           # Production orchestration
├── docker-compose.dev.yml       # Development overrides
├── .gitignore
└── README.md                    # This file
```

## Hackathon Task Breakdown

The hackathon demo has **18 tasks** organized into **3 phases**:

### ✅ Phase H1: Project Setup (5 tasks - ~3 hours) - COMPLETE

| Task | Description | Status | Time | Tests |
|------|-------------|--------|------|-------|
| H001 | Monorepo structure | ✅ Complete | 20 min | 25/25 passed |
| H002 | Backend (Express + TypeScript) | ✅ Complete | 30 min | 12/12 passed |
| H003 | Frontend (React + Vite + Tailwind) | ✅ Complete | 30 min | 18/18 passed |
| H004 | Dockerfiles (backend + frontend) | ✅ Complete | 30 min | 20/20 passed |
| H005 | Docker Compose orchestration | ✅ Complete | 40 min | 22/22 passed |

**Results**: Infrastructure ready, 100% test pass rate (97 automated tests)

### 🚧 Phase H2: Database & Config (3 tasks - ~2 hours)

| Task | Description | Status | Time | Deliverable |
|------|-------------|--------|------|-------------|
| H006 | README & documentation | 🚧 In Progress | 20 min | This file |
| H009 | PostgreSQL with 5 mock patients | 📋 Planned | 30 min | Realistic CKD data |
| H012 | Database connection | 📋 Planned | 20 min | Backend connects to DB |

### 📋 Phase H3: Core Demo Features (8 tasks - ~6 hours)

| Task | Description | Time | Deliverable |
|------|-------------|------|-------------|
| H024 | Mock Patient data service | 30 min | Patient API endpoints |
| H025 | Mock Observation data service | 30 min | Lab results API |
| H030 | Claude API client | 40 min | Real AI integration |
| H032 | AI processing service | 30 min | Orchestrate data + AI |
| H033 | Risk analysis API endpoint | 20 min | POST /api/analyze |
| H035 | Risk Analysis Button component | 30 min | Loading states |
| H036 | Risk Assessment Display | 60 min | Full results UI |
| H037 | Color-Coded Risk Indicator | 20 min | Green/yellow/red |

**Timeline**: 13-15 hours remaining (1.5-2 days)

## Tech Stack

### Frontend
- **React 19.0.0** - Latest UI framework with improved hooks
- **Vite 6.0.7** - Lightning-fast dev server and build tool
- **TypeScript 5.9.3** - Type safety with strict mode
- **Tailwind CSS 3.4.17** - Utility-first styling
- **nginx 1.25-alpine** - Production static file serving

**Build Output**: 403 KB JS, 10 KB CSS (gzipped to 119 KB total)

### Backend
- **Node.js 20 LTS** - Long-term support runtime
- **Express 5.1.0** - Web framework
- **TypeScript 5.9.3** - Strict type checking
- **@anthropic-ai/sdk** - Claude AI integration
- **CORS** - Cross-origin resource sharing
- **pg** - PostgreSQL client (to be added in H012)

**Production Image**: 150 MB (70% smaller than development)

### Database
- **PostgreSQL 16-alpine** - Lightweight database (~80 MB vs ~300 MB)
- **uuid-ossp extension** - UUID generation
- **UTC timezone** - Consistent timestamps

**Data Persistence**: Named volume survives container restarts

### Infrastructure
- **Docker 24+** - Containerization
- **Docker Compose 2.20+** - Multi-container orchestration
- **Multi-stage builds** - Optimized image sizes
- **Health checks** - Automatic dependency management
- **Custom bridge network** - Service isolation

**Startup Time**: ~45 seconds from cold start, ~10 seconds with cache

## Security Features (Implemented)

### Docker Security
- ✅ **Non-root users**: Containers run as nodejs:1001 and nginx-app:1001
- ✅ **Read-only volumes**: Source code mounted read-only in development
- ✅ **Health checks**: Automatic restart on service failure
- ✅ **Network isolation**: Custom bridge network for inter-service communication
- ✅ **Secret injection**: API keys via environment variables (not committed)

### Code Quality
- ✅ **TypeScript strict mode**: Catch errors at compile time
- ✅ **CORS configured**: Backend only accepts requests from frontend
- ✅ **Error handling**: Global error handlers in Express
- ✅ **Input validation**: (To be added in H024-H033)

### Hackathon Scope
This demo focuses on functionality. Production deployment would add:
- HTTPS/TLS encryption
- Authentication/authorization
- Rate limiting
- GDPR compliance (data retention, audit logs)
- Penetration testing

## Quick Start

### Prerequisites

- **Docker 24+** and **Docker Compose 2.20+** (required)
- **Git** (for cloning the repository)
- **Anthropic API Key** (sign up at https://console.anthropic.com)

No Node.js installation needed - everything runs in containers!

### 1. Clone Repository

```bash
git clone <repository-url>
cd hackathon_BI_CKD
```

### 2. Set Environment Variables

Create `.env` file in project root:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Start All Services

```bash
# Production mode (nginx serving built frontend)
docker-compose up -d

# Development mode (hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 4. Access Application

- **Frontend**: http://localhost:8080 (production) or http://localhost:5173 (dev)
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432 (user: healthcare_user, password: healthcare_pass)

### 5. Stop Services

```bash
# Stop containers (preserves data)
docker-compose down

# Stop and remove data volumes (⚠️ destroys database)
docker-compose down -v
```

## Development Workflow

### Hot Reload Development

```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Edit files in backend/src or frontend/src
# Changes auto-reload in containers

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Running Tests

```bash
# Run all test scripts
bash tests/T001_structure_test.sh    # Monorepo structure
bash tests/T002_backend_test.sh      # Backend initialization
bash tests/T003_frontend_test.sh     # Frontend initialization
bash tests/T004_dockerfiles_test.sh  # Docker configuration
bash tests/T005_dockercompose_test.sh # Docker Compose

# All tests: 97 automated tests (100% pass rate)
```

### Database Access

```bash
# Connect to PostgreSQL shell
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db

# Run SQL queries
# healthcare_ai_db=# SELECT * FROM patients;

# Exit shell
# healthcare_ai_db=# \q
```

### Rebuilding After Changes

```bash
# Rebuild specific service
docker-compose up -d --build backend

# Rebuild all services
docker-compose up -d --build

# Force clean rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d
```

## Project Documentation

### Implementation Logs (log_files/)
Each completed task has detailed implementation documentation:
- **T001_MonorepoSetup_Log.md**: Monorepo structure design decisions
- **T002_BackendInit_Log.md**: Express + TypeScript setup
- **T003_FrontendInit_Log.md**: React + Vite + Tailwind configuration
- **T004_DockerFiles_Log.md**: Multi-stage Docker builds
- **T005_DockerCompose_Log.md**: Service orchestration

### Test Logs (log_tests/)
Comprehensive test results with 100% pass rates:
- **T001-T005_TestLog.md**: 97 automated tests total

### Learning Guides (log_learn/)
Educational resources for each technology:
- **T001_MonorepoSetup_Guide.md**: Monorepo architecture patterns
- **T002_BackendInit_Guide.md**: Express.js, TypeScript, middleware
- **T003_FrontendInit_Guide.md**: React 19, Vite, Tailwind best practices
- **T004_DockerFiles_Guide.md**: Docker optimization techniques
- **T005_DockerCompose_Guide.md**: Container orchestration

### Task Planning
- **.specify/memory/hackathon-tasks.md**: 18-task breakdown with progress tracking
- **.specify/memory/hackathon-implementation-plan.md**: Detailed implementation steps

## API Endpoints (To Be Implemented)

### Current (H005 - Completed)
```
GET  /health              - Health check endpoint
GET  /api/info            - API version information
```

### Planned (H024-H033)
```
GET  /api/patients        - List all patients
GET  /api/patients/:id    - Get patient details
GET  /api/patients/:id/observations - Get patient lab results
POST /api/analyze         - Trigger AI risk analysis
```

## Troubleshooting

### Service Won't Start
```bash
# Check service logs
docker-compose logs backend
docker-compose logs postgres

# Restart specific service
docker-compose restart backend

# Force rebuild
docker-compose up -d --build backend
```

### Database Connection Errors
```bash
# Check if postgres is healthy
docker-compose ps

# Verify postgres is running
docker-compose exec postgres pg_isready -U healthcare_user

# Check database exists
docker-compose exec postgres psql -U healthcare_user -l
```

### Frontend Can't Reach Backend
```bash
# Verify backend is running
curl http://localhost:3000/health

# Check CORS configuration in backend/src/index.ts
# Should allow http://localhost:8080 and http://localhost:5173
```

### Hot Reload Not Working
```bash
# Make sure using dev compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Check volume mounts
docker-compose exec backend ls -la /app/src
docker-compose exec frontend ls -la /app/src

# Restart services
docker-compose restart backend frontend
```

## Success Criteria (Hackathon Demo)

By end of hackathon, the demo should demonstrate:

1. ✅ **One-command startup**: `docker-compose up` starts everything
2. 🎯 **AI Integration**: Click button → AI analyzes mock patient → Returns risk assessment
3. 📊 **Visual UI**: Color-coded risk levels, recommendations displayed
4. 🏥 **Mock Data**: 5 patients with realistic CKD clinical data
5. 🐳 **Production-Ready**: Containerized, health checks, proper error handling
6. 📝 **Documentation**: README, setup guide, troubleshooting

**Demo Timeline**: 2-3 days (18 tasks, ~16 hours)

## Next Steps

After completing the hackathon demo (H001-H037), the project can expand to:
- Authentication & authorization
- Real FHIR integration (SMART on FHIR)
- Multiple clinical conditions (diabetes, CVD)
- Population health scanning
- GDPR compliance features
- Multi-country deployments

See the original project plan for full 155-task roadmap.

## License

This project is a hackathon demonstration. For production use, consult with legal and compliance teams.

## Contact

For questions about this hackathon demo:
- Review implementation logs in `log_files/`
- Check test results in `log_tests/`
- Consult learning guides in `log_learn/`

---

**Built for Hackathon BI CKD** - A 2-3 day demonstration of AI-powered clinical decision support
