# RENALGUARD AI - Intelligent Chronic Kidney Disease Management Platform (Local Deployment)

![RENALGUARD AI](https://img.shields.io/badge/AI-Powered-blue) ![Status](https://img.shields.io/badge/Deployment-Local-green) ![KDIGO](https://img.shields.io/badge/KDIGO-2024-orange)

## 🎯 What is RENALGUARD AI?

**RENALGUARD AI** is an advanced artificial intelligence-powered clinical decision support system designed specifically for primary care physicians to manage chronic kidney disease (CKD) patients. The platform combines real-time patient monitoring, evidence-based risk assessment, and AI-driven treatment recommendations to help doctors identify kidney disease early, track progression accurately, and optimize treatment strategies.

### The Problem We Solve

Chronic kidney disease affects **1 in 7 adults** globally, yet it often goes undiagnosed until advanced stages. Primary care physicians face multiple challenges:

- **Early Detection Gaps**: CKD is often asymptomatic until significant kidney damage occurs
- **Complex Risk Stratification**: Manual KDIGO classification is time-consuming and error-prone
- **Treatment Decision Burden**: Determining when to initiate RAS inhibitors, SGLT2 inhibitors, or refer to nephrology requires constant guideline consultation
- **Lab Result Overload**: Distinguishing clinically significant changes from normal variation is challenging
- **Transition Monitoring**: Tracking patients moving between non-CKD and CKD status requires special attention

### Our Solution

RENALGUARD AI acts as an **intelligent co-pilot** for primary care physicians, providing:

1. **Automated Risk Assessment**: Instant KDIGO classification, SCORED screening, and Framingham risk calculation
2. **AI Doctor Assistant**: Patient-specific treatment recommendations based on complete medical history
3. **Smart Alerting**: Only notifies doctors of clinically significant changes, reducing alert fatigue
4. **Proactive Monitoring**: Continuous background surveillance with priority-based notifications
5. **Evidence-Based Guidance**: All recommendations follow KDIGO 2024 clinical practice guidelines

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

## ✨ Core Features

### 🤖 AI Doctor Assistant - Your Intelligent Clinical Partner

The AI Doctor Assistant is embedded directly in each patient's detail card, providing instant access to evidence-based recommendations.

**Key Capabilities:**
- **Patient-Context-Aware Conversations**: Automatically knows the patient's complete medical history, lab trends, current medications, and risk classification
- **Treatment Guidance**: Answers questions like "Should I start an SGLT2 inhibitor?" or "When should I refer to nephrology?"
- **Clinical Guideline Integration**: Provides KDIGO 2024 recommendations tailored to each patient's specific situation
- **Automatic Retry Logic**: Handles API overload gracefully with exponential backoff (2s, 4s, 8s delays)
- **Multi-Modal Analysis**: Can discuss population-level statistics, individual patient trends, or general CKD management principles

**Sample Interactions:**
```
Doctor: "Should I start treating this patient?"

AI: Based on Roger Campbell's current status:
    - CKD Stage: 3a (Moderate)
    - eGFR: 52.3 ml/min/1.73m²
    - uACR: 45 mg/g (A2 - Moderately increased albuminuria)
    - Treatment Status: NOT ON TREATMENT
    - Comorbidities: Hypertension, Type 2 Diabetes

    KDIGO 2024 Recommendations:

    1. ✓ INITIATE RAS Inhibitor (ACE-I or ARB)
       Rationale: uACR >30 mg/g + diabetes/hypertension

    2. ✓ CONSIDER SGLT2 Inhibitor
       Rationale: eGFR >20, proven cardio-renal protection

    3. ✓ INITIATE Home Monitoring
       Recommend: Minuteful Kidney (eGFR + uACR every 3 months)

    4. Blood Pressure Target: <130/80 mmHg

    5. Follow-up: 3 months (monitor for acute eGFR decline)
```

### 📊 Advanced Patient Management System

**Comprehensive Patient Dashboard:**
- **1000 Mock Patients**: Realistic CKD population with diverse clinical scenarios
- **Real-Time KDIGO Classification**: Automatic calculation based on eGFR and uACR
- **CKD Stage Tracking**: Monitors patients from Stage 1 (mild) to Stage 5 (kidney failure)
- **Smart Filtering**: Filter by CKD status, severity, treatment status, monitoring status, and recent updates
- **Complete Patient Cards**: Every patient card displays CKD status, health state, treatment status, and monitoring status

**Patient Detail View Includes:**
- Demographics and medical history
- Latest lab results with trend visualization
- KDIGO risk classification breakdown
- Current medications and treatment status
- Home monitoring device status
- AI-generated health state evolution timeline
- Embedded Doctor Assistant chat
- Recommended actions and clinical summaries

### 🔬 Intelligent Lab Monitoring & Analysis

**Real-Time Continuous Monitoring:**
- Monitors **10 key biomarkers**: eGFR, uACR, serum creatinine, BUN, blood pressure, HbA1c, glucose, hemoglobin, heart rate, oxygen saturation
- **Background Processing**: Automatically analyzes every patient update without manual intervention
- **Clinical Significance Detection**: Only alerts on changes that matter clinically

**Smart Threshold-Based Alerting:**
- **eGFR**: Alerts on ≥1.5 ml/min change OR >2% variation
- **uACR**: Alerts on >10% change OR ≥10 mg/g absolute change
- **Blood Pressure**: Alerts on >10 mmHg change
- **HbA1c**: Alerts on ≥0.5% change
- **Creatinine**: Alerts on >0.3 mg/dL change

**Transition Detection:**
- Automatically identifies patients moving from non-CKD to CKD status (or vice versa)
- Preserves SCORED and Framingham risk data during transitions for comprehensive analysis
- Generates special transition-focused AI analysis explaining the clinical significance

### 💊 Treatment & Monitoring Tracking

**CKD Treatment Management:**
- Tracks RAS inhibitors (ACE inhibitors, ARBs)
- Tracks SGLT2 inhibitors (empagliflozin, dapagliflozin, etc.)
- Monitors mineralocorticoid receptor antagonists (MRAs)
- Records nephrotoxic medication exposure
- Flags treatment gaps for eligible patients

**Home Monitoring Integration:**
- Tracks Minuteful Kidney device usage
- Records monitoring frequency (monthly, quarterly, semi-annual)
- Monitors adherence to testing schedules
- Flags patients needing monitoring initiation

**AI-Powered Treatment Recommendations:**
- Suggests evidence-based treatments based on:
  - Current CKD stage and albuminuria level
  - Comorbidities (diabetes, hypertension, heart failure)
  - Treatment status (verifies if already on recommended medications)
  - Contraindications (checks eGFR thresholds)

### 📈 Health State Evolution & AI Analysis

**Automated AI Analysis for Every Update:**
- Comprehensive analysis triggered on every lab value update
- Clinical summary explaining changes and their significance
- Recommended actions prioritized by urgency
- Cycle tracking to monitor progression over time

**Intelligent Analysis Features:**
- **Lab Change Detection**: Calculates absolute and percentage changes for all biomarkers
- **Significance Evaluation**: Determines if changes warrant clinical attention
- **Transition Handling**: Special analysis for CKD status changes with risk data preservation
- **Treatment Verification**: AI checks current treatment status before making recommendations
- **Monitoring Verification**: AI confirms home monitoring status before suggesting initiation

**Health State Evolution Timeline:**
- Visual timeline of all patient updates
- Color-coded change types (worsening, improving, stable, initial)
- Severity indicators (critical, warning, routine)
- Expandable detailed analysis for each update
- Cycle numbers for tracking progression

### 📋 Clinical Decision Support Tools

**KDIGO 2024 Risk Classification:**
- **Automatic Calculation**: Based on eGFR and uACR values
- **eGFR Categories**: G1 (≥90), G2 (60-89), G3a (45-59), G3b (30-44), G4 (15-29), G5 (<15)
- **Albuminuria Categories**: A1 (<30), A2 (30-300), A3 (>300)
- **Risk Stratification**: Low, Moderately Increased, High, Very High
- **Color-Coded Visualization**: Green, yellow, orange, red based on risk level

**SCORED Risk Assessment (Non-CKD Patients):**
- Screens for Current/Hidden kidney disease in patients without diagnosed CKD
- **Point System**:
  - Age ≥70: +4 points
  - Male (age ≥50): +15% risk
  - Cardiovascular disease: +3 points
  - Proteinuria: +3 points
- **Risk Levels**:
  - Low (<20% chance of undetected CKD)
  - High (≥20% chance of undetected CKD)
- Recommends lab screening for high-risk patients

**Framingham Risk Calculator (Non-CKD Patients):**
- Predicts 10-year risk of developing CKD
- **Factors Considered**:
  - Age and gender
  - BMI (body mass index)
  - Diabetes mellitus
  - Hypertension
  - Cardiovascular disease
  - Family history of end-stage renal disease (ESRD)
- **Risk Categories**: Low (<10%), Moderate (10-20%), High (>20%)

## 🏗️ Technical Architecture

### Frontend Stack
- **React 19** - Latest UI framework with concurrent features
- **Vite 6** - Next-generation build tool with HMR
- **TypeScript 5.9** - Strict type safety
- **Tailwind CSS 3** - Utility-first CSS framework
- **nginx 1.25** - Production web server

### Backend Stack
- **Node.js 20 LTS** - Long-term support runtime
- **Express 5** - Fast, minimalist web framework
- **TypeScript 5.9** - End-to-end type safety
- **PostgreSQL 16** - Robust relational database
- **Docker** - Containerized deployment

### AI & Clinical Intelligence
- **Claude Sonnet 4.5** - State-of-the-art language model by Anthropic
- **Model Context Protocol (MCP)** - Clinical decision support tool integration
- **KDIGO 2024 Guidelines** - Latest evidence-based CKD management protocols
- **Exponential Backoff Retry Logic** - Ensures reliability during API overload

### Database Schema
- **Patients Table**: Demographics, medical history, comorbidities, medications
- **Observations Table**: Lab results with timestamps and month numbers
- **CKD Patient Data**: KDIGO classification, stage, severity, treatment status
- **Non-CKD Patient Data**: SCORED risk, Framingham risk, monitoring status
- **Health State Comments**: AI-generated analysis timeline
- **Conditions Table**: Active medical conditions with severity and onset dates

## 📁 Project Structure

```
hack_BI_local/
├── backend/                      # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts             # Server entry point
│   │   ├── api/routes/          # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── config/              # Configuration
│   │   └── types/               # TypeScript types
│   ├── Dockerfile               # Backend container
│   └── package.json
│
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx              # Main application
│   │   ├── components/          # React components
│   │   └── main.tsx             # Entry point
│   ├── Dockerfile               # Frontend container
│   ├── nginx.conf               # nginx configuration
│   └── package.json
│
├── infrastructure/
│   └── postgres/
│       └── init.sql             # Database schema
│
├── docker-compose.yml           # Service orchestration
├── .env.example                 # Environment template
└── README.md                    # This file
```

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
# Stop all services (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### Rebuild after code changes
```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d
```

### Database access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db

# Run queries
SELECT COUNT(*) FROM patients;
\dt  # List tables
\q   # Exit
```

### Development Mode (Hot Reload)
```bash
# Use development compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Frontend will be on port 5173 (Vite dev server)
# Backend will auto-reload on code changes
```

## 📚 API Documentation

### Patient Management Endpoints

#### List All Patients
```http
GET /api/patients
```
Returns all patients with KDIGO classification, latest lab results, and risk assessment.

#### Filter Patients
```http
GET /api/patients/filter?has_ckd=true&severity=Moderate&is_treated=false
```
Filter patients by CKD status, severity, treatment status, monitoring status, and more.

**Query Parameters:**
- `has_ckd`: true | false
- `severity`: Mild | Moderate | Severe | Advanced | Kidney Failure
- `ckd_stage`: 1 | 2 | 3 | 4 | 5
- `risk_level`: low | moderate | high | very_high
- `is_monitored`: true | false
- `is_treated`: true | false

#### Get Patient Detail
```http
GET /api/patients/:id
```
Returns comprehensive patient information including full medical history, lab trends, and AI analysis.

#### Update Patient Records
```http
POST /api/patients/:id/update-records
```
Simulates new lab results, triggers AI analysis, and generates health state evolution comment.

### Doctor Assistant Endpoints

#### Chat with AI
```http
POST /api/agent/chat
```
Interact with the AI Doctor Assistant with full patient context.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Should I start treatment for this patient?"
    }
  ],
  "patientId": "uuid",
  "includeRecentLabs": true,
  "includeRiskAssessment": true
}
```

#### Analyze Patient
```http
POST /api/agent/analyze-patient/:id
```
Generates proactive alerts for a specific patient.

### Database Initialization

#### Populate Database
```http
POST /api/init/populate-realistic-cohort
```
Populates database with realistic CKD patients.

**Request Body:**
```json
{
  "patient_count": 1000
}
```

#### Get Statistics
```http
GET /api/patients/statistics
```
Returns dashboard statistics (total patients, CKD patients, high-risk patients, etc.).

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

### Doctor Assistant Returns Error
```bash
# Check backend logs for retry attempts
docker-compose logs backend | grep "DoctorAgent"

# Verify API key is set
docker-compose exec backend env | grep ANTHROPIC_API_KEY
```

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

## 💡 How to Use RENALGUARD AI

### For Primary Care Physicians

#### Daily Workflow

**Morning Routine:**
1. Access application at http://localhost:8080
2. Review patient list for any recent updates
3. Use filters to find patients needing attention

**Patient Review:**
1. Click on patient card to view detailed information
2. Review latest lab results and trends
3. Check KDIGO risk classification
4. Use AI Doctor Assistant for treatment guidance

**Treatment Decisions:**
1. Ask AI specific questions about treatment options
2. Review AI-generated clinical summaries
3. Make informed decisions based on KDIGO 2024 guidelines

#### Common Use Cases

**Scenario 1: New CKD Diagnosis**
```
1. Filter patients: "Non-CKD, High Risk"
2. Review patients with elevated SCORED scores
3. Ask AI: "This patient has a SCORED score of 5. Should I order labs?"
4. Order labs → Patient transitions to CKD
5. Review AI transition analysis
```

**Scenario 2: CKD Progression Monitoring**
```
1. Notice patient with eGFR decline
2. Review Health State Evolution timeline
3. Ask AI: "Should I refer to nephrology?"
4. AI analyzes stage, decline rate, current treatment
5. Make decision based on AI recommendations
```

**Scenario 3: Treatment Optimization**
```
1. Filter patients: "CKD, Moderate, Not on SGLT2i"
2. Identify eligible patients
3. Ask AI: "Should I add empagliflozin?"
4. AI confirms eligibility and provides dosing
```

## 📄 License & Disclaimer

### License

This project is for **educational and demonstration purposes only**.

For production medical use, you must:
- Consult with legal counsel regarding medical device regulations
- Ensure HIPAA compliance for patient data handling
- Obtain appropriate liability insurance
- Conduct clinical validation studies

### Disclaimer

**RENALGUARD AI is a clinical decision support tool and should not replace professional medical judgment.**

- All AI recommendations must be reviewed by licensed physicians
- System outputs are based on available data and may not reflect all clinical factors
- Doctors are responsible for final treatment decisions
- This software is provided "as is" without warranty of any kind

## 🤝 Contributing

We welcome contributions from the clinical and developer communities!

### How to Contribute

1. Fork the Repository
2. Create Feature Branch: `git checkout -b feature/your-feature`
3. Make Changes (follow TypeScript strict mode)
4. Commit: `git commit -m "Add: Feature description"`
5. Push and Create Pull Request

### Development Guidelines

**Code Style:**
- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Keep functions small and focused

**Testing:**
- Test all new API endpoints
- Verify database migrations work correctly
- Check edge cases

## 📞 Contact & Support

### Getting Help

**Documentation:**
- Read this README thoroughly
- Check troubleshooting section

**Technical Support:**
- GitHub Issues: Report bugs or request features

**Clinical Questions:**
- Consult KDIGO 2024 guidelines: https://kdigo.org
- Review AI recommendations with clinical judgment

---

## 🌟 Why RENALGUARD AI?

### The Impact

**For Doctors:**
- Reduce time spent on manual risk calculations by 80%
- Identify high-risk patients earlier with automated screening
- Access evidence-based treatment recommendations instantly
- Minimize alert fatigue with smart significance detection

**For Patients:**
- Earlier CKD detection and intervention
- Personalized treatment plans based on latest guidelines
- Better monitoring of kidney function trends
- Reduced risk of progression to end-stage renal disease

**For Healthcare Systems:**
- Standardize CKD care across primary care practices
- Reduce unnecessary nephrology referrals
- Lower costs through earlier intervention
- Improve population health outcomes

### The Vision

RENALGUARD AI aims to **democratize access to nephrology expertise** by bringing advanced CKD management tools to every primary care practice. By combining artificial intelligence with evidence-based clinical guidelines, we empower doctors to provide world-class kidney care regardless of location or resources.

**Together, we can prevent kidney disease progression and improve lives.**

---

**RENALGUARD AI** - *Guarding Kidney Health with Artificial Intelligence*

Built with ❤️ using Claude AI, React, TypeScript, and PostgreSQL

*Local Deployment Version | Last Updated: November 2025*
