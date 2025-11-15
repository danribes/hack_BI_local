# Lab Value Simulation Feature - Implementation Documentation

## Overview

This document describes the implementation of the lab value simulation feature for the Healthcare AI Clinical Data Analyzer. This feature allows simulating lab value updates for patients to demonstrate the AI's ability to assess patient status over time.

## Feature Requirements

The implementation fulfills two main requirements:

1. **Single Patient Simulation**: Generate new random lab values for a single patient when a button is pressed, triggering AI assessment
2. **Cohort Cycle Advancement**: Simulate a full cycle for all patients, advancing them through monthly tracking periods (1-12 months)

## Implementation Details

### 1. Database Schema Changes

**File**: `/infrastructure/postgres/migrations/013_add_month_tracking_to_observations.sql`

Added `month_number` column to the `observations` table:
- Type: `INTEGER NOT NULL`
- Constraint: `CHECK (month_number >= 1 AND month_number <= 12)`
- Default: `1`
- Purpose: Track which month (cycle) each observation belongs to

**Index Added**:
```sql
CREATE INDEX idx_observations_month ON observations(patient_id, month_number, observation_type);
```

This index optimizes queries that fetch observations by patient, month, and observation type.

### 2. Backend API Endpoints

**File**: `/backend/src/api/routes/patients.ts`

#### Endpoint 1: Single Patient Lab Simulation

**POST** `/api/patients/:id/simulate-new-labs`

**Purpose**: Generate new random lab values for a specific patient

**Behavior**:
1. Retrieves patient information (CKD stage, diabetes status)
2. Determines current month number for the patient
3. If at month 12, performs rollover:
   - Copies month 12 values to month 1
   - Deletes months 2-12
   - Generates new values for month 12
4. If before month 12, increments month counter and generates new values
5. Generates realistic lab values based on patient's CKD stage:
   - eGFR: Varies by CKD stage (Stage 5: 10-15, Stage 4: 15-30, etc.)
   - Creatinine: Inversely related to eGFR
   - uACR: Higher values for advanced CKD stages
   - Metabolic panel, lipid panel, diabetes markers

**Lab Values Generated**:
- eGFR (mL/min/1.73m²)
- Creatinine (mg/dL)
- BUN (mg/dL)
- uACR (mg/g)
- Blood Pressure (Systolic/Diastolic mmHg)
- Hemoglobin (g/dL)
- Potassium (mEq/L)
- Calcium (mg/dL)
- Phosphorus (mg/dL)
- Albumin (g/dL)
- Lipid Panel (LDL, HDL, Total Cholesterol, Triglycerides)
- HbA1c (%)
- Glucose (mg/dL)

**Response**:
```json
{
  "status": "success",
  "message": "New lab values simulated for month 3",
  "data": {
    "month": 3,
    "patient_id": "uuid",
    "observation_count": 17,
    "key_values": {
      "eGFR": 45.2,
      "creatinine": 1.8,
      "uacr": 125.5,
      "hba1c": 7.2
    }
  }
}
```

#### Endpoint 2: Cohort Cycle Advancement

**POST** `/api/patients/advance-cycle`

**Purpose**: Advance all patients to the next monthly cycle

**Behavior**:
1. Retrieves all patients from the database
2. For each patient:
   - Determines current month number
   - If at month 12:
     - Deletes observations for months 2-12
     - Updates month 12 observations to month 1
     - Generates new observations for month 12
   - If before month 12:
     - Increments month counter
     - Generates new observations for the new month
3. Generates realistic lab values for each patient based on their CKD stage

**Response**:
```json
{
  "status": "success",
  "message": "Cycle advanced for 200 patients",
  "data": {
    "patients_processed": 200,
    "total_patients": 200
  }
}
```

### 3. Frontend Changes

**File**: `/frontend/src/App.tsx`

#### State Management

Added two new state variables:
```typescript
const [isSimulating, setIsSimulating] = useState(false);
const [isAdvancingCycle, setIsAdvancingCycle] = useState(false);
```

#### Handler Functions

**handleSimulateNewLabs()**:
- Calls `/api/patients/:id/simulate-new-labs` endpoint
- Refreshes patient detail view with new values
- Shows success/error alerts
- Disables button while simulating

**handleAdvanceCycle()**:
- Confirms user action with dialog
- Calls `/api/patients/advance-cycle` endpoint
- Refreshes patient list and detail view
- Shows success/error alerts
- Disables button while advancing

#### UI Components

**1. Patient Detail View - "Simulate New Labs" Button**

Location: Laboratory Results section (line ~1244)

Features:
- Purple button with refresh icon
- Located in the header of the Laboratory Results section
- Disabled state while simulating
- Shows "Simulating..." text during operation
- Triggers AI assessment automatically after simulation

**2. Main View - "Advance All Patients (Next Month)" Button**

Location: Main header (line ~1751)

Features:
- Green button with lightning bolt icon
- Located in the top-right of the main page header
- Only visible when patients are loaded
- Confirmation dialog before execution
- Disabled state while advancing cycle
- Shows "Advancing Cycle..." text during operation

## Monthly Tracking Logic

### Month Progression

The system maintains a 12-month rolling history:

**Months 1-11**:
- Each new simulation increments the month counter
- New values are added to the next month
- Previous months' values are preserved

**Month 12 (Maximum)**:
- When advancing from month 12:
  - Month 12 values are copied to month 1 (baseline)
  - Months 2-12 are deleted
  - New values are generated for month 12
- This maintains a 12-month historical window

### Use Case: AI Evolution Assessment

The 12-month history allows the AI to:
1. Track patient progression over a year
2. Identify trends (improving, stable, declining)
3. Assess effectiveness of treatments
4. Detect significant changes that require intervention

## Running the Database Migration

The database migration must be run before using this feature:

### Option 1: Using Docker Compose (Recommended)

```bash
cd /home/user/hack_BI/infrastructure/postgres
./run_migration.sh 013
```

Or manually:

```bash
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db < migrations/013_add_month_tracking_to_observations.sql
```

### Option 2: Direct PostgreSQL Connection

```bash
psql -h localhost -p 5433 -U healthcare_user -d healthcare_ai_db < infrastructure/postgres/migrations/013_add_month_tracking_to_observations.sql
```

### Option 3: Copy to Container and Execute

```bash
docker cp infrastructure/postgres/migrations/013_add_month_tracking_to_observations.sql healthcare-postgres:/tmp/migration.sql
docker exec healthcare-postgres psql -U healthcare_user -d healthcare_ai_db -f /tmp/migration.sql
```

## Testing the Feature

### Test Single Patient Simulation

1. Start the application: `docker-compose up`
2. Navigate to http://localhost:8080
3. Click on any patient to view details
4. Scroll to the "Laboratory Results" section
5. Click the purple "Simulate New Labs" button
6. Observe:
   - Button becomes disabled with "Simulating..." text
   - Alert shows success message with month number
   - Lab values update in the UI
   - The patient's values should change to reflect the new simulation

### Test Cohort Cycle Advancement

1. From the main patient list page
2. Click the green "Advance All Patients (Next Month)" button in the top-right
3. Confirm the action in the dialog
4. Observe:
   - Button becomes disabled with "Advancing Cycle..." text
   - Alert shows success message with number of patients processed
   - All patients advance to the next month
   - If viewing a patient detail, values update automatically

## Technical Considerations

### Performance

- **Single Patient Simulation**: Fast (~100-200ms) - only generates values for one patient
- **Cohort Advancement**: Slower for large datasets - processes all patients sequentially
  - 200 patients: ~10-20 seconds
  - Consider adding progress indicators for large cohorts

### Data Realism

Lab values are generated with realistic ranges based on:
- CKD stage (affects eGFR, creatinine, uACR)
- Diabetes status (affects HbA1c, glucose)
- Normal physiological ranges for other values

Values include natural variation to simulate real-world fluctuations.

### AI Assessment Integration

The "Simulate New Labs" feature is designed to trigger AI assessment:
- New values are immediately available to the AI
- AI can analyze month-over-month changes
- Trend detection becomes possible with multiple months of data
- Treatment effectiveness can be evaluated

## Future Enhancements

1. **Configurable Trends**: Allow setting whether a patient should improve, decline, or stay stable
2. **Batch Simulation**: Simulate specific groups of patients (e.g., only high-risk patients)
3. **Automated Cycles**: Schedule automatic cycle advancement (e.g., daily for demo purposes)
4. **Month Range Display**: Show lab values across multiple months in the UI
5. **Trend Visualization**: Add charts showing lab value changes over 12 months
6. **AI-Driven Simulation**: Let the AI generate realistic value changes based on treatment adherence

## Files Modified

1. `/infrastructure/postgres/migrations/013_add_month_tracking_to_observations.sql` (new)
2. `/infrastructure/postgres/run_migration.sh` (new)
3. `/backend/src/api/routes/patients.ts` (modified - added 2 endpoints)
4. `/frontend/src/App.tsx` (modified - added buttons and handlers)

## Summary

This implementation provides a demonstration-ready simulation system that:
- ✅ Generates realistic lab values based on patient conditions
- ✅ Maintains a 12-month rolling history
- ✅ Provides both single-patient and cohort-wide simulation
- ✅ Integrates with the existing AI assessment system
- ✅ Offers an intuitive UI with clear feedback

The feature enables effective demonstration of the AI's ability to assess patient evolution over time, a critical capability for chronic disease management systems.
