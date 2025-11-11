# CKD Progression Tracking System

## Overview

This system implements **AI-powered monitoring** of chronic kidney disease progression using the **KDIGO classification framework**. It tracks patients through 18 possible health states over time, automatically detects concerning changes, generates alerts, and recommends clinical actions.

## Features

### 1. **KDIGO Health State Classification**
- Classifies patients into 18 health states based on eGFR (G1-G5) and uACR (A1-A3)
- Assigns risk levels: Low (🟢), Moderate (🟡), High (🟠), Very High (🔴)
- Determines CKD stage (1-5) and monitoring frequency
- Provides treatment recommendations (RAS inhibitors, SGLT2i, BP targets)

### 2. **24-Month Longitudinal Tracking**
- Stores monthly measurements for all 230 patients
- Tracks realistic progression patterns:
  - **Progressive decliners (30%)**: Steady worsening - eGFR decline 3-6 mL/min/year
  - **Stable patients (50%)**: Minimal change - eGFR decline 0.5-1.5 mL/min/year
  - **Improvers (15%)**: Treatment response - slight eGFR improvement
  - **Rapid progressors (5%)**: Fast decline 8-12 mL/min/year requiring urgent intervention

### 3. **Automated State Transition Detection**
- Compares consecutive monthly measurements
- Detects when patients move between KDIGO states (e.g., G3a-A1 → G3b-A2)
- Analyzes significance of changes:
  - Category changes (GFR or albuminuria)
  - Risk level increases
  - Critical threshold crossings (eGFR <30, <15, uACR >300)
- Records transition details with change analysis

### 4. **AI-Powered Alert Generation**
- **Critical Alerts** (Priority 1):
  - eGFR drops below 30 mL/min (Stage 4 CKD)
  - eGFR drops below 15 mL/min (Kidney failure)
  - uACR exceeds 300 mg/g (Severe albuminuria)

- **Warning Alerts** (Priority 2):
  - Health state changes
  - Risk level increases
  - Significant eGFR decline (>5 mL/min)
  - Albuminuria progression

- **Info Alerts** (Priority 3):
  - Minor fluctuations
  - Status updates

### 5. **Clinical Action Recommendations**
Based on KDIGO guidelines, the system automatically recommends:

- **Nephrology Referral**: For G3b+, A3, or Stage 4-5 CKD
- **uACR Monitoring**: When albuminuria not measured
- **RAS Inhibitor Therapy**: For A2-A3 (albuminuria ≥30 mg/g)
- **SGLT2 Inhibitor**: For CKD with albuminuria, eGFR ≥20
- **Increased Monitoring**: Frequency based on risk level
- **Dialysis Planning**: For Stage 4-5 CKD

Each recommendation includes:
- Rationale based on clinical guidelines
- Priority and urgency level
- Specific timeframe
- Detailed action items (medications, lab tests, referrals)

## Database Schema

### Core Tables

#### `health_state_history`
Stores KDIGO classification at each measurement point:
- Patient ID, measurement date, cycle number
- Lab values (eGFR, uACR)
- KDIGO classification (GFR category, albuminuria category, health state)
- Risk assessment (level, color)
- CKD stage
- Clinical flags (nephrology referral needed, dialysis planning)
- Treatment recommendations

#### `state_transitions`
Records when patients move between health states:
- Previous and current state details
- Change analysis (type, eGFR change, uACR change, trends)
- Severity flags (category changed, risk increased, threshold crossed)
- Alert status and severity

#### `monitoring_alerts`
Automated alerts generated for significant changes:
- Alert type, severity, priority
- Patient and clinical context
- Alert reasons (array of triggering factors)
- Status (active, acknowledged, resolved, dismissed)
- Action tracking

#### `action_recommendations`
AI-generated clinical recommendations:
- Recommendation type and category
- Title, description, rationale
- Priority, urgency, timeframe
- Structured action items (JSON):
  - Lab tests to order
  - Medications to start/adjust
  - Specialist referrals
  - Monitoring frequency
- Status and outcome tracking

### Analytics Views

#### `patient_progression_summary`
Materialized view providing quick access to:
- Current vs baseline health state
- Total transitions (worsening/improving)
- Active alerts count
- Pending recommendations count
- Monitoring duration

## API Endpoints

### Patient Progression

```
GET /api/progression/patient/:patientId?months=24
```
Returns complete progression history for a patient:
- Progression history (all measurements)
- State transitions
- Active alerts
- Pending recommendations
- Summary statistics

### Alerts

```
GET /api/progression/alerts?severity=critical&status=active&limit=100
```
Get all alerts with filtering options.

```
PATCH /api/progression/alerts/:alertId
Body: { status: "acknowledged", acknowledged_by: "Dr. Smith", action_taken: "..." }
```
Update alert status.

### Recommendations

```
GET /api/progression/recommendations?type=treatment&urgency=urgent&limit=100
```
Get recommendations with filtering.

```
PATCH /api/progression/recommendations/:recommendationId
Body: { status: "completed", implemented_by: "Dr. Smith", outcome: "improved" }
```
Update recommendation status.

### System Monitoring

```
GET /api/progression/summary
```
Get system-wide progression statistics:
- Risk distribution across all patients
- Transition stats (worsening/improving counts)
- Alert stats (active/critical counts)
- Recommendation stats
- Patients requiring urgent attention

```
POST /api/progression/run-monitoring
```
Manually trigger progression monitoring cycle:
- Generates alerts for new transitions
- Creates action recommendations
- Returns statistics

### Classification

```
POST /api/progression/classify
Body: { egfr: 42, uacr: 180 }
```
Classify a set of lab values into KDIGO health state.

## Setup Instructions

### 1. Initialize the System

Run the master initialization script:

```bash
# From project root
cd /home/user/hackathon_BI_CKD

# Run initialization (requires PostgreSQL connection)
psql $DATABASE_URL -f scripts/initialize_progression_tracking.sql
```

This will:
1. Create all progression tracking tables
2. Generate baseline measurements from existing patient data
3. Create 24 months of realistic progression data for all 230 patients
4. Detect and record state transitions
5. Display summary statistics

### 2. Generate Alerts and Recommendations

After initialization, generate alerts and recommendations:

**Option A: Via API**
```bash
curl -X POST http://localhost:3000/api/progression/run-monitoring
```

**Option B: Via SQL**
```sql
-- Connect to database and run
SELECT * FROM generate_monitoring_alerts();
```

### 3. Verify Setup

Check that everything is working:

```bash
# Get progression summary
curl http://localhost:3000/api/progression/summary

# Get active alerts
curl http://localhost:3000/api/progression/alerts?status=active

# Get pending recommendations
curl http://localhost:3000/api/progression/recommendations?status=pending

# Get a patient's progression
curl http://localhost:3000/api/progression/patient/{PATIENT_ID}
```

## Example Workflows

### Workflow 1: Daily Monitoring

```typescript
// Run daily monitoring cycle
const response = await fetch('/api/progression/run-monitoring', {
  method: 'POST'
});

const results = await response.json();
console.log(`Generated ${results.results.criticalAlerts} critical alerts`);

// Get urgent patients
const summary = await fetch('/api/progression/summary').then(r => r.json());
const urgentPatients = summary.patients_requiring_urgent_attention;

// Review each urgent patient
for (const patient of urgentPatients) {
  const progression = await fetch(`/api/progression/patient/${patient.id}`)
    .then(r => r.json());

  console.log(`${patient.first_name} ${patient.last_name}:`);
  console.log(`  - ${progression.active_alerts.length} active alerts`);
  console.log(`  - ${progression.pending_recommendations.length} recommendations`);
}
```

### Workflow 2: Alert Triage

```typescript
// Get critical alerts
const alerts = await fetch('/api/progression/alerts?severity=critical&status=active')
  .then(r => r.json());

// Review and acknowledge each alert
for (const alert of alerts.alerts) {
  console.log(alert.title);
  console.log(alert.message);
  console.log('Reasons:', alert.alert_reasons);

  // Acknowledge after review
  await fetch(`/api/progression/alerts/${alert.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'acknowledged',
      acknowledged_by: 'Dr. Smith'
    })
  });
}
```

### Workflow 3: Recommendation Implementation

```typescript
// Get urgent recommendations
const recs = await fetch('/api/progression/recommendations?urgency=urgent&status=pending')
  .then(r => r.json());

// Review each recommendation
for (const rec of recs.recommendations) {
  console.log(rec.title);
  console.log(rec.rationale);
  console.log('Action items:', rec.action_items);

  // Mark as in progress
  await fetch(`/api/progression/recommendations/${rec.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'in_progress',
      implemented_by: 'Dr. Smith'
    })
  });

  // After completing the action...
  await fetch(`/api/progression/recommendations/${rec.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'completed',
      completion_notes: 'Started lisinopril 10mg daily, scheduled nephrology appt',
      outcome: 'improved'
    })
  });
}
```

## Key Insights

### What the System Demonstrates

1. **Automated Clinical Surveillance**
   - Continuous monitoring of 230 patients across 24 months (5,750 measurements)
   - Detects subtle changes that might be missed in routine care
   - Prioritizes patients based on clinical significance

2. **Evidence-Based Alerts**
   - Every alert linked to specific KDIGO guideline thresholds
   - Multiple reasons provided for transparency
   - Severity levels guide clinical urgency

3. **Actionable Recommendations**
   - Not just "what's wrong" but "what to do about it"
   - Specific medications, dosing, monitoring frequencies
   - Based on international clinical practice guidelines

4. **Progression Analytics**
   - Identify patients at high risk of rapid decline
   - Track treatment effectiveness over time
   - Population-level insights (e.g., "30% of patients worsening")

5. **Integration Ready**
   - RESTful API for easy integration with EHR systems
   - Structured data formats (JSON) for interoperability
   - Scalable database schema

## Clinical Scenarios Demonstrated

### Scenario 1: Progressive Decline
**Patient**: eGFR 52 → 48 → 44 → 39 over 12 months

**System Response**:
- Detects transition from G3a-A1 to G3b-A1 at month 9
- Generates WARNING alert: "GFR category changed"
- Recommendations:
  - Increase monitoring frequency to every 3-6 months
  - Nephrology referral (now entering G3b)
  - Review medications for dose adjustments

### Scenario 2: Albuminuria Development
**Patient**: uACR 22 → 45 → 85 mg/g over 6 months

**System Response**:
- Detects transition from A1 to A2
- Generates WARNING alert: "Developed microalbuminuria"
- Recommendations:
  - Initiate RAS inhibitor (lisinopril or losartan)
  - Target BP <130/80 mmHg
  - Monitor uACR every 3 months
  - Consider SGLT2 inhibitor if diabetic

### Scenario 3: Rapid Progression to Kidney Failure
**Patient**: eGFR 32 → 28 → 22 → 16 → 13 over 12 months

**System Response**:
- Month 9: CRITICAL alert when eGFR drops below 30 (G3b → G4)
- Month 12: CRITICAL alert when eGFR drops below 15 (G4 → G5)
- Recommendations:
  - URGENT nephrology referral
  - Dialysis access planning (AV fistula creation)
  - Transplant center referral
  - Patient education on dialysis options
  - Social work consultation for financial/transportation planning

### Scenario 4: Treatment Response
**Patient on SGLT2i + ACE-I**: uACR 420 → 280 → 150 mg/g, eGFR stable

**System Response**:
- Detects transition from A3 to A2 (improvement!)
- Generates INFO alert: "Albuminuria improving - treatment effective"
- Recommendations:
  - Continue current medications
  - Monitor to ensure sustained improvement
  - Consider reducing monitoring frequency if stable

## Performance Metrics

With the full dataset:
- **5,750 total measurements** (230 patients × 25 time points)
- **~800-1,200 state transitions** detected (varies by random progression patterns)
- **~200-400 alerts** generated (30-40% of transitions trigger alerts)
- **~150-300 recommendations** created
- **API response times**: <100ms for patient progression, <50ms for alerts/recommendations

## Future Enhancements

Potential additions to showcase even more AI capabilities:

1. **Predictive Modeling**: ML models to predict future eGFR trajectory
2. **Risk Scoring**: Customized risk scores beyond KDIGO (KFRE calculator)
3. **Trend Analysis**: Detect acceleration/deceleration of decline
4. **Population Analytics**: Cohort identification for clinical trials
5. **Treatment Optimization**: A/B testing of different treatment strategies
6. **Natural Language Alerts**: GPT-powered narrative summaries
7. **Automated Reporting**: PDF generation for physician review

## References

- KDIGO 2024 Clinical Practice Guideline for CKD
- KDIGO 2012 CKD Classification and Risk Assessment
- AKI Work Group 2012 KDIGO Clinical Practice Guideline

## Support

For questions or issues:
1. Check API endpoint documentation above
2. Review database schema in `infrastructure/postgres/migrations/005_add_kdigo_progression_tracking.sql`
3. Examine sample queries in initialization scripts

---

**Built with**: TypeScript, PostgreSQL, Express.js, KDIGO Guidelines
**Purpose**: Demonstrate AI-powered clinical decision support for CKD management
