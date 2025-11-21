# RENALGUARD AI - Quick Start Guide

**AI-Powered Chronic Kidney Disease Management Platform**

## Prerequisites

✅ **Docker Desktop** (v20.10+) - [Download here](https://www.docker.com/products/docker-desktop)
🔑 **Anthropic API Key** (optional) - [Get one here](https://console.anthropic.com)

> **Note**: The application works without an API key! AI features will be disabled but all core functionality remains operational.

---

## 5-Minute Deployment

### 1️⃣ Clone & Navigate
```bash
git clone https://github.com/danribes/hack_BI_local.git
cd hack_BI_local
```

### 2️⃣ Configure (Optional - For AI Features)
```bash
# Copy environment template
cp .env.example .env

# Edit and add your API key
nano .env
# Update line: ANTHROPIC_API_KEY=your-actual-api-key-here
```

**Skip this step entirely if you don't have an API key!**

### 3️⃣ Start Services
```bash
docker-compose up -d
```

**What happens:**
- PostgreSQL database initializes (30-60 seconds)
- Database schema created automatically
- 1001 sample CKD patients loaded
- Backend API starts on port 3000
- Frontend builds and serves on port 8080

**Startup time:** 3-5 minutes first time, 10-20 seconds after

### 4️⃣ Verify Deployment
```bash
# Check service status
docker-compose ps

# Test backend health
curl http://localhost:3000/health

# Test frontend access
curl -I http://localhost:8080
```

**Expected output:**
```
NAME                  STATUS              PORTS
healthcare-backend    Up (healthy)        0.0.0.0:3000->3000/tcp
healthcare-frontend   Up (healthy)        0.0.0.0:8080->8080/tcp
healthcare-postgres   Up (healthy)        0.0.0.0:5433->5432/tcp
```

### 5️⃣ Access Application

🌐 **Frontend**: http://localhost:8080
🔌 **Backend API**: http://localhost:3000
🗄️ **Database**: localhost:5433
- Username: `healthcare_user`
- Password: `healthcare_pass`
- Database: `healthcare_ai_db`

---

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
# Stop (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Access Database
```bash
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db
```

### Generate More Patient Data
```bash
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

---

## Quick Troubleshooting

### Port Conflicts
Modify ports in `docker-compose.yml` if 3000, 5433, or 8080 are in use.

### Services Not Starting
```bash
docker info                    # Check Docker is running
docker-compose down            # Stop all services
docker-compose up -d --build   # Rebuild and restart
```

### Database Connection Issues
```bash
docker-compose exec postgres pg_isready -U healthcare_user
docker-compose logs postgres
```

### API Not Responding
```bash
curl http://localhost:3000/health
docker-compose logs backend
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS |
| **Backend** | Node.js 20 + Express + TypeScript |
| **Database** | PostgreSQL 16 |
| **AI Engine** | Claude Sonnet 4.5 (Anthropic) |
| **Deployment** | Docker + Docker Compose |

---

## System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB for images and data
- **CPU**: 2 cores minimum
- **OS**: Linux, macOS, or Windows with Docker Desktop

---

## Key Features

✨ **AI Doctor Assistant** - Patient-specific treatment recommendations
📊 **Automated KDIGO Classification** - Real-time CKD risk assessment
🔬 **Smart Lab Monitoring** - Alerts only on clinically significant changes
💊 **Treatment Tracking** - RAS inhibitors, SGLT2i, MRAs
📈 **Health State Evolution** - Visual timeline of patient progression
🎯 **Risk Screening** - SCORED and Framingham risk calculators

---

## Next Steps

1. **Explore Sample Patients**: Open http://localhost:8080 and browse the patient dashboard
2. **Test AI Assistant**: Click any patient card and chat with the AI Doctor
3. **Review Documentation**: See `README.md` for comprehensive guide
4. **Check API Endpoints**: Visit http://localhost:3000/api/patients

---

## Getting Help

📖 **Full Documentation**: `README.md`
🐛 **Issues**: Report on GitHub
📚 **KDIGO Guidelines**: https://kdigo.org

---

**RENALGUARD AI** - *Guarding Kidney Health with Artificial Intelligence*

Built with ❤️ using Claude AI, React, TypeScript, and PostgreSQL
