# Complete Database Creation & Setup Guide

This guide walks you through creating a PostgreSQL database on Render.com from scratch and populating it with CKD patient data.

---

## Part 1: Create PostgreSQL Database on Render.com

### Step 1: Sign Up / Log In to Render

1. Go to https://render.com/
2. Click **"Get Started"** or **"Sign In"**
3. Sign in with your GitHub account (recommended) or email

### Step 2: Create a New PostgreSQL Database

1. From your Render dashboard, click **"New +"** in the top right
2. Select **"PostgreSQL"** from the dropdown menu

### Step 3: Configure Your Database

Fill in the database details:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `ckd_analyzer` | Or any name you prefer |
| **Database** | `ckd_analyzer_db` | Database name (auto-generated, you can change) |
| **User** | `ckd_analyzer_user` | Username (auto-generated, you can change) |
| **Region** | `Oregon (US West)` | Choose closest to you |
| **PostgreSQL Version** | `15` or `16` | Latest stable version |
| **Plan** | **Free** | Good for development/testing |

**Important Notes about the Free Plan:**
- ✅ 90 days free trial of Starter plan
- ✅ 1 GB storage
- ✅ Shared CPU
- ✅ Enough for ~1000 patients with comprehensive data
- ⚠️ Database expires after 90 days (you'll need to upgrade or export data)
- ⚠️ May have connection limits

### Step 4: Create the Database

1. Click **"Create Database"** at the bottom
2. Wait 2-3 minutes for Render to provision your database
3. You'll see "Database is live" when ready

### Step 5: Get Your Connection Details

Once the database is created, you'll see the **Info** tab with connection details:

**Connection String Formats:**

1. **External Database URL** (what you need for psql):
   ```
   postgresql://username:password@hostname.render.com/database_name
   ```
   Example:
   ```
   postgresql://ckd_analyzer_user:yJkMuyiKFr66xgY1Kmk6iYstGuCSaCg5@dpg-d49o1cq4d50c739iihig-a.oregon-postgres.render.com/ckd_analyzer_db
   ```

2. **Individual Connection Details**:
   - **Hostname**: `dpg-xxxxx.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `ckd_analyzer_db`
   - **Username**: `ckd_analyzer_user`
   - **Password**: `random_generated_password`

**🔒 Keep these credentials secure! Don't commit them to GitHub.**

---

## Part 2: Set Up Your Development Environment

You have three options for where to run the setup scripts:

### Option A: GitHub Codespaces (Recommended - Easiest)

**Advantages:**
- ✅ Pre-configured with Git
- ✅ Browser-based (works anywhere)
- ✅ Free for GitHub users (60 hours/month)
- ✅ No local installation needed

**Steps:**

1. **Open Your Repository in Codespaces**
   - Go to https://github.com/danribes/hack_BI
   - Click green **"Code"** button
   - Click **"Codespaces"** tab
   - Click **"Create codespace on main"**
   - Wait 30-60 seconds for it to load

2. **Open Terminal in Codespaces**
   - Look at bottom panel
   - Click **"TERMINAL"** tab (or press `` Ctrl+` ``)
   - You now have a full Linux terminal!

3. **Install PostgreSQL Client**

   Codespaces doesn't have `psql` pre-installed, so install it:
   ```bash
   sudo apt-get update && sudo apt-get install -y postgresql-client
   ```
   Wait 1-2 minutes for installation.

4. **Verify Installation**
   ```bash
   psql --version
   ```
   You should see: `psql (PostgreSQL) 14.x` or similar

### Option B: Local Development (Mac/Linux/Windows)

**If you have a local terminal**, install PostgreSQL client:

**Mac (using Homebrew):**
```bash
brew install postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Install PostgreSQL (includes psql)
3. Use Git Bash or PowerShell

**Verify Installation:**
```bash
psql --version
```

### Option C: Replit (Browser-based alternative)

1. Go to https://replit.com/
2. Sign in with GitHub
3. Create new Repl → choose "Bash"
4. Install PostgreSQL client:
   ```bash
   sudo apt-get update && sudo apt-get install -y postgresql-client
   ```
5. Clone your repo:
   ```bash
   git clone https://github.com/danribes/hack_BI.git
   cd hack_BI/scripts
   ```

---

## Part 3: Populate the Database

### Step 1: Navigate to Scripts Directory

In your terminal (Codespace, local, or Replit):

```bash
cd scripts
ls -la
```

You should see these SQL files:
- `enhance_database_schema.sql`
- `add_comprehensive_variables.sql`
- `update_existing_patients.sql`
- `populate_500_patients_fixed.sql`
- `populate_1001_patients_verified.sql` ⭐
- `populate_comprehensive_variables.sql`

### Step 2: Set Database URL as Environment Variable

Copy your **External Database URL** from Render and save it:

```bash
export DATABASE_URL="postgresql://your_user:your_password@your_host.render.com/your_database"
```

**Example:**
```bash
export DATABASE_URL="postgresql://ckd_analyzer_user:yJkMuyiKFr66xgY1Kmk6iYstGuCSaCg5@dpg-d49o1cq4d50c739iihig-a.oregon-postgres.render.com/ckd_analyzer_db"
```

### Step 3: Test Database Connection

Before running scripts, test the connection:

```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

You should see PostgreSQL version info. If you see an error:
- ✗ Check your DATABASE_URL is correct
- ✗ Check firewall/network (Render should allow all connections)
- ✗ Verify database status in Render dashboard

### Step 4: Run Database Setup Scripts in Order

Run these scripts **in this exact order**:

#### Script 1: Enhance Database Schema (1-2 minutes)

Creates all tables, indexes, and relationships.

```bash
psql "$DATABASE_URL" -f enhance_database_schema.sql
```

**Expected output:**
```
ALTER TABLE
ALTER TABLE
CREATE TABLE
CREATE INDEX
...
```

#### Script 2: Add Comprehensive Variables (1-2 minutes)

Adds 180+ patient variables (comorbidities, symptoms, etc.).

```bash
psql "$DATABASE_URL" -f add_comprehensive_variables.sql
```

**Expected output:**
```
ALTER TABLE
ALTER TABLE
CREATE TABLE
UPDATE
...
Additional variables migration complete!
```

#### Script 3: Update Existing Patients (< 1 minute)

Updates any existing patient records (can skip if fresh database).

```bash
psql "$DATABASE_URL" -f update_existing_patients.sql
```

**Expected output:**
```
UPDATE 0
(or UPDATE n if you have existing patients)
```

#### Script 4: Populate Patients (5-15 minutes) ⭐ MOST IMPORTANT

**Choose ONE of these options:**

**Option A: 500 Patients (Faster - for testing)**
```bash
psql "$DATABASE_URL" -f populate_500_patients_fixed.sql
```
- Runtime: 5-10 minutes
- Good for: Testing, development
- Verification: Basic

**Option B: 1001 Patients (Production-ready)** ⭐ **RECOMMENDED**
```bash
psql "$DATABASE_URL" -f populate_1001_patients_verified.sql
```
- Runtime: 10-15 minutes
- Good for: Production, demos
- Verification: Comprehensive with duplicate detection

**Expected output:**
```
NOTICE:  Starting population of 1001 patients with unique names...
NOTICE:  Processed 100 patients...
NOTICE:  Processed 200 patients...
...
NOTICE:  Successfully populated 1001 patients!
NOTICE:
NOTICE:  --- DUPLICATE NAME CHECK ---
NOTICE:  ✓ PASSED: No duplicate names found!
NOTICE:
NOTICE:  --- GENDER-NAME CONCORDANCE CHECK ---
NOTICE:  ✓ PASSED: All names match patient gender!
```

**⚠️ This step takes the longest - be patient!**

#### Script 5: Populate Comprehensive Variables (2-3 minutes)

Adds urine analysis and hematology data for patients.

```bash
psql "$DATABASE_URL" -f populate_comprehensive_variables.sql
```

**Expected output:**
```
INSERT 0 750
INSERT 0 750
UPDATE ...
```

---

## Part 4: Verify the Database Setup

### Quick Verification

Connect to your database:
```bash
psql "$DATABASE_URL"
```

Run verification queries:

#### 1. Check Total Patients
```sql
SELECT COUNT(*) as total_patients FROM patients;
```
**Expected:** 500 or 1001

#### 2. Check for Duplicate Names
```sql
SELECT
    first_name,
    last_name,
    COUNT(*) as count
FROM patients
GROUP BY first_name, last_name
HAVING COUNT(*) > 1;
```
**Expected:** 0 rows (no duplicates)

#### 3. Check Gender Distribution
```sql
SELECT
    gender,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM patients), 1) as percentage
FROM patients
GROUP BY gender;
```
**Expected:**
```
 gender | count | percentage
--------+-------+------------
 female |   520 |       52.0
 male   |   481 |       48.0
```

#### 4. Check Gender-Name Concordance
```sql
-- Males with female names (should be 0)
SELECT COUNT(*) FROM patients
WHERE gender = 'male'
  AND first_name IN ('Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara');
```
**Expected:** 0

```sql
-- Females with male names (should be 0)
SELECT COUNT(*) FROM patients
WHERE gender = 'female'
  AND first_name IN ('James', 'Robert', 'Michael', 'William', 'David');
```
**Expected:** 0

#### 5. Check Data Completeness
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
ORDER BY table_name;
```

**Expected (for 1001 patients):**
```
   table_name   | record_count
----------------+--------------
 Conditions     |         3000+
 Observations   |        40000+
 Patients       |         1001
 Prescriptions  |         3500+
 Refills        |        40000+
```

Type `\q` and press Enter to exit psql.

---

## Part 5: Connect Your Application

### Update Environment Variables

In your backend `.env` file (or Render environment variables):

```env
DATABASE_URL=postgresql://your_user:your_password@your_host.render.com/your_database
```

### Test Backend Connection

Start your backend server:
```bash
cd backend
npm install
npm run dev
```

You should see:
```
✓ Database connected successfully
Server running on port 3000
```

### Test Frontend

1. Start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Open http://localhost:5173

3. You should see **1001 patients** (or 500) in the patient list!

---

## Troubleshooting

### Issue: "psql: command not found"

**Solution:** Install PostgreSQL client (see Part 2)

### Issue: "connection refused" or "timeout"

**Solutions:**
1. ✓ Check DATABASE_URL is correct (copy from Render)
2. ✓ Verify database is "live" in Render dashboard
3. ✓ Try different network (some corporate networks block database ports)
4. ✓ Check Render status: https://status.render.com/

### Issue: "permission denied"

**Solutions:**
1. ✓ Verify you're using the correct username/password from Render
2. ✓ Make sure you're the database owner (check Render dashboard)

### Issue: Scripts fail partway through

**Solutions:**
1. ✓ Most scripts use `IF NOT EXISTS` so they're safe to re-run
2. ✓ Check which step failed and start from that script
3. ✓ Increase connection timeout if needed

### Issue: Found duplicate names after running

**Solutions:**
1. ✓ Use `scripts/fix_duplicate_names.sql` to clean up
2. ✓ Or delete all patients and re-run:
   ```sql
   DELETE FROM refills;
   DELETE FROM prescriptions;
   DELETE FROM observations;
   DELETE FROM conditions;
   DELETE FROM patients;
   ```
   Then re-run the populate script.

### Issue: Gender-name mismatches

**Solutions:**
1. ✓ This should NOT happen with `populate_1001_patients_verified.sql`
2. ✓ If it does, check the verification output for specific patients
3. ✓ Use `fix_duplicate_names.sql` to identify and fix

---

## Quick Reference: All Commands

```bash
# 1. Navigate to scripts
cd scripts

# 2. Set database URL
export DATABASE_URL="postgresql://user:password@host.render.com/database"

# 3. Test connection
psql "$DATABASE_URL" -c "SELECT version();"

# 4. Run all setup scripts
psql "$DATABASE_URL" -f enhance_database_schema.sql
psql "$DATABASE_URL" -f add_comprehensive_variables.sql
psql "$DATABASE_URL" -f update_existing_patients.sql
psql "$DATABASE_URL" -f populate_1001_patients_verified.sql  # ⭐ Use this one
psql "$DATABASE_URL" -f populate_comprehensive_variables.sql

# 5. Verify setup
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"
```

---

## Database Schema Overview

After setup, you'll have these tables:

### Core Tables
1. **patients** (1001) - Demographics, vitals, comorbidities, symptoms
2. **observations** (40,000+) - Lab results, vital signs (eGFR, uACR, etc.)
3. **conditions** (3,000+) - ICD-10 coded diagnoses
4. **prescriptions** (3,500+) - Active medications
5. **refills** (40,000+) - 12 months of refill history for adherence

### Comprehensive Variable Tables
6. **urine_analysis** (750+) - Urine microscopy and chemistry
7. **hematology** (750+) - Complete blood counts (CBC)
8. **medications** - Reference table for all CKD medications
9. **risk_assessments** - Patient risk scores and assessments
10. **treatment_recommendations** - AI-generated treatment suggestions

### Total Variables Per Patient: **180+**
- Demographics (10+)
- Vital signs (10+)
- Comorbidities (30+)
- Symptoms (10+)
- Lab results (50+)
- Medications (40+)
- Risk factors (20+)

---

## Next Steps After Database Setup

1. ✅ **Test the Doctor Assistant**
   - Ask: "How many patients are there?"
   - Ask: "Show me patients at high risk of CKD"
   - Ask: "What is the average eGFR?"

2. ✅ **Explore Patient Data**
   - Click on patients in the frontend
   - View comprehensive patient cards
   - Check vital signs, comorbidities, and symptoms

3. ✅ **Deploy to Production**
   - Merge your branch to main
   - Wait for Render to auto-deploy
   - Test in production environment

4. ✅ **Monitor Your Database**
   - Check Render dashboard for usage stats
   - Monitor connection counts
   - Watch for storage limits (1 GB on free plan)

---

## Important Notes

⚠️ **Free Plan Limitations:**
- Database expires after 90 days
- 1 GB storage limit (sufficient for 1001 patients)
- Shared CPU (may be slower during peak times)
- No automated backups

💡 **Best Practices:**
1. Export your data regularly
2. Keep DATABASE_URL secret (never commit to Git)
3. Use environment variables for all credentials
4. Monitor database size in Render dashboard
5. Upgrade to paid plan before 90-day limit if needed

🔒 **Security:**
- Never share your DATABASE_URL publicly
- Use `.env` files for local development
- Add `.env` to `.gitignore`
- Use Render environment variables for production

---

## Support & Resources

- **Render Documentation**: https://render.com/docs/databases
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Project Repository**: https://github.com/danribes/hack_BI
- **Database Setup Guide**: `/DATABASE_SETUP_RENDER_ONLY.md`
- **Patient Generation**: `/scripts/README_PATIENT_GENERATION.md`

---

## Summary Checklist

- [ ] Created PostgreSQL database on Render
- [ ] Copied DATABASE_URL connection string
- [ ] Opened GitHub Codespaces (or local terminal)
- [ ] Installed PostgreSQL client (`psql`)
- [ ] Navigated to `scripts` directory
- [ ] Set DATABASE_URL environment variable
- [ ] Tested database connection
- [ ] Ran `enhance_database_schema.sql`
- [ ] Ran `add_comprehensive_variables.sql`
- [ ] Ran `update_existing_patients.sql`
- [ ] Ran `populate_1001_patients_verified.sql` ⭐
- [ ] Ran `populate_comprehensive_variables.sql`
- [ ] Verified 1001 patients created
- [ ] Checked for no duplicate names
- [ ] Confirmed gender-name concordance
- [ ] Tested backend connection
- [ ] Tested frontend displays patients
- [ ] Tested Doctor Assistant chat

**✅ Database setup complete! You now have 1001 patients with comprehensive CKD data.**
