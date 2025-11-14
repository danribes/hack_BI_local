# Comprehensive CKD Variables List for Early Diagnosis, Monitoring, and Management

**Based on**: Kaggle CKD Dataset + RenalGuard Platform Specification  
**Document Version**: 1.0  
**Date**: November 14, 2025  
**Purpose**: Complete variable dictionary for CKD management from risk assessment through treatment adherence

---

## Table of Contents

1. [Demographic & Patient Characteristics](#1-demographic--patient-characteristics)
2. [Vital Signs](#2-vital-signs)
3. [Primary Kidney Function Laboratory Values](#3-primary-kidney-function-laboratory-values)
4. [Urine Microscopy & Analysis](#4-urine-microscopy--analysis)
5. [Hematology Values](#5-hematology-values)
6. [Metabolic Panel & Electrolytes](#6-metabolic-panel--electrolytes)
7. [Lipid Panel](#7-lipid-panel)
8. [Mineral & Bone Metabolism](#8-mineral--bone-metabolism)
9. [Comorbidities & Diagnoses](#9-comorbidities--diagnoses)
10. [Clinical Symptoms](#10-clinical-symptoms)
11. [Medications](#11-medications)
12. [Pharmacy & Adherence Data](#12-pharmacy--adherence-data)
13. [Risk Stratification & Clinical Decision Variables](#13-risk-stratification--clinical-decision-variables)
14. [Treatment Decision Variables](#14-treatment-decision-variables)
15. [Monitoring Frequency Variables](#15-monitoring-frequency-variables)
16. [Historical & Contextual Variables](#16-historical--contextual-variables)

---

## 1. DEMOGRAPHIC & PATIENT CHARACTERISTICS

| Variable | Type | Unit/Values | Clinical Purpose |
|----------|------|-------------|------------------|
| **Age** | Numerical | Years | Risk stratification (>40, >50, >65 critical thresholds) |
| **Sex** | Nominal | Male/Female | Lab reference ranges, risk adjustment |
| **Weight** | Numerical | kg or lbs | BMI calculation, volume status |
| **Height** | Numerical | cm or inches | BMI calculation |
| **BMI** | Calculated | kg/m² | Obesity risk factor (>30 = high risk, >35 = severe) |

---

## 2. VITAL SIGNS

| Variable | Type | Unit | Normal Range | Clinical Purpose |
|----------|------|------|--------------|------------------|
| **Systolic Blood Pressure (SBP)** | Numerical | mmHg | <140 (<130 if proteinuria) | HTN classification, CKD risk tier 1 indicator |
| **Diastolic Blood Pressure (DBP)** | Numerical | mmHg | <90 (<80 if proteinuria) | HTN assessment |
| **Blood Pressure Control Status** | Nominal | Controlled/Uncontrolled | - | Risk modifier |
| **Heart Rate** | Numerical | bpm | 60-100 | Cardiovascular status |
| **Oxygen Saturation (SpO2)** | Numerical | % | >95 | Cardiopulmonary status (advanced CKD) |

---

## 3. PRIMARY KIDNEY FUNCTION LABORATORY VALUES
*(Gold Standard)*

| Variable | Type | Unit | Normal Range | Clinical Purpose |
|----------|------|------|--------------|------------------|
| **eGFR** | Numerical | mL/min/1.73m² | ≥90 | **CRITICAL**: KDIGO G-stage classification (G1-G5) |
| **Serum Creatinine** | Numerical | mg/dL | 0.6-1.2 | Used to calculate eGFR |
| **uACR** | Numerical | mg/g | <30 | **CRITICAL**: KDIGO A-stage classification (A1-A3) |
| **Blood Urea (BUN)** | Numerical | mg/dL | 7-20 | Kidney function marker |
| **Urine Specific Gravity** | Nominal | - | 1.005-1.025 | Kidney concentration ability |
| **Albumin (Urine)** | Nominal | 0-5 scale | 0 | Proteinuria severity (Kaggle dataset) |
| **Sugar (Urine)** | Nominal | 0-5 scale | 0 | Glucosuria indicator |

---

## 4. URINE MICROSCOPY & ANALYSIS
*(Kaggle Dataset)*

| Variable | Type | Values | Clinical Purpose |
|----------|------|--------|------------------|
| **Red Blood Cells (RBC)** | Nominal | Normal/Abnormal | Hematuria indicator (glomerular damage) |
| **Pus Cells** | Nominal | Normal/Abnormal | Pyuria (infection/inflammation) |
| **Pus Cell Clumps** | Nominal | Present/Not Present | Infection severity |
| **Bacteria** | Nominal | Present/Not Present | UTI indicator |

---

## 5. HEMATOLOGY VALUES

| Variable | Type | Unit | Normal Range | Clinical Purpose |
|----------|------|------|--------------|------------------|
| **Hemoglobin** | Numerical | g/dL | 12-16 | Anemia screening (common CKD Stage 3+) |
| **Packed Cell Volume (PCV)** | Numerical | % | 38-52 | Hematocrit alternative measure |
| **Red Blood Cell Count (RBC)** | Numerical | millions/cmm | 4.5-5.5 | Anemia assessment |
| **White Blood Cell Count (WBC)** | Numerical | cells/cumm | 4,000-11,000 | Infection/inflammation marker |
| **Anemia** | Nominal | Yes/No | - | CKD complication indicator |

---

## 6. METABOLIC PANEL & ELECTROLYTES

| Variable | Type | Unit | Normal Range | Clinical Purpose |
|----------|------|------|--------------|------------------|
| **Blood Glucose Random (BGR)** | Numerical | mg/dL | 70-140 | Diabetes screening |
| **Fasting Glucose** | Numerical | mg/dL | 70-100 | Diabetes indicator |
| **HbA1c** | Numerical | % | <7.0 | Glycemic control (affects CKD progression) |
| **Sodium** | Numerical | mEq/L | 135-145 | Electrolyte balance |
| **Potassium** | Numerical | mEq/L | 3.5-5.0 | **CRITICAL**: SGLT2i/RAS inhibitor safety |
| **Bicarbonate (HCO3)** | Numerical | mEq/L | 22-29 | Metabolic acidosis marker |
| **Serum Albumin** | Numerical | g/dL | 3.5-5.0 | Nutritional status, proteinuria severity |

---

## 7. LIPID PANEL
*(Cardiovascular Risk)*

| Variable | Type | Unit | Target Range | Clinical Purpose |
|----------|------|------|--------------|------------------|
| **Total Cholesterol** | Numerical | mg/dL | <200 | CV risk marker |
| **LDL Cholesterol** | Numerical | mg/dL | <100 | Primary lipid target in CKD |
| **HDL Cholesterol** | Numerical | mg/dL | >40 | Protective factor |
| **Triglycerides** | Numerical | mg/dL | <150 | Metabolic risk marker |

---

## 8. MINERAL & BONE METABOLISM
*(CKD-MBD)*

| Variable | Type | Unit | Normal Range | Clinical Purpose |
|----------|------|------|--------------|------------------|
| **Calcium (Corrected)** | Numerical | mg/dL | 8.5-10.5 | CKD-Mineral Bone Disorder monitoring |
| **Phosphorus** | Numerical | mg/dL | 2.5-4.5 | CKD-MBD monitoring |
| **Parathyroid Hormone (PTH)** | Numerical | pg/mL | 10-65 | Secondary hyperparathyroidism |
| **Uric Acid** | Numerical | mg/dL | 3.5-7.0 | Elevated levels (>7) = CKD risk |

---

## 9. COMORBIDITIES & DIAGNOSES
*(ICD-10 Codes)*

### A. CKD Staging (Primary Diagnoses)

- **N18.1** - CKD, stage 1
- **N18.2** - CKD, stage 2
- **N18.31** - CKD, stage 3a
- **N18.32** - CKD, stage 3b
- **N18.4** - CKD, stage 4
- **N18.5** - CKD, stage 5
- **N18.6** - End Stage Renal Disease (ESRD)
- **N18.9** - CKD, unspecified

### B. Diabetes (Major Risk Factor)

| Variable | ICD-10 Code | Proxy Indicator |
|----------|-------------|-----------------|
| Diabetes Mellitus | Yes/No | DM diagnosis |
| Type 2 Diabetes | E11.22, E11.9, E11.65 | +Age >40 = Tier 1 risk |
| Type 1 Diabetes | E10.22, E10.9 | +Duration >5 years = High risk |

### C. Hypertension (Major Risk Factor)

| Variable | ICD-10 Code | Clinical Context |
|----------|-------------|------------------|
| Hypertension | Yes/No | HTN diagnosis |
| Essential HTN | I10 | Primary hypertension |
| Renovascular HTN | I15.0 | Kidney-related HTN |
| Hypertensive CKD | I12.0, I12.9 | Combined HTN+CKD |
| Resistant HTN | - | ≥3 antihypertensive meds |

### D. Cardiovascular Disease (High CKD Risk)

| Condition | ICD-10 Code | Risk Impact |
|-----------|-------------|-------------|
| Heart Failure | I50.x | 25-point risk score (Tier 1) |
| Coronary Artery Disease (CAD) | I25.10 | Yes/No (Kaggle dataset) |
| Myocardial Infarction | I21.9 | CV event history |
| Atrial Fibrillation | I48.91 | Anticoagulation needed |
| Stroke | I63.9 | CV event history |
| Peripheral Vascular Disease | I73.9 | Atherosclerosis marker |

### E. Other Risk Conditions

| Condition | ICD-10 Code | Risk Impact |
|-----------|-------------|-------------|
| Obesity | E66.9 | BMI >30 = 10 points, >35 = 15 points |
| Hyperlipidemia | E78.5 | CV risk modifier |
| Acute Kidney Injury (AKI) | N17.9 | 30-point risk score (4x CKD risk) |
| Urinary Tract Infection | N39.0 | Recurrent UTIs = Moderate risk |
| Kidney Stones | N20.0 | Moderate risk factor |
| Gout | M10.9 | Hyperuricemia link |
| Lupus | M32.14 | Autoimmune CKD risk |
| Rheumatoid Arthritis | M06.9 | Autoimmune risk |
| Polycystic Kidney Disease | Q61.9 | Genetic CKD |

---

## 10. CLINICAL SYMPTOMS
*(Kaggle Dataset)*

| Variable | Type | Values | Clinical Purpose |
|----------|------|--------|------------------|
| **Appetite** | Nominal | Good/Poor | Uremia symptom (advanced CKD) |
| **Pedal Edema** | Nominal | Yes/No | Fluid overload indicator |

---

## 11. MEDICATIONS
*(Treatment & Proxy Indicators)*

### A. CKD-Specific Disease-Modifying Therapies

| Medication Class | Generic Names | Clinical Significance |
|------------------|---------------|----------------------|
| **SGLT2 Inhibitors** | Jardiance (Empagliflozin), Farxiga (Dapagliflozin), Invokana (Canagliflozin), Steglatro (Ertugliflozin) | **STRONG CKD INDICATOR**: 30-point risk score; confirms CKD with proteinuria |
| **ACE Inhibitors** | Lisinopril, Enalapril, Ramipril, Benazepril, Captopril | First-line proteinuria treatment; 10-point proxy if labs missing |
| **ARBs** | Losartan, Valsartan, Irbesartan, Olmesartan, Telmisartan | Alternative to ACE-I; same CKD protection |

### B. Antihypertensive Medications (HTN Proxy)

| Medication Class | Examples | Proxy Interpretation |
|------------------|----------|---------------------|
| **Calcium Channel Blockers** | Amlodipine, Nifedipine, Diltiazem, Verapamil | Second-line HTN; may indicate inadequate control |
| **Beta Blockers** | Metoprolol, Carvedilol, Atenolol, Bisoprolol | CV disease + HTN |
| **Diuretics** | Hydrochlorothiazide, Furosemide, Chlorthalidone, Spironolactone | Loop diuretics = volume overload/advanced CKD |
| **≥3 BP Medications** | Any combination | 20-point risk score (resistant HTN) |

### C. Diabetes Medications (Diabetes Proxy)

| Medication Class | Examples | Proxy Interpretation |
|------------------|----------|---------------------|
| **Metformin** | Metformin, Glucophage | First-line diabetes (requires eGFR >30) |
| **Sulfonylureas** | Glipizide, Glyburide, Glimepiride | Older diabetes drugs |
| **DPP-4 Inhibitors** | Sitagliptin, Linagliptin, Saxagliptin | Safe in CKD (Linagliptin) |
| **GLP-1 Agonists** | Semaglutide, Dulaglutide, Liraglutide | Weight loss + potential CKD protection |
| **Insulin** | Glargine, Aspart, NPH | Advanced/poorly controlled diabetes |

### D. Cardiovascular Medications

| Medication Class | Examples | Clinical Indication |
|------------------|----------|---------------------|
| **Statins** | Atorvastatin, Rosuvastatin, Simvastatin, Pravastatin | Recommended for all CKD Stage 3-5 |
| **Antiplatelets** | Aspirin, Clopidogrel | CV disease history |
| **Anticoagulants** | Warfarin, Apixaban, Rivaroxaban | Atrial fibrillation/DVT |
| **Allopurinol** | Allopurinol | Gout treatment; hyperuricemia link |

### E. Nephrotoxic Medications (RED FLAGS)

| Medication Class | Examples | Risk Impact |
|------------------|----------|-------------|
| **NSAIDs** | Ibuprofen, Naproxen, Indomethacin, Ketorolac | **AVOID in CKD**; 12-point risk score |
| **PPIs** | Omeprazole, Pantoprazole, Esomeprazole | Long-term use (>1 year) = 20-50% increased CKD risk |
| **Lithium** | Lithium carbonate | Chronic interstitial nephritis |
| **Calcineurin Inhibitors** | Tacrolimus, Cyclosporine | Transplant drugs; nephrotoxic |

### F. CKD Complication Treatments

| Medication | Indication | CKD Stage |
|------------|------------|-----------|
| **Erythropoietin** | Epoetin alfa, Darbepoetin | Anemia (CKD Stage 3b+) |
| **Phosphate Binders** | Sevelamer, Calcium Acetate | Hyperphosphatemia (Stage 4-5) |
| **Vitamin D Analogs** | Calcitriol, Paricalcitol | Secondary hyperparathyroidism |

---

## 12. PHARMACY & ADHERENCE DATA
*(Treatment Monitoring)*

### A. Prescription Fill Records

| Variable | Type | Clinical Purpose |
|----------|------|------------------|
| **rx_fill_date** | Date | Date prescription dispensed |
| **rx_number** | String | Unique prescription ID |
| **medication_name** | String | Generic/brand name |
| **ndc_code** | String | National Drug Code |
| **quantity_dispensed** | Integer | Number of units |
| **days_supply** | Integer | **CRITICAL** for MPR calculation |
| **refills_remaining** | Integer | Refill authorization |
| **fill_status** | Nominal | Filled/Not Picked Up/Transferred |
| **previous_fill_date** | Date | For gap calculation |
| **expected_refill_date** | Date | Previous fill + days supply |

### B. Calculated Adherence Metrics

| Metric | Formula | Threshold |
|--------|---------|-----------|
| **Medication Possession Ratio (MPR)** | (Total Days Supply) / (Days in Period) × 100% | ≥90% = Good |
| **Proportion of Days Covered (PDC)** | Days covered / Total days | ≥80% = Adequate |
| **Refill Gap Days** | Actual refill date - Expected refill date | >7 days = Alert |
| **Adherence Status** | - | <75% = Poor, 75-89% = Suboptimal, ≥90% = Good |

---

## 13. RISK STRATIFICATION & CLINICAL DECISION VARIABLES

### A. Three-Tier Risk Classification (Pre-Diagnosis)

| Tier | Risk Score | Testing Priority | Expected Yield |
|------|-----------|------------------|----------------|
| **TIER 1: HIGH RISK** | ≥40 points | Order tests immediately | 40-60% abnormal |
| **TIER 2: MODERATE RISK** | 20-39 points | Order at next visit (1-3 months) | 20-35% abnormal |
| **TIER 3: LOW RISK** | <20 points | Standard screening (annual/age 40) | <10% abnormal |

### B. KDIGO Classification Matrix (Post-Diagnosis)

| GFR Category | A1 (<30 mg/g) | A2 (30-300 mg/g) | A3 (>300 mg/g) |
|--------------|---------------|------------------|----------------|
| **G1 (≥90)** | LOW (Green) | MODERATE (Yellow) | HIGH (Orange) |
| **G2 (60-89)** | LOW (Green) | MODERATE (Yellow) | HIGH (Orange) |
| **G3a (45-59)** | MODERATE (Yellow) | HIGH (Orange) | VERY HIGH (Red) |
| **G3b (30-44)** | HIGH (Orange) | VERY HIGH (Red) | VERY HIGH (Red) |
| **G4 (15-29)** | VERY HIGH (Red) | VERY HIGH (Red) | VERY HIGH (Red) |
| **G5 (<15)** | VERY HIGH (Red) | VERY HIGH (Red) | VERY HIGH (Red) |

### C. Trajectory Analysis Variables

| Variable | Calculation | Risk Classification |
|----------|-------------|---------------------|
| **eGFR Annual Decline Rate** | (eGFR₁ - eGFR₂) / Years | >5 mL/min/year = RAPID (Critical) |
| **uACR Change** | % change over time | >15% increase = Clinical worsening |
| **Progression Status** | Trend analysis | Rapid/Moderate/Slow/Stable |

---

## 14. TREATMENT DECISION VARIABLES

### A. Jardiance (SGLT2i) Eligibility

| Indication Level | Criteria | Evidence Grade |
|------------------|----------|----------------|
| **STRONG** | T2DM + eGFR ≥20 + uACR ≥200 OR Non-diabetic CKD + eGFR 20-75 + uACR ≥200 | Grade 1A |
| **MODERATE** | T2DM + eGFR ≥20 + uACR 30-200 | Grade 2B |
| **CONTRAINDICATED** | eGFR <20, Type 1 DM with DKA history, recurrent genital infections | - |

### B. RAS Inhibitor Logic

| Condition | Action | Rationale |
|-----------|--------|-----------|
| uACR ≥30 WITHOUT RAS inhibitor | Start ACE-I or ARB BEFORE Jardiance | 30-40% proteinuria reduction |
| On RAS inhibitor | Monitor K+ and creatinine 1-2 weeks after initiation | Safety |

---

## 15. MONITORING FREQUENCY VARIABLES

| Risk Level | Lab Frequency | Clinic Visits | RenalGuard Monitoring |
|------------|---------------|---------------|-----------------------|
| **LOW (Green)** | Annually | Annually | Not needed |
| **MODERATE (Yellow)** | Every 6-12 months | Every 6-12 months | If A2/A3: Every 6-12 months |
| **HIGH (Orange)** | Every 3-6 months | Every 3-6 months | Every 3-6 months |
| **VERY HIGH (Red)** | Every 1-3 months | Every 1-3 months | Monthly |

---

## 16. HISTORICAL & CONTEXTUAL VARIABLES

| Variable | Type | Clinical Purpose |
|----------|------|------------------|
| **Family History of CKD** | Nominal | Risk modifier (with DM/HTN) |
| **Smoking History** | Nominal | Current/Former/Never |
| **Chronic Medication Use Duration** | Numerical | NSAIDs >1 month, PPIs >1 year |
| **Diabetes Duration** | Numerical | Type 1 DM >5 years = High risk |
| **Historical eGFR/uACR Values** | Time series | Trajectory analysis |
| **Previous AKI Episodes** | Count | 4x CKD risk multiplier |

---

## VARIABLE SUMMARY BY DATA SOURCE

### Kaggle CKD Dataset (25 features)
- **11 Numerical**: Age, BP, BGR, BU, SC, Sodium, Potassium, Hemoglobin, PCV, WBC, RBC
- **14 Nominal**: Specific Gravity, Albumin, Sugar, RBC, Pus Cells, PCC, Bacteria, HTN, DM, CAD, Appetite, Pedal Edema, Anemia, Class

### RenalGuard Specification (85+ variables)
- **Laboratory**: eGFR, uACR, electrolytes, metabolic panel, lipids, bone metabolism
- **Medications**: 40+ specific drugs across 8 therapeutic classes
- **Diagnoses**: 50+ ICD-10 codes
- **Adherence**: 12+ pharmacy variables + calculated metrics
- **Clinical**: Risk scores, KDIGO staging, trajectory analysis

---

## KEY INSIGHTS FOR IMPLEMENTATION

### 1. Data Adaptability Strategy
- **Tier 1 (Gold Standard)**: eGFR + uACR → KDIGO staging
- **Tier 2 (Clinical Indicators)**: Diagnoses, vitals, symptoms → Risk scoring
- **Tier 3 (Treatment Proxies)**: Medications → Inferred conditions when labs missing

### 2. Critical Variables for Early Diagnosis
1. **eGFR** (primary kidney function)
2. **uACR** (kidney damage marker)
3. **Blood Pressure** (modifiable risk factor)
4. **HbA1c** (diabetes control)
5. **Comorbidities** (diabetes, hypertension, heart failure)

### 3. Essential Monitoring Variables
- **Quarterly**: eGFR, uACR, Potassium (if on SGLT2i/RAS inhibitor)
- **Every 6 months**: HbA1c, lipid panel
- **Annual**: Hemoglobin, calcium, phosphorus, PTH (if Stage 3+)

### 4. Adherence-Critical Variables
- **days_supply** (for MPR calculation)
- **rx_fill_date** (gap detection)
- **medication_name** (SGLT2i and RAS inhibitor focus)

---

## REFERENCES

1. **Kaggle CKD Dataset**: https://www.kaggle.com/datasets/mansoordaku/ckdisease
2. **UCI Machine Learning Repository**: Chronic Kidney Disease Dataset
3. **RenalGuard Platform Specification**: Unified_CKD_Complete_Specification_Enhanced_v3_Adherence_Risk.docx
4. **KDIGO 2024 Guidelines**: Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease
5. **EMPA-KIDNEY Trial**: Evidence for SGLT2 inhibitor efficacy in CKD

---

**Document End**
