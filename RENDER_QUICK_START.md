# Quick Start - Render Deployment

## ⚙️ Setup (One-Time)

### 1. Set Environment Variables in Render Dashboard

**Backend Service:**
```
CORS_ORIGIN=https://your-frontend-name.onrender.com
NODE_ENV=production
ANTHROPIC_API_KEY=sk-ant-... (if using AI features)
```

**Frontend Service:**
```
VITE_API_URL=https://your-backend-name.onrender.com
```

**⚠️ IMPORTANT:** Replace with your actual Render service URLs!

---

## 🚀 Generate Demo Data

**Replace `your-backend-name` with your actual backend service name:**

```bash
# 1. Clear existing data (optional)
curl -X POST https://your-backend-name.onrender.com/api/init/clear-patients

# 2. Generate 1000 realistic patients (takes 30-90 seconds)
curl -X POST https://your-backend-name.onrender.com/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'

# 3. Verify data was created
curl https://your-backend-name.onrender.com/api/patients/statistics
```

**Expected Result:**
```json
{
  "status": "success",
  "statistics": {
    "total_patients": 1000,
    "ckd": {
      "total": 355,
      "mild": { "total": 80, "treated": 64, "not_treated": 16 },
      "moderate": { "total": 250, "treated": 200, "not_treated": 50 },
      ...
    },
    "non_ckd": {
      "total": 645,
      "low": { "total": 245, ... },
      "high": { "total": 400, "monitored": 240, "not_monitored": 160 }
    }
  }
}
```

---

## 🌐 Access Your App

Open in browser:
```
https://your-frontend-name.onrender.com
```

You should see:
- Filter panel at top with statistics
- Search bar
- List of 1000 patients

---

## 🧪 Test Filtering

### Test 1: Find Untreated Moderate CKD Patients

**API Test:**
```bash
curl "https://your-backend-name.onrender.com/api/patients/filter?has_ckd=true&severity=moderate&is_treated=false"
```

**Expected:** 50 patients

**UI Test:**
1. Open frontend
2. Click **"CKD Patients (355)"**
3. Click **"Moderate CKD (250)"**
4. Click **"Not Treated (50)"**

---

### Test 2: Find High-Risk Non-CKD Patients Needing Monitoring

**API Test:**
```bash
curl "https://your-backend-name.onrender.com/api/patients/filter?has_ckd=false&risk_level=high&is_monitored=false"
```

**Expected:** 160 patients

**UI Test:**
1. Click **"Non-CKD Patients (645)"**
2. Click **"High Risk (400)"**
3. Click **"Not Monitored (160)"**

---

## 🎯 Pre-Demo Checklist

**Day before:**
```bash
# Populate database
curl -X POST https://your-backend-name.onrender.com/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

**30 minutes before demo:**
```bash
# Wake up services (free tier sleeps after 15 min)
curl https://your-backend-name.onrender.com/api/patients/statistics
curl https://your-frontend-name.onrender.com/
```

**Bookmark these URLs:**
- Frontend: `https://your-frontend-name.onrender.com`
- API: `https://your-backend-name.onrender.com/api/patients/statistics`

---

## 🐛 Common Issues

### Issue: "Service Unavailable"
**Cause:** Free tier service sleeping
**Fix:** Wait 30-60 seconds, refresh

### Issue: CORS Error
**Cause:** `CORS_ORIGIN` not set correctly
**Fix:**
1. Render Dashboard → Backend → Environment
2. Set `CORS_ORIGIN` to your frontend URL
3. Redeploy

### Issue: No Filters Showing
**Cause:** Database empty or backend unreachable
**Fix:**
```bash
# Check if backend is accessible
curl https://your-backend-name.onrender.com/api/patients/statistics

# If empty, populate database
curl -X POST https://your-backend-name.onrender.com/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

---

## 📊 What You Get

### Patient Distribution (1000 patients)
- **CKD Patients:** 355 (35.5%)
  - Mild: 80 (22.5%)
  - Moderate: 250 (70.4%)
  - Severe: 20 (5.6%)
  - Kidney Failure: 5 (1.4%)

- **Non-CKD Patients:** 645 (64.5%)
  - Low Risk: 245 (38%)
  - High Risk: 400 (62%)

### Treatment/Monitoring Rates
- **CKD Treated:** 80% (284 of 355)
- **CKD Monitored:** 90% (320 of 355)
- **High-Risk Non-CKD Monitored:** 60% (240 of 400)

---

## 🎬 Demo Script

**Open frontend, then:**

> "As a primary care doctor managing 1,000 patients, I need powerful tools to identify who needs attention.
>
> [Click CKD Patients]
>
> With one click, I can focus on my 355 CKD patients. Now let me find those with moderate disease who might need treatment optimization.
>
> [Click Moderate CKD]
>
> Here are 250 moderate CKD patients. Let me see who's not on treatment yet.
>
> [Click Not Treated]
>
> These 50 patients could benefit from SGLT2 inhibitors. The system shows me exactly who needs attention, with real-time statistics at every step.
>
> [Click Clear All, then Non-CKD → High Risk → Not Monitored]
>
> Or I can find my 160 high-risk non-CKD patients who should be enrolled in home monitoring. This level of population health management would be impossible without AI-powered tools."

---

## 📞 Help

**Check logs:**
- Render Dashboard → Your Service → Logs

**Check frontend console:**
- Browser DevTools → Console tab

**Test API:**
```bash
# Health check
curl https://your-backend-name.onrender.com/health

# Statistics
curl https://your-backend-name.onrender.com/api/patients/statistics

# All patients
curl https://your-backend-name.onrender.com/api/patients
```

---

## 🔗 Your Render URLs

**Update these placeholders with your actual service names:**

```bash
# Set these variables for easy copy-paste
export BACKEND_URL="https://your-backend-name.onrender.com"
export FRONTEND_URL="https://your-frontend-name.onrender.com"

# Then use like this:
curl $BACKEND_URL/api/patients/statistics
```

**Example (replace with yours):**
```bash
export BACKEND_URL="https://healthcare-ai-backend.onrender.com"
export FRONTEND_URL="https://healthcare-ai-frontend.onrender.com"
```

---

## ✅ Success Criteria

You're ready for demo when:

- [ ] Backend responds to `/api/patients/statistics` with 1000 patients
- [ ] Frontend loads and shows filter panel
- [ ] Clicking filters updates patient list
- [ ] Search works within filtered results
- [ ] Patient detail view loads when clicking a patient
- [ ] No CORS errors in browser console
- [ ] Services wake up in <60 seconds (test by waiting 20 min, then accessing)

---

**Full documentation:** See `docs/RENDER_DEPLOYMENT_GUIDE.md`
