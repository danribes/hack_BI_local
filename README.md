# Healthcare AI Clinical Data Analyzer - Local Deployment

A comprehensive CKD (Chronic Kidney Disease) Risk Screening System with AI-powered analysis using Claude 3.5 Sonnet. This application provides real-time health state classification, progression tracking, and personalized risk assessments.

## 🚀 Quick Start (5 Minutes)

### Prerequisites

**Required:**
- **Docker Desktop** (v20.10+) - [Download here](https://www.docker.com/products/docker-desktop)
  - Includes Docker Compose (no separate installation needed)

**Optional:**
- **Anthropic API Key** - [Get one here](https://console.anthropic.com)
  - Only required for AI-powered risk analysis features
  - Basic features work without it

### Deployment Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/danribes/hack_BI_local.git
cd hack_BI_local
```

#### 2. Configure Environment (Optional)

**Quick Deploy (No Configuration Needed):**
You can skip this step entirely! The application has sensible defaults and will run without creating a `.env` file. AI features will be disabled but all other functionality works.

**Full Setup (With AI Features):**
```bash
# Create environment file from template
cp .env.example .env

# Add your Anthropic API key
nano .env
# or use your preferred editor to edit .env
# Update line: ANTHROPIC_API_KEY=your-actual-api-key-here
```

**Note:** All database credentials and ports are pre-configured. You only need to add an API key for AI-powered analysis.

#### 3. Start All Services
```bash
# Start all containers in detached mode
docker-compose up -d
```

**What happens during startup:**
- PostgreSQL database initializes (30-60 seconds first time)
- Database schema created automatically from `infrastructure/postgres/init.sql`
- 5 sample CKD patients loaded into database
- Backend API starts and connects to database
- Frontend builds and serves via nginx

**First-time startup:** 3-5 minutes (downloads images)
**Subsequent startups:** 10-20 seconds

#### 4. Verify Deployment
```bash
# Check all services are running and healthy
docker-compose ps

# Test backend API
curl http://localhost:3000/health

# Test frontend (should return HTTP 200)
curl -I http://localhost:8080
```

Expected output from `docker-compose ps`:
```
NAME                  STATUS              PORTS
healthcare-backend    Up (healthy)        0.0.0.0:3000->3000/tcp
healthcare-frontend   Up (healthy)        0.0.0.0:8080->8080/tcp
healthcare-postgres   Up (healthy)        0.0.0.0:5433->5432/tcp
```

#### 5. Access the Application

- **Frontend Web Interface:** http://localhost:8080
- **Backend API:** http://localhost:3000
- **Database:** localhost:5433
  - User: `healthcare_user`
  - Password: `healthcare_pass`
  - Database: `healthcare_ai_db`

**That's it!** The application is now running locally with 5 sample patients ready to explore.

### Next Steps

**Generate More Patient Data** (optional):
```bash
# Generate 1000 realistic CKD patients
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

**Enable AI Features** (optional):
1. Get API key from https://console.anthropic.com
2. Edit `.env` file and add your key
3. Restart backend: `docker-compose restart backend`

## 📋 Architecture

The system consists of three Docker containers:

- **PostgreSQL Database** (port 5433) - Stores patient data, lab results, and health state history
- **Backend API** (port 3000) - Node.js/Express RESTful API with AI integration
- **Frontend** (port 8080) - React/Vite modern web interface with responsive design

All services communicate via a custom Docker network and include health checks for reliability.

## 🛠️ Development Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop services
```bash
docker-compose down
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Reset database
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Restart with fresh database
```

### Database access
```bash
# Check backend logs for retry attempts
docker-compose logs backend | grep "DoctorAgent"

# Run SQL queries
# healthcare_ai_db=# \l
# healthcare_ai_db=# \dt
# healthcare_ai_db=# \q (to exit)
```

## 🏥 Key Features

- **Real-time Health State Classification** - KDIGO-based CKD staging (G1-G5, A1-A3)
- **Progression Tracking** - Monitor patient health evolution over time
- **AI-Powered Risk Analysis** - Claude 3.5 Sonnet integration for intelligent assessments
- **Comprehensive Lab Management** - Track biomarkers, trends, and critical values
- **Comorbidity Management** - Diabetes, hypertension, cardiovascular tracking
- **Medication Tracking** - Monitor treatments, dosages, and adherence

## 📊 System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB for images and data
- **CPU**: 2 cores minimum
- **OS**: Linux, macOS, or Windows with Docker Desktop

## 🔒 Security Notes

- Never commit `.env` file to version control (already in .gitignore)
- Rotate API keys regularly
- Use strong database passwords in production
- Keep Docker and dependencies updated
- Containers run as non-root users for security

## 📁 Project Structure

```
.
├── backend/              # Node.js/Express API
│   ├── src/             # TypeScript source code
│   ├── Dockerfile       # Backend container config
│   └── package.json     # Dependencies
├── frontend/            # React/Vite frontend
│   ├── src/            # TypeScript/React source code
│   ├── Dockerfile      # Frontend container config
│   ├── nginx.conf      # nginx configuration
│   └── package.json    # Dependencies
├── infrastructure/     # Database initialization
│   └── postgres/
│       └── init.sql   # Database schema
├── docker-compose.yml # Service orchestration
├── .env              # Environment configuration (create from .env.example)
└── .env.example      # Environment template
```

## 🧪 Testing

### Patient Filter Shows Incomplete Data

**Symptom:** Filtered patient list missing CKD status, treatment status, or health state badges

**Diagnosis:**
```bash
# Run backend tests (inside container)
docker-compose exec backend npm test

# Run frontend tests (inside container)
docker-compose exec frontend npm test

# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:8080/
```

## 📖 API Endpoints

### Health & Info
```
GET  /health              - Health check endpoint
GET  /api/info            - API version information
```

### Patient Management
```
GET  /api/patients                      - List all patients
GET  /api/patients/:id                  - Get patient details
GET  /api/patients/:id/observations     - Get patient lab results
GET  /api/patients/:id/health-states    - Get health state history
```

### AI Analysis
```
POST /api/analyze         - Trigger AI risk analysis for a patient
```

## 📖 Additional Resources

- **API Documentation**: All endpoints documented in the [API Endpoints](#-api-endpoints) section
- **Development Mode**: See [Development Mode](#-development-mode-hot-reload) for hot-reload setup
- **Troubleshooting**: Comprehensive guide in the [Troubleshooting](#-troubleshooting) section

## 🐛 Troubleshooting

### Port conflicts
If ports 3000, 5433, or 8080 are already in use:
1. Stop services using those ports, or
2. Modify ports in `docker-compose.yml` (left side of port mapping `"HOST:CONTAINER"`)

### Database connection issues
```bash
# Check database health
docker-compose exec postgres pg_isready -U healthcare_user

# View database logs
docker-compose logs postgres

# Verify database exists
docker-compose exec postgres psql -U healthcare_user -l
```

### API not responding
```bash
# Check backend health
curl http://localhost:3000/health

# View backend logs
docker-compose logs backend

# Check if backend container is running
docker-compose ps
```

### Frontend shows connection errors
```bash
# Verify API URL in frontend
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check CORS configuration
docker-compose logs backend | grep CORS

# Ensure backend is accessible
curl http://localhost:3000/api/info
```

### Services not starting
```bash
# Check Docker is running
docker info

# View all service status
docker-compose ps

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## 🚀 Development Mode (Hot Reload)

For active development with hot reload:

```bash
# Use development compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Frontend will be available on port 5173 (Vite dev server)
# Backend will auto-reload on code changes
```

Edit files in `backend/src/` or `frontend/src/` and changes will automatically reload.

## 🤝 Contributing

For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is part of a healthcare technology demonstration.

## 🆘 Support

For issues or questions:
- Check the [troubleshooting section](#-troubleshooting)
- Review documentation in the `docs/` folder
- Open an issue with detailed logs

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 6 (build tool)
- Tailwind CSS 3
- nginx (production serving)

### Backend
- Node.js 20 LTS + TypeScript
- Express 5
- Anthropic AI SDK (Claude 3.5 Sonnet)
- PostgreSQL client (pg)

### Database
- PostgreSQL 16 Alpine
- uuid-ossp extension
- Persistent volume storage

### Infrastructure
- Docker multi-stage builds
- Docker Compose orchestration
- Health checks and auto-restart
- Custom bridge network
