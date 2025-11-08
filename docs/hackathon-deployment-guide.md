# Hackathon Deployment Guide - Healthcare AI Clinical Data Analyzer

**Purpose**: Quick deployment guide for showcasing the app at a hackathon

**Last Updated**: 2025-11-08

---

## Table of Contents

1. [Hackathon Demo Scope](#hackathon-demo-scope)
2. [Prerequisites](#prerequisites)
3. [Option 1: Local Deployment (Recommended for Hackathon)](#option-1-local-deployment-recommended)
4. [Option 2: Cloud Deployment](#option-2-cloud-deployment)
5. [Mock Data Setup](#mock-data-setup)
6. [Demo Script](#demo-script)
7. [Troubleshooting](#troubleshooting)

---

## Hackathon Demo Scope

### What to Demonstrate (MVP - User Story 1)

For a hackathon, focus on **US1: AI Risk Assessment During Patient Consultation**

**Core Demo Flow** (2-3 minutes):
1. Show doctor viewing mock patient in "EHR" interface
2. Click "AI Risk Analysis" button
3. Display AI-generated risk assessment in <2 seconds:
   - Risk score (0.0-1.0) with color-coded indicator
   - Top 3 contributing factors (e.g., declining eGFR, elevated HbA1c)
   - Top 3 clinical recommendations
4. Show trend graphs (eGFR over time, HbA1c trends)
5. Demonstrate explainability (why this risk score?)

**What You DON'T Need for Hackathon**:
- ❌ Real EHR integration (use mock FHIR data)
- ❌ SMART on FHIR OAuth2 flow (simplified auth for demo)
- ❌ Population scanning (US2) - nice to have, not essential
- ❌ Automatic recalculation (US3)
- ❌ Country-specific integrations
- ❌ Production-grade security (demo mode)

**Simplified Tech Stack for Demo**:
- ✅ React SPA frontend (with Tailwind CSS)
- ✅ Express.js backend with mock FHIR endpoints
- ✅ PostgreSQL with seed data (5-10 mock patients)
- ✅ Claude 3.5 Sonnet or GPT-4 for AI analysis
- ✅ Docker Compose for easy setup
- ❌ Redis (not needed for demo - remove job queue)
- ❌ Apache Kafka (not needed for US1)
- ❌ Real SMART on FHIR (use mock auth)

---

## Prerequisites

### Required
- **Docker Desktop** installed (macOS/Windows) or Docker Engine (Linux)
- **Docker Compose** v2.20+
- **Git** installed
- **API Key**: Anthropic Claude API key OR OpenAI API key
  - Get Claude key: https://console.anthropic.com/
  - Get OpenAI key: https://platform.openai.com/api-keys

### Optional
- **Node.js 20 LTS** (if running without Docker)
- **PostgreSQL 14** (if running without Docker)

---

## Option 1: Local Deployment (Recommended)

**Best for**: Hackathon demos, quick local testing, development

**Advantages**:
- ✅ No cloud costs
- ✅ Works offline (after initial setup)
- ✅ Full control
- ✅ Fast iteration

### Step 1: Clone Repository

```bash
git clone https://github.com/danribes/hackathon_BI_CKD.git
cd hackathon_BI_CKD
```

### Step 2: Create Hackathon Demo Configuration

Create `.env` file in project root:

```bash
# .env (Hackathon Demo Configuration)

# Mode
NODE_ENV=demo
DEMO_MODE=true

# API Keys (Choose ONE)
ANTHROPIC_API_KEY=your_claude_api_key_here
# OR
OPENAI_API_KEY=your_openai_api_key_here

# Database (Docker will handle this)
DATABASE_URL=postgresql://healthcare_user:healthcare_pass@postgres:5432/healthcare_ai_db

# Backend
BACKEND_PORT=3000
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000
VITE_DEMO_MODE=true

# Mock FHIR Server (for demo - no real EHR)
MOCK_FHIR_ENABLED=true
FHIR_SERVER_URL=http://localhost:3000/fhir

# Security (Demo - relaxed for hackathon)
JWT_SECRET=demo_jwt_secret_for_hackathon_only
SESSION_SECRET=demo_session_secret_for_hackathon_only
CORS_ORIGIN=http://localhost:5173

# Audit Logging (simplified for demo)
AUDIT_RETENTION_DAYS=30
```

### Step 3: Create Docker Compose for Hackathon

Create `docker-compose.hackathon.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: healthcare-ai-postgres-demo
    environment:
      POSTGRES_DB: healthcare_ai_db
      POSTGRES_USER: healthcare_user
      POSTGRES_PASSWORD: healthcare_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init-demo.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U healthcare_user -d healthcare_ai_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: healthcare-ai-backend-demo
    environment:
      - NODE_ENV=demo
      - DATABASE_URL=postgresql://healthcare_user:healthcare_pass@postgres:5432/healthcare_ai_db
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MOCK_FHIR_ENABLED=true
      - DEMO_MODE=true
      - PORT=3000
    ports:
      - "3000:3000"
    volumes:
      - ./backend/src:/app/src
      - ./backend/package.json:/app/package.json
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: healthcare-ai-frontend-demo
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_DEMO_MODE=true
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - ./frontend/index.html:/app/index.html
    command: npm run dev

volumes:
  postgres_data:
    driver: local
```

### Step 4: Create Mock FHIR Data

Create `infrastructure/postgres/init-demo.sql`:

```sql
-- Healthcare AI Demo Database - Mock FHIR Data
-- Purpose: Seed data for hackathon demo

-- Create tables
CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_token VARCHAR(255) UNIQUE NOT NULL,
    patient_name VARCHAR(255), -- For demo only (GDPR: remove in production)
    age INTEGER,
    gender VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observations (
    observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    loinc_code VARCHAR(50) NOT NULL,
    value NUMERIC,
    unit VARCHAR(50),
    effective_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conditions (
    condition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    icd10_code VARCHAR(10) NOT NULL,
    condition_name VARCHAR(255),
    onset_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_token VARCHAR(255) NOT NULL,
    risk_model VARCHAR(50) NOT NULL,
    risk_score NUMERIC(3,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    calculated_at TIMESTAMP NOT NULL,
    triggered_by VARCHAR(50),
    ai_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    patient_token VARCHAR(255),
    action VARCHAR(100),
    result_code VARCHAR(50),
    ip_address VARCHAR(45)
);

-- Insert mock patients for demo
INSERT INTO patients (patient_token, patient_name, age, gender) VALUES
('demo_patient_001', 'John Doe', 67, 'male'),
('demo_patient_002', 'Maria Garcia', 58, 'female'),
('demo_patient_003', 'Erik Svensson', 72, 'male'),
('demo_patient_004', 'Anna Kowalski', 45, 'female'),
('demo_patient_005', 'Ahmed Hassan', 61, 'male');

-- Insert mock observations for Patient 001 (High-risk diabetes)
-- HbA1c (LOINC: 4548-4) - Elevated
INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '4548-4', 9.2, '%', CURRENT_TIMESTAMP - INTERVAL '1 month'
FROM patients WHERE patient_token = 'demo_patient_001';

-- eGFR (LOINC: 48643-7) - Declining kidney function
INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '48643-7', 42, 'mL/min/1.73m²', CURRENT_TIMESTAMP - INTERVAL '1 month'
FROM patients WHERE patient_token = 'demo_patient_001';

INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '48643-7', 55, 'mL/min/1.73m²', CURRENT_TIMESTAMP - INTERVAL '7 months'
FROM patients WHERE patient_token = 'demo_patient_001';

-- Blood Pressure (LOINC: 85354-9) - Hypertensive
INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '85354-9', 158, 'mmHg', CURRENT_TIMESTAMP - INTERVAL '2 weeks'
FROM patients WHERE patient_token = 'demo_patient_001';

-- Insert conditions for Patient 001
INSERT INTO conditions (patient_id, icd10_code, condition_name, onset_date)
SELECT patient_id, 'E11', 'Type 2 Diabetes Mellitus', '2015-03-15'
FROM patients WHERE patient_token = 'demo_patient_001';

INSERT INTO conditions (patient_id, icd10_code, condition_name, onset_date)
SELECT patient_id, 'I10', 'Essential Hypertension', '2018-06-20'
FROM patients WHERE patient_token = 'demo_patient_001';

-- Insert mock observations for Patient 002 (Moderate-risk)
INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '4548-4', 7.1, '%', CURRENT_TIMESTAMP - INTERVAL '2 months'
FROM patients WHERE patient_token = 'demo_patient_002';

INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '48643-7', 68, 'mL/min/1.73m²', CURRENT_TIMESTAMP - INTERVAL '1 month'
FROM patients WHERE patient_token = 'demo_patient_002';

INSERT INTO conditions (patient_id, icd10_code, condition_name, onset_date)
SELECT patient_id, 'E11', 'Type 2 Diabetes Mellitus', '2019-08-10'
FROM patients WHERE patient_token = 'demo_patient_002';

-- Insert mock observations for Patient 003 (High-risk CKD)
INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '48643-7', 28, 'mL/min/1.73m²', CURRENT_TIMESTAMP - INTERVAL '3 weeks'
FROM patients WHERE patient_token = 'demo_patient_003';

INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '9318-7', 450, 'mg/g', CURRENT_TIMESTAMP - INTERVAL '3 weeks'
FROM patients WHERE patient_token = 'demo_patient_003';

INSERT INTO conditions (patient_id, icd10_code, condition_name, onset_date)
SELECT patient_id, 'N18.4', 'Chronic Kidney Disease Stage 4', '2022-11-05'
FROM patients WHERE patient_token = 'demo_patient_003';

INSERT INTO conditions (patient_id, icd10_code, condition_name, onset_date)
SELECT patient_id, 'E11', 'Type 2 Diabetes Mellitus', '2012-02-18'
FROM patients WHERE patient_token = 'demo_patient_003';

-- Create indexes for performance
CREATE INDEX idx_observations_patient ON observations(patient_id);
CREATE INDEX idx_observations_loinc ON observations(loinc_code);
CREATE INDEX idx_conditions_patient ON conditions(patient_id);
CREATE INDEX idx_risk_patient_model ON risk_assessments(patient_token, risk_model);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO healthcare_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO healthcare_user;

-- Success message
SELECT 'Healthcare AI Demo Database initialized successfully with 5 mock patients' AS status;
```

### Step 5: Launch Demo

```bash
# Start all services
docker-compose -f docker-compose.hackathon.yml up --build

# Wait for services to start (30-60 seconds)
# Backend will be at: http://localhost:3000
# Frontend will be at: http://localhost:5173
```

### Step 6: Verify Demo

Open browser to `http://localhost:5173`

**Test the demo**:
1. You should see a patient list with 5 mock patients
2. Click on "John Doe" (demo_patient_001)
3. Click "AI Risk Analysis" button
4. See risk assessment appear in <2 seconds

### Step 7: Stop Demo

```bash
# Stop all services
docker-compose -f docker-compose.hackathon.yml down

# Stop and remove volumes (reset data)
docker-compose -f docker-compose.hackathon.yml down -v
```

---

## Option 2: Cloud Deployment

**Best for**: Public demos, remote judging, persistent URLs

### Option 2A: Railway (Recommended for Hackathon)

**Advantages**:
- ✅ Free tier: $5 credit/month
- ✅ PostgreSQL included
- ✅ Automatic HTTPS
- ✅ Easy GitHub integration
- ✅ Fast deployment

**Steps**:

1. **Sign up**: https://railway.app/ (use GitHub login)

2. **Create New Project** → "Deploy from GitHub repo"

3. **Add PostgreSQL**:
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway automatically creates database

4. **Deploy Backend**:
   - Click "+ New" → "GitHub Repo" → Select your repo
   - Root directory: `backend`
   - Add environment variables:
     ```
     NODE_ENV=production
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     ANTHROPIC_API_KEY=your_key
     PORT=3000
     DEMO_MODE=true
     MOCK_FHIR_ENABLED=true
     ```
   - Deploy triggers automatically

5. **Deploy Frontend**:
   - Click "+ New" → "GitHub Repo" → Select your repo
   - Root directory: `frontend`
   - Add environment variables:
     ```
     VITE_API_URL=https://your-backend.railway.app
     VITE_DEMO_MODE=true
     ```

6. **Generate Public URL**:
   - Click on frontend service → "Settings" → "Networking" → "Generate Domain"
   - Your app will be live at: `https://your-app.railway.app`

**Cost**: Free tier sufficient for hackathon (restarts after 500 hours/month)

### Option 2B: Render

**Advantages**:
- ✅ Free tier (persistent)
- ✅ PostgreSQL included
- ✅ No credit card required

**Steps**:

1. **Sign up**: https://render.com/ (GitHub login)

2. **Create PostgreSQL**:
   - Dashboard → "New" → "PostgreSQL"
   - Name: healthcare-ai-db
   - Free tier
   - Copy "Internal Database URL"

3. **Deploy Backend**:
   - "New" → "Web Service"
   - Connect GitHub repo
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment variables:
     ```
     NODE_ENV=production
     DATABASE_URL=<your_postgres_url>
     ANTHROPIC_API_KEY=<your_key>
     DEMO_MODE=true
     ```

4. **Deploy Frontend**:
   - "New" → "Static Site"
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Environment variables:
     ```
     VITE_API_URL=https://your-backend.onrender.com
     VITE_DEMO_MODE=true
     ```

**Cost**: Free (backend sleeps after 15 min inactivity, wakes on request)

### Option 2C: Vercel (Frontend) + Railway (Backend)

**Best for**: Fastest frontend, free PostgreSQL

1. **Backend on Railway** (see Option 2A steps 1-4)

2. **Frontend on Vercel**:
   - Sign up: https://vercel.com/
   - "New Project" → Import from GitHub
   - Framework preset: Vite
   - Root directory: `frontend`
   - Environment variables:
     ```
     VITE_API_URL=https://your-backend.railway.app
     VITE_DEMO_MODE=true
     ```
   - Deploy

**URL**: Your app live at `https://your-app.vercel.app`

---

## Mock Data Setup

### Customize Mock Patients

Edit `infrastructure/postgres/init-demo.sql`:

```sql
-- Add your own mock patient
INSERT INTO patients (patient_token, patient_name, age, gender) VALUES
('demo_patient_006', 'Custom Patient Name', 55, 'female');

-- Add observations
INSERT INTO observations (patient_id, loinc_code, value, unit, effective_date)
SELECT patient_id, '4548-4', 8.5, '%', CURRENT_TIMESTAMP - INTERVAL '1 month'
FROM patients WHERE patient_token = 'demo_patient_006';
```

### Common LOINC Codes for Demo

| Test | LOINC Code | Normal Range | Demo Values |
|------|------------|--------------|-------------|
| HbA1c | 4548-4 | <5.7% | 7.0-10.0% (diabetes) |
| eGFR | 48643-7 | >60 mL/min | 30-50 (CKD) |
| Blood Pressure (Systolic) | 85354-9 | <120 mmHg | 140-180 (hypertension) |
| uACR | 9318-7 | <30 mg/g | 50-500 (kidney damage) |
| LDL Cholesterol | 18262-6 | <100 mg/dL | 120-200 (CVD risk) |

---

## Demo Script

### 5-Minute Hackathon Presentation

**Slide 1: Problem (30 seconds)**
- "Primary care doctors see 25-30 patients daily"
- "Fragmented EHR data makes it hard to catch early warning signs"
- "Preventable complications (CKD, CVD) go undetected"

**Slide 2: Solution (30 seconds)**
- "AI-powered clinical decision support embedded in EHR"
- "Analyzes patient data in <2 seconds"
- "Provides actionable risk assessments and recommendations"
- "GDPR-compliant, FHIR-based, EU primary care focus"

**Slide 3: Live Demo (3 minutes)**

**Demo Flow**:
1. **Show patient list**: "Here's Dr. Svensson's patient panel" (5 mock patients)

2. **Select high-risk patient**: Click on "John Doe, 67, Male"
   - Show patient summary: "Type 2 diabetes, hypertension"

3. **Trigger AI analysis**: Click "AI Risk Analysis" button
   - **Narrate**: "Our AI analyzes all clinical data in real-time"

4. **Show results (appears in <2s)**:
   - **Risk Score**: 0.87 (HIGH RISK) - color-coded RED
   - **Contributing Factors**:
     - Declining eGFR: ↓ 24% in 6 months (weight: 0.4)
     - Elevated HbA1c: 9.2% (weight: 0.3)
     - No nephrology follow-up in 18 months (weight: 0.17)
   - **Recommendations**:
     1. Schedule nephrology consult (HIGH priority, 2 weeks)
     2. Order urine albumin/creatinine ratio (MEDIUM, 1 week)
     3. Review RAAS inhibitor dosage (MEDIUM, this visit)

5. **Show trend graph**: eGFR declining from 55 → 42 over 6 months

6. **Explain AI reasoning**: "Uses Claude 3.5 Sonnet with medical guideline prompts"

**Slide 4: Technical Highlights (1 minute)**
- React + TypeScript frontend (Tailwind CSS)
- Express.js + Node.js backend
- PostgreSQL database
- FHIR R4 standard for EHR integration
- Docker containerized for easy deployment
- SMART on FHIR for real EHR embedding (shown in architecture)

**Slide 5: Next Steps & Impact (30 seconds)**
- "Ready for pilot with 5-10 doctors in Sweden"
- "Can prevent 40% of dialysis cases through early CKD detection"
- "Scales to 500,000 EU primary care physicians"
- "CE marking pathway for medical device certification"

### Q&A Preparation

**Expected Questions**:

**Q: How do you ensure AI accuracy?**
A: "Multi-model fallback (Claude → GPT-4), rule-based validation, clinical guideline citations, and pilot validation study planned"

**Q: GDPR compliance?**
A: "Pseudonymization (SHA-256 hashing), 72-hour data retention, audit trails, Article 9(2)(h) legal basis for healthcare"

**Q: Integration with existing EHRs?**
A: "SMART on FHIR standard - works with Epic, Cerner, national systems. OAuth2 authentication, embedded iframe"

**Q: Why not use Next.js/SSR?**
A: "SMART on FHIR requires client-side OAuth2 in iframe. SSR breaks this flow due to server-side rendering incompatibility with EHR cookies and CSP headers"

**Q: Cost per analysis?**
A: "~$0.01-0.05 per patient with Claude API. Caching reduces costs. Local LLaMA option for air-gapped deployments"

---

## Troubleshooting

### Issue: Docker containers won't start

**Check Docker Desktop is running**:
```bash
docker ps
```

**Check logs**:
```bash
docker-compose -f docker-compose.hackathon.yml logs backend
docker-compose -f docker-compose.hackathon.yml logs postgres
```

**Common fix**: Remove old volumes and rebuild
```bash
docker-compose -f docker-compose.hackathon.yml down -v
docker-compose -f docker-compose.hackathon.yml up --build
```

### Issue: Frontend shows "Cannot connect to backend"

**Check backend is running**:
```bash
curl http://localhost:3000/health
```

**Check CORS**: Verify `CORS_ORIGIN` in `.env` matches frontend URL

**Check .env**: Ensure `VITE_API_URL=http://localhost:3000`

### Issue: AI analysis fails

**Check API key**:
```bash
# Test Anthropic
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```

**Verify**: Backend logs show API errors:
```bash
docker-compose -f docker-compose.hackathon.yml logs backend | grep -i "error"
```

### Issue: Database connection fails

**Check PostgreSQL is ready**:
```bash
docker-compose -f docker-compose.hackathon.yml exec postgres pg_isready -U healthcare_user
```

**Reset database**:
```bash
docker-compose -f docker-compose.hackathon.yml down -v
docker-compose -f docker-compose.hackathon.yml up -d postgres
# Wait 30 seconds
docker-compose -f docker-compose.hackathon.yml up backend frontend
```

### Issue: Port already in use

**Find process using port 3000/5173**:
```bash
# macOS/Linux
lsof -ti:3000
lsof -ti:5173

# Kill process
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Or change ports** in `docker-compose.hackathon.yml`:
```yaml
services:
  backend:
    ports:
      - "3001:3000"  # Changed from 3000
  frontend:
    ports:
      - "5174:5173"  # Changed from 5173
```

---

## Performance Tips for Demo

### Pre-warm the AI (Optional)

Before demo, run one analysis to cache the AI connection:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"patientToken":"demo_patient_001"}'
```

### Prepare Backup Slides

In case of technical issues:
1. **Screenshot of working app** (risk assessment displayed)
2. **Architecture diagram** (React → Express → PostgreSQL → Claude API)
3. **Code snippets** (AI prompt template, FHIR fetcher)

### Test on Venue WiFi (Day Before)

- Deploy to Railway/Render (persistent URL)
- Test on venue WiFi (may have firewall issues)
- Have local Docker backup ready

---

## Deployment Checklist

**Before Hackathon** (1-2 days before):
- [ ] Test local Docker deployment end-to-end
- [ ] Deploy to Railway/Render for cloud backup
- [ ] Test cloud deployment with mock patients
- [ ] Verify AI API key works (test one analysis)
- [ ] Create 3-5 demo patient scenarios (high/medium/low risk)
- [ ] Prepare demo script (practice 5-minute pitch)
- [ ] Take screenshots of working app (backup slides)
- [ ] Download all dependencies (in case of WiFi issues)
- [ ] Export Docker images (offline backup)

**At Hackathon Venue**:
- [ ] Test venue WiFi speed
- [ ] Decide: Cloud (if WiFi good) or Local Docker (if WiFi bad)
- [ ] Open app in browser, pre-load patient list
- [ ] Test one AI analysis (verify API key works on venue network)
- [ ] Have backup slides ready (screenshots of app)

**During Demo**:
- [ ] Start with problem statement (30s)
- [ ] Show live app (3 min - select patient, run AI, show results)
- [ ] Highlight technical stack (1 min)
- [ ] Mention impact/next steps (30s)
- [ ] Be ready for Q&A

---

**Good luck with your hackathon! 🚀**

For questions or issues, check:
- `docs/technical-decision-record.md` - Architecture rationale
- `tasks.md` - Implementation workflow
- `spec.md` - Feature specifications
