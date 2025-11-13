# Doctor Assistant Agent - Feature Documentation

## Overview

The **Doctor Assistant Agent** is an AI-powered clinical decision support system that helps primary care doctors manage their patients more effectively. It provides real-time patient monitoring, intelligent alerts, and a conversational interface for clinical questions.

## Key Features

### 1. **AI Chat Interface**
- **Context-Aware Responses**: When viewing a patient, the agent has full access to their medical history, lab results, risk assessments, and comorbidities
- **General Clinical Questions**: Ask questions about KDIGO guidelines, CKD management, or treatment recommendations
- **Natural Language**: Communicate in plain English - the AI understands medical terminology and context

### 2. **Real-Time Patient Monitoring**
- **Automatic Change Detection**: The system monitors all patient data changes in real-time using PostgreSQL LISTEN/NOTIFY
- **AI-Powered Analysis**: When significant changes occur, Claude AI analyzes the impact and generates intelligent alerts
- **Risk-Based Prioritization**: Alerts are automatically categorized as CRITICAL, HIGH, or MODERATE priority

### 3. **Smart Notifications**
- **Proactive Alerts**: Get notified about:
  - Critical lab values requiring immediate action
  - Significant changes in kidney function (eGFR decline)
  - Untreated high-risk conditions
  - Missing recommended treatments (e.g., SGLT2i for eligible patients)
  - Overdue nephrology referrals
- **Notification Center**: View all pending alerts with patient context
- **One-Click Context**: Click a notification to automatically load patient context into the chat

## Architecture

### Backend Components

#### 1. **Doctor Agent Service** (`/backend/src/services/doctorAgent.ts`)
Main AI service powered by Claude 3.5 Sonnet:
- Handles chat conversations with clinical context
- Analyzes patient data for alerts
- Generates clinical recommendations
- Summarizes patient status changes

**Key Methods:**
```typescript
chat(messages, context?)              // Main chat endpoint
analyzePatientForAlerts(patientId)    // Proactive alert analysis
summarizePatientChanges(patientId)    // Change summaries
```

#### 2. **Patient Monitor Service** (`/backend/src/services/patientMonitor.ts`)
Real-time monitoring system:
- Listens to PostgreSQL notifications via LISTEN/NOTIFY
- Detects significant patient data changes
- Triggers AI analysis for critical changes
- Creates doctor notifications in the database

**Key Methods:**
```typescript
startMonitoring()                     // Start real-time monitoring
handlePatientChange(event)            // Process change events
createAlert(event)                    // Generate notifications
```

#### 3. **API Routes**

**Agent Routes** (`/api/agent/*`)
- `POST /api/agent/chat` - Main chat endpoint
- `POST /api/agent/analyze-patient/:patientId` - Analyze specific patient
- `POST /api/agent/quick-question` - Quick clinical questions
- `GET /api/agent/health` - Check agent service status

**Notification Routes** (`/api/notifications/*`)
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread` - Get unread notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/:id/acknowledge` - Acknowledge notification
- `GET /api/notifications/stats` - Get notification statistics
- `GET /api/notifications/monitor/status` - Monitor service status

### Frontend Components

#### **DoctorChatBar** (`/frontend/src/components/DoctorChatBar.tsx`)
Floating chat interface with:
- Expandable chat window
- Notification badge showing unread count
- Patient context awareness (when viewing a patient)
- Message history
- Loading states and error handling

## Setup Instructions

### 1. **Prerequisites**
- Docker and Docker Compose installed
- Anthropic API key (get from https://console.anthropic.com)

### 2. **Environment Configuration**

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 3. **Start the Services**

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs if needed
docker-compose logs -f backend
```

### 4. **Initialize Database**

The database will be automatically initialized on first startup. If you need to add sample patients:

```bash
# Access the backend container
docker-compose exec backend sh

# Or use the init API endpoint
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort
```

### 5. **Access the Application**

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Agent Health**: http://localhost:3000/api/agent/health

## Usage Guide

### For Doctors Using the Chat Interface

1. **Open the Chat**
   - Click the blue chat button in the bottom-right corner
   - The notification badge shows unread alerts

2. **Ask General Questions**
   ```
   "What are the current KDIGO guidelines for CKD management?"
   "When should I refer a patient to nephrology?"
   "What's the recommended blood pressure target for patients with high albuminuria?"
   ```

3. **Ask Patient-Specific Questions**
   - First, select a patient from the patient list
   - The agent will automatically include their context
   ```
   "What's this patient's current risk level?"
   "Should I start this patient on an SGLT2 inhibitor?"
   "What are the most recent lab trends?"
   ```

4. **View Notifications**
   - Click the bell icon in the chat header
   - Notifications are color-coded by priority:
     - **Red**: CRITICAL
     - **Orange**: HIGH
     - **Yellow**: MODERATE
   - Click a notification to get more details in the chat

### For Developers

#### Testing the Chat API

```bash
# Test general question
curl -X POST http://localhost:3000/api/agent/quick-question \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the KDIGO risk categories?"}'

# Test chat with patient context
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is this patient'\''s current status?"}
    ],
    "patientId": "patient-uuid-here",
    "includeRecentLabs": true,
    "includeRiskAssessment": true
  }'
```

#### Testing Notifications

```bash
# Get unread notifications
curl http://localhost:3000/api/notifications/unread

# Get notification stats
curl http://localhost:3000/api/notifications/stats

# Check monitor status
curl http://localhost:3000/api/notifications/monitor/status
```

#### Monitoring Database Events

The patient monitor listens to PostgreSQL notifications. You can test this:

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db

# Send a test notification
NOTIFY patient_data_updated, '{"patient_id": "some-uuid", "change_type": "risk_level_change", "old_risk_level": "MODERATE", "new_risk_level": "HIGH", "timestamp": "2024-01-15T10:00:00Z"}';
```

## Clinical Context Provided to AI

When chatting about a patient, the AI receives:

### Patient Demographics
- Name, MRN, Age, Gender
- Weight, Height, BMI
- Smoking status

### Comorbidities
- Diabetes status
- Hypertension
- Heart failure
- Coronary artery disease
- CVD history
- Family history of ESRD

### Current Medications
- RAS inhibitor status
- SGLT2 inhibitor status
- Nephrotoxic medications

### Recent Lab Results (last 20)
- eGFR
- Serum creatinine
- Urine albumin-to-creatinine ratio (uACR)
- HbA1c
- Blood pressure
- Electrolytes
- Hemoglobin
- And more...

### Risk Assessment
- KDIGO category
- CKD stage
- Risk level (LOW/MODERATE/HIGH/CRITICAL)
- Risk score
- Clinical recommendations

### Active Conditions
- All active diagnoses with severity and onset dates

## Alert Triggers

The monitoring system creates alerts for:

1. **Risk Level Changes**
   - Any change in KDIGO risk category
   - Escalation from LOW → MODERATE → HIGH → CRITICAL

2. **Critical Lab Values**
   - eGFR < 15 (kidney failure)
   - Severe hyperkalemia or hypercalcemia
   - Critically low hemoglobin

3. **Treatment Gaps**
   - Eligible patients not on SGLT2i
   - High albuminuria without RAS inhibitor
   - Nephrology referral needed but not completed

4. **Monitoring Issues**
   - Overdue appointments
   - Missing required lab work
   - Adherence problems

## Technical Details

### AI Model
- **Model**: Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- **Max Tokens**: 4096 for chat, 1024 for analysis, 512 for summaries
- **Temperature**: Default (balanced)

### Database Tables

**doctor_notifications**
- Stores all alert notifications
- Status tracking: pending → sent → delivered → read → acknowledged
- Priority levels: CRITICAL, HIGH, MODERATE
- JSONB field for alert metadata

**patient_risk_history**
- Audit trail of all risk assessments
- Tracks state changes and escalations
- Used for trend analysis

### Real-Time Architecture

The system uses PostgreSQL's LISTEN/NOTIFY mechanism:

1. Database triggers detect patient data changes
2. Triggers emit NOTIFY events on `patient_data_updated` channel
3. Patient Monitor service listens to this channel
4. When events are received, AI analysis is triggered
5. Notifications are created and stored in the database
6. Frontend polls for new notifications every 30 seconds

## Security Considerations

### Current Implementation
⚠️ **Note**: This is a hackathon/demo implementation

**Missing Features:**
- No authentication system
- No role-based access control
- No audit logging
- No data encryption at rest

**For Production Use, Add:**
1. User authentication (JWT or session-based)
2. Role-based access control (doctors, nurses, admins)
3. Audit logging for all AI interactions
4. HIPAA-compliant data handling
5. Encryption at rest and in transit
6. Rate limiting on API endpoints
7. Input validation and sanitization

### API Key Management
- Store `ANTHROPIC_API_KEY` in `.env` file (never commit to git)
- Use different keys for dev/staging/production
- Rotate keys regularly
- Monitor API usage and costs

## Troubleshooting

### Chat not responding
```bash
# Check if agent service has API key
docker-compose exec backend env | grep ANTHROPIC_API_KEY

# Check agent health
curl http://localhost:3000/api/agent/health

# Check backend logs
docker-compose logs backend | grep -i agent
```

### No notifications appearing
```bash
# Check monitor status
curl http://localhost:3000/api/notifications/monitor/status

# Should show: {"isMonitoring": true}

# Check backend logs for monitoring
docker-compose logs backend | grep -i monitor
```

### Database connection issues
```bash
# Check database is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db -c "SELECT NOW();"
```

## Future Enhancements

Potential improvements for production:

1. **WebSocket Support**
   - Real-time notification push (instead of polling)
   - Live chat synchronization across devices

2. **Enhanced AI Features**
   - Multi-turn conversations with memory
   - Automatic literature citation
   - Drug interaction checking
   - Clinical decision trees

3. **Advanced Analytics**
   - Population health insights
   - Trend analysis and predictions
   - Cohort-based recommendations

4. **Integration Capabilities**
   - EHR integration (HL7 FHIR)
   - Lab system interfaces
   - Prescription management
   - Appointment scheduling

5. **Mobile App**
   - Native iOS/Android apps
   - Push notifications
   - Offline support

## Cost Estimation

Based on Anthropic's pricing (as of 2024):
- Claude 3.5 Sonnet: $3/MTok input, $15/MTok output

**Typical Usage:**
- Chat message: ~500 input tokens, ~200 output tokens ≈ $0.004
- Patient analysis: ~2000 input tokens, ~400 output tokens ≈ $0.012
- Daily usage (50 interactions): ~$0.20-0.40/day

**Monthly estimate for small practice (10 doctors):**
- ~$60-120/month for AI costs

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Check API health endpoints
4. Review this documentation

## License

This is a hackathon project for demonstration purposes. Consult with legal and compliance teams before using in production healthcare settings.

---

**Built with:**
- Claude 3.5 Sonnet (Anthropic)
- PostgreSQL 16
- Node.js + Express
- React + TypeScript
- Docker
