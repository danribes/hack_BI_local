# CKD Diagnosis Detection & Early Treatment System

## Overview

This system automatically detects when at-risk patients transition to a CKD diagnosis and guides doctors through confirmation and early treatment protocol initiation.

## Problem Solved

**Before:** Patients at risk for CKD might have declining kidney function for months before diagnosis, missing critical window for early intervention.

**After:** Automatic detection alerts doctors immediately when diagnostic criteria are met, initiating structured early treatment protocols that can:
- Slow disease progression by 30-50%
- Delay dialysis need by 2-5 years
- Reduce cardiovascular events by 20-30%

---

## How It Works

### 1. Continuous Monitoring

Every time patient data is updated (new lab results, observations), the system:
1. Runs risk assessment (existing system)
2. ✨ **NEW**: Checks if patient meets CKD diagnostic criteria
3. Detects transition from "at-risk" to "CKD diagnosed"

### 2. CKD Diagnostic Criteria

Patient is diagnosed with CKD when:

**Option A: eGFR < 60 mL/min/1.73m²** (Stage 3+)
- Indicates significant kidney function decline
- Most common diagnostic path

**Option B: eGFR 60-89 + Proteinuria (uACR >30)** (Stage 2)
- Kidney damage with mild function decline
- Earlier detection opportunity

**Option C: Rapid eGFR decline crossing threshold**
- Was >60, now <60
- Captures accelerated progression

### 3. Automatic Workflow Initiation

When CKD diagnosis detected:

```
Patient Data Updated (e.g., new eGFR result)
    ↓
Risk Assessment Runs
    ↓
CKD Diagnosis Criteria Met? YES
    ↓
✨ CREATE DIAGNOSIS EVENT
    ↓
GENERATE ACTIONS:
  1. Doctor Action: Confirm Diagnosis
  2. Generate Evidence-Based Treatment Protocol
  3. Doctor Action: Approve Treatment
    ↓
SEND NOTIFICATION TO DOCTOR
    ↓
DOCTOR REVIEWS IN "CKD Diagnosis" TAB
    ↓
DOCTOR CLICKS:
  - "Confirm Diagnosis" ✓
  - "Approve & Initiate Treatment" ✓
    ↓
PATIENT ENTERS EARLY TREATMENT PROGRAM
```

---

## Components

### Database Tables

#### 1. `ckd_diagnosis_events`
Tracks when patients are diagnosed with CKD:
- `diagnosis_date` - When detected
- `ckd_stage_at_diagnosis` - Stage 2, 3a, 3b, 4, 5
- `egfr_at_diagnosis` - eGFR at diagnosis
- `previous_risk_level` - What priority they were before
- `detection_trigger` - egfr_decline, persistent_proteinuria
- `diagnosis_confirmed` - Doctor confirmed?

#### 2. `ckd_treatment_protocols`
Evidence-based early treatment protocols:
- `protocol_name` - "Early Stage 3a CKD Management Protocol"
- `medication_orders` - RAS inhibitor, SGLT2i, BP control
- `lab_monitoring_schedule` - How often to check labs
- `referrals` - Nephrology, dietitian
- `lifestyle_modifications` - Diet, exercise, smoking
- `status` - pending_approval → approved → active

#### 3. `doctor_action_queue`
Actions requiring doctor review:
- `action_type` - confirm_ckd_diagnosis, approve_treatment
- `priority` - CRITICAL, HIGH, MODERATE
- `action_title` - "Confirm CKD Diagnosis - John Doe"
- `action_description` - Full clinical context
- `due_date` - Typically 48 hours
- `status` - pending → completed/declined

### Backend Services

#### `ckdDiagnosisDetection.ts`
- `detectCKDDiagnosisOnset()` - Checks diagnostic criteria
- `processNewCKDDiagnosis()` - Creates actions and protocols
- `confirmCKDDiagnosis()` - Doctor confirms diagnosis
- `approveTreatmentProtocol()` - Doctor initiates treatment

#### `riskChangeMonitor.ts` (Enhanced)
Now includes CKD diagnosis detection after risk assessment:
```typescript
// After risk assessment...
const diagnosisResult = await detectCKDDiagnosisOnset(patient);
if (diagnosisResult.newly_diagnosed) {
  await processNewCKDDiagnosis(patient, diagnosisEventId);
}
```

### API Endpoints

- `GET /api/ckd-diagnosis/actions` - Pending actions for doctor
- `GET /api/ckd-diagnosis/actions/:id` - Full action details
- `POST /api/ckd-diagnosis/actions/:id/confirm-diagnosis` - Confirm
- `POST /api/ckd-diagnosis/actions/:id/approve-treatment` - Approve & initiate
- `POST /api/ckd-diagnosis/actions/:id/decline` - Decline with reason
- `GET /api/ckd-diagnosis/patient/:id/history` - Diagnosis history
- `GET /api/ckd-diagnosis/patient/:id/protocols` - Treatment protocols
- `GET /api/ckd-diagnosis/stats` - System statistics

### Frontend Component

#### `CKDDiagnosisActionQueue.tsx`
Full-featured doctor action dashboard:
- **Pending Actions List** - All items requiring review
- **Priority Filtering** - CRITICAL/HIGH/MODERATE
- **Due Date Tracking** - Visual countdown/overdue alerts
- **One-Click Actions** - Confirm/Approve/Decline
- **Treatment Protocol Display** - Full protocol details
- **Clinical Context** - Patient demographics, labs, comorbidities

---

## Example Scenario

### Patient: Jane Smith, 67F

**Baseline State:**
- Risk Priority: MODERATE
- eGFR: 65 mL/min/1.73m²
- uACR: 45 mg/g
- Pre-CKD status: at_risk

**New Lab Result Added:**
```sql
INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date)
VALUES ('jane-uuid', 'eGFR', 58.5, 'mL/min/1.73m²', NOW());
```

**System Response:**

1. **Trigger Fires** (automatic)
   ```
   [RiskChangeMonitor] Patient data updated: Jane Smith
   [RiskChangeMonitor] Running risk assessment...
   [RiskChangeMonitor] Checking for CKD diagnosis onset...
   [RiskChangeMonitor] 🔔 NEW CKD DIAGNOSIS DETECTED!
   ```

2. **Diagnosis Event Created**
   ```
   Diagnosis ID: abc-123
   Stage at Diagnosis: 3a
   eGFR: 58.5
   Previous Status: at_risk (MODERATE)
   Detection Trigger: egfr_decline
   ```

3. **Doctor Actions Created**
   - **Action 1**: Confirm CKD Diagnosis
     - Priority: HIGH
     - Due: 48 hours

   - **Action 2**: Approve Treatment Protocol
     - Priority: HIGH
     - Due: 48 hours

4. **Treatment Protocol Generated**
   ```json
   {
     "protocol_name": "Early Stage 3a CKD Management Protocol",
     "medications": {
       "ras_inhibitor": {
         "recommended": true,
         "options": ["Lisinopril", "Losartan", "Ramipril"],
         "rationale": "Slows CKD progression with proteinuria"
       },
       "sglt2_inhibitor": {
         "recommended": true,
         "options": ["Empagliflozin", "Dapagliflozin"],
         "rationale": "Proven renoprotection in Stage 2-4"
       },
       "blood_pressure": {
         "target": "<130/80 mmHg"
       }
     },
     "lab_monitoring": {
       "egfr_creatinine": "Every 3-6 months",
       "electrolytes": "Every 3-6 months",
       "urine_acr": "Every 3-12 months"
     },
     "referrals": {
       "nephrology": {
         "recommended": true,
         "urgency": "routine"
       },
       "dietitian": {
         "recommended": true,
         "focus": ["Sodium restriction", "Protein modification"]
       }
     }
   }
   ```

5. **Notification Sent**
   ```
   Subject: ⚠️ NEW: CKD Diagnosis Detected - Jane Smith (Stage 3a)

   DIAGNOSTIC CRITERIA MET - CKD STAGE 3a

   Current Clinical Status:
     • eGFR: 58.5 mL/min/1.73m²
     • Urine ACR: 45 mg/g
     • CKD Stage: 3a

   ✓ eGFR < 60 mL/min/1.73m² (persistent kidney function decline)

   Previous Status: MODERATE Risk

   REQUIRED ACTIONS:
   1. CONFIRM CKD DIAGNOSIS
      → Action required in Doctor Action Queue

   2. APPROVE EARLY TREATMENT PROTOCOL
      → Evidence-based management protocol generated
      → Action required in Doctor Action Queue
   ```

6. **Doctor Reviews in Dashboard**
   - Navigates to "🏥 CKD Diagnosis" tab
   - Sees 2 pending actions for Jane Smith
   - Reviews clinical data, eGFR trend, comorbidities
   - Reviews generated treatment protocol

7. **Doctor Confirms & Approves**
   - Clicks "Confirm Diagnosis" ✓
   - Clicks "Approve & Initiate Treatment" ✓

8. **Patient Updated**
   ```sql
   UPDATE patients SET
     ckd_diagnosed = true,
     ckd_diagnosis_confirmed = true,
     on_early_treatment_protocol = true,
     treatment_protocol_start_date = CURRENT_DATE
   WHERE id = 'jane-uuid';
   ```

9. **Result**
   - Patient now in structured early treatment program
   - Automatic lab monitoring scheduled
   - Nephrology referral initiated
   - Dietary counseling scheduled
   - Treatment effectiveness tracked over time

---

## Treatment Protocol Components

### Medication Orders

**RAS Inhibitors** (ACE-I or ARB)
- First-line for proteinuric CKD
- Options: Lisinopril, Losartan, Ramipril, Enalapril
- Slows progression significantly

**SGLT2 Inhibitors**
- Game-changer in CKD management
- Options: Empagliflozin, Dapagliflozin
- Proven benefit in Stages 2-4
- Reduces progression by 30-40%

**Blood Pressure Control**
- Target: <130/80 mmHg in proteinuric CKD
- Additional agents: Amlodipine, Chlorthalidone
- Home BP monitoring recommended

**Avoid**
- NSAIDs (ibuprofen, naproxen)
- High-dose PPIs
- Aminoglycosides
- Contrast dye (if possible)

### Lab Monitoring Schedule

| CKD Stage | eGFR/Creatinine | Electrolytes | uACR | Other |
|-----------|-----------------|--------------|------|-------|
| Stage 2   | Every 6-12mo    | Every 6-12mo | Annually | HbA1c if DM |
| Stage 3   | Every 3-6mo     | Every 3-6mo  | Every 3-12mo | PTH annually |
| Stage 4   | Every 3mo       | Every 3mo    | Every 3-6mo  | PTH, Vit D q6mo |
| Stage 5   | Every 3mo       | Monthly      | Every 3mo    | Dialysis prep |

### Specialist Referrals

**Nephrology**
- Required: Stage 3b+ (eGFR <45)
- Recommended: Stage 3a with rapid decline
- Urgent: Stage 4-5 or complications

**Dietitian**
- Sodium restriction: <2000 mg/day
- Protein modification: 0.8 g/kg/day in Stage 3+
- Phosphorus management: <800-1000 mg/day in Stage 4+
- Potassium monitoring based on labs

**Diabetes Educator** (if diabetic)
- Glycemic control critical
- Target HbA1c <7%
- SGLT2i education

### Lifestyle Modifications

**Diet**
- Low sodium (<2g/day)
- Moderate protein (0.8-1.0 g/kg)
- Limit phosphorus (Stage 4+)
- Potassium management

**Exercise**
- 150 min/week moderate activity
- Walking, cycling, swimming
- Improves outcomes

**Smoking Cessation**
- Critical for slowing progression
- Pharmacotherapy: Varenicline, Bupropion
- Counseling programs

**Weight Management**
- Target BMI 20-25
- Gradual 5-10% weight loss if obese

---

## Testing the System

### Prerequisites

1. **Apply Database Migration**
   ```bash
   docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db \
     -f /migrations/004_add_ckd_diagnosis_detection.sql
   ```

2. **Verify Tables Created**
   ```sql
   \dt ckd_*
   \dt doctor_action_queue
   ```

3. **Backend Running with Monitor**
   ```bash
   docker-compose up backend
   # Should see: "✓ Risk Change Monitor active"
   ```

### Test Scenario 1: New eGFR <60 (Most Common)

```sql
-- Select a patient currently at risk but not diagnosed
SELECT id, medical_record_number, first_name, last_name
FROM patients
WHERE ckd_diagnosed = false
LIMIT 1;

-- Add eGFR result below 60
INSERT INTO observations (
  patient_id,
  observation_type,
  value_numeric,
  unit,
  observation_date,
  status
) VALUES (
  'patient-uuid-from-above',
  'eGFR',
  57.5,  -- Below 60 threshold
  'mL/min/1.73m²',
  NOW(),
  'final'
);
```

**Expected Output:**
```
[RiskChangeMonitor] Patient data updated: MRN123
[RiskChangeMonitor] Checking for CKD diagnosis onset...
[RiskChangeMonitor] 🔔 NEW CKD DIAGNOSIS DETECTED for MRN123!
   - Diagnosis Event ID: abc-123
   - Requires Confirmation: true
   - Treatment Recommended: true
[CKD Diagnosis] Processing new CKD diagnosis for patient MRN123
[CKD Diagnosis] ✓ Diagnosis workflow created:
  - Confirmation action: action-1
  - Treatment protocol: protocol-1
  - Approval action: action-2
```

### Test Scenario 2: eGFR 60-89 + Proteinuria (Stage 2)

```sql
-- Add both eGFR and proteinuria
INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date)
VALUES
  ('patient-uuid', 'eGFR', 75.0, 'mL/min/1.73m²', NOW()),
  ('patient-uuid', 'uACR', 150.0, 'mg/g', NOW());
```

Should detect Stage 2 CKD with proteinuria.

### Test Scenario 3: View in Frontend

1. Start frontend: `http://localhost:5173`
2. Navigate to "🏥 CKD Diagnosis" tab
3. See pending actions
4. Click "View Details" on an action
5. Click "Confirm Diagnosis"
6. Click "Approve & Initiate Treatment"

### Test Scenario 4: Check Results

```sql
-- Check diagnosis events
SELECT
  p.medical_record_number,
  cde.diagnosis_date,
  cde.ckd_stage_at_diagnosis,
  cde.egfr_at_diagnosis,
  cde.diagnosis_confirmed,
  cde.doctor_notified
FROM ckd_diagnosis_events cde
JOIN patients p ON cde.patient_id = p.id
ORDER BY cde.diagnosis_date DESC
LIMIT 5;

-- Check pending actions
SELECT
  daq.action_type,
  daq.priority,
  daq.status,
  p.medical_record_number,
  daq.created_at
FROM doctor_action_queue daq
JOIN patients p ON daq.patient_id = p.id
WHERE daq.status = 'pending'
ORDER BY
  CASE daq.priority
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    ELSE 3
  END,
  daq.created_at;

-- Check treatment protocols
SELECT
  p.medical_record_number,
  ctp.protocol_name,
  ctp.status,
  ctp.created_at
FROM ckd_treatment_protocols ctp
JOIN patients p ON ctp.patient_id = p.id
ORDER BY ctp.created_at DESC
LIMIT 5;
```

---

## Doctor Workflow

### Daily Routine

1. **Morning: Check Action Queue**
   - Open "🏥 CKD Diagnosis" tab
   - Review pending actions sorted by priority
   - Overdue items highlighted in red

2. **For Each Diagnosis Confirmation:**
   - Review patient demographics
   - Check eGFR trend over time
   - Review comorbidities and risk factors
   - Confirm diagnosis meets criteria
   - Click "Confirm Diagnosis" or "Decline" with reason

3. **For Each Treatment Approval:**
   - Review generated protocol
   - Check medication recommendations
   - Verify no contraindications
   - Adjust protocol if needed (future feature)
   - Click "Approve & Initiate"

4. **Result:**
   - Patient automatically enrolled in protocol
   - Lab monitoring scheduled
   - Referrals initiated
   - Progress tracked

---

## Integration with Existing Systems

### With Risk Monitoring

CKD diagnosis detection runs **after** risk assessment:
1. Patient data updated
2. Risk assessment runs (existing)
3. **NEW**: CKD diagnosis check runs
4. Both can trigger notifications

### With Notifications Dashboard

Diagnosis alerts appear in:
- "📧 Notifications" tab (general alerts)
- "🏥 CKD Diagnosis" tab (actionable items)

### With High-Risk Monitoring

Patients can be:
- High-risk but not yet CKD (pre-CKD)
- Newly diagnosed CKD
- Established CKD with high risk

All three scenarios tracked separately.

---

## Statistics & Reporting

### Available Metrics

```javascript
GET /api/ckd-diagnosis/stats

{
  "diagnoses": {
    "confirmed_diagnoses": 15,  // Last 30 days
    "pending_confirmation": 3,
    "total_diagnoses": 18,
    "patients_diagnosed": 17
  },
  "pending_actions": [
    {
      "action_type": "confirm_ckd_diagnosis",
      "priority": "HIGH",
      "count": 2
    },
    {
      "action_type": "approve_treatment",
      "priority": "HIGH",
      "count": 3
    }
  ]
}
```

### Dashboard Metrics

Frontend displays:
- Pending Actions count
- Pending Confirmations
- Confirmed Diagnoses (30d)
- Total Patients Diagnosed

---

## Configuration

### Adjust Detection Sensitivity

Edit `detect_ckd_diagnosis_onset()` function in migration file:

```sql
-- More aggressive detection (catch borderline cases)
IF p_current_egfr < 62.0 THEN  -- Was 60.0
  v_meets_criteria := TRUE;
END IF;

-- Less aggressive (only clear cases)
IF p_current_egfr < 58.0 THEN  -- Was 60.0
  v_meets_criteria := TRUE;
END IF;
```

### Adjust Due Dates

```sql
-- In create_ckd_diagnosis_action function
due_date = CURRENT_TIMESTAMP + INTERVAL '24 hours',  -- Was 48 hours
auto_expire_hours = 24  -- Was 48
```

### Customize Treatment Protocols

Edit `generate_early_treatment_protocol()` function to:
- Add/remove medications
- Adjust lab monitoring frequency
- Modify referral criteria
- Change lifestyle recommendations

---

## Troubleshooting

### Diagnosis Not Detected

**Check:**
1. Patient already diagnosed?
   ```sql
   SELECT ckd_diagnosed FROM patients WHERE id = 'patient-uuid';
   ```

2. Criteria actually met?
   ```sql
   -- Should be < 60 for diagnosis
   SELECT value_numeric
   FROM observations
   WHERE patient_id = 'patient-uuid'
   AND observation_type = 'eGFR'
   ORDER BY observation_date DESC
   LIMIT 1;
   ```

3. Monitor logs:
   ```bash
   docker-compose logs backend | grep "CKD Diagnosis"
   ```

### Actions Not Appearing

**Check:**
1. Actions created?
   ```sql
   SELECT * FROM doctor_action_queue WHERE status = 'pending';
   ```

2. Frontend API working?
   ```bash
   curl http://localhost:3000/api/ckd-diagnosis/actions
   ```

### Treatment Not Initiating

**Check approval status:**
```sql
SELECT
  status,
  treatment_approved,
  treatment_approved_by
FROM ckd_treatment_protocols
WHERE id = 'protocol-uuid';
```

---

## Future Enhancements

### Phase 2: AI-Enhanced Detection
- Predictive models for "will develop CKD in 6 months"
- Earlier intervention opportunity
- Machine learning on historical data

### Phase 3: Personalized Protocols
- Adjust based on age, comorbidities, contraindications
- Different protocols for diabetic vs non-diabetic
- Geriatric-specific protocols

### Phase 4: Outcomes Tracking
- Track eGFR slope after treatment initiation
- Compare treated vs untreated historical controls
- Continuous protocol optimization

### Phase 5: Patient Portal
- Patient education materials
- Home BP monitoring integration
- Medication adherence tracking
- Lifestyle goal tracking

---

## References

1. KDIGO 2024 Clinical Practice Guideline for CKD Management
2. KDIGO 2012 CKD Classification Guidelines
3. American Diabetes Association Standards of Care 2024
4. NKF KDOQI Guidelines for CKD Evaluation

---

## Support

For questions:
- Review implementation logs
- Check test scripts
- Consult database schema comments

**System designed to save lives through early intervention** ❤️
