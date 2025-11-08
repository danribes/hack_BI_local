# Deployment Guide - Render.com

**Healthcare AI Clinical Data Analyzer - CKD Risk Screening System**

This guide walks you through deploying the full-stack application to Render.com with no domain required.

---

## Why Render.com?

- ✅ **Free Tier**: No credit card required for getting started
- ✅ **Docker Support**: Use our existing Dockerfiles
- ✅ **Managed PostgreSQL**: Free 90-day database (can be extended)
- ✅ **Auto-Deploy**: Connects to GitHub for automatic deployments
- ✅ **Free Subdomain**: Get `your-app.onrender.com` URLs
- ✅ **Easy Setup**: Simple dashboard interface
- ✅ **Perfect for Hackathons**: Quick to set up, reliable for demos

**Alternatives**: Railway, Fly.io, or DigitalOcean App Platform

---

## Prerequisites

Before starting deployment:

1. ✅ **GitHub Repository**: Code must be pushed to GitHub (✓ Already done!)
2. ✅ **Render.com Account**: Sign up at https://render.com (free)
3. ✅ **Anthropic API Key**: Get from https://console.anthropic.com
4. ✅ **All Tasks Complete**: All H001-H037 tasks completed (✓ Already done!)

---

## Deployment Steps

### Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure database:
   - **Name**: `ckd-analyzer-db`
   - **Database**: `ckd_analyzer`
   - **User**: `postgres` (auto-generated)
   - **Region**: Choose closest to your users (e.g., Oregon, Frankfurt)
   - **PostgreSQL Version**: 16
   - **Plan**: **Free** (90 days, can upgrade later)
4. Click **"Create Database"**
5. Wait for database to provision (~2 minutes)
6. **Copy the Internal Database URL** (looks like: `postgresql://postgres:...@dpg-.../ckd_analyzer`)

### Step 2: Initialize Database Schema

1. In Render dashboard, click on your database
2. Click **"Connect"** → **"External Connection"** → Copy `PSQL Command`
3. Run on your local machine (requires `psql` installed):
   ```bash
   # Connect to database
   psql postgresql://postgres:...@dpg-.../ckd_analyzer

   # Or use the web shell in Render dashboard
   ```
4. Run the initialization script:
   ```bash
   # From your project root
   cat infrastructure/postgres/init.sql | psql <YOUR_DATABASE_URL>
   ```
5. Verify data loaded:
   ```sql
   SELECT COUNT(*) FROM patients;  -- Should return 5
   SELECT COUNT(*) FROM observations;  -- Should return 33
   ```

**Alternative**: Use Render's **"Shell"** tab in the database dashboard to run SQL directly.

---

### Step 3: Deploy Backend API

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. **Connect GitHub Repository**:
   - Click **"Connect account"** (if first time)
   - Select your repository: `hackathon_BI_CKD`
   - Click **"Connect"**
3. Configure backend service:
   - **Name**: `ckd-analyzer-backend`
   - **Region**: Same as database (important for low latency!)
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `backend/Dockerfile` (auto-detected)
   - **Plan**: **Free** (512 MB RAM, spins down after 15 min inactivity)
4. **Environment Variables** - Click **"Add Environment Variable"**:
   ```
   NODE_ENV=production
   PORT=3000

   # Database (use Internal Database URL from Step 1)
   DATABASE_URL=<paste_internal_database_url>
   DB_POOL_MAX=10

   # AI Service
   ANTHROPIC_API_KEY=<your_anthropic_api_key>
   CLAUDE_MODEL=claude-3-5-sonnet-20241022

   # CORS (update with frontend URL in Step 4)
   CORS_ORIGIN=https://ckd-analyzer-frontend.onrender.com
   ```
5. Click **"Create Web Service"**
6. Wait for deployment (~5-10 minutes for first build)
7. **Test Backend**:
   - Open `https://ckd-analyzer-backend.onrender.com/health`
   - Should see: `{"status":"healthy","timestamp":"..."}`
   - Test DB: `https://ckd-analyzer-backend.onrender.com/api/db/health`
   - Test API: `https://ckd-analyzer-backend.onrender.com/api/patients`

**Note**: Free tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds.

---

### Step 4: Deploy Frontend

#### Option A: Static Site (Recommended - Faster & Free Forever)

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Select your repository: `hackathon_BI_CKD`
3. Configure frontend:
   - **Name**: `ckd-analyzer-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL=https://ckd-analyzer-backend.onrender.com
   ```
5. Click **"Create Static Site"**
6. Wait for deployment (~3-5 minutes)
7. **Update Backend CORS**:
   - Go back to backend service
   - Update `CORS_ORIGIN` environment variable:
     ```
     CORS_ORIGIN=https://ckd-analyzer-frontend.onrender.com
     ```
   - Backend will auto-redeploy

#### Option B: Web Service with nginx (Alternative)

1. Click **"New +"** → **"Web Service"**
2. Select repository, configure:
   - **Root Directory**: `frontend`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `frontend/Dockerfile`
3. Add environment variable during build:
   ```
   VITE_API_URL=https://ckd-analyzer-backend.onrender.com
   ```

---

### Step 5: Test End-to-End

1. **Open Frontend**: `https://ckd-analyzer-frontend.onrender.com`
2. **Test Patient List**:
   - Navigate to patients page
   - Should see 5 mock patients (John Anderson, Maria Rodriguez, etc.)
3. **Test Risk Analysis**:
   - Click on a patient (e.g., John Anderson - high risk)
   - Click **"Analyze Risk"** button
   - Wait ~5-10 seconds for AI analysis
   - Should see:
     - Risk score, level, and tier
     - Key findings (abnormal labs, risk factors)
     - CKD analysis (stage, kidney function)
     - Recommendations (immediate actions, follow-up)
4. **Test All Risk Tiers**:
   - **Tier 1 (Low)**: David Chen
   - **Tier 2 (Moderate)**: Maria Rodriguez, Michael Thompson
   - **Tier 3 (High)**: John Anderson, Sarah Johnson

---

## Configuration Reference

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | - | `production` for deployment |
| `PORT` | No | 3000 | Server port (Render sets automatically) |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string (from Render DB) |
| `DB_POOL_MAX` | No | 10 | Max database connections |
| `ANTHROPIC_API_KEY` | Yes | - | Your Anthropic API key |
| `CLAUDE_MODEL` | No | claude-3.5-sonnet-20241022 | AI model to use |
| `CORS_ORIGIN` | Yes | - | Frontend URL (must match exactly) |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | - | Backend API URL (no trailing slash) |

---

## Troubleshooting

### Backend Won't Start

**Problem**: Service fails to start, logs show database connection error

**Solution**:
1. Verify `DATABASE_URL` is the **Internal Database URL** (not External)
2. Check database and backend are in **same region**
3. Verify database initialization completed successfully
4. Check Render dashboard → Logs for specific error

---

### Frontend Can't Connect to Backend

**Problem**: Frontend loads but shows "Failed to fetch" errors

**Solutions**:
1. **CORS Error**: Update backend `CORS_ORIGIN` to match frontend URL exactly
   - Must include `https://` protocol
   - No trailing slash
   - Match case exactly
2. **Backend Spun Down**: Wait 30 seconds for backend to wake up (free tier)
3. **Wrong API URL**: Check frontend `VITE_API_URL` environment variable
4. Test backend directly: `curl https://ckd-analyzer-backend.onrender.com/health`

---

### AI Analysis Not Working

**Problem**: Risk analysis button fails or returns errors

**Solutions**:
1. **Invalid API Key**: Verify `ANTHROPIC_API_KEY` in backend environment
2. **Rate Limit**: Anthropic free tier has rate limits (5 requests/min)
3. **Model Access**: Ensure your API key has access to Claude 3.5 Sonnet
4. Check backend logs: Render dashboard → Backend service → Logs

---

### Slow Response Times

**Problem**: Application is slow or times out

**Solutions**:
1. **Free Tier Spin Down**: First request after inactivity takes ~30 seconds
   - Solution: Upgrade to paid tier ($7/month) for always-on
   - Or: Set up cron job to ping every 10 minutes (keep alive)
2. **Database Location**: Ensure backend and database in same region
3. **Build Optimization**: Production build should be optimized (already done)

---

### Database Full (90 days limit)

**Problem**: Free PostgreSQL expires after 90 days

**Solutions**:
1. **Upgrade Database**: $7/month for permanent database
2. **Migrate to New Free DB**: Export data, create new free database, import
   ```bash
   # Export
   pg_dump <old_database_url> > backup.sql

   # Import
   psql <new_database_url> < backup.sql
   ```
3. **Use Render's Persistent Disk**: Alternative storage option

---

## Monitoring & Maintenance

### Health Checks

Set up health checks in Render:
1. Go to backend service → **Settings** → **Health Check Path**
2. Set: `/health`
3. Render will automatically restart if health check fails

### Logs

View logs in real-time:
1. Render dashboard → Select service
2. Click **"Logs"** tab
3. Filter by error level: `Error`, `Warn`, `Info`

### Database Backups

Render automatically backs up databases:
- **Free Tier**: No backups (manual export recommended)
- **Paid Tier**: Daily backups retained for 7 days

Manual backup:
```bash
pg_dump <database_url> > backup_$(date +%Y%m%d).sql
```

---

## Cost Breakdown

### Free Tier (Perfect for Hackathon Demo)

| Service | Cost | Limitations |
|---------|------|-------------|
| PostgreSQL | FREE | 90 days, 256 MB RAM, 1 GB storage |
| Backend (Web Service) | FREE | 512 MB RAM, spins down after 15 min |
| Frontend (Static Site) | FREE | Unlimited bandwidth, always on |
| **Total** | **$0/month** | Good for demos, limited production use |

### Production Tier (For Real Deployment)

| Service | Cost | Benefits |
|---------|------|----------|
| PostgreSQL | $7/month | Unlimited time, 1 GB RAM, 10 GB storage, backups |
| Backend | $7/month | Always on, 512 MB RAM, custom domains |
| Frontend | FREE | Still free! |
| **Total** | **$14/month** | Production-ready, no spin down |

---

## Security Considerations

### Secrets Management

✅ **Never commit secrets to Git**:
- `.env` files are gitignored
- All secrets in Render environment variables

### CORS Configuration

✅ **Restrict CORS to your frontend only**:
```
CORS_ORIGIN=https://ckd-analyzer-frontend.onrender.com
```
❌ **Never use** `CORS_ORIGIN=*` in production

### API Key Protection

✅ **Backend only**:
- `ANTHROPIC_API_KEY` is in backend environment (secure)
- Never expose in frontend environment variables

✅ **Frontend only uses public API URL**:
- `VITE_API_URL` is public (safe to expose)

### Database Security

✅ **Use Internal Database URL**:
- Faster (same network)
- More secure (not exposed to internet)
- Already done in deployment steps

---

## Custom Domain (Optional)

If you want a custom domain like `ckd-analyzer.yourname.com`:

1. **Get a domain** (Namecheap, Google Domains, etc.)
2. **In Render dashboard**:
   - Go to frontend service → **Settings** → **Custom Domain**
   - Add your domain: `ckd-analyzer.yourname.com`
   - Follow DNS setup instructions
3. **Update backend CORS**:
   ```
   CORS_ORIGIN=https://ckd-analyzer.yourname.com
   ```
4. **SSL Certificate**: Render provides free SSL automatically

---

## Scaling for Production

If your app gets popular:

### Database Scaling
- **Upgrade to Starter**: $7/month (1 GB RAM, 10 GB storage)
- **Upgrade to Standard**: $20/month (4 GB RAM, 50 GB storage)
- **Add Read Replicas**: For high read traffic

### Backend Scaling
- **Upgrade to Starter**: $7/month (always on)
- **Horizontal Scaling**: Add more instances ($7 each)
- **Autoscaling**: Available on Team plan ($19/month/service)

### Caching Layer
- Add Redis for caching (available on Render)
- Cache AI analysis results (already implemented in code!)

---

## Next Steps After Deployment

1. ✅ **Test All Features**: Go through complete user flow
2. ✅ **Share Demo URL**: `https://ckd-analyzer-frontend.onrender.com`
3. ✅ **Monitor Logs**: Watch for errors in first 24 hours
4. ✅ **Set Up Notifications**: Render can email on deployment failures
5. ✅ **Document Live URLs**: Update README with production URLs
6. ✅ **Prepare Demo Script**: For hackathon presentation
7. ✅ **Test on Mobile**: Ensure responsive design works

---

## Support & Resources

### Render Documentation
- Main Docs: https://render.com/docs
- Docker Guide: https://render.com/docs/docker
- PostgreSQL: https://render.com/docs/databases

### Project Resources
- README.md: Local development setup
- CONTRIBUTING.md: Development workflow
- hackathon-tasks.md: All tasks and progress

### Get Help
- Render Community: https://community.render.com
- Anthropic Discord: For Claude API issues
- Project Issues: Create issue in GitHub repository

---

## Deployment Checklist

Before presenting at hackathon:

- [ ] PostgreSQL database created and initialized
- [ ] Backend deployed and health check passing
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly (backend ↔ frontend)
- [ ] Environment variables set (especially ANTHROPIC_API_KEY)
- [ ] All 5 mock patients visible
- [ ] Risk analysis working for all 3 tiers
- [ ] Mobile responsive design verified
- [ ] Demo script prepared
- [ ] Live URLs documented and tested
- [ ] Backup plan if service spins down during demo

---

**Good luck with your hackathon presentation! 🚀**

Your CKD Risk Screening System is production-ready and will help clinicians identify high-risk patients for early intervention.
