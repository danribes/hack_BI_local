# 🚀 Quick Start Deployment Guide

**Get your CKD Risk Screening System live in ~20 minutes!**

---

## Prerequisites

Before you start, make sure you have:

- [ ] ✅ Code pushed to GitHub (already done!)
- [ ] 🔑 Anthropic API Key ([Get one here](https://console.anthropic.com))
- [ ] 🌐 Render.com account ([Sign up free](https://dashboard.render.com/register))

---

## Deployment Steps

### Step 1: Deploy with Render Blueprint (5 minutes)

1. **Go to Render Dashboard**
   - Open: https://dashboard.render.com
   - Sign in (or create free account)

2. **Create New Blueprint**
   - Click **"New +"** button (top right)
   - Select **"Blueprint"**

3. **Connect GitHub Repository**
   - Click **"Connect GitHub"** (first time only)
   - Authorize Render to access your repos
   - Select repository: **`hackathon_BI_CKD`**
   - Click **"Connect"**

4. **Configure Blueprint**
   - Render will detect `render.yaml` automatically
   - You'll see 3 services:
     - `ckd-analyzer-db` (PostgreSQL)
     - `ckd-analyzer-backend` (Backend API)
     - `ckd-analyzer-frontend` (Frontend)
   - Click **"Apply"**

5. **Wait for Deployment**
   - Database: ~2 minutes
   - Backend: ~5-8 minutes (Docker build)
   - Frontend: ~3-5 minutes (npm build)
   - ☕ Grab a coffee while services deploy!

---

### Step 2: Set Your Anthropic API Key (1 minute)

**CRITICAL**: The backend won't work without this!

1. In Render dashboard, click on **`ckd-analyzer-backend`** service
2. Click **"Environment"** tab (left sidebar)
3. Find **`ANTHROPIC_API_KEY`** variable
4. Click **"Edit"**, paste your API key
5. Click **"Save Changes"**
6. Backend will automatically redeploy (~2 minutes)

---

### Step 3: Initialize Database (3 minutes)

You need to load the mock patients and clinical data.

#### Option A: Using psql (Recommended)

```bash
# From your project directory
./scripts/init-render-db.sh "YOUR_DATABASE_URL"
```

**Get DATABASE_URL:**
1. In Render dashboard, click **`ckd-analyzer-db`**
2. Scroll down to **"Connections"** section
3. Copy **"Internal Database URL"** (starts with `postgresql://`)
4. Paste into command above

**Don't have psql?**
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`
- Windows: [Download PostgreSQL](https://www.postgresql.org/download/)

#### Option B: Using Render Shell

1. In Render dashboard, click **`ckd-analyzer-db`**
2. Click **"Shell"** tab
3. Copy and paste the contents of `infrastructure/postgres/init.sql`
4. Press Enter to execute

---

### Step 4: Verify Deployment (2 minutes)

Test each component:

#### 1. **Database** ✓
In Render database shell, run:
```sql
SELECT COUNT(*) FROM patients;  -- Should return: 5
```

#### 2. **Backend API** ✓
Open in browser:
```
https://ckd-analyzer-backend.onrender.com/health
```
Should see: `{"status":"healthy","timestamp":"..."}`

Test patient API:
```
https://ckd-analyzer-backend.onrender.com/api/patients
```
Should see: JSON array with 5 patients

#### 3. **Frontend** ✓
Open in browser:
```
https://ckd-analyzer-frontend.onrender.com
```
Should see: Your React application

---

### Step 5: Test End-to-End (5 minutes)

1. **Open Frontend**
   ```
   https://ckd-analyzer-frontend.onrender.com
   ```

2. **View Patients**
   - Navigate to patients list
   - You should see 5 mock patients:
     - John Anderson (MRN: MRN001)
     - Maria Rodriguez (MRN: MRN002)
     - David Chen (MRN: MRN003)
     - Sarah Johnson (MRN: MRN004)
     - Michael Thompson (MRN: MRN005)

3. **Test Risk Analysis** (The Big Test!)
   - Click on a patient (try **John Anderson** - high risk)
   - Click **"Analyze Risk"** button
   - Wait ~5-10 seconds (AI processing)
   - You should see:
     ✅ Risk score and level (High/Medium/Low)
     ✅ Risk tier (1, 2, or 3)
     ✅ Key findings (abnormal labs, risk factors)
     ✅ CKD analysis (stage, kidney function, progression risk)
     ✅ Recommendations (immediate actions, follow-up, lifestyle, tests)

4. **Test All Risk Tiers**
   - **Tier 3 (High Risk)**: John Anderson, Sarah Johnson
   - **Tier 2 (Moderate)**: Maria Rodriguez, Michael Thompson
   - **Tier 1 (Low Risk)**: David Chen

---

## Your Live URLs

Once deployed, your URLs will be:

- **Frontend**: `https://ckd-analyzer-frontend.onrender.com`
- **Backend API**: `https://ckd-analyzer-backend.onrender.com`
- **Database**: Internal only (not publicly accessible)

**Save these URLs!** You'll need them for your hackathon presentation.

---

## Troubleshooting

### Problem: Backend shows "Application failed to respond"

**Cause**: Backend is spinning up (free tier spins down after 15 min inactivity)

**Solution**: Wait 30 seconds and refresh. First request takes time.

---

### Problem: Frontend shows "Failed to fetch"

**Possible Causes:**
1. **Backend is spinning up** → Wait 30 seconds
2. **CORS error** → Check backend logs, verify CORS_ORIGIN matches frontend URL
3. **Backend hasn't deployed** → Check backend service status in Render dashboard

**Fix CORS:**
1. Go to `ckd-analyzer-backend` → Environment
2. Verify `CORS_ORIGIN` = `https://ckd-analyzer-frontend.onrender.com` (exact match!)
3. Save and redeploy

---

### Problem: Risk analysis fails with "API Error"

**Possible Causes:**
1. **ANTHROPIC_API_KEY not set** → Go to Step 2 above
2. **Invalid API key** → Verify key at https://console.anthropic.com
3. **Rate limit hit** → Wait 1 minute and try again (free tier: 5 requests/min)

**Check Backend Logs:**
1. Go to `ckd-analyzer-backend` service
2. Click "Logs" tab
3. Look for errors with "Anthropic" or "Claude"

---

### Problem: Database shows "No patients found"

**Cause**: Database not initialized (Step 3 skipped)

**Solution**: Run `scripts/init-render-db.sh` or use Render Shell to run init.sql

---

## Important Notes

### Free Tier Limitations

- **Backend spins down** after 15 minutes of inactivity
  - First request takes ~30 seconds to wake up
  - Keep this in mind during demo!
  - Tip: Open backend URL 1 minute before presenting

- **Database expires** after 90 days
  - Perfect for hackathon!
  - Can upgrade to $7/month for permanent database

### Cost

**Total: $0/month** (free tier)

Want always-on for production?
- Backend: $7/month (no spin down)
- Database: $7/month (permanent)
- **Total: $14/month** for production-ready deployment

---

## Pre-Demo Checklist

Before your hackathon presentation:

- [ ] All services showing "Live" status in Render
- [ ] Frontend URL opens successfully
- [ ] Backend /health endpoint returns healthy
- [ ] Database has 5 patients (verify in shell)
- [ ] AI risk analysis works for at least one patient
- [ ] ANTHROPIC_API_KEY is set and valid
- [ ] URLs saved and ready to share
- [ ] **Wake up backend 1 minute before demo** (avoid spin-up delay!)

---

## Next Steps After Deployment

1. **Share Your Demo**
   - Add frontend URL to your hackathon submission
   - Update README with live URLs
   - Share with judges and teammates

2. **Monitor Performance**
   - Watch logs for errors
   - Check Anthropic usage at https://console.anthropic.com
   - Monitor Render dashboard for issues

3. **Prepare Demo Script**
   - Open all tabs before presenting
   - Have backup screenshots (in case of network issues)
   - Test all 3 risk tiers before demo

---

## Need More Help?

- **Full Deployment Guide**: See `DEPLOYMENT.md` for detailed instructions
- **Render Docs**: https://render.com/docs
- **Render Support**: https://community.render.com
- **Project Issues**: Create GitHub issue in your repo

---

## 🎉 You're Live!

Your AI-powered CKD Risk Screening System is now deployed and accessible worldwide!

**Frontend**: https://ckd-analyzer-frontend.onrender.com
**Backend**: https://ckd-analyzer-backend.onrender.com

Go crush that hackathon! 🏆
