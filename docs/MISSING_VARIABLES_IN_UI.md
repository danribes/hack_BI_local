# Missing Variables in Patient Card UI

## Overview

The database contains **180+ comprehensive CKD variables** added through the enhancement scripts, but the frontend patient card currently only displays a **subset** of these variables. This document lists all the missing variables and proposes where they should be displayed.

## Variables in Database But NOT Displayed in UI

### 1. **Vital Signs** (Partially Missing)
Currently displayed: None
Missing from UI:
- `systolic_bp` - Systolic blood pressure
- `diastolic_bp` - Diastolic blood pressure
- `bp_control_status` - Blood pressure control status
- `heart_rate` - Heart rate
- `oxygen_saturation` - O2 saturation
- `bmi` - Body Mass Index (calculated but raw value not shown)

### 2. **Comorbidities** (Mostly Missing)
Currently displayed: Only shown indirectly through conditions table
Missing from UI:
- `has_diabetes` - General diabetes flag
- `has_type1_diabetes` - Type 1 diabetes
- `has_type2_diabetes` - Type 2 diabetes
- `has_hypertension` - General hypertension flag
- `has_essential_hypertension` - Essential hypertension
- `has_renovascular_hypertension` - Renovascular hypertension
- `has_hypertensive_ckd` - Hypertensive CKD
- `has_heart_failure` - Heart failure
- `has_cad` - Coronary artery disease
- `has_mi` - Myocardial infarction
- `has_atrial_fibrillation` - Atrial fibrillation
- `has_stroke` - Stroke history
- `has_peripheral_vascular_disease` - PVD
- `has_aki_history` - AKI history
- `has_lupus` - Systemic lupus erythematosus
- `has_ra` - Rheumatoid arthritis
- `has_obesity` - Obesity
- `has_metabolic_syndrome` - Metabolic syndrome
- `has_hyperlipidemia` - Hyperlipidemia
- `has_uti` - Urinary tract infection
- `has_kidney_stones` - Kidney stones
- `has_gout` - Gout
- `has_polycystic_kidney_disease` - PKD
- `resistant_hypertension` - Resistant hypertension flag
- `antihypertensive_count` - Number of antihypertensive meds

### 3. **Clinical Symptoms** (Completely Missing)
Missing from UI:
- `appetite` - Appetite status (Good/Poor)
- `pedal_edema` - Pedal edema present
- `anemia` - Anemia flag
- `chronic_nsaid_use_months` - Chronic NSAID use duration
- `chronic_ppi_use_months` - Chronic PPI use duration
- `diabetes_duration_years` - How long patient has had diabetes
- `previous_aki_episodes` - Number of previous AKI episodes

### 4. **Monitoring & Treatment** (Partially Missing)
Currently displayed: Basic monitoring device and status
Missing from UI:
- `monitoring_status` - Active/inactive monitoring
- `current_risk_score` - Current risk score value
- `next_visit_date` - Next scheduled visit
- Detailed medication adherence metrics
- Refill history and MPR (Medication Possession Ratio)

### 5. **Laboratory Results** (Many Missing)
Currently displayed: eGFR, Creatinine, BUN, uACR, BP, LDL/HDL, HbA1c, Hemoglobin, Potassium, Calcium, Phosphorus, Albumin

Missing from UI (available in `observations` table but not always shown):
- Uric acid
- Triglycerides
- Total cholesterol
- And many other observation types

### 6. **Urine Analysis Table** (Completely Missing)
The `urine_analysis` table has detailed urine microscopy data that's **not displayed at all**:
- `blood_urea` (BUN)
- `specific_gravity`
- `albumin_level` (0-5 scale)
- `sugar_level` (0-5 scale)
- `rbc_status` (Normal/Abnormal)
- `pus_cells` (Normal/Abnormal)
- `pus_cell_clumps` (Present/Not Present)
- `bacteria` (Present/Not Present)

### 7. **Hematology Table** (Completely Missing)
The `hematology` table has complete blood count data that's **not displayed at all**:
- `hemoglobin` (g/dL)
- `packed_cell_volume` (PCV %)
- `rbc_count` (millions/cmm)
- `wbc_count` (cells/cumm)
- `platelet_count` (thousands/cmm)

### 8. **Prescription & Adherence Data** (Mostly Missing)
Currently displayed: Only high-level "on RAS inhibitor" and "on SGLT2i" flags

Missing from UI:
- Complete prescription list from `prescriptions` table
  - Medication names, dosages, frequencies
  - Prescribed dates, prescriber info
  - Refills authorized/remaining
  - Status (active/discontinued)
- Refill history from `refills` table
  - Fill dates, quantities dispensed
  - Days supply per refill
  - Pharmacy information
  - Patient costs
- Adherence metrics from `adherence_monitoring` table
  - MPR (Medication Possession Ratio)
  - Adherence status (Good/Suboptimal/Poor)
  - Gap days and longest gaps
  - Barriers detected
  - eGFR/uACR trends correlated with adherence

### 9. **Risk Assessments** (Partially Missing)
Currently displayed: Basic risk level from KDIGO

Missing from UI:
- Data from `patient_risk_assessments` table:
  - Assessment type (pre_diagnosis, kdigo, treatment, adherence)
  - Risk tier for non-CKD patients
  - Progression risk (RAPID, MODERATE, SLOW, STABLE)
  - eGFR decline rate (mL/min/year)
  - Monitoring frequency recommendations
  - Risk factors (JSONB data)
  - Missing data alerts
  - Priority level (URGENT, ROUTINE, STANDARD)

### 10. **Treatment Recommendations** (Completely Missing)
The `treatment_recommendations` table data is **not displayed at all**:
- Medication recommendations (Jardiance, RAS inhibitors, RenalGuard)
- Indication strength (STRONG, MODERATE, NOT_INDICATED, CONTRAINDICATED)
- Evidence grade (1A, 2B, etc.)
- Reasoning and contraindications
- Safety monitoring requirements
- Recommended dosages
- RenalGuard frequency and rationale
- Cost-effectiveness data
- Implementation status and outcomes

## Recommended UI Enhancements

### **Priority 1: High Value, Easy to Add**

1. **Add Vital Signs Card**
   - Display systolic_bp, diastolic_bp, heart_rate, oxygen_saturation
   - Show bp_control_status with color coding

2. **Add Comorbidities Summary Card**
   - Show all boolean comorbidity flags in a clean grid
   - Use checkmarks/badges for present conditions
   - Group by category (Cardiovascular, Metabolic, Renal, etc.)

3. **Add Clinical Symptoms Section**
   - Display appetite, pedal_edema, anemia
   - Show NSAID/PPI use duration if >0
   - Display diabetes duration and previous AKI episodes

### **Priority 2: Medium Value, Moderate Effort**

4. **Add Urine Analysis Card**
   - Display most recent urine analysis results
   - Show microscopy findings (RBC, pus cells, bacteria)
   - Color-code abnormal results

5. **Add Hematology/CBC Card**
   - Display complete blood count results
   - Highlight abnormal values
   - Show trends if multiple tests available

6. **Expand Medications Section**
   - Show complete prescription list with dosages
   - Display refill history timeline
   - Show adherence metrics (MPR) with visual indicators

### **Priority 3: Lower Priority**

7. **Add Risk Assessment Details Section**
   - Show comprehensive risk assessment data
   - Display progression risk and eGFR decline rate
   - Show missing data alerts

8. **Add Treatment Recommendations Section**
   - Display medication recommendations with evidence grades
   - Show reasoning and contraindications
   - Track implementation status

## Implementation Impact

**Backend**: ✅ Already returns all data (using `SELECT *`)
**Frontend**: ❌ Needs updates to:
1. TypeScript interfaces in `App.tsx`
2. Patient detail view JSX to display new sections
3. Possibly create new sub-components for better organization

## Summary Statistics

- **Total variables in database**: ~180+
- **Variables currently displayed**: ~40
- **Missing variables**: ~140
- **Coverage**: ~22% of available data

The frontend is only showing about **1/5th of the available patient data**!
