# Health State Management System - Comprehensive Analysis

## Executive Summary
This codebase implements a healthcare AI clinical data analyzer for CKD (Chronic Kidney Disease) patient monitoring with KDIGO classification, risk assessment, and health state tracking. The system distinguishes between CKD and non-CKD patients, tracks health state changes, and includes alert/notification systems.

---

## 1. HEALTH STATE DEFINITIONS & UPDATES FOR PATIENTS

### Health State Definition (KDIGO Classification)

**Key File**: `/home/user/hack_BI/backend/src/utils/kdigo.ts`

Health state is defined as a combination of:
- **GFR Category**: G1, G2, G3a, G3b, G4, G5 (based on eGFR value)
- **Albuminuria Category**: A1, A2, A3 (based on uACR value)
- **Format**: `{GFR_CATEGORY}-{ALBUMINURIA_CATEGORY}` e.g., "G3a-A2"

**Core Classification Function**:
```typescript
// From kdigo.ts (lines 158-214)
export function classifyKDIGO(egfr: number, uacr: number): KDIGOClassification {
  // Returns:
  // - gfr_category: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5'
  // - albuminuria_category: 'A1' | 'A2' | 'A3'
  // - health_state: string (e.g., "G3a-A2")
  // - risk_level: 'low' | 'moderate' | 'high' | 'very_high'
  // - ckd_stage: 1-5 or null
  // - has_ckd: boolean
  // ... + clinical recommendations
}
```

### GFR Categories (based on eGFR value):
```
G1: >= 90 mL/min/1.73m² (Normal or High)
G2: 60-89 (Mildly Decreased)
G3a: 45-59 (Mild to Moderate Decrease)
G3b: 30-44 (Moderate to Severe Decrease)
G4: 15-29 (Severely Decreased)
G5: < 15 (Kidney Failure)
```

### Albuminuria Categories (based on uACR value):
```
A1: < 30 mg/g (Normal to Mildly Increased)
A2: 30-300 mg/g (Moderately Increased)
A3: > 300 mg/g (Severely Increased)
```

### Health State Updates in Database

**Database Tables** (from migration `002_create_patient_tracking_tables.sql`):

**CKD Patients Table**:
```sql
CREATE TABLE ckd_patient_data (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL UNIQUE,
    ckd_severity VARCHAR(20) NOT NULL, -- 'mild', 'moderate', 'severe', 'kidney_failure'
    ckd_stage INTEGER NOT NULL, -- 1-5
    kdigo_gfr_category VARCHAR(5) NOT NULL, -- 'G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'
    kdigo_albuminuria_category VARCHAR(5) NOT NULL, -- 'A1', 'A2', 'A3'
    kdigo_health_state VARCHAR(10) NOT NULL -- 'G3a-A2', etc.
);
```

**Non-CKD Patients Table**:
```sql
CREATE TABLE non_ckd_patient_data (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL UNIQUE,
    risk_level VARCHAR(20) NOT NULL, -- 'low', 'moderate', 'high'
    kdigo_health_state VARCHAR(10) NOT NULL -- 'G1-A1', 'G2-A1', etc.
);
```

**Health State History** (from migration `005_add_kdigo_progression_tracking.sql`):
```sql
CREATE TABLE health_state_history (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    measured_at TIMESTAMP NOT NULL,
    cycle_number INTEGER,
    egfr_value DECIMAL(5, 2) NOT NULL,
    uacr_value DECIMAL(8, 2),
    gfr_category VARCHAR(5) NOT NULL,
    albuminuria_category VARCHAR(5) NOT NULL,
    health_state VARCHAR(10) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    ckd_stage INTEGER,
    ... (clinical flags, treatment recommendations)
    CONSTRAINT health_state_unique UNIQUE (patient_id, measured_at)
);
```

### Where Health States Are Updated

**API Route**: `/home/user/hack_BI/backend/src/api/routes/patients.ts`

**GET /api/patients/:id** (lines 373-535):
- Fetches patient's latest observations (eGFR, uACR)
- Calls `classifyKDIGO(egfr, uacr)` to calculate current health state
- Returns `kdigo_classification` object in response

**POST /api/patients/:id/update-records** (lines 542-743):
- Uses Claude AI to generate next cycle of lab values
- Simulates progression based on treatment status:
  - **Treated**: eGFR stabilizes/improves, uACR decreases
  - **Untreated**: eGFR declines, uACR increases
- Inserts new observations for each metric
- Health state updates automatically when fetching patient detail

---

## 2. PATIENT CARDS/BARS DISPLAY

### Frontend Components

**Main Application**: `/home/user/hack_BI/frontend/src/App.tsx`

### Patient List View (Patient Cards)
The patient list displays as card rows in the filtered patient view:

**Patient List Structure** (lines 595-610):
```typescript
// Filtered patients array
filteredPatients = patients.filter(patient => {
  // Search by name, MRN, email, ID
});

// Each patient card displays:
- first_name, last_name
- medical_record_number (MRN)
- kdigo_classification (health state, risk level, CKD status)
- risk_category (computed label)
- is_monitored, monitoring_device
- is_treated (for CKD patients)
```

### Patient Detail View (Expanded Card)

**Health State Display** (lines 784-838):
```jsx
// Health State & Risk Classification Card
<div className="bg-white rounded-lg shadow-xl overflow-hidden">
  <div className={`px-8 py-4 ${
    kdigo_classification.has_ckd 
      ? 'bg-gradient-to-r from-red-600 to-orange-600'
      : 'bg-gradient-to-r from-blue-600 to-indigo-600'
  }`}>
    <h2>{has_ckd ? 'CKD Patient' : 'Non-CKD Patient'} - Health Classification</h2>
  </div>
  
  {/* Primary Classification Badge */}
  <span className={getRiskCategoryBadgeColor(risk_category)}>
    {risk_category} {/* e.g., "Severe CKD", "High Risk" */}
  </span>
  
  {/* KDIGO Details */}
  <div>Health State: {kdigo_classification.health_state}</div>
  <div>Risk Level: {kdigo_classification.risk_level}</div>
  <div>GFR Category: {kdigo_classification.gfr_category}</div>
  <div>Albuminuria Category: {kdigo_classification.albuminuria_category}</div>
</div>
```

### Color Coding for Health States

**Risk Category Badge Colors** (lines 569-592):
```typescript
// CKD Patients (Severity-based):
- Kidney Failure: bg-red-600 (red background, white text)
- Severe CKD: bg-orange-600
- Moderate CKD: bg-yellow-600
- Mild CKD: bg-green-600

// Non-CKD Patients (Risk-based):
- High Risk: bg-pink-600
- Moderate Risk: bg-purple-500
- Low Risk: bg-blue-500

// KDIGO Risk Color Mapping:
- Red (very_high): bg-red-100 text-red-800
- Orange (high): bg-orange-100 text-orange-800
- Yellow (moderate): bg-yellow-100 text-yellow-800
- Green (low): bg-green-100 text-green-800
```

### Lab Values Display

**Color-coded by Clinical Range** (lines 485-526):
```typescript
eGFR:
  < 30: red (Stage 4-5)
  30-60: orange (Stage 3)
  60-90: yellow (Stage 2)
  >= 90: green (Normal)

uACR:
  >= 300: red (A3 - Severely increased)
  >= 30: orange (A2 - Moderately increased)
  < 30: green (A1 - Normal)

HbA1c:
  >= 9.0: red (Poor control)
  >= 7.0: orange (Suboptimal)
  >= 6.5: yellow (Target)
  < 6.5: green (Good control)
```

---

## 3. COMMENTS SYSTEM IMPLEMENTATION

**Current Status**: Comments table DOES NOT exist yet in the database.

### Existing Tracking Infrastructure (to build upon):

**State Transitions Table** (migration `005_add_kdigo_progression_tracking.sql`, lines 67-118):
```sql
CREATE TABLE state_transitions (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    transition_date TIMESTAMP NOT NULL,
    from_cycle INTEGER,
    to_cycle INTEGER,
    from_health_state VARCHAR(10) NOT NULL,
    from_risk_level VARCHAR(20) NOT NULL,
    to_health_state VARCHAR(10) NOT NULL,
    to_risk_level VARCHAR(20) NOT NULL,
    change_type VARCHAR(20) NOT NULL, -- 'improved', 'worsened', 'stable'
    egfr_change DECIMAL(6, 2),
    uacr_change DECIMAL(8, 2),
    category_changed BOOLEAN DEFAULT false,
    risk_increased BOOLEAN DEFAULT false,
    crossed_critical_threshold BOOLEAN DEFAULT false,
    alert_generated BOOLEAN DEFAULT false,
    alert_severity VARCHAR(20), -- 'info', 'warning', 'critical'
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Monitoring Alerts Table** (lines 123-158):
```sql
CREATE TABLE monitoring_alerts (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    transition_id UUID REFERENCES state_transitions(id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    alert_reasons TEXT[], -- Array of reasons
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    acknowledged_at TIMESTAMP,
    action_taken TEXT,
    action_taken_at TIMESTAMP
);
```

**Action Recommendations Table** (lines 169-221):
```sql
CREATE TABLE action_recommendations (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    alert_id UUID REFERENCES monitoring_alerts(id),
    recommendation_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    priority INTEGER,
    urgency VARCHAR(20),
    action_items JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    outcome VARCHAR(50),
    outcome_notes TEXT
);
```

### Proposed Comments Table

To implement comments when health states change:

```sql
CREATE TABLE patient_health_state_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- State Change Reference
    from_state_transition_id UUID REFERENCES state_transitions(id),
    
    -- Comment Content
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(50) NOT NULL, -- 'automatic', 'manual', 'ai_generated'
    
    -- When state changed
    health_state_from VARCHAR(10),
    health_state_to VARCHAR(10),
    risk_level_from VARCHAR(20),
    risk_level_to VARCHAR(20),
    cycle_number INTEGER,
    
    -- Comment timing
    created_by VARCHAR(100), -- 'system', 'ai', or user email
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_type VARCHAR(20), -- 'system', 'doctor', 'ai'
    
    -- Metadata
    severity VARCHAR(20), -- 'info', 'warning', 'critical'
    clinical_rationale TEXT, -- Why this change matters
    recommended_actions TEXT[],
    
    -- Tracking
    visibility VARCHAR(20) DEFAULT 'visible', -- 'visible', 'archived'
    is_pinned BOOLEAN DEFAULT false
);

CREATE INDEX idx_patient_comments ON patient_health_state_comments(patient_id);
CREATE INDEX idx_state_transition_comments ON patient_health_state_comments(from_state_transition_id);
CREATE INDEX idx_comment_created ON patient_health_state_comments(created_at);
```

### Notification System (Existing)

**Frontend Component**: `/home/user/hack_BI/frontend/src/components/DoctorChatBar.tsx`

**Notification Interface** (lines 10-22):
```typescript
interface Notification {
  id: string;
  patient_id: string;
  notification_type: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  medical_record_number: string;
}
```

**Backend Route**: `/home/user/hack_BI/backend/src/api/routes/notifications.ts`
- Fetches unread notifications
- Used for alert propagation

---

## 4. FILTERING MECHANISMS FOR PATIENTS

### Primary Filter Types

**File**: `/home/user/hack_BI/frontend/src/components/PatientFilters.tsx` (entire component)
**Backend Endpoint**: `/api/patients/filter` in `/home/user/hack_BI/backend/src/api/routes/patients.ts` (lines 23-152)

### Filter Hierarchy

#### Level 1: Patient Type (Required)
```
- All Patients
- CKD Patients (has_ckd = true)
- Non-CKD Patients (has_ckd = false)
```

#### Level 2a: CKD-Specific Filters (when CKD selected)
```
Severity Levels:
- Mild CKD (ckd_severity = 'mild')
- Moderate CKD (ckd_severity = 'moderate')
- Severe CKD (ckd_severity = 'severe')
- Kidney Failure (ckd_severity = 'kidney_failure')

Treatment Status (after severity selected):
- Treated (is_treated = true)
- Not Treated (is_treated = false)
```

#### Level 2b: Non-CKD-Specific Filters (when non-CKD selected)
```
Risk Level:
- Low Risk (risk_level = 'low')
- Moderate Risk (risk_level = 'moderate')
- High Risk (risk_level = 'high')

Monitoring Status (only for high risk):
- Monitored (is_monitored = true)
- Not Monitored (is_monitored = false)
```

### API Query Parameters

**GET /api/patients/filter** (lines 11-22):
```
has_ckd: 'true' | 'false'
severity: 'mild' | 'moderate' | 'severe' | 'kidney_failure'
ckd_stage: 1 | 2 | 3 | 4 | 5
risk_level: 'low' | 'moderate' | 'high'
is_monitored: 'true' | 'false'
is_treated: 'true' | 'false' (CKD only)
monitoring_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually'
treatment_name: string (e.g., 'Jardiance')
```

### Frontend Filter State

**App.tsx State** (lines 155-167):
```typescript
const [activeFilters, setActiveFilters] = useState<{
  patientType: 'all' | 'ckd' | 'non-ckd';
  ckdSeverity: string | null;
  ckdTreatment: string | null;
  nonCkdRisk: string | null;
  nonCkdMonitoring: string | null;
}>({
  patientType: 'all',
  ckdSeverity: null,
  ckdTreatment: null,
  nonCkdRisk: null,
  nonCkdMonitoring: null
});
```

### Statistics Endpoint

**GET /api/patients/statistics** (lines 257-366):
Returns hierarchical counts for filter options:

```json
{
  "statistics": {
    "total_patients": 100,
    "ckd": {
      "total": 60,
      "mild": { "total": 10, "treated": 5, "not_treated": 5 },
      "moderate": { "total": 20, "treated": 15, "not_treated": 5 },
      "severe": { "total": 20, "treated": 18, "not_treated": 2 },
      "kidney_failure": { "total": 10, "treated": 9, "not_treated": 1 }
    },
    "non_ckd": {
      "total": 40,
      "low": { "total": 20, "monitored": 5, "not_monitored": 15 },
      "moderate": { "total": 12, "monitored": 8, "not_monitored": 4 },
      "high": { "total": 8, "monitored": 6, "not_monitored": 2 }
    }
  }
}
```

---

## 5. CKD vs NON-CKD PATIENTS DIFFERENTIATION

### How Patients Are Classified

**Classification Logic** (kdigo.ts, lines 73-106):

**CKD = TRUE** if:
```
1. eGFR < 60 (any albuminuria) → Stage 3+ CKD
2. eGFR >= 60 AND uACR >= 30 → Stage 1-2 CKD (with kidney damage)
```

**CKD = FALSE** if:
```
eGFR >= 60 AND uACR < 30 → No CKD (normal kidney function)
```

### Database Separation

**Two Separate Tables**:

**ckd_patient_data**:
```sql
- ckd_severity: 'mild', 'moderate', 'severe', 'kidney_failure'
- ckd_stage: 1-5
- is_treated: boolean
- monitoring_frequency: 'weekly', 'monthly', 'quarterly', etc.
```

**non_ckd_patient_data**:
```sql
- risk_level: 'low', 'moderate', 'high'
- is_monitored: boolean
- monitoring_frequency: 'monthly', 'quarterly', 'biannually', 'annually'
```

### Risk Classification Differences

**CKD Patients** - Severity-Based (lines 274-292, kdigo.ts):
```typescript
export function getRiskCategoryLabel(classification: KDIGOClassification): string {
  if (!classification.has_ckd) {
    // Non-CKD logic
  } else {
    // CKD patients use severity labels
    const severity = getCKDSeverity(classification.ckd_stage);
    return getCKDSeverityLabel(severity);
    // Returns: 'Mild CKD', 'Moderate CKD', 'Severe CKD', 'Kidney Failure', 'No CKD'
  }
}
```

**CKD Severity Mapping** (lines 219-235):
```
Stage 1-2 → 'mild'
Stage 3 → 'moderate'
Stage 4 → 'severe'
Stage 5 → 'kidney_failure'
```

**Non-CKD Patients** - Risk-Based:
```
Low Risk: eGFR >= 60 AND uACR < 30
Moderate Risk: (G1/G2 AND A2) OR (G3a AND A1)
High Risk: eGFR < 60 OR uACR >= 300 OR (high-risk combinations)
```

### Clinical Recommendations Differ

**CKD Patients** (lines 167-194, kdigo.ts):
```typescript
- requires_nephrology_referral: for eGFR < 30 or stages 3b+
- requires_dialysis_planning: for eGFR < 20 (Stage 4+)
- recommend_ras_inhibitor: always for CKD
- recommend_sglt2i: for stages 2-4
- target_bp: <130/80 mmHg
- monitoring_frequency: monthly to quarterly (based on stage)
```

**Non-CKD Patients**:
```typescript
- monitoring_frequency: quarterly to annually
- focus on: risk factor control (diabetes, hypertension, obesity)
```

### API Response Differences

**GET /api/patients**:

**For CKD patients, returns**:
```json
{
  "ckd_severity": "moderate",
  "ckd_stage": 3,
  "ckd_health_state": "G3a-A2",
  "ckd_is_monitored": true,
  "ckd_monitoring_frequency": "quarterly",
  "ckd_is_treated": true
}
```

**For Non-CKD patients, returns**:
```json
{
  "non_ckd_risk_level": "moderate",
  "non_ckd_health_state": "G2-A1",
  "non_ckd_is_monitored": false,
  "non_ckd_monitoring_frequency": "biannually"
}
```

---

## 6. SEVERITY/RISK LEVEL DETERMINATION

### Risk Assessment Matrix

**KDIGO Risk Matrix** (kdigo.ts, lines 112-153):

**Very High Risk (Red)**:
```
- G4 or G5 (eGFR < 30)
- G3b + (A2 or A3)
- G3a + A3
```

**High Risk (Orange)**:
```
- G3b + A1
- G3a + A2
- (G1 or G2) + A3
```

**Moderate Risk (Yellow)**:
```
- G3a + A1
- (G1 or G2) + A2
```

**Low Risk (Green)**:
```
- (G1 or G2) + A1
- No other abnormalities
```

### CKD Severity Classification

**Severity by Stage** (kdigo.ts, lines 219-253):

```typescript
export function getCKDSeverity(ckdStage: number | null): 
  'mild' | 'moderate' | 'severe' | 'kidney_failure' | null {
  
  Stage 1-2 → 'mild'
  Stage 3 → 'moderate'
  Stage 4 → 'severe'
  Stage 5 → 'kidney_failure'
}
```

### Monitoring Frequency Determination

**Based on Risk Level** (kdigo.ts, lines 258-269):

```typescript
very_high → 'monthly' (Every 1-3 months)
high → 'quarterly' (Every 3-6 months)
moderate → 'biannually' (Every 6-12 months)
low → 'annually' (Annually)
```

### Clinical Flag Determination

**Nephrology Referral** (kdigo.ts, lines 167-169):
```typescript
Recommend if:
- eGFR < 30 (G4 or G5)
- GFR category is G3b
- Albuminuria is A3
```

**Dialysis Planning** (lines 171-172):
```typescript
Recommend if:
- eGFR < 15 (G5)
- eGFR < 20 AND stage 4
```

**RAS Inhibitor Treatment** (lines 174):
```typescript
Recommend if:
- Albuminuria present (A2 or A3)
```

**SGLT2i Treatment** (lines 175):
```typescript
Recommend if:
- CKD Stage 2-4 (stages that benefit from slowing progression)
```

### Patient Health State Change Detection

**State Transition Tracking** (migration 005, lines 67-118):

The `state_transitions` table captures:
```
- from_health_state vs to_health_state
- from_risk_level vs to_risk_level
- change_type: 'improved' | 'worsened' | 'stable'
- category_changed: boolean
- risk_increased: boolean
- crossed_critical_threshold: boolean
```

**Example Transitions**:
```
Improved: G3b-A2 → G3a-A1 (improving eGFR and albuminuria)
Worsened: G3a-A1 → G3b-A2 (declining eGFR, new proteinuria)
Critical: G3b-A1 → G4-A1 (crossed into Stage 4)
```

---

## IMPLEMENTATION ROADMAP FOR COMMENTS ON HEALTH STATE CHANGES

### 1. Database Schema
Add `patient_health_state_comments` table (as specified above in section 3)

### 2. Backend API Routes
**File**: `/home/user/hack_BI/backend/src/api/routes/patients.ts`

Add endpoints:
```
POST /api/patients/:id/comments - Create comment on health state change
GET /api/patients/:id/comments - Fetch all comments for patient
PUT /api/patients/:id/comments/:commentId - Update comment
DELETE /api/patients/:id/comments/:commentId - Delete comment
```

### 3. Automatic Comment Generation
**Service**: Create new service file `/home/user/hack_BI/backend/src/services/commentService.ts`

When state transition detected:
```typescript
// Trigger on patient update
if (stateChanged) {
  await commentService.generateCommentForStateChange({
    patient_id,
    from_state,
    to_state,
    change_type,
    egfr_change,
    uacr_change,
    triggered_alerts
  });
}
```

### 4. Frontend Display
**File**: `/home/user/hack_BI/frontend/src/App.tsx`

Add comment section in patient detail view after health state card:
```jsx
{/* Health State Comments */}
<div className="bg-white rounded-lg shadow-xl p-8">
  <h3 className="text-lg font-bold mb-4">Health State Change History</h3>
  {comments.map(comment => (
    <div className="border-l-4 border-gray-300 pl-4 mb-4">
      <div className="text-sm text-gray-500">{formatDate(comment.created_at)}</div>
      <div className="font-semibold">{comment.comment_type === 'automatic' ? 'System' : 'Manual'}</div>
      <div className="mt-1">{comment.comment_text}</div>
    </div>
  ))}
</div>
```

### 5. Integration Points

The system already has:
- `state_transitions` table to detect changes
- `monitoring_alerts` table for alert generation
- `action_recommendations` table for suggested actions
- `DoctorChatBar` for notifications

Comments can be:
- Automatically generated when state_transitions are created
- Displayed alongside alerts in the chat/notification panel
- Used to build clinical narrative of patient progression

---

## KEY FILES SUMMARY

| Purpose | File Path | Key Functions |
|---------|-----------|----------------|
| **Health State Calculation** | `/backend/src/utils/kdigo.ts` | `classifyKDIGO()`, `getCKDStage()`, `getKDIGORiskLevel()`, `getRiskCategoryLabel()` |
| **Patient API** | `/backend/src/api/routes/patients.ts` | `GET /api/patients`, `GET /api/patients/:id`, `GET /api/patients/filter`, `POST /api/patients/:id/update-records` |
| **Patient Monitoring** | `/backend/src/services/patientMonitor.ts` | `handlePatientChange()`, `createAlert()` |
| **Database Schema** | `/infrastructure/postgres/migrations/005_add_kdigo_progression_tracking.sql` | `health_state_history`, `state_transitions`, `monitoring_alerts`, `action_recommendations` |
| **Frontend Filters** | `/frontend/src/components/PatientFilters.tsx` | Filter UI component with hierarchical filter buttons |
| **Frontend Display** | `/frontend/src/App.tsx` | Patient list, detail view, health state display |
| **Notifications** | `/frontend/src/components/DoctorChatBar.tsx` | Chat bar with notification alerts |

