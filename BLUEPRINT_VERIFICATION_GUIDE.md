# Blueprint Services Verification Guide

## Current Status Summary

✅ **Frontend**: Responding correctly (HTTP 200)
⚠️ **Backend**: Timing out - needs configuration
❓ **Database**: Need to verify initialization

---

## Step-by-Step Verification

### 1. Verify Backend Service Configuration

Go to: https://dashboard.render.com → **`ckd-analyzer-backend-ejsm`**

#### A. Check Service Status

In the **Overview** tab:
- [ ] Status should be "Live" (green)
- [ ] If "Deploy failed" or "Build failed", check logs

**If service is not deployed:**
1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for build to complete (5-10 minutes)

#### B. Check Build Logs (if failing)

Click **"Logs"** tab → Look for errors:

**Common errors:**
```
Error: Cannot find module 'XXX'
Fix: npm ci should install all dependencies (check package.json)

Error: TypeScript compilation failed
Fix: We already fixed these - make sure you're on latest commit

Error: PORT is not defined
Fix: Render sets this automatically - no action needed
```

#### C. Verify Environment Variables ⚠️ **CRITICAL**

Click **"Environment"** tab → Verify these are set:

**Required Variables:**
```bash
✅ NODE_ENV = production
✅ PORT = 3000
✅ DATABASE_URL = <from ckd-analyzer-db-ejsm Internal Database URL>
✅ DB_POOL_MAX = 10
✅ CLAUDE_MODEL = claude-3-5-sonnet-20241022
✅ CORS_ORIGIN = https://ckd-analyzer-frontend-ejsm.onrender.com
⚠️ ANTHROPIC_API_KEY = <YOUR_API_KEY_HERE> ← MUST BE SET!
```

**How to get DATABASE_URL:**
1. Go to https://dashboard.render.com
2. Click on **`ckd-analyzer-db-ejsm`**
3. Look for **"Internal Database URL"** (in the Connection Details section)
4. Copy it (looks like: `postgresql://ckd_analyzer_...@dpg-.../ckd_analyzer`)
5. Paste it as the value for `DATABASE_URL` in backend environment

**How to set ANTHROPIC_API_KEY:**
1. Go to https://console.anthropic.com
2. Create an API key if you don't have one
3. Copy the key
4. In backend environment variables, set: `ANTHROPIC_API_KEY = <your_key>`

**After updating environment variables:**
- Click **"Save Changes"**
- The service will automatically redeploy

---

### 2. Verify Database Initialization

Go to: https://dashboard.render.com → **`ckd-analyzer-db-ejsm`**

#### A. Access Database Shell

1. Click **"Shell"** tab (left sidebar)
2. Wait for connection

#### B. Run Verification Queries

Copy and paste each query:

```sql
-- Check if patients table exists and has data
SELECT COUNT(*) FROM patients;
```
**Expected:** `205` (or 0 if not initialized yet)

```sql
-- Check if observations exist
SELECT COUNT(*) FROM observations;
```
**Expected:** `200+` rows

```sql
-- List first 5 patients
SELECT medical_record_number, first_name, last_name
FROM patients
ORDER BY medical_record_number
LIMIT 5;
```
**Expected:** Shows MRN001-MRN005

#### C. Initialize Database (if not done)

**If queries above return errors or 0 rows:**

1. Open the file: `RENDER_DATABASE_INIT.sql` from the repository
2. Copy the ENTIRE contents (all 667 lines)
3. Paste into the Shell
4. Press Enter and wait 30-60 seconds
5. Re-run the verification queries above

---

### 3. Verify Frontend Service

Go to: https://dashboard.render.com → **`ckd-analyzer-frontend-ejsm`**

#### A. Check Deployment Status

- [ ] Status: "Live" (green)
- [ ] Latest deploy succeeded

#### B. Verify Environment Variables

Click **"Environment"** tab:

```bash
✅ VITE_API_URL = https://ckd-analyzer-backend-ejsm.onrender.com
```

**If not set or wrong:**
1. Click **"Add Environment Variable"**
2. Key: `VITE_API_URL`
3. Value: `https://ckd-analyzer-backend-ejsm.onrender.com`
4. Click **"Save Changes"**
5. Service will redeploy

---

### 4. Test Services End-to-End

Once all services are deployed and configured:

#### A. Backend Health Check

Open in browser or run:
```bash
curl https://ckd-analyzer-backend-ejsm.onrender.com/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T...",
  "service": "Healthcare AI Backend",
  "version": "1.0.0",
  "environment": "production"
}
```

#### B. Database Health Check

```bash
curl https://ckd-analyzer-backend-ejsm.onrender.com/api/db/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "Database connection successful",
  "database": {
    "connected": true,
    "pool": {...}
  }
}
```

#### C. Frontend Loading

Open in browser:
```
https://ckd-analyzer-frontend-ejsm.onrender.com
```

**Expected:**
- Page loads with "Healthcare AI Clinical Data Analyzer" title
- Navigation tabs visible (Patients, Monitoring, Notifications, CKD Diagnosis)
- No console errors (press F12 → Console tab)

#### D. API Connectivity Test

1. Open frontend in browser
2. Open DevTools (F12) → Network tab
3. Click on any navigation tab
4. You should see API calls to `ckd-analyzer-backend-ejsm.onrender.com`
5. Check that they return 200 OK (not 404, 500, or CORS errors)

---

## Common Issues & Solutions

### Issue 1: Backend Returns 503 Service Unavailable

**Cause:** Service is spinning up (free tier cold start)
**Solution:** Wait 30-60 seconds and try again

### Issue 2: Backend Crashes Immediately

**Check logs for:**
```
Error: connect ECONNREFUSED
```
**Solution:** DATABASE_URL is wrong or database is down

```
Error: Invalid API key
```
**Solution:** ANTHROPIC_API_KEY is not set or invalid

```
Error: Cannot find module
```
**Solution:** Dependencies not installed - check build logs

### Issue 3: Frontend Shows "Failed to fetch"

**Cause:** CORS error or backend not responding
**Solution:**
1. Check CORS_ORIGIN in backend matches frontend URL
2. Check VITE_API_URL in frontend matches backend URL
3. Verify backend is running

### Issue 4: Database Connection Fails

**Check:**
1. DATABASE_URL uses **Internal Database URL** (not External)
2. Database is running (check database dashboard)
3. Database has been initialized (run queries in Shell)

---

## Deployment Checklist

Use this checklist to verify everything:

### Database
- [ ] Database exists: `ckd-analyzer-db-ejsm`
- [ ] Database is running (status: Available)
- [ ] Shell accessible
- [ ] Tables created (run: `\dt`)
- [ ] Data loaded (run: `SELECT COUNT(*) FROM patients;` → 205)

### Backend
- [ ] Service exists: `ckd-analyzer-backend-ejsm`
- [ ] Service status: Live (green)
- [ ] Latest commit deployed
- [ ] All 7 environment variables set (especially ANTHROPIC_API_KEY)
- [ ] Build succeeded (check logs)
- [ ] Health endpoint responds: `/health`
- [ ] Database health check passes: `/api/db/health`

### Frontend
- [ ] Service exists: `ckd-analyzer-frontend-ejsm`
- [ ] Service status: Live (green)
- [ ] VITE_API_URL environment variable set
- [ ] Build succeeded
- [ ] Site loads in browser
- [ ] No console errors (F12 → Console)
- [ ] API calls succeed (F12 → Network)

---

## Quick Commands Reference

### Test Backend Locally
```bash
# Health check
curl https://ckd-analyzer-backend-ejsm.onrender.com/health

# Database health
curl https://ckd-analyzer-backend-ejsm.onrender.com/api/db/health

# Get patients
curl https://ckd-analyzer-backend-ejsm.onrender.com/api/patients

# Check API info
curl https://ckd-analyzer-backend-ejsm.onrender.com/api
```

### Database Verification
```sql
-- In Render Shell:
\dt                                          -- List all tables
SELECT COUNT(*) FROM patients;               -- Count patients
SELECT COUNT(*) FROM observations;           -- Count observations
SELECT * FROM patients LIMIT 5;              -- Show sample data
```

---

## What to Share if Still Having Issues

If you're still experiencing problems, please share:

1. **Backend Logs:**
   - Go to backend service → Logs tab
   - Copy the last 50 lines
   - Include any error messages

2. **Service Status:**
   - Screenshot of all 3 services showing their status
   - Backend environment variables (hide ANTHROPIC_API_KEY value)

3. **Error Details:**
   - Exact error message
   - URL you're trying to access
   - Browser console errors (if frontend issue)

---

## Success Criteria

You'll know everything is working when:

✅ Backend `/health` returns `{"status":"ok"}`
✅ Backend `/api/db/health` returns `{"status":"ok","message":"Database connection successful"}`
✅ Frontend loads in browser
✅ Frontend can fetch patient list (check Network tab)
✅ No CORS errors in browser console
✅ Database has 205 patients

---

## Next Steps After Verification

Once all services are verified and working:

1. **Test the risk monitoring system:**
   - Go to "Monitoring" tab in frontend
   - Click "Scan All Patients"
   - Should show 121 high-risk patients

2. **Test CKD diagnosis detection:**
   - Go to "CKD Diagnosis" tab
   - Should show pending doctor actions

3. **Explore the patient data:**
   - Go to "Patients" tab
   - Browse the 205 mock patients
   - Click on a patient to see details

4. **Check notifications:**
   - Go to "Notifications" tab
   - Should see state change notifications

---

**Current Status (as of verification):**
- ✅ Frontend: Deployed and responding
- ⚠️ Backend: Needs environment variable configuration
- ❓ Database: Need to verify initialization

**Most likely issue:** ANTHROPIC_API_KEY not set in backend environment variables.
