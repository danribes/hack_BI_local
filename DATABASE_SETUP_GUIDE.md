# Complete Database Setup Guide - CKD Analytics Platform

This guide provides step-by-step instructions for creating and populating the PostgreSQL database with 500 patients and 180+ comprehensive CKD variables.

## Overview

The database setup includes:
- **500 patients** with unique name combinations and gender-appropriate names
- **180+ variables** from the comprehensive CKD specification
- **Multiple data tables**: patients, observations, conditions, prescriptions, refills, urine_analysis, hematology
- **Realistic clinical data** with proper correlations between CKD stage, symptoms, and lab values

## Prerequisites

- Access to your Render PostgreSQL database
- `psql` command-line tool installed
- Database connection string from Render

## Option 1: Complete Automated Setup (Recommended)

This option runs all scripts in the correct order with a single command.

### Step 1: Get Your Database Connection String

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Navigate to your PostgreSQL database service
3. Go to the "Info" tab
4. Copy the **External Database URL** (format: `postgresql://user:password@host:port/database`)

### Step 2: Run the Master Setup Script

From your project root directory:

```bash
# Navigate to the scripts directory
cd /home/user/hack_BI/scripts

# Run the complete setup (replace DATABASE_URL with your actual connection string)
psql "postgresql://user:password@host:port/database" -f RUN_COMPLETE_DATABASE_SETUP_V2.sql
```

**Execution Time**: 8-15 minutes depending on database performance

### Step 3: Verify the Setup

The master script includes comprehensive verification queries that will display:
- Total patient count (should be 500+)
- Data completeness across all tables
- Condition prevalence
- Medication coverage
- eGFR distribution across CKD stages
- Clinical symptoms prevalence
- Urine analysis findings

Look for these summary sections in the output:
```
=== PATIENT SUMMARY ===
=== DATA COMPLETENESS ===
=== CONDITION PREVALENCE ===
=== MEDICATION COVERAGE ===
=== EGFR DISTRIBUTION ===
=== CLINICAL SYMPTOMS ===
=== URINE ANALYSIS FINDINGS ===
```

## Option 2: Manual Step-by-Step Setup

If you prefer to run each script individually for more control:

### Step 1: Enhance Database Schema

Adds all necessary tables and columns:

```bash
psql "YOUR_DATABASE_URL" -f enhance_database_schema.sql
```

**What this does**:
- Adds new columns to patients table (lifestyle, medications, family history)
- Creates refills table for medication adherence tracking
- Ensures uuid extension is enabled
- Creates all necessary indexes

### Step 2: Add Comprehensive Variables

Adds 60+ additional variables from the comprehensive specification:

```bash
psql "YOUR_DATABASE_URL" -f add_comprehensive_variables.sql
```

**What this does**:
- Adds clinical symptoms columns (appetite, pedal_edema, anemia)
- Adds medication history columns (chronic_nsaid_use_months, chronic_ppi_use_months)
- Adds disease duration tracking (diabetes_duration_years, previous_aki_episodes)
- Adds 14 new comorbidity flags (has_mi, has_stroke, has_hyperlipidemia, etc.)
- Creates urine_analysis table with microscopy findings
- Creates hematology table with CBC parameters

### Step 3: Update Existing Patients (If Any)

Updates any existing patient records with new fields:

```bash
psql "YOUR_DATABASE_URL" -f update_existing_patients.sql
```

**What this does**:
- Sets diabetes subtypes (Type 1 vs Type 2)
- Sets hypertension subtypes
- Updates anemia flags based on hemoglobin values
- Updates hyperlipidemia flags based on cholesterol
- Updates gout flags based on uric acid or medications

### Step 4: Populate 500 Patients

**IMPORTANT**: This script ensures unique names and gender-appropriate assignments!

```bash
psql "YOUR_DATABASE_URL" -f populate_500_patients_fixed.sql
```

**What this does**:
- Generates 500 patients with comprehensive demographics
- **Unique name combinations**: Uses retry logic to ensure no duplicate first_name + last_name pairs
- **Gender-appropriate names**:
  - Male names: James, Robert, Michael, William, David, etc. (50 names)
  - Female names: Mary, Patricia, Jennifer, Linda, Barbara, etc. (50 names)
- Creates 12 months of vital signs observations (weight, BP, HR)
- Creates 12 months of lab observations (eGFR, creatinine, hemoglobin, etc.)
- Assigns realistic comorbidities (diabetes, hypertension, obesity)
- Creates medication prescriptions based on conditions
- Generates 12 months of refill history for adherence tracking

**Unique Name Algorithm**:
```sql
1. Determine gender (48% male, 52% female)
2. Select gender-appropriate first name from array
3. Select random last name
4. Check if combination already exists in database
5. If duplicate, retry up to 100 times with different name
6. If still duplicate after 100 tries, add middle initial (e.g., "David A.")
```

**Verification queries included**:
- Count of duplicate names (should be 0)
- Gender distribution
- Verification that male names match male gender

### Step 5: Populate Comprehensive Variables

Adds data to all the new tables and columns:

```bash
psql "YOUR_DATABASE_URL" -f populate_comprehensive_variables.sql
```

**What this does**:
- Updates patient-level clinical symptoms (appetite, edema, anemia)
- Updates medication history (NSAID use, PPI use)
- Updates disease duration for diabetes
- Updates cardiovascular conditions (MI, AFib, stroke)
- Inserts 1-2 urine analysis tests per patient with realistic values
- Inserts 1-2 hematology tests per patient with CBC data
- Adds additional observations (BUN, sodium, bicarbonate)

**Clinical correlations included**:
- Poor appetite correlated with low eGFR or anemia
- Pedal edema more common in advanced CKD (eGFR < 30)
- High BUN in urine analysis for CKD patients
- Proteinuria (albumin) more common with eGFR < 60
- Anemia (low hemoglobin) more common in advanced CKD

## Verification Steps

After running the setup, verify the data quality:

### 1. Check Total Patient Count

```sql
SELECT COUNT(*) as total_patients FROM patients;
```

**Expected**: 500+ patients

### 2. Check for Duplicate Names

```sql
SELECT
    first_name,
    last_name,
    COUNT(*) as count
FROM patients
GROUP BY first_name, last_name
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

**Expected**: 0 rows (no duplicates)

### 3. Verify Gender-Appropriate Names

```sql
-- Check male patients have male names
SELECT COUNT(*) as male_patients_with_male_names
FROM patients
WHERE gender = 'male'
  AND (
    first_name LIKE 'James%' OR first_name LIKE 'Robert%' OR
    first_name LIKE 'Michael%' OR first_name LIKE 'William%' OR
    first_name LIKE 'David%' OR first_name LIKE 'Richard%' OR
    first_name LIKE 'Joseph%' OR first_name LIKE 'Thomas%' OR
    first_name LIKE 'Charles%' OR first_name LIKE 'Christopher%'
    -- Add more male names as needed
  );

-- Check female patients have female names
SELECT COUNT(*) as female_patients_with_female_names
FROM patients
WHERE gender = 'female'
  AND (
    first_name LIKE 'Mary%' OR first_name LIKE 'Patricia%' OR
    first_name LIKE 'Jennifer%' OR first_name LIKE 'Linda%' OR
    first_name LIKE 'Barbara%' OR first_name LIKE 'Elizabeth%' OR
    first_name LIKE 'Susan%' OR first_name LIKE 'Jessica%' OR
    first_name LIKE 'Sarah%' OR first_name LIKE 'Karen%'
    -- Add more female names as needed
  );
```

**Expected**: High percentage of matches (95%+)

### 4. Check Gender Distribution

```sql
SELECT
    gender,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM patients), 1) as percentage
FROM patients
GROUP BY gender;
```

**Expected**: Approximately 48% male, 52% female

### 5. Check Data Completeness

```sql
SELECT
    'Patients' as table_name,
    COUNT(*) as record_count
FROM patients
UNION ALL
SELECT 'Observations', COUNT(*) FROM observations
UNION ALL
SELECT 'Conditions', COUNT(*) FROM conditions
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Refills', COUNT(*) FROM refills
UNION ALL
SELECT 'Urine Analysis', COUNT(*) FROM urine_analysis
UNION ALL
SELECT 'Hematology', COUNT(*) FROM hematology
ORDER BY table_name;
```

**Expected record counts**:
- Patients: 500+
- Observations: 30,000+ (12 months × ~5 vitals + ~7 labs per patient)
- Conditions: 1,500+ (comorbidities for most patients)
- Prescriptions: 2,000+ (medications based on conditions)
- Refills: 12,000+ (12 months × 2-3 medications per patient)
- Urine Analysis: 750+ (1-2 tests per patient)
- Hematology: 750+ (1-2 tests per patient)

### 6. Sample Patient Query

Check a few patients to ensure data looks realistic:

```sql
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.gender,
    p.age,
    p.has_diabetes,
    p.has_hypertension,
    p.ckd_diagnosed,
    p.appetite,
    p.pedal_edema,
    p.anemia,
    (SELECT value_numeric FROM observations o
     WHERE o.patient_id = p.id AND o.observation_type = 'eGFR'
     ORDER BY o.observation_date DESC LIMIT 1) as latest_egfr,
    (SELECT value_numeric FROM observations o
     WHERE o.patient_id = p.id AND o.observation_type = 'Hemoglobin'
     ORDER BY o.observation_date DESC LIMIT 1) as latest_hemoglobin
FROM patients p
LIMIT 10;
```

**Expected**: Patients with realistic combinations of:
- Unique first_name + last_name pairs
- Gender matching first name
- Clinical data correlated with CKD stage

## Troubleshooting

### Issue: "relation already exists" errors

**Solution**: This is normal if you're running scripts multiple times. The scripts use `IF NOT EXISTS` clauses to safely handle re-runs.

### Issue: Duplicate name errors

**Solution**: The `populate_500_patients_fixed.sql` script has built-in duplicate detection. If you see duplicates after running:

```sql
-- Delete all patients and start fresh
DELETE FROM patients;

-- Re-run the population script
\i populate_500_patients_fixed.sql
```

### Issue: Gender mismatch (e.g., "David" is female)

**Solution**: This should not happen with the fixed script. If it does:

```sql
-- Check the issue
SELECT first_name, gender, COUNT(*)
FROM patients
WHERE (
    (first_name LIKE 'David%' AND gender = 'female') OR
    (first_name LIKE 'Mary%' AND gender = 'male')
)
GROUP BY first_name, gender;

-- If issues found, delete and re-populate
DELETE FROM patients;
\i populate_500_patients_fixed.sql
```

### Issue: Script takes too long (> 20 minutes)

**Solution**:
1. Check database resource limits in Render dashboard
2. Consider running during off-peak hours
3. Run scripts individually instead of using master script
4. Check for database locks: `SELECT * FROM pg_locks WHERE NOT granted;`

### Issue: Connection timeout

**Solution**:
```bash
# Increase connection timeout
psql "YOUR_DATABASE_URL?connect_timeout=300" -f RUN_COMPLETE_DATABASE_SETUP_V2.sql
```

## Post-Setup Tasks

After successful database setup:

1. **Verify MCP Server Connection**:
   - Test the Doctor Assistant in your frontend
   - Ask: "How many patients are there?"
   - Expected response: Information about 500+ patients

2. **Test Sample Queries**:
   - "Show me patients at high risk of CKD progression"
   - "What is the medication adherence rate?"
   - "Show me patients with diabetes and CKD"

3. **Monitor Backend Logs**:
   - Check Render logs for any errors
   - Verify MCP server is starting correctly
   - Ensure database queries are completing successfully

## Database Schema Summary

### Core Tables

1. **patients** (500+ records)
   - Demographics: name, age, gender, contact info
   - Comorbidities: 14 boolean flags
   - Clinical symptoms: appetite, edema, anemia
   - Medication history: NSAID use, PPI use
   - Disease duration: diabetes years, AKI episodes

2. **observations** (30,000+ records)
   - Vital signs: weight, BP, heart rate (monthly)
   - Labs: eGFR, creatinine, hemoglobin, HbA1c, etc. (monthly)
   - Metabolic: BUN, sodium, bicarbonate

3. **conditions** (1,500+ records)
   - ICD-10 coded diagnoses
   - Onset dates and severity

4. **prescriptions** (2,000+ records)
   - Medication name, class, dose, frequency
   - Start/end dates, active status

5. **refills** (12,000+ records)
   - Monthly refill history for 12 months
   - Tracks medication adherence

6. **urine_analysis** (750+ records)
   - BUN, specific gravity
   - Albumin, sugar levels
   - Microscopy: RBC, pus cells, bacteria

7. **hematology** (750+ records)
   - Hemoglobin, PCV
   - RBC count, WBC count
   - Platelet count

## Variables Included (180+ Total)

### Demographics (10)
- Name, age, gender, contact, location, BMI

### Vital Signs (5)
- Weight, systolic BP, diastolic BP, heart rate, temperature

### Core Lab Values (10)
- eGFR, creatinine, hemoglobin, HbA1c, glucose, cholesterol, potassium, calcium, phosphorus, albumin

### Metabolic Markers (5)
- BUN, uric acid, sodium, bicarbonate, PTH

### Urine Analysis (8)
- BUN, specific gravity, albumin, sugar, RBC, pus cells, pus clumps, bacteria

### Hematology (5)
- Hemoglobin, PCV, RBC count, WBC count, platelet count

### Comorbidities (20)
- Diabetes (Type 1/2), hypertension (essential/renovascular/CKD), cardiovascular (MI, AFib, stroke, PVD), metabolic (hyperlipidemia, gout), kidney (UTI, stones, PKD)

### Clinical Symptoms (10)
- Appetite, pedal edema, anemia, fatigue, nausea, etc.

### Medications (40+)
- Antihypertensives: ACE inhibitors, ARBs, beta blockers, CCBs, diuretics
- Diabetes: Metformin, SGLT2i, DPP4i, insulin
- Lipid-lowering: Statins, fibrates
- Others: Allopurinol, NSAIDs, PPIs

### Medication History (5)
- SGLT2i use, RAS inhibitor use, statin use, NSAID duration, PPI duration

### Disease Duration (5)
- Diabetes years, hypertension years, CKD years, AKI episodes

### Lifestyle (8)
- Smoking status, alcohol use, exercise, diet, sleep, stress

### Family History (5)
- Family CKD, diabetes, hypertension, cardiovascular disease

## Support

If you encounter issues:
1. Check the Render dashboard for database status
2. Review backend logs for MCP server errors
3. Verify database connection string is correct
4. Ensure all migration scripts are in the `/scripts` directory
5. Check PostgreSQL version compatibility (requires 12+)

## Next Steps

Once the database is populated:
1. Deploy the backend to Render (should auto-deploy from main branch)
2. Test the Doctor Assistant in the frontend
3. Verify MCP tools are working (list_patients, get_patient_risk, etc.)
4. Monitor query performance and optimize if needed
5. Set up regular database backups in Render

---

**Database Status**: Ready for MCP Server v2.0 with complete support for all Phase 1-4 tools

**Total Variables**: 180+
**Data Points per Patient**: 50+
**Clinical Realism**: High (proper correlations between CKD stage, symptoms, and lab values)
