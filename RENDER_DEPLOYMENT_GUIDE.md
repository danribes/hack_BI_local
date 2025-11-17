# Render.com Deployment Guide - Healthcare AI CKD Analyzer

**Last Updated**: 2025-11-11

This guide will help you deploy the Healthcare AI Clinical Data Analyzer to Render.com using the Blueprint method.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Method 1: Blueprint (Recommended)](#method-1-blueprint-recommended)
3. [Deployment Method 2: Manual Setup](#method-2-manual-setup-alternative)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Database Initialization](#database-initialization)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- ✅ **GitHub Account** with your code pushed to a repository
- ✅ **Render Account** (free tier) - Sign up at https://dashboard.render.com
- ✅ **Anthropic API Key** - Get from https://console.anthropic.com/

### Repository Preparation

Make sure your code is pushed to GitHub:

```bash
cd /home/user/webapp

# Check git status
git status

# If you have uncommitted changes, commit them:
git add .
git commit -m "Prepare for Render deployment"

# Push to GitHub
git push origin main
```

---

## Method 1: Blueprint (Recommended)

This is the easiest method - Render will automatically deploy all services from your `render.yaml` file.

### Step 1: Access Render Dashboard

1. Go to https://dashboard.render.com
2. Sign in (or sign up with GitHub - it's free!)

### Step 2: Deploy Blueprint

1. Click the **"New +"** button in the top right
2. Select **"Blueprint"** from the dropdown menu
3. Click **"Connect account"** to link your GitHub account (if not already connected)
4. **Select your repository**: `hackathon_BI_CKD` (or your repo name)
5. Click **"Connect"**

### Step 3: Blueprint Configuration

Render will detect your `render.yaml` file and show:

**Services to be created:**
- ✅ **ckd-analyzer-db** (PostgreSQL Database)
- ✅ **ckd-analyzer-backend** (Web Service - Docker)
- ✅ **ckd-analyzer-frontend** (Static Site)

Click **"Apply"** to create all services.

### Step 4: Wait for Initial Deployment

Render will now:
1. Create PostgreSQL database (~1 minute)
2. Build and deploy backend (~3-5 minutes)
3. Build and deploy frontend (~2-3 minutes)

**Total time: 5-10 minutes**

You can watch the build logs in real-time by clicking on each service.

### Step 5: Set Environment Variables

⚠️ **IMPORTANT**: The blueprint doesn't include secrets for security reasons.

**Configure Backend Service:**

1. Go to **Dashboard** → **ckd-analyzer-backend**
2. Click **"Environment"** in the left sidebar
3. Find **ANTHROPIC_API_KEY** (it will show as "Not set")
4. Click **"Add Environment Variable"** or edit the existing one
5. Set value to your API key: `sk-ant-api03-...`
6. Click **"Save Changes"**

The backend will automatically redeploy with the new API key (~2-3 minutes).

### Step 6: Verify Service URLs

After deployment completes, note your service URLs:

- **Frontend**: `https://ckd-analyzer-frontend.onrender.com`
- **Backend**: `https://ckd-analyzer-backend.onrender.com`
- **Database**: Internal connection (not publicly accessible)

**Check Backend Health:**
```bash
curl https://ckd-analyzer-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T...",
  "service": "Healthcare AI Backend"
}
```

---

## Method 2: Manual Setup (Alternative)

If you prefer to set up services manually instead of using the blueprint:

### Step 1: Create Database

1. **Dashboard** → **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `ckd-analyzer-db`
   - **Database**: `ckd_analyzer`
   - **Region**: Oregon (us-west)
   - **Plan**: Free
   - **PostgreSQL Version**: 16
3. Click **"Create Database"**
4. Wait ~1 minute for database to provision
5. Copy **"Internal Database URL"** (starts with `postgresql://`)

### Step 2: Create Backend Service

1. **Dashboard** → **"New +"** → **"Web Service"**
2. **Connect repository**: Select your GitHub repo
3. Configure:
   - **Name**: `ckd-analyzer-backend`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free
4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=[paste Internal Database URL from Step 1]
   DB_POOL_MAX=10
   CLAUDE_MODEL=claude-3-5-sonnet-20241022
   ANTHROPIC_API_KEY=[your API key]
   CORS_ORIGIN=https://ckd-analyzer-frontend.onrender.com
   ```
5. **Health Check Path**: `/health`
6. Click **"Create Web Service"**

### Step 3: Create Frontend Service

1. **Dashboard** → **"New +"** → **"Static Site"**
2. **Connect repository**: Select your GitHub repo
3. Configure:
   - **Name**: `ckd-analyzer-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist`
4. **Environment Variables**:
   ```
   VITE_API_URL=https://ckd-analyzer-backend.onrender.com
   ```
5. Click **"Create Static Site"**

---

## Post-Deployment Configuration

### Update Frontend URL in Backend CORS

After frontend is deployed, update the backend CORS setting:

1. Go to **ckd-analyzer-backend** service
2. Click **"Environment"**
3. Update **CORS_ORIGIN** to your actual frontend URL:
   ```
   CORS_ORIGIN=https://ckd-analyzer-frontend.onrender.com
   ```
4. Save (backend will redeploy)

### Enable Auto-Deploy (Optional)

Enable automatic deployments on git push:

**For Backend:**
1. Go to **ckd-analyzer-backend**
2. Click **"Settings"**
3. Scroll to **"Auto-Deploy"**
4. Toggle **ON**
5. Select branch: `main`

**For Frontend:**
1. Go to **ckd-analyzer-frontend**
2. Click **"Settings"**
3. Enable **"Auto-Deploy"** for `main` branch

Now every `git push` to main will trigger automatic deployment!

---

## Database Initialization

Your database is empty after creation. You need to initialize it with schema and mock data.

### Option A: Using the Migration API Endpoint (Recommended)

The easiest way to initialize your database is to use the built-in migration endpoint:

**After backend is deployed:**

1. **Run the migration endpoint**:
   ```bash
   # Replace with your actual backend URL
   curl -X POST https://ckd-analyzer-backend.onrender.com/api/init/migrate
   ```

   This will:
   - ✅ Create all tables and schema
   - ✅ Create the patient_health_state_comments table
   - ✅ Add all necessary indexes
   - ✅ Add monitoring triggers
   - ✅ Verify tables were created

   **Estimated time**: 5-10 seconds

2. **Verify migration succeeded**:
   ```bash
   curl https://ckd-analyzer-backend.onrender.com/api/init/migrate
   ```

   Expected response:
   ```json
   {
     "message": "Migration completed successfully",
     "tables_created": [
       "patients",
       "observations",
       "conditions",
       "patient_health_state_comments"
     ]
   }
   ```

3. **Load mock patient data** (if needed):
   ```bash
   curl -X POST https://ckd-analyzer-backend.onrender.com/api/init
   ```

   This will populate the database with sample patients and clinical data.

### Option B: Using the Initialization Script (Alternative)

**From your local machine:**

1. **Get Database URL**:
   - Go to **ckd-analyzer-db** in Render dashboard
   - Copy **"External Database URL"** (the one that's publicly accessible)

2. **Install PostgreSQL client** (if not already installed):
   ```bash
   # macOS
   brew install postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql-client

   # Windows - Download from https://www.postgresql.org/download/
   ```

3. **Run initialization script**:
   ```bash
   cd /home/user/hack_BI

   # Make script executable (if exists)
   chmod +x scripts/init-render-db.sh

   # Run initialization (replace with your actual DATABASE_URL)
   ./scripts/init-render-db.sh "postgresql://user:pass@host/database"
   ```

   This will:
   - ✅ Create all tables and schema
   - ✅ Load 205 mock patients with clinical data
   - ✅ Add monitoring triggers
   - ✅ Add CKD diagnosis detection system
   - ✅ Verify data loaded correctly

   **Estimated time**: 30-60 seconds

### Option B: Manual SQL Initialization via Render Shell

If you don't have PostgreSQL client installed:

1. **Go to Render Dashboard** → **ckd-analyzer-db**
2. Click **"Connect"** in the top right
3. Select **"PostgreSQL Shell"**
4. **Copy contents of** `RENDER_DATABASE_INIT.sql`:
   ```bash
   # View the file locally
   cat RENDER_DATABASE_INIT.sql
   ```
5. **Paste the entire SQL script** into the Render shell
6. Press **Enter** to execute
7. Wait ~30-60 seconds for completion

### Verify Database Initialization

Check that data loaded correctly:

```bash
# Using psql locally
psql "YOUR_EXTERNAL_DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"
psql "YOUR_EXTERNAL_DATABASE_URL" -c "SELECT COUNT(*) FROM observations;"
psql "YOUR_EXTERNAL_DATABASE_URL" -c "SELECT COUNT(*) FROM conditions;"
```

Expected counts:
- **Patients**: ~205
- **Observations**: ~2,000+
- **Conditions**: ~400+

---

## Verification & Testing

### 1. Check Backend Health

```bash
curl https://ckd-analyzer-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T12:00:00.000Z",
  "service": "Healthcare AI Backend",
  "database": "connected",
  "ai": "ready"
}
```

### 2. Test API Endpoints

**List Patients:**
```bash
curl https://ckd-analyzer-backend.onrender.com/api/patients
```

Should return array of patients with mock data.

**Get Single Patient:**
```bash
curl https://ckd-analyzer-backend.onrender.com/api/patients/[PATIENT_ID]
```

### 3. Test Frontend

1. Open browser: `https://ckd-analyzer-frontend.onrender.com`
2. You should see the patient list
3. Click on a patient (e.g., "John Doe")
4. Click **"AI Risk Analysis"** button
5. Should see risk assessment in ~2-5 seconds

### 4. Test AI Analysis (if backend health check shows AI ready)

```bash
curl -X POST https://ckd-analyzer-backend.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"patientId":"[PATIENT_ID]"}'
```

Expected response:
```json
{
  "riskScore": 0.72,
  "riskLevel": "HIGH",
  "contributingFactors": [...],
  "recommendations": [...]
}
```

---

## Health State Comments Feature

The application now automatically generates intelligent comments when a patient's health state changes.

### How It Works

1. **Automatic Detection**: When patient observations are updated (eGFR, uACR values), the system automatically detects if the KDIGO health state changed
2. **Smart Comments**: The system generates context-aware comments that:
   - Describe the patient's health evolution
   - Provide mitigation measures for worsening conditions
   - Acknowledge improvements for better health states
   - Include clinical recommendations based on KDIGO guidelines

### Features

**For Worsening Health States:**
- ⚠️ Warning indicators
- Clinical summary of changes (eGFR decline, uACR increase)
- Severity-specific mitigation measures
- Urgent recommendations for critical stages (G5, A3)
- CKD-specific vs non-CKD messaging

**For Improving Health States:**
- ✅ Positive acknowledgment
- Recognition of improvements
- Encouragement to maintain good practices
- Continued monitoring recommendations

**Patient Filtering:**
- Filter patients by recent health state changes (7/30/90 days)
- Filter by change type (improved/worsened/any)
- Quickly identify patients needing attention

### Testing the Feature

After deployment and migration:

1. **Update a patient's observations**:
   ```bash
   # This should trigger a health state change
   curl -X POST https://ckd-analyzer-backend.onrender.com/api/patients/[PATIENT_ID]/update-records \
     -H "Content-Type: application/json" \
     -d '{
       "cycle_number": 5,
       "baseline_egfr": 45.0,
       "baseline_uacr": 150.0
     }'
   ```

2. **View health state comments**:
   ```bash
   curl https://ckd-analyzer-backend.onrender.com/api/patients/[PATIENT_ID]/comments
   ```

3. **Filter patients with health state changes**:
   ```bash
   # Patients with changes in last 30 days
   curl "https://ckd-analyzer-backend.onrender.com/api/patients?filter=health-state-changed&days=30"

   # Only patients with worsening conditions
   curl "https://ckd-analyzer-backend.onrender.com/api/patients?filter=health-state-changed&days=30&changeType=worsened"
   ```

### UI Features

In the frontend, you'll see:
- **Health State Evolution Comments** section in patient detail view
- Color-coded comments (red for worsening, green for improving)
- Health state transition display (e.g., "G2-A1 → G3a-A2")
- Lab value changes with delta indicators
- Mitigation measures for declining patients
- Recommended actions based on current severity
- "Recent Health State Changes" filter button in the patient list

---

## Troubleshooting

### Issue 1: Backend Build Fails

**Symptoms:**
- Build logs show errors during `npm install` or Docker build
- Backend service status shows "Build failed"

**Solutions:**

1. **Check Dockerfile exists**:
   ```bash
   ls backend/Dockerfile
   ```

2. **Check package.json is valid**:
   ```bash
   cd backend && npm install
   ```

3. **Review build logs** in Render dashboard
4. **Common fixes**:
   - Ensure `backend/package.json` has all dependencies
   - Check Node version in `backend/Dockerfile` (should be Node 20)
   - Verify `tsconfig.json` is present

### Issue 2: Frontend Build Fails

**Symptoms:**
- Frontend build logs show errors
- "Build failed" status

**Solutions:**

1. **Check build command**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Verify dist folder is created**:
   ```bash
   ls frontend/dist
   ```

3. **Check environment variables**:
   - Ensure `VITE_API_URL` is set correctly in Render

### Issue 3: Database Connection Fails

**Symptoms:**
- Backend logs show "Cannot connect to database"
- Health check returns `database: "disconnected"`

**Solutions:**

1. **Verify DATABASE_URL is correct**:
   - Go to **ckd-analyzer-db** → Copy "Internal Database URL"
   - Go to **ckd-analyzer-backend** → "Environment" → Update DATABASE_URL
   - Must use **Internal Database URL** (not External)

2. **Check database is running**:
   - Dashboard → ckd-analyzer-db → Status should be "Available"

3. **Test connection manually**:
   ```bash
   psql "YOUR_EXTERNAL_DATABASE_URL" -c "SELECT 1;"
   ```

### Issue 4: CORS Errors in Frontend

**Symptoms:**
- Browser console shows CORS errors
- Frontend can't connect to backend API

**Solutions:**

1. **Update CORS_ORIGIN in backend**:
   - Go to **ckd-analyzer-backend** → "Environment"
   - Set `CORS_ORIGIN` to your frontend URL:
     ```
     CORS_ORIGIN=https://ckd-analyzer-frontend.onrender.com
     ```

2. **Check frontend VITE_API_URL**:
   - Go to **ckd-analyzer-frontend** → "Environment"
   - Verify `VITE_API_URL` points to backend:
     ```
     VITE_API_URL=https://ckd-analyzer-backend.onrender.com
     ```

3. **Redeploy frontend** after backend URL changes

### Issue 5: AI Analysis Fails

**Symptoms:**
- Frontend shows "AI analysis failed"
- Backend logs show Anthropic API errors

**Solutions:**

1. **Verify API key is set**:
   - Backend → "Environment" → Check ANTHROPIC_API_KEY
   - Test key validity:
     ```bash
     curl https://api.anthropic.com/v1/messages \
       -H "x-api-key: YOUR_KEY" \
       -H "anthropic-version: 2023-06-01" \
       -H "content-type: application/json" \
       -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'
     ```

2. **Check API quota**:
   - Visit https://console.anthropic.com/
   - Verify you have remaining credits

3. **Review backend logs**:
   - Dashboard → ckd-analyzer-backend → "Logs"
   - Look for Anthropic API error messages

### Issue 6: Free Tier Limitations

**Render Free Tier Constraints:**
- ⚠️ Backend **sleeps after 15 minutes** of inactivity
- ⚠️ Database **expires after 90 days** (need to migrate to paid)
- ⚠️ **Cold start**: 30-60 second delay when backend wakes up

**Solutions:**

1. **Keep backend awake** (optional - for demos):
   - Use a service like UptimeRobot to ping every 10 minutes
   - Ping URL: `https://ckd-analyzer-backend.onrender.com/health`

2. **Upgrade to paid tier** for production:
   - Go to service → "Upgrade" → $7/month removes sleep

3. **Database backup before 90 days**:
   ```bash
   pg_dump "EXTERNAL_DATABASE_URL" > backup.sql
   ```

### Issue 7: Slow Initial Load

**Symptoms:**
- First request takes 30-60 seconds
- Subsequent requests are fast

**Cause:**
- Free tier backend goes to sleep after 15 min inactivity
- Cold start when waking up

**Solutions:**

1. **Pre-warm before demos**:
   ```bash
   curl https://ckd-analyzer-backend.onrender.com/health
   ```
   Wait 30 seconds, then app will be fast

2. **Upgrade to paid tier** ($7/month) to eliminate sleep

3. **Use health check warming** (automated):
   - Set up cron job or UptimeRobot to ping every 10 minutes

### Issue 8: Health State Comments Not Appearing

**Symptoms:**
- Patient details don't show health state comments
- "Recent Health State Changes" filter returns empty results

**Solutions:**

1. **Ensure migration was run**:
   ```bash
   # Check if the comments table exists
   curl -X POST https://ckd-analyzer-backend.onrender.com/api/init/migrate
   ```

   Expected response should include:
   ```json
   {
     "message": "Migration completed successfully",
     "tables_created": ["...", "patient_health_state_comments"]
   }
   ```

2. **Verify table exists in database**:
   ```bash
   # Using psql
   psql "YOUR_EXTERNAL_DATABASE_URL" -c "\dt patient_health_state_comments"
   ```

   Should show the table exists.

3. **Trigger a health state change**:
   ```bash
   # Update a patient to force health state change
   curl -X POST https://ckd-analyzer-backend.onrender.com/api/patients/[PATIENT_ID]/update-records \
     -H "Content-Type: application/json" \
     -d '{"cycle_number": 5}'
   ```

4. **Check comments were created**:
   ```bash
   curl https://ckd-analyzer-backend.onrender.com/api/patients/[PATIENT_ID]/comments
   ```

   Should return array of comment objects.

5. **Review backend logs** for errors:
   - Dashboard → ckd-analyzer-backend → "Logs"
   - Look for "HealthStateCommentService" errors

### Issue 9: Filter Shows "No Patients Found"

**Symptoms:**
- Clicking "Recent Health State Changes" filter shows no results
- Error in browser console

**Solutions:**

1. **Ensure comments table exists** (see Issue 8 above)

2. **Trigger some health state changes first**:
   - Update a few patients to generate comments
   - Wait for health state to actually change (not just lab values)

3. **Check filter parameters**:
   ```bash
   # Test the API endpoint directly
   curl "https://ckd-analyzer-backend.onrender.com/api/patients?filter=health-state-changed&days=30"
   ```

4. **Verify database has comments**:
   ```bash
   psql "YOUR_EXTERNAL_DATABASE_URL" -c "SELECT COUNT(*) FROM patient_health_state_comments;"
   ```

   If count is 0, no comments exist yet - update some patients.

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub (main branch)
- [ ] `.env.example` file exists (for reference)
- [ ] `render.yaml` is configured correctly
- [ ] Anthropic API key obtained
- [ ] Docker builds succeed locally

### During Deployment
- [ ] Blueprint applied successfully
- [ ] All 3 services created (database, backend, frontend)
- [ ] Backend build completed (~5 min)
- [ ] Frontend build completed (~3 min)
- [ ] ANTHROPIC_API_KEY set in backend environment
- [ ] Database migration run: `POST /api/init/migrate`
- [ ] Database initialized with schema and mock data
- [ ] Health state comments table created

### Post-Deployment
- [ ] Backend health check returns `{"status": "healthy"}`
- [ ] Frontend loads in browser
- [ ] Patient list displays
- [ ] AI analysis button works
- [ ] Risk assessment returns in <5 seconds
- [ ] CORS configured correctly
- [ ] Health state comments feature working:
  - [ ] Update a patient and verify comment created
  - [ ] "Recent Health State Changes" filter works
  - [ ] Comments display in patient detail view
- [ ] Auto-deploy enabled (optional)

---

## Production Readiness

### For Production Use (Beyond Hackathon Demo)

Before using in production, consider:

1. **Security**:
   - [ ] Enable HTTPS only (Render provides this automatically)
   - [ ] Add authentication/authorization
   - [ ] Implement rate limiting
   - [ ] Enable GDPR compliance features

2. **Performance**:
   - [ ] Upgrade to paid tier (remove sleep)
   - [ ] Add Redis caching layer
   - [ ] Enable database connection pooling
   - [ ] Set up CDN for frontend

3. **Monitoring**:
   - [ ] Set up error tracking (Sentry, LogRocket)
   - [ ] Configure uptime monitoring
   - [ ] Enable database backups
   - [ ] Set up alerting for failures

4. **Compliance**:
   - [ ] GDPR audit trail
   - [ ] HIPAA compliance review (if US deployment)
   - [ ] CE marking for medical device (EU)
   - [ ] Data retention policies

---

## Cost Estimate

### Free Tier (Hackathon Demo)
- **Database**: Free for 90 days
- **Backend**: Free (sleeps after 15 min)
- **Frontend**: Free (unlimited)
- **Total**: $0/month

### Paid Tier (Production)
- **Database**: $7/month (1GB storage)
- **Backend**: $7/month (512MB RAM, no sleep)
- **Frontend**: Free
- **Total**: $14/month

### With High Availability
- **Database**: $20/month (2GB, auto-backups)
- **Backend**: $25/month (2GB RAM, auto-scaling)
- **Frontend**: Free
- **Total**: $45/month

---

## Support & Resources

### Render Documentation
- **Dashboard**: https://dashboard.render.com
- **Docs**: https://render.com/docs
- **Discord**: https://render.com/discord
- **Status Page**: https://status.render.com

### Project Resources
- **Repository**: Your GitHub repo
- **API Docs**: `docs/api-documentation.md`
- **Deployment Logs**: `DEPLOYMENT_VERIFICATION.md`

### Getting Help

1. **Check Render Logs**: Dashboard → Service → "Logs" tab
2. **Review GitHub Issues**: Check if others had same problem
3. **Render Community**: https://community.render.com
4. **Contact Support**: support@render.com (paid plans)

---

## Next Steps After Deployment

Once deployed successfully:

1. **Test thoroughly** with all mock patients
2. **Share demo URL** with hackathon judges
3. **Monitor logs** for any errors
4. **Prepare demo script** (see `docs/hackathon-deployment-guide.md`)
5. **Create backup screenshots** (in case of demo day issues)

---

**🎉 Congratulations! Your Healthcare AI CKD Analyzer is now live on Render!**

Your app URLs:
- **Frontend**: `https://ckd-analyzer-frontend.onrender.com`
- **Backend**: `https://ckd-analyzer-backend.onrender.com`
- **Health Check**: `https://ckd-analyzer-backend.onrender.com/health`

Good luck with your hackathon! 🚀
