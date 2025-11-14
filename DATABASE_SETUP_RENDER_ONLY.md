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

## Method 1: Using GitHub Codespaces (EASIEST - Recommended!)

Since your code is on GitHub, you can use **GitHub Codespaces** - a free browser-based development environment with terminal access!

### Step 1: Open GitHub Codespaces

1. Go to your repository: https://github.com/danribes/hack_BI
2. Click the green **"Code"** button (top right)
3. Click the **"Codespaces"** tab
4. Click **"Create codespace on main"** (or use an existing one)
5. Wait for the codespace to load (30-60 seconds)
6. You'll get a VS Code-like interface in your browser!

### Step 2: Get Your Database Connection URL

1. In another tab, go to [Render Dashboard](https://dashboard.render.com/)
2. Navigate to your PostgreSQL database service
3. Click on the **"Info"** tab
4. Find **"External Database URL"**
5. Click **"Copy"** to copy the full connection string
   - It looks like: `postgresql://user:password@host.render.com:5432/database`

### Step 3: Open Terminal in Codespaces

1. In your Codespace, look at the bottom panel
2. Click on the **"TERMINAL"** tab (or press `` Ctrl+` ``)
3. You now have a full Linux terminal!

### Step 4: Install PostgreSQL Client

GitHub Codespaces doesn't have `psql` pre-installed, so we need to install it first.

In the terminal, run this command:

```bash
sudo apt-get update && sudo apt-get install -y postgresql-client
```

**Wait 1-2 minutes** for the installation to complete. You'll see messages about packages being installed.

### Step 5: Test Database Connection

In the Codespace terminal, paste this command (replace with your actual URL):

```bash
psql "postgresql://user:password@host.render.com:5432/database"
```

You should see a PostgreSQL prompt like:
```
database=>
```

Type `\q` and press Enter to exit (we'll reconnect in the next step).

### Step 6: Navigate to Scripts Directory

In the Codespace terminal:

```bash
cd scripts
ls -la
```

You should see all your SQL scripts!

### Step 7: Run Each Script in Order (Using psql -f command)

Now you'll run each script directly using `psql -f`. Replace `YOUR_DATABASE_URL` with the connection string you copied from Render.

**Pro tip**: Save your database URL as an environment variable first:

```bash
export DATABASE_URL="postgresql://user:password@host.render.com:5432/database"
```

Now run the scripts in this exact order:

#### Script 1: Enhance Database Schema (1-2 minutes)

```bash
psql "$DATABASE_URL" -f enhance_database_schema.sql
```

You'll see "ALTER TABLE" and "CREATE TABLE" messages. Wait for completion.

#### Script 2: Add Comprehensive Variables (1-2 minutes)

```bash
psql "$DATABASE_URL" -f add_comprehensive_variables.sql
```

You'll see messages about new columns and tables being created.

#### Script 3: Update Existing Patients (< 1 minute)

```bash
psql "$DATABASE_URL" -f update_existing_patients.sql
```

You'll see "UPDATE" messages for existing patient records.

#### Script 4: Populate 500 Patients - MOST IMPORTANT (5-10 minutes)

**This script ensures unique names and gender-appropriate assignments!**

```bash
psql "$DATABASE_URL" -f populate_500_patients_fixed.sql
```

**Wait 5-10 minutes** - this generates 500 patients with 12 months of data. You'll see progress messages.

#### Script 5: Populate Comprehensive Variables (2-3 minutes)

```bash
psql "$DATABASE_URL" -f populate_comprehensive_variables.sql
```

You'll see "UPDATE" and "INSERT" messages for urine analysis and hematology data.

### Step 8: Verify the Setup

After running all scripts, verify your data using `psql` in your Codespace terminal:

First, connect to your database:

```bash
psql "$DATABASE_URL"
```

Now you'll have an interactive PostgreSQL prompt. Run these verification queries:

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

**When done verifying, type `\q` and press Enter to exit psql.**

---

## Method 2: Alternative Options (If Codespaces Doesn't Work)

### Option A: Use Replit (Free Online IDE with Terminal)

1. Go to https://replit.com/
2. Sign up for free (or sign in with GitHub)
3. Create a new Repl → choose "Bash"
4. Install PostgreSQL client:
   ```bash
   sudo apt-get update && sudo apt-get install -y postgresql-client
   ```
5. Clone your repository:
   ```bash
   git clone https://github.com/danribes/hack_BI.git
   cd hack_BI/scripts
   ```
6. Follow the same steps as Method 1 (Step 7 onwards)

### Option B: Use Any Computer with Terminal

If you have access to ANY computer with a terminal (friend's laptop, library computer, etc.):

1. Install `psql` (it's included with PostgreSQL client)
   - **Mac**: `brew install postgresql`
   - **Linux**: `sudo apt-get install postgresql-client`
   - **Windows**: Download from https://www.postgresql.org/download/windows/

2. Clone your repository or download the scripts
3. Follow the same steps as Method 1 (Step 7 onwards)

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
