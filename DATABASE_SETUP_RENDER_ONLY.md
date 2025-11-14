# Database Setup Guide - Using Render.com Only

This guide shows you how to create and populate the PostgreSQL database with 500 patients using **only Render.com's web interface** - no local tools required!

## Overview

You'll populate your database with:
- **500 patients** with unique name combinations and gender-appropriate names
- **180+ variables** from the comprehensive CKD specification
- **Multiple data tables**: patients, observations, conditions, prescriptions, refills, urine_analysis, hematology

## Prerequisites

- Access to your Render.com account
- Your PostgreSQL database already created on Render

---

## Method 1: Using Render's Shell (Recommended)

This method uses Render's built-in database shell that runs directly in your browser.

### Step 1: Access Your Database Shell

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Navigate to your PostgreSQL database service
3. Click on the **"Shell"** tab in the top menu
4. Wait for the shell to connect (you'll see a PostgreSQL prompt)

### Step 2: Get the SQL Scripts from GitHub

You need to copy the SQL scripts from your GitHub repository. Here are the direct links:

1. **enhance_database_schema.sql**
   - URL: https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/enhance_database_schema.sql

2. **add_comprehensive_variables.sql**
   - URL: https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/add_comprehensive_variables.sql

3. **update_existing_patients.sql**
   - URL: https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/update_existing_patients.sql

4. **populate_500_patients_fixed.sql**
   - URL: https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/populate_500_patients_fixed.sql

5. **populate_comprehensive_variables.sql**
   - URL: https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/populate_comprehensive_variables.sql

### Step 3: Run Each Script in Order

For each script, follow these steps:

#### Script 1: Enhance Database Schema

1. Open https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/enhance_database_schema.sql in a new browser tab
2. Press `Ctrl+A` (Windows/Linux) or `Cmd+A` (Mac) to select all
3. Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac) to copy
4. Go back to the Render Shell tab
5. Click in the shell and paste the SQL code (`Ctrl+V` or `Cmd+V`)
6. Press `Enter` to execute
7. Wait for completion (you'll see "ALTER TABLE" messages)

#### Script 2: Add Comprehensive Variables

1. Open https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/add_comprehensive_variables.sql
2. Select all and copy (`Ctrl+A`, then `Ctrl+C`)
3. Paste into Render Shell
4. Press `Enter` to execute
5. Wait for completion (you'll see "ALTER TABLE" and "CREATE TABLE" messages)

#### Script 3: Update Existing Patients

1. Open https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/update_existing_patients.sql
2. Select all and copy
3. Paste into Render Shell
4. Press `Enter` to execute
5. Wait for completion (you'll see "UPDATE" messages)

#### Script 4: Populate 500 Patients (MOST IMPORTANT)

**This script ensures unique names and gender-appropriate assignments!**

1. Open https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/populate_500_patients_fixed.sql
2. Select all and copy
3. Paste into Render Shell
4. Press `Enter` to execute
5. **Wait 5-10 minutes** - this is the longest script (generates 500 patients with 12 months of data)
6. You'll see progress messages like "Inserted patient X of 500"

#### Script 5: Populate Comprehensive Variables

1. Open https://raw.githubusercontent.com/danribes/hack_BI/main/scripts/populate_comprehensive_variables.sql
2. Select all and copy
3. Paste into Render Shell
4. Press `Enter` to execute
5. Wait for completion (you'll see "UPDATE" and "INSERT" messages)

### Step 4: Verify the Setup

After running all scripts, verify your data in the Render Shell:

#### Check Total Patient Count

```sql
SELECT COUNT(*) as total_patients FROM patients;
```

**Expected**: 500 or more

#### Check for Duplicate Names

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

#### Check Gender Distribution

```sql
SELECT
    gender,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM patients), 1) as percentage
FROM patients
GROUP BY gender;
```

**Expected**: ~48% male, ~52% female

#### Sample Patients with Gender-Appropriate Names

```sql
SELECT
    first_name,
    last_name,
    gender,
    age,
    has_diabetes,
    ckd_diagnosed
FROM patients
WHERE first_name IN ('David', 'James', 'Mary', 'Jennifer')
ORDER BY first_name
LIMIT 10;
```

**Expected**: David and James should be male, Mary and Jennifer should be female

#### Data Completeness Summary

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

**Expected**:
- Patients: 500+
- Observations: 30,000+
- Conditions: 1,500+
- Prescriptions: 2,000+
- Refills: 12,000+
- Urine Analysis: 750+
- Hematology: 750+

---

## Method 2: Using Render's External Connection (If Shell Doesn't Work)

If the Shell tab is not available or times out, you can connect externally:

### Option A: Use an Online PostgreSQL Client

1. Go to https://sqlpad.io/tutorial/ or https://extendsclass.com/postgresql-online.html
2. Get your database connection details from Render:
   - Go to your database in Render
   - Click "Info" tab
   - Copy: External Database URL

3. In the online tool, connect using your External Database URL
4. Copy and paste each SQL script as described in Method 1

### Option B: Use Render's PSQL Connect Command

1. In your Render database page, go to "Info" tab
2. Find the "PSQL Command" section
3. Copy the command (looks like: `PSQL_COMMAND="psql -h ......"`)
4. If you have access to ANY terminal (could be on a friend's computer, library, etc.):
   ```bash
   # Paste the PSQL command from Render
   psql -h xyz.render.com -U user database_name

   # Then paste each SQL script
   ```

---

## Quick Verification After Setup

Run this single query to get a complete summary:

```sql
-- Complete summary query
SELECT 'Total Patients' as metric, COUNT(*)::text as value FROM patients
UNION ALL
SELECT 'Male Patients', COUNT(*)::text FROM patients WHERE gender = 'male'
UNION ALL
SELECT 'Female Patients', COUNT(*)::text FROM patients WHERE gender = 'female'
UNION ALL
SELECT 'Duplicate Names', COUNT(*)::text FROM (
    SELECT first_name, last_name FROM patients
    GROUP BY first_name, last_name HAVING COUNT(*) > 1
) dup
UNION ALL
SELECT 'Patients with Diabetes', COUNT(*)::text FROM patients WHERE has_diabetes = true
UNION ALL
SELECT 'Patients with CKD', COUNT(*)::text FROM patients WHERE ckd_diagnosed = true
UNION ALL
SELECT 'Total Observations', COUNT(*)::text FROM observations
UNION ALL
SELECT 'Total Conditions', COUNT(*)::text FROM conditions
UNION ALL
SELECT 'Total Prescriptions', COUNT(*)::text FROM prescriptions
UNION ALL
SELECT 'Urine Tests', COUNT(*)::text FROM urine_analysis
UNION ALL
SELECT 'Hematology Tests', COUNT(*)::text FROM hematology;
```

**Expected output**:
```
Total Patients          | 500
Male Patients          | ~240
Female Patients        | ~260
Duplicate Names        | 0
Patients with Diabetes | ~180
Patients with CKD      | ~200
Total Observations     | 30000+
Total Conditions       | 1500+
Total Prescriptions    | 2000+
Urine Tests           | 750+
Hematology Tests      | 750+
```

---

## Troubleshooting

### Issue: Shell connection keeps timing out

**Solution**:
1. Try refreshing the page and reconnecting
2. Run one script at a time (don't paste all at once)
3. For the patient population script, it may take 10 minutes - be patient!
4. If timeout persists, try during off-peak hours (early morning UTC)

### Issue: "permission denied" errors

**Solution**:
1. Make sure you're using the database owner credentials
2. In Render dashboard, go to database "Info" → use the main connection URL
3. Verify you have write permissions

### Issue: Scripts fail partway through

**Solution**:
1. Most scripts use `IF NOT EXISTS` so they're safe to re-run
2. If a script fails, you can re-run it - it will skip already created objects
3. Check which step failed and start from that script

### Issue: Still see duplicate names after running

**Solution**:
```sql
-- Delete all patients and start over
DELETE FROM patients;

-- Re-run just the populate_500_patients_fixed.sql script
-- (Copy and paste it again from GitHub)
```

### Issue: Gender mismatch (e.g., David is female)

**Solution**: This should NOT happen with the fixed script. If it does:
```sql
-- Check the problem
SELECT first_name, gender, COUNT(*)
FROM patients
WHERE (
    (first_name LIKE 'David%' AND gender = 'female') OR
    (first_name LIKE 'Mary%' AND gender = 'male')
)
GROUP BY first_name, gender;

-- If problems found, delete and re-populate
DELETE FROM patients;
-- Re-run populate_500_patients_fixed.sql
```

---

## After Successful Setup

### 1. Test Your Doctor Assistant

Go to your frontend application and ask:
- "How many patients are there?"
- "Show me patients at high risk of CKD"
- "What is the average eGFR?"

### 2. Monitor Your Backend

1. Go to your backend service in Render
2. Check the "Logs" tab
3. Look for successful startup messages
4. Ensure MCP server starts without errors

### 3. Verify MCP Server Connection

If you get "Error: Failed to fetch" in the Doctor Assistant:
1. Check backend logs in Render
2. Look for MCP server startup errors
3. Verify database connection is successful
4. Check that the MCP server path fix was deployed

---

## Script Execution Order (Summary)

**IMPORTANT**: Run scripts in this exact order!

1. ✅ `enhance_database_schema.sql` - Adds tables and columns (1-2 min)
2. ✅ `add_comprehensive_variables.sql` - Adds 60+ new variables (1-2 min)
3. ✅ `update_existing_patients.sql` - Updates existing records (< 1 min)
4. ✅ `populate_500_patients_fixed.sql` - Creates 500 unique patients (5-10 min) **MOST IMPORTANT**
5. ✅ `populate_comprehensive_variables.sql` - Populates all new data (2-3 min)

**Total time**: 10-15 minutes

---

## What Makes This Script Special

### Unique Name Guarantee

The `populate_500_patients_fixed.sql` script uses a smart algorithm:

```
For each patient:
  1. Determine gender (48% male, 52% female)
  2. Pick gender-appropriate first name:
     - If male: Choose from 50 male names (James, Robert, Michael, William, David...)
     - If female: Choose from 50 female names (Mary, Patricia, Jennifer, Linda, Barbara...)
  3. Pick random last name from 50 surnames
  4. Check if this first_name + last_name combination already exists
  5. If duplicate, try again (up to 100 attempts)
  6. If still can't find unique combo, add middle initial (e.g., "David A.")
```

This guarantees:
- ✅ **Zero duplicate names**
- ✅ **Gender-appropriate assignments** (David is always male, Mary is always female)
- ✅ **Realistic name distribution**

---

## Database Schema Overview

After setup, you'll have these tables:

### Core Tables
1. **patients** (500+) - Demographics, comorbidities, clinical symptoms
2. **observations** (30,000+) - Monthly vital signs and lab results for 12 months
3. **conditions** (1,500+) - Diagnosed conditions with ICD-10 codes
4. **prescriptions** (2,000+) - Active medications
5. **refills** (12,000+) - 12 months of medication refills for adherence tracking

### New Tables (from comprehensive variables)
6. **urine_analysis** (750+) - Urine test results including microscopy
7. **hematology** (750+) - Complete blood count (CBC) results

### Variables Included (180+ total)

- **Demographics**: Name, age, gender, contact, BMI
- **Vital Signs**: BP, heart rate, weight, temperature
- **Labs**: eGFR, creatinine, hemoglobin, HbA1c, cholesterol, potassium, calcium, etc.
- **Urine**: BUN, specific gravity, albumin, sugar, RBC, pus cells, bacteria
- **Hematology**: Hemoglobin, PCV, RBC count, WBC count, platelets
- **Comorbidities**: 20 conditions (diabetes types, hypertension types, cardiovascular, metabolic)
- **Symptoms**: Appetite, edema, anemia, fatigue
- **Medications**: 40+ drugs across multiple classes
- **Lifestyle**: Smoking, alcohol, exercise, diet
- **Family History**: CKD, diabetes, hypertension, cardiovascular disease

---

## Support

If you encounter any issues:

1. **Check the Render Status**: https://status.render.com/
2. **Review Render Database Logs**: Dashboard → Database → Logs tab
3. **Verify Connection**: Dashboard → Database → Info → Connection details
4. **Database Size**: Make sure you haven't exceeded your plan limits

---

## Next Steps

Once database is populated and verified:

1. ✅ Merge your latest branch to main (triggers auto-deploy)
2. ✅ Wait for Render to deploy the backend (check Logs tab)
3. ✅ Test Doctor Assistant in your frontend
4. ✅ Ask sample questions to verify MCP tools work
5. ✅ Monitor backend logs for any errors

**Your CKD Analytics Platform is now ready with a complete dataset! 🎉**

---

## Quick Links

- **Render Dashboard**: https://dashboard.render.com/
- **GitHub Repository**: https://github.com/danribes/hack_BI
- **SQL Scripts Location**: https://github.com/danribes/hack_BI/tree/main/scripts

## Branch to Merge

After following this guide, merge your branch:
- **Branch**: `claude/fix-ai-chat-issues-016tGUwFZTWuPtUKy3vLDa5R`
- **To**: `main`

This will deploy the latest backend fixes including the corrected MCP server path.
