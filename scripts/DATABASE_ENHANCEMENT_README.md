# Database Enhancement for CKD Management System

## Overview

This directory contains SQL scripts to enhance the CKD database with all variables specified in the **Unified CKD Complete Specification Enhanced v3.0** document. The enhancement includes comprehensive patient data, lab observations, medications, prescriptions, and refill history for adherence tracking.

## What's New

### Schema Enhancements

#### Enhanced Patients Table
Added 20+ new columns for comprehensive vital signs and comorbidity tracking:
- **Vital Signs**: `systolic_bp`, `diastolic_bp`, `bp_control_status`, `heart_rate`, `oxygen_saturation`, `bmi`
- **Comorbidity Flags**: `has_diabetes`, `has_hypertension`, `has_heart_failure`, `has_cad`, `has_aki_history`, `has_lupus`, `has_ra`, `has_obesity`, `has_metabolic_syndrome`
- **Treatment Status**: `resistant_hypertension`, `antihypertensive_count`

#### New Tables

**medications** - Reference table for all CKD-related medications
- Generic/brand names
- Medication classes (SGLT2i, ACEi, ARB, etc.)
- CKD-specific indicators
- Nephrotoxic flags
- eGFR thresholds for safety

**prescriptions** - Patient prescription records
- Links to patients and medications
- Dosage, frequency, quantity
- Refill authorization tracking
- Status (active, discontinued)

**refills** - Pharmacy refill history for MPR calculation
- Fill dates and quantities
- Days supply
- Cost tracking
- Fill status

**patient_risk_assessments** - Phase-based risk assessments
- Pre-diagnosis risk (3-tier stratification)
- KDIGO classification (G × A matrix)
- Trajectory analysis (progression risk)
- Monitoring frequency recommendations

**treatment_recommendations** - Evidence-based treatment recommendations
- Jardiance (SGLT2i) eligibility
- RAS inhibitor recommendations
- RenalGuard device recommendations
- EMPA-KIDNEY evidence integration

**adherence_monitoring** - MPR-based adherence tracking
- Medication Possession Ratio calculation
- Adherence status (GOOD/SUBOPTIMAL/POOR)
- Barrier detection
- Clinical correlation with outcomes

### Comprehensive Lab Observations

Added observation types from the specification:
- **Kidney Function**: eGFR, uACR, Creatinine, Potassium
- **Diabetes**: HbA1c, Fasting Glucose
- **Lipids**: Total Cholesterol, LDL, HDL, Triglycerides
- **Additional**: Hemoglobin, Albumin, Calcium, Phosphorus, PTH, Uric Acid

### Prescription Data

Generated 12 months of refill history for adherence tracking:
- **RAS Inhibitors** (ACEi/ARBs): For patients with hypertension or proteinuria
- **SGLT2 Inhibitors** (Jardiance): For patients with diabetes + CKD + proteinuria
- **Statins**: For cardiovascular protection
- **Diuretics**: For volume management
- **Diabetes Medications**: Metformin, GLP-1s, etc.

Realistic adherence patterns:
- Good adherence (90%+): Statins, essential medications
- Suboptimal adherence (75-90%): Some SGLT2i patients
- Occasional missed refills: 10-15% miss rate for some medications

## Files

### Main Scripts (Run in Order)

1. **`enhance_database_schema.sql`**
   - Adds new columns to patients table
   - Creates new tables (medications, prescriptions, refills, assessments)
   - Populates medications reference data
   - **Runtime**: ~30 seconds

2. **`update_existing_patients.sql`**
   - Updates existing patients with new vital signs
   - Calculates BMI from height/weight
   - Infers comorbidities from conditions
   - Adds missing lab observations
   - **Runtime**: ~1-2 minutes (depends on existing patient count)

3. **`populate_500_patients.sql`**
   - Generates 500 new patients with realistic demographics
   - Adds comprehensive vital signs and labs
   - Creates conditions based on comorbidities
   - Generates prescriptions with 12 months of refills
   - **Runtime**: ~3-5 minutes

4. **`RUN_COMPLETE_DATABASE_SETUP.sql`** ⭐ **MASTER SCRIPT**
   - Runs all three scripts in order
   - Displays verification queries
   - Shows summary statistics
   - **Runtime**: ~5-10 minutes total

## Quick Start

### Option 1: Run Master Script (Recommended)

```bash
# From project root
psql $DATABASE_URL -f scripts/RUN_COMPLETE_DATABASE_SETUP.sql
```

### Option 2: Run Individual Scripts

```bash
# Step 1: Enhance schema
psql $DATABASE_URL -f scripts/enhance_database_schema.sql

# Step 2: Update existing patients
psql $DATABASE_URL -f scripts/update_existing_patients.sql

# Step 3: Populate 500 new patients
psql $DATABASE_URL -f scripts/populate_500_patients.sql
```

### Option 3: Run from Web Interface

If using a web-based PostgreSQL client (like Render's SQL console):
1. Copy entire contents of `RUN_COMPLETE_DATABASE_SETUP.sql`
2. Paste into SQL console
3. Execute

## Data Generated

### Patient Demographics
- **500 patients** with realistic names and ages (40-85 years)
- **Diverse comorbidity profiles**:
  - 45% with diabetes
  - 60% with hypertension
  - 15% with heart failure
  - 30-40% with obesity (BMI >30)

### Vital Signs
- Blood pressure (systolic, diastolic)
- Heart rate (60-100 bpm)
- Oxygen saturation (95-100%)
- BMI calculated from height/weight

### Lab Values (Multiple Time Points)
- **eGFR**: 4 measurements over 12 months (shows trajectory)
- **uACR**: 4 measurements over 12 months
- **Other labs**: Single recent measurement for each

### Conditions (ICD-10 Coded)
- Type 2 Diabetes Mellitus (E11.22)
- Hypertensive CKD (I12.9)
- Heart Failure (I50.9)
- CKD Stages 2-5 (N18.2 - N18.5)

### Medications
- **CKD-specific**: SGLT2i, RAS inhibitors
- **Cardiovascular**: Beta-blockers, statins, aspirin
- **Diabetes**: Metformin, GLP-1s, insulin
- **Others**: Diuretics, PPIs, NSAIDs

### Refill History
- **12 months of refills** per active medication
- Realistic gaps and adherence patterns
- Cost data (patient copays)

## Database Statistics After Enhancement

Expected counts after running all scripts:

| Data Type | Count |
|-----------|-------|
| **Patients** | 500+ |
| **Observations** | 10,000+ |
| **Conditions** | 1,500+ |
| **Prescriptions** | 1,500+ |
| **Refills** | 15,000+ |
| **Medications (Reference)** | 25 |

### eGFR Distribution (Expected)

| GFR Category | % of Patients | Avg eGFR |
|--------------|---------------|----------|
| G1 (≥90) | ~10% | 95 |
| G2 (60-89) | ~25% | 72 |
| G3a (45-59) | ~30% | 52 |
| G3b (30-44) | ~20% | 37 |
| G4 (15-29) | ~12% | 22 |
| G5 (<15) | ~3% | 12 |

### Top Medications (Expected)

| Medication Class | % on Medication |
|------------------|-----------------|
| RAS Inhibitors | 60-70% |
| Statins | 50-60% |
| Diuretics | 30-40% |
| SGLT2i | 15-25% |
| Diabetes Meds | 45% |

## Integration with MCP Server v2.0

The enhanced database is now **fully compatible** with all MCP server v2.0 phase-based tools:

### Phase 1: Pre-Diagnosis Risk Assessment
Uses: `systolic_bp`, `diastolic_bp`, `has_diabetes`, `has_hypertension`, `has_heart_failure`, `bmi`, `antihypertensive_count`, `resistant_hypertension`

### Phase 2: KDIGO Classification
Uses: `eGFR`, `uACR` observations with historical trajectory analysis

### Phase 3: Treatment Decision Support
Uses: Comorbidity flags, eGFR, uACR, existing prescriptions to determine Jardiance and RAS inhibitor eligibility

### Phase 4: Adherence Monitoring
Uses: `prescriptions` and `refills` tables to calculate MPR and detect barriers

## Verification Queries

### Check patient comorbidity distribution
```sql
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE has_diabetes) as diabetes,
    COUNT(*) FILTER (WHERE has_hypertension) as hypertension,
    COUNT(*) FILTER (WHERE has_heart_failure) as heart_failure,
    COUNT(*) FILTER (WHERE has_obesity) as obesity,
    COUNT(*) FILTER (WHERE ckd_diagnosed) as ckd
FROM patients;
```

### Check prescription adherence
```sql
SELECT
    p.medication_class,
    COUNT(DISTINCT r.patient_id) as patients_with_refills,
    ROUND(AVG(r.days_supply), 1) as avg_days_supply,
    COUNT(r.id) / COUNT(DISTINCT r.patient_id) as avg_refills_per_patient
FROM prescriptions p
JOIN refills r ON r.prescription_id = p.id
WHERE r.fill_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY p.medication_class
ORDER BY patients_with_refills DESC;
```

### Check eGFR progression over time
```sql
WITH egfr_trend AS (
    SELECT
        patient_id,
        value_numeric as egfr,
        observation_date,
        LAG(value_numeric) OVER (PARTITION BY patient_id ORDER BY observation_date) as prev_egfr,
        LAG(observation_date) OVER (PARTITION BY patient_id ORDER BY observation_date) as prev_date
    FROM observations
    WHERE observation_type = 'eGFR'
)
SELECT
    patient_id,
    egfr as current_egfr,
    prev_egfr,
    ROUND((egfr - prev_egfr) / (EXTRACT(EPOCH FROM (observation_date - prev_date)) / 31536000), 2) as egfr_change_per_year
FROM egfr_trend
WHERE prev_egfr IS NOT NULL
ORDER BY egfr_change_per_year
LIMIT 20;
```

## Testing MCP Server Tools

After running the database enhancement, test each MCP tool:

### Test Phase 1: Pre-Diagnosis Risk
```sql
-- Find patients without recent eGFR (candidates for Phase 1)
SELECT id, medical_record_number, first_name, last_name,
       has_diabetes, has_hypertension, systolic_bp
FROM patients
WHERE NOT EXISTS (
    SELECT 1 FROM observations
    WHERE patient_id = patients.id
      AND observation_type = 'eGFR'
      AND observation_date >= CURRENT_DATE - INTERVAL '6 months'
);
```

### Test Phase 2: KDIGO Classification
```sql
-- Find patients with recent eGFR and uACR
SELECT
    p.id,
    p.medical_record_number,
    egfr.value_numeric as egfr,
    uacr.value_numeric as uacr
FROM patients p
JOIN LATERAL (
    SELECT value_numeric
    FROM observations
    WHERE patient_id = p.id AND observation_type = 'eGFR'
    ORDER BY observation_date DESC
    LIMIT 1
) egfr ON true
JOIN LATERAL (
    SELECT value_numeric
    FROM observations
    WHERE patient_id = p.id AND observation_type = 'uACR'
    ORDER BY observation_date DESC
    LIMIT 1
) uacr ON true
LIMIT 10;
```

### Test Phase 3: Treatment Recommendations
```sql
-- Find patients eligible for Jardiance
SELECT
    p.id,
    p.medical_record_number,
    p.has_diabetes,
    p.on_sglt2i,
    egfr.value_numeric as egfr,
    uacr.value_numeric as uacr
FROM patients p
JOIN LATERAL (
    SELECT value_numeric
    FROM observations
    WHERE patient_id = p.id AND observation_type = 'eGFR'
    ORDER BY observation_date DESC
    LIMIT 1
) egfr ON true
JOIN LATERAL (
    SELECT value_numeric
    FROM observations
    WHERE patient_id = p.id AND observation_type = 'uACR'
    ORDER BY observation_date DESC
    LIMIT 1
) uacr ON true
WHERE p.has_diabetes = TRUE
  AND egfr.value_numeric >= 20
  AND egfr.value_numeric < 75
  AND uacr.value_numeric >= 30
  AND p.on_sglt2i = FALSE
LIMIT 10;
```

### Test Phase 4: Adherence Monitoring
```sql
-- Calculate MPR for SGLT2i patients
SELECT
    p.id,
    p.medical_record_number,
    pr.medication_name,
    COUNT(r.id) as refill_count,
    SUM(r.days_supply) as total_days_supplied,
    ROUND(100.0 * SUM(r.days_supply) / 365, 1) as mpr_percentage
FROM patients p
JOIN prescriptions pr ON pr.patient_id = p.id
JOIN refills r ON r.prescription_id = pr.id
WHERE pr.medication_class = 'SGLT2i'
  AND r.fill_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY p.id, p.medical_record_number, pr.medication_name
HAVING SUM(r.days_supply) < 330  -- MPR < 90%
ORDER BY mpr_percentage;
```

## Troubleshooting

### Error: "relation already exists"
**Solution**: Some tables already exist. Either:
1. Drop existing tables first: `DROP TABLE IF EXISTS table_name CASCADE;`
2. Or modify scripts to use `CREATE TABLE IF NOT EXISTS`

### Error: "column already exists"
**Solution**: Schema already enhanced. Skip to populate_500_patients.sql

### Slow execution
**Solution**: Normal for large data generation. Wait 5-10 minutes.

### Refill gaps seem unrealistic
**Solution**: Intentional! Real-world adherence is imperfect. Gaps simulate missed refills (10-15% miss rate).

## Next Steps

1. ✅ **Run database enhancement** (you are here)
2. **Deploy to Render**: Push changes and redeploy backend
3. **Test MCP server**: Use MCP Client to call phase-based tools
4. **Integrate with Doctor Chat**: Update Doctor Agent to leverage MCP tools
5. **Monitor adherence**: Use Phase 4 tool to identify at-risk patients

## Support

For issues or questions:
- Check logs for specific error messages
- Review verification queries to confirm data integrity
- Consult the Unified CKD Specification document
- Review MCP_INTEGRATION_GUIDE.md for usage examples

---

**Database Ready!** 🎉 The CKD database now contains all variables from the specification document and is fully compatible with MCP server v2.0 phase-based tools.
