# Local Deployment Guide - Quick Start

## Prerequisites

You need these installed on your machine:

- **Docker Desktop** (includes Docker Compose)
  - Download: https://www.docker.com/products/docker-desktop/
  - Check: `docker --version` and `docker compose version`

- **Git** (to clone the repository)
  - Check: `git --version`

---

## 🚀 Quick Start (5 minutes)

### Step 1: Start the Application

Open terminal in your project directory and run:

```bash
# Start all services (database, backend, frontend)
docker compose up -d
```

**What happens:**
- PostgreSQL database starts on port `5432`
- Backend API starts on port `3000`
- Frontend web app starts on port `8080`

**Wait time:** 30-60 seconds for all services to be ready.

### Step 2: Check Services are Running

```bash
docker compose ps
```

**Expected output:**
```
NAME                     STATUS    PORTS
healthcare-postgres      Up        0.0.0.0:5432->5432/tcp
healthcare-backend       Up        0.0.0.0:3000->3000/tcp
healthcare-frontend      Up        0.0.0.0:8080->8080/tcp
```

### Step 3: Generate Patient Data

```bash
# Generate 1000 patients with realistic distribution
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

**Expected response:**
```json
{
  "status": "success",
  "message": "Realistic patient cohort generated successfully",
  "patients_created": 1000,
  "distribution": {
    "Non-CKD Low/Moderate Risk": 245,
    "Non-CKD High Risk": 400,
    "Mild CKD": 80,
    "Moderate CKD": 250,
    "Severe CKD": 20,
    "Kidney Failure": 5
  }
}
```

**Wait time:** 30-60 seconds

### Step 4: Open the Application

**Frontend:** http://localhost:8080

You should see:
- ✅ Filter panel with patient statistics
- ✅ Search bar
- ✅ List of 1000 patients

**Backend API:** http://localhost:3000/api/patients/statistics

---

## 🧪 Test the Filtering System

### Test 1: Verify Statistics

```bash
curl http://localhost:3000/api/patients/statistics
```

**Should return:**
```json
{
  "status": "success",
  "statistics": {
    "total_patients": 1000,
    "ckd": {
      "total": 355,
      "mild": { "total": 80, "treated": 64, "not_treated": 16 },
      "moderate": { "total": 250, "treated": 200, "not_treated": 50 },
      "severe": { "total": 20, "treated": 18, "not_treated": 2 },
      "kidney_failure": { "total": 5, "treated": 5, "not_treated": 0 }
    },
    "non_ckd": {
      "total": 645,
      "low": { "total": 245, "monitored": 0, "not_monitored": 245 },
      "high": { "total": 400, "monitored": 240, "not_monitored": 160 }
    }
  }
}
```

### Test 2: Filter Moderate CKD, Not Treated

```bash
curl "http://localhost:3000/api/patients/filter?has_ckd=true&severity=moderate&is_treated=false"
```

**Should return:** 50 patients

### Test 3: Filter High Risk Non-CKD, Not Monitored

```bash
curl "http://localhost:3000/api/patients/filter?has_ckd=false&risk_level=high&is_monitored=false"
```

**Should return:** 160 patients

---

## 🎯 Using the Frontend (http://localhost:8080)

### Example 1: Find Untreated Moderate CKD Patients

1. Open http://localhost:8080
2. Click **"CKD Patients (355)"**
3. Click **"Moderate CKD (250)"**
4. Click **"Not Treated (50)"**

**Result:** Shows 50 patients who need treatment initiation

### Example 2: Find High-Risk Non-CKD Patients Needing Monitoring

1. Click **"Non-CKD Patients (645)"**
2. Click **"High Risk (400)"**
3. Click **"Not Monitored (160)"**

**Result:** Shows 160 patients who should be monitored

### Example 3: Search Within Filtered Results

1. Apply any filter (e.g., Moderate CKD)
2. Type patient name in search bar
3. Results are filtered to both criteria

---

## 🛠️ Common Commands

### Start/Stop Services

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart all services
docker compose restart

# View logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend
```

### Database Operations

```bash
# Clear all patients
curl -X POST http://localhost:3000/api/init/clear-patients

# Generate patients (default: 1000)
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'

# Generate fewer patients (faster)
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 500}'
```

### Check Service Health

```bash
# Backend health
curl http://localhost:3000/health

# Check if backend is accessible
curl http://localhost:3000/api/patients

# Check statistics endpoint
curl http://localhost:3000/api/patients/statistics
```

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

**Error:**
```
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:3000 -> 0.0.0.0:0: listen tcp 0.0.0.0:3000: bind: address already in use
```

**Solution 1:** Stop the conflicting service
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 PID
```

**Solution 2:** Change the port in `docker-compose.yml`
```yaml
backend:
  ports:
    - "3001:3000"  # Use 3001 instead of 3000
```

Then update frontend environment:
```yaml
frontend:
  environment:
    VITE_API_URL: http://localhost:3001
```

### Issue: Services Not Starting

**Check logs:**
```bash
docker compose logs backend
docker compose logs postgres
```

**Common causes:**
- **Database not ready:** Wait 10-20 seconds, backend depends on postgres
- **Docker daemon not running:** Start Docker Desktop
- **Out of memory:** Increase Docker memory limit in Docker Desktop settings

**Solution:**
```bash
# Stop everything
docker compose down

# Remove volumes (fresh start)
docker compose down -v

# Start again
docker compose up -d
```

### Issue: Frontend Shows CORS Error

**Browser console shows:**
```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:8080' has been blocked by CORS
```

**Solution:** Check `docker-compose.yml` backend environment:
```yaml
backend:
  environment:
    CORS_ORIGIN: http://localhost:8080
```

Restart backend:
```bash
docker compose restart backend
```

### Issue: No Patients Showing

**Cause:** Database not populated

**Solution:**
```bash
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

### Issue: Filter Panel Not Showing

**Possible causes:**
1. Backend not accessible
2. Statistics endpoint failing
3. Frontend can't reach backend

**Debug steps:**
```bash
# 1. Check backend is running
docker compose ps backend

# 2. Check backend logs
docker compose logs backend

# 3. Test statistics endpoint
curl http://localhost:3000/api/patients/statistics

# 4. Check frontend logs
docker compose logs frontend
```

### Issue: "Connection Refused" Errors

**Cause:** Services not fully started yet

**Solution:** Wait 30-60 seconds after `docker compose up`, then try again

---

## 🔍 Advanced Operations

### Access Database Directly

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U healthcare_user -d healthcare_ai_db

# Inside psql, run queries:
# Count patients
SELECT COUNT(*) FROM patients;

# View CKD distribution
SELECT ckd_severity, COUNT(*) FROM ckd_patient_data GROUP BY ckd_severity;

# Exit psql
\q
```

### View Real-Time Logs

```bash
# All services
docker compose logs -f

# Just backend (useful for debugging)
docker compose logs -f backend

# Just database
docker compose logs -f postgres
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker compose up -d --build

# Force rebuild (no cache)
docker compose build --no-cache
docker compose up -d
```

### Clean Slate (Remove Everything)

```bash
# Stop services and remove volumes (deletes all data)
docker compose down -v

# Remove images (forces full rebuild next time)
docker compose down --rmi all -v

# Start fresh
docker compose up -d
```

---

## 📊 Performance on Local

Local deployment is **significantly faster** than Render free tier:

| Operation | Local | Render Free |
|-----------|-------|-------------|
| **Service start** | 10-20 seconds | 30-60 seconds |
| **Load patient list** | 0.1-0.3 seconds | 2-5 seconds |
| **Apply filter** | 0.05-0.15 seconds | 1-3 seconds |
| **Search** | <0.05 seconds | <1 second |
| **Load patient detail** | 0.1-0.2 seconds | 1-2 seconds |
| **Generate 1000 patients** | 20-40 seconds | 30-90 seconds |

---

## 🎬 Demo Preparation (Local)

### 1. Day Before Demo

```bash
# Start services
docker compose up -d

# Wait for services to be ready
sleep 30

# Populate database
curl -X POST http://localhost:3000/api/init/clear-patients
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'

# Verify
curl http://localhost:3000/api/patients/statistics
```

### 2. Morning of Demo

```bash
# Ensure services are running
docker compose ps

# If not running:
docker compose up -d

# Quick test
curl http://localhost:3000/api/patients/statistics
```

### 3. During Demo

**Have these URLs ready:**
- Frontend: http://localhost:8080
- API Statistics: http://localhost:3000/api/patients/statistics

**Demo Flow:**
1. Open frontend (already warm, loads instantly)
2. Show filter panel with statistics
3. Demonstrate filtering hierarchy
4. Show search within filtered results
5. Open patient detail view

**No warm-up needed** - local services are always ready!

---

## 🔐 Environment Variables (Already Configured)

These are set in `docker-compose.yml` and work out of the box:

**Backend:**
```yaml
environment:
  NODE_ENV: production
  PORT: 3000
  DATABASE_URL: postgresql://healthcare_user:healthcare_pass@postgres:5432/healthcare_ai_db
  CORS_ORIGIN: http://localhost:8080
  ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}  # Optional, for AI features
```

**Frontend:**
```yaml
environment:
  VITE_API_URL: http://localhost:3000
```

**To add Anthropic API key:**
1. Create `.env` file in project root
2. Add: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart: `docker compose restart backend`

---

## 📱 Accessing from Other Devices (Same Network)

Want to show the demo on another device (phone, tablet)?

### 1. Find Your Local IP

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Look for IPv4 Address (e.g., `192.168.1.100`)

### 2. Update CORS in docker-compose.yml

```yaml
backend:
  environment:
    CORS_ORIGIN: http://192.168.1.100:8080,http://localhost:8080
```

### 3. Restart Backend

```bash
docker compose restart backend
```

### 4. Access from Other Device

Open in browser: `http://192.168.1.100:8080`

---

## 🚀 Quick Reference

### One-Line Start

```bash
docker compose up -d && sleep 30 && curl -X POST http://localhost:3000/api/init/populate-realistic-cohort -H "Content-Type: application/json" -d '{"patient_count": 1000}'
```

This command:
1. Starts all services
2. Waits 30 seconds
3. Populates database with 1000 patients

### Essential URLs

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000
- **API Statistics:** http://localhost:3000/api/patients/statistics
- **Health Check:** http://localhost:3000/health

### Most Used Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker compose logs -f

# Restart
docker compose restart

# Clean slate
docker compose down -v && docker compose up -d
```

---

## ✅ Success Checklist

You're ready when:

- [ ] `docker compose ps` shows all 3 services as "Up"
- [ ] http://localhost:8080 loads the frontend
- [ ] http://localhost:3000/api/patients/statistics returns data
- [ ] Filter panel shows patient statistics (1000 total)
- [ ] Clicking filters updates patient list
- [ ] Search bar works
- [ ] Patient detail view loads when clicking a patient
- [ ] No errors in browser console (F12 → Console)

---

## 🆚 Local vs Render Comparison

| Feature | Local | Render |
|---------|-------|--------|
| **Setup time** | 5 minutes | 15-30 minutes |
| **Performance** | Very fast | Slower (free tier) |
| **Cost** | Free | Free tier available |
| **Internet required** | No | Yes |
| **Sleep after inactivity** | No | Yes (15 min) |
| **Best for** | Development, demos | Production, sharing |
| **Database persistence** | Volume (survives restarts) | Managed database |
| **SSL/HTTPS** | No (local only) | Yes (automatic) |

**Recommendation:** Use **local** for development and demos, **Render** for production deployment.

---

## 📞 Getting Help

### Check Service Status

```bash
docker compose ps
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f frontend
```

### Test Endpoints

```bash
# Backend health
curl http://localhost:3000/health

# Statistics
curl http://localhost:3000/api/patients/statistics

# All patients
curl http://localhost:3000/api/patients

# Filtered patients
curl "http://localhost:3000/api/patients/filter?has_ckd=true"
```

### Common Log Messages

**Good signs:**
```
✓ Database populated with 1000 patients
Server listening on port 3000
Database connected successfully
```

**Problems:**
```
Error: connect ECONNREFUSED (database not ready)
Error: Port 3000 is already in use
CORS error: Origin not allowed
```

---

**Next Steps:**
1. Run `docker compose up -d`
2. Wait 30 seconds
3. Open http://localhost:8080
4. Enjoy your locally-running Healthcare AI system! 🎉
