# Realistic Patient Distribution Guide

## Overview

This guide explains how to populate your database with a realistic patient cohort that reflects real-world CKD prevalence and monitoring patterns.

## Real-World Distribution

The patient generation follows epidemiological data for CKD prevalence in primary care:

| Category | Percentage | Patients (out of 1000) | Monitoring Rate | Treatment Rate |
|----------|------------|------------------------|-----------------|----------------|
| **Low/Moderate Risk Non-CKD** | 24.5% | 245 | 0% | 0% |
| **High Risk Non-CKD** | 40.0% | 400 | 60% (240 patients) | 0% |
| **Mild CKD (Stages 1-2)** | 8.0% | 80 | 90% | 80% |
| **Moderate CKD (Stage 3)** | 25.0% | 250 | 90% | 80% |
| **Severe CKD (Stage 4)** | 2.0% | 20 | 90% | 80% |
| **Kidney Failure (Stage 5)** | 0.5% | 5 | 100% | 100% |
| **TOTAL** | **100%** | **1000** | - | - |

### Key Statistics
- **Total CKD Patients**: 355 (35.5%)
- **Total Non-CKD Patients**: 645 (64.5%)
- **CKD Patients Monitored**: ~320 (90%)
- **CKD Patients Treated**: ~284 (80%)
- **High-Risk Non-CKD Monitored**: 240 (60% of 400)

---

## Method 1: API Endpoint (Recommended)

### Prerequisites
- Backend server running on `http://localhost:3000`
- Database initialized with schema

### Step 1: Clear Existing Patients

```bash
curl -X POST http://localhost:3000/api/init/clear-patients
```

**Response:**
```json
{
  "status": "success",
  "message": "All patient data cleared successfully",
  "deleted_patients": 205
}
```

### Step 2: Generate Realistic Cohort

```bash
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

**Parameters:**
- `patient_count` (optional): Number of patients to generate (default: 1000)

**Response:**
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
  },
  "monitoring_treatment": {
    "Non-CKD High Risk Monitored": "60%",
    "CKD Monitored": "90%",
    "CKD Treated": "80%"
  }
}
```

### Step 3: Verify Distribution

```bash
curl http://localhost:3000/api/patients | jq '.patients | length'
```

---

## Method 2: SQL Migration

### Prerequisites
- PostgreSQL client installed
- Access to database credentials

### Step 1: Connect to Database

```bash
psql -U healthcare_user -d healthcare_ai_db -h localhost -p 5432
```

### Step 2: Run Migration

```sql
\i infrastructure/postgres/migrations/010_adjust_patient_distribution_real_world.sql
```

**Or from command line:**

```bash
psql -U healthcare_user -d healthcare_ai_db -h localhost -p 5432 \
  -f infrastructure/postgres/migrations/010_adjust_patient_distribution_real_world.sql
```

### Step 3: Verify Results

The migration automatically runs a verification query at the end:

```sql
SELECT
  CASE
    WHEN nckd.risk_level IN ('low', 'moderate') THEN 'Low/Moderate Risk Non-CKD'
    WHEN nckd.risk_level = 'high' THEN 'High Risk Non-CKD'
    WHEN ckd.severity = 'mild' THEN 'Mild CKD (Stages 1-2)'
    WHEN ckd.severity = 'moderate' THEN 'Moderate CKD (Stage 3)'
    WHEN ckd.severity = 'severe' THEN 'Severe CKD (Stage 4)'
    WHEN ckd.severity = 'kidney_failure' THEN 'Kidney Failure (Stage 5)'
  END as category,
  COUNT(*) as patient_count,
  ROUND(COUNT(*) * 100.0 / 1000, 2) as percentage,
  COUNT(CASE WHEN p.monitoring_status = 'active' THEN 1 END) as monitored_count,
  ROUND(COUNT(CASE WHEN p.monitoring_status = 'active' THEN 1 END) * 100.0 / COUNT(*), 1) as percent_monitored
FROM patients p
LEFT JOIN ckd_patient_data ckd ON p.id = ckd.patient_id
LEFT JOIN non_ckd_patient_data nckd ON p.id = nckd.patient_id
WHERE p.medical_record_number LIKE 'MRN-%'
GROUP BY category;
```

**Expected Output:**
```
           category           | patient_count | percentage | monitored_count | percent_monitored
-------------------------------+---------------+------------+-----------------+-------------------
 Low/Moderate Risk Non-CKD     |           245 |      24.50 |               0 |               0.0
 High Risk Non-CKD             |           400 |      40.00 |             240 |              60.0
 Mild CKD (Stages 1-2)         |            80 |       8.00 |              72 |              90.0
 Moderate CKD (Stage 3)        |           250 |      25.00 |             225 |              90.0
 Severe CKD (Stage 4)          |            20 |       2.00 |              18 |              90.0
 Kidney Failure (Stage 5)      |             5 |       0.50 |               5 |             100.0
```

---

## What Gets Generated

### Patient Demographics
- **Age Range**: 35-89 years (weighted toward 60-75)
- **Gender**: ~48% male, ~52% female
- **Ethnicity**: Realistic US distribution
  - Caucasian: ~61%
  - African American: ~13%
  - Hispanic/Latino: ~18%
  - Asian: ~6%
  - Native American: ~2%

### Clinical Data

#### Lab Values (Comprehensive Panel - Tailored by Category)

**Kidney Function Panel:**
- eGFR (mL/min/1.73m²)
- uACR (mg/g)
- Serum Creatinine (mg/dL)
- BUN (mg/dL)

**Blood Pressure & Cardiovascular:**
- Blood Pressure (systolic/diastolic mmHg)
- LDL Cholesterol (mg/dL)
- HDL Cholesterol (mg/dL)

**Metabolic:**
- HbA1c (%)
- BMI (kg/m²)

**Hematology & Minerals:**
- Hemoglobin (g/dL) - varies by CKD severity (lower in advanced CKD)
- Potassium (mEq/L) - higher risk in CKD Stage 4-5
- Calcium (mg/dL) - can be low in advanced CKD
- Phosphorus (mg/dL) - elevated in advanced CKD
- Albumin (g/dL) - nutritional status marker

All lab values are generated with **clinically realistic ranges** based on patient category and CKD severity.

#### Comorbidities (Realistic Prevalence)
- Type 2 Diabetes Mellitus
- Hypertension
- Cardiovascular Disease
- Heart Failure
- Obesity
- History of AKI

#### Medications
- RAS Inhibitors (ACE-I/ARB)
- SGLT2 Inhibitors (Jardiance, Farxiga, Invokana)
- Finerenone (Kerendia)
- Nephrotoxic medications (NSAIDs, PPIs)

#### KDIGO Classification
- GFR Categories: G1, G2, G3a, G3b, G4, G5
- Albuminuria Categories: A1, A2, A3
- Health States: 18 possible combinations (e.g., "G3a-A2")
- Risk Levels: Low, Moderate, High, Very High

#### Monitoring Data
- Device: Minuteful Kidney Kit (for monitored patients)
- Frequency: Monthly, Quarterly, Biannually, Annually
- Status: Active or Not Monitored

#### Treatment Data (CKD Patients)
- Treatment Name (e.g., Jardiance, Kerendia)
- Treatment Class (SGLT2i, MRA, etc.)
- Start Date
- Active Status

#### Jardiance Adherence Tracking (60% of Treated Patients)
- Prescription details (dosage: 10mg or 25mg)
- Refill history (30-day supplies)
- MPR (Medication Possession Ratio): 30-95%
- PDC (Proportion of Days Covered)
- Adherence Categories: High (50%), Medium (30%), Low (20%)
- Barriers to Adherence:
  - Cost concerns
  - Forgetfulness
  - Side effects
  - Lack of symptoms
  - Complex medication regimen

#### Risk Factors (Comprehensive)
- Laboratory markers (eGFR decline rate, trajectory)
- Comorbidity scores
- Demographic risk factors
- Lifestyle factors (smoking, physical activity, diet)
- Medication exposure (nephrotoxic vs protective)
- Family history
- AKI episodes

---

## 🔬 Comprehensive Laboratory Panel

**Updated Feature:** The API now generates a **complete laboratory panel** for all patients, including values that were previously missing from the patient cards.

### Critical Labs (Always Generated)

These labs are **essential** for CKD risk assessment, treatment decisions, and monitoring:

#### Blood Pressure
- **Range**: 110-170 mmHg systolic, 70-105 mmHg diastolic
- **Variation**: Higher and less controlled in CKD patients (especially Stage 4-5)
- **Clinical Use**:
  - Risk assessment (hypertension is cause AND consequence of CKD)
  - Treatment targets differ by proteinuria (<130/80 with A2/A3, <140/90 with A1)
  - Determines need for RAS inhibitors, CCBs, diuretics

#### Potassium
- **Range**:
  - Non-CKD: 3.8-4.7 mEq/L (normal)
  - Mild-Moderate CKD: 4.0-5.2 mEq/L
  - Severe CKD/Kidney Failure: 4.5-6.0 mEq/L (hyperkalemia risk)
- **Clinical Use**:
  - **Safety**: Hyperkalemia >5.5 is life-threatening
  - Prevents/limits use of RAS inhibitors, Finerenone if elevated
  - Determines need for potassium binders

#### Hemoglobin
- **Range** (varies dramatically by CKD severity):
  - Non-CKD: 12.5-16 g/dL
  - Mild CKD: 12-15 g/dL
  - Moderate CKD: 11-14 g/dL
  - Severe CKD: 9.5-12 g/dL
  - Kidney Failure: 8-10 g/dL
- **Clinical Use**:
  - Anemia is universal in advanced CKD (EPO deficiency)
  - <10 g/dL: Consider ESA (erythropoietin therapy)
  - Affects quality of life, accelerates CKD progression

### Important Labs (Strongly Recommended)

#### HbA1c
- **Range**:
  - Non-diabetic: 4.5-5.5%
  - Diabetic: 6.5-9.0%
- **Prevalence**: Varies by category (10% low-risk to 75% kidney failure)
- **Clinical Use**: Diabetes control assessment, influences SGLT2i benefit

#### LDL & HDL Cholesterol
- **Range**: LDL 80-180 mg/dL, HDL 30-70 mg/dL
- **Clinical Use**:
  - CVD risk stratification (CKD = 10-20x higher CVD risk)
  - LDL goal <70 mg/dL for all CKD patients (treat with statins)

#### Calcium & Phosphorus
- **Range** (varies by CKD severity):
  - Normal: Ca 8.8-10.0, PO4 2.7-4.5 mg/dL
  - Moderate CKD: Ca 8.5-10.0, PO4 3.0-5.0 mg/dL
  - Advanced CKD: Ca 8.0-9.5 (low), PO4 4.5-7.0 (high) mg/dL
- **Clinical Use**:
  - CKD-MBD (Mineral Bone Disease) management
  - Prevents secondary hyperparathyroidism, vascular calcification
  - Determines need for phosphate binders, vitamin D analogs

#### Serum Albumin
- **Range**:
  - Normal: 3.8-4.5 g/dL
  - Moderate CKD: 3.4-4.2 g/dL
  - Advanced CKD: 2.8-3.7 g/dL
- **Clinical Use**: Nutritional status, dialysis planning

### Lab Value Generation Logic

The API intelligently generates lab values based on:
1. **Patient Category** (non-CKD low/moderate/high, CKD mild/moderate/severe/failure)
2. **CKD Severity** (labs worsen progressively with declining kidney function)
3. **Clinical Realism** (ranges match real-world epidemiology)

**Example: Hemoglobin Generation**
```typescript
// Non-CKD: Normal values (12.5-16 g/dL)
// Mild CKD: Minimal anemia (12-15 g/dL)
// Moderate CKD: Mild anemia (11-14 g/dL)
// Severe CKD: Moderate anemia (9.5-12 g/dL)
// Kidney Failure: Severe anemia (8-10 g/dL)
```

This ensures that patient cards display **clinically credible and complete** laboratory data.

---

## Use Cases

### 1. Demo & Presentation
Generate a realistic cohort to showcase:
- KDIGO risk stratification across different patient types
- Monitoring program effectiveness
- Treatment adherence challenges
- Population health management

### 2. Testing & Development
- Test filtering and sorting algorithms with realistic distribution
- Validate risk calculation logic across all severity levels
- Ensure UI handles edge cases (kidney failure, high-risk non-CKD)

### 3. Algorithm Validation
- Verify KDIGO classification accuracy
- Test progression tracking with realistic lab trajectories
- Validate adherence metrics calculations

### 4. Clinical Workflows
- Practice triaging high-risk patients
- Test alert systems for declining kidney function
- Simulate nephrology referral workflows

---

## Customization

### Adjust Patient Count

Generate more or fewer patients:

```bash
# Generate 500 patients
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 500}'

# Generate 2000 patients
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 2000}'
```

### Modify Distribution

To change the prevalence percentages, edit:

**API Method:** `backend/src/api/routes/init.ts` (lines 596-608)

```typescript
const distribution = {
  nonCkdLowModerate: Math.floor(targetCount * 0.245), // Change this
  nonCkdHigh: Math.floor(targetCount * 0.40),        // Change this
  ckdMild: Math.floor(targetCount * 0.08),           // Change this
  ckdModerate: Math.floor(targetCount * 0.25),       // Change this
  ckdSevere: Math.floor(targetCount * 0.02),         // Change this
  ckdKidneyFailure: Math.floor(targetCount * 0.005)  // Change this
};
```

**SQL Method:** `infrastructure/postgres/migrations/010_adjust_patient_distribution_real_world.sql` (lines 96-113)

---

## Troubleshooting

### Error: "Database already contains patients"

**Solution:** Clear patients first:
```bash
curl -X POST http://localhost:3000/api/init/clear-patients
```

### Database Connection Failed

**Check:**
1. PostgreSQL is running: `docker compose ps postgres`
2. Backend is running: `docker compose ps backend`
3. Database credentials in `.env` are correct

### Patients Generated But Distribution Is Wrong

**Verify:**
```bash
# Count patients by category
curl http://localhost:3000/api/patients | jq '[.patients[] | .risk_priority] | group_by(.) | map({category: .[0], count: length})'
```

### Performance Issues

Generating 1000+ patients can take 30-60 seconds. For faster generation:
1. Reduce patient count
2. Disable Jardiance adherence tracking (edit API code)
3. Use SQL migration (faster than API)

---

## Best Practices

1. **Start Fresh**: Always clear existing patients before generating new cohort
2. **Verify Distribution**: Run verification queries after generation
3. **Calculate Risk Scores**: Risk scores are automatically calculated by the API
4. **Check Monitoring Status**: Verify correct percentage of patients are monitored
5. **Validate Adherence**: Confirm Jardiance adherence data for SGLT2i patients

---

## Related Documentation

- [KDIGO Classification Guide](../KDIGO_Health_States_Classification.md)
- [Risk Assessment Documentation](../docs/algorithm/README_adherence.md)
- [Jardiance Adherence Tracking](../docs/algorithm/README_adherence.md)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API logs: `docker compose logs backend`
3. Verify database state: Connect to PostgreSQL and run verification queries
