# 🚀 Quick Render Deployment - 5 Minute Setup

**Your Healthcare AI CKD Analyzer → Live in 5 minutes!**

---

## ⚡ Super Quick Deploy (Blueprint Method)

### 1️⃣ Push to GitHub (if needed)
```bash
git push origin main
```

### 2️⃣ Deploy on Render
1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repo: `danribes/hack_BI`
4. Render auto-detects `render.yaml` → Click **"Apply"**
5. Wait 5-10 minutes for deployment

### 3️⃣ Add API Key
1. Dashboard → **ckd-analyzer-backend**
2. Click **"Environment"** tab
3. Set **ANTHROPIC_API_KEY** = `sk-ant-api03-...`
4. Save (auto-redeploys)

### 4️⃣ Initialize Database
```bash
# Get External Database URL from Render dashboard
./scripts/init-render-db.sh "postgresql://user:pass@host/database"
```

### 5️⃣ Test Your App! 🎉
- **Frontend**: https://ckd-analyzer-frontend.onrender.com
- **Backend Health**: https://ckd-analyzer-backend.onrender.com/health
- **Test**: Click a patient → "AI Risk Analysis" button

---

## 📋 What Gets Deployed

Your `render.yaml` blueprint creates:

| Service | Type | URL | Cost |
|---------|------|-----|------|
| **ckd-analyzer-db** | PostgreSQL 16 | Internal only | Free (90 days) |
| **ckd-analyzer-backend** | Docker (Node.js) | `*.onrender.com` | Free (sleeps after 15min) |
| **ckd-analyzer-frontend** | Static Site (React) | `*.onrender.com` | Free (always on) |

---

## 🔧 After Deployment Checklist

- [ ] Backend deployed successfully (~5 min build)
- [ ] Frontend deployed successfully (~3 min build)
- [ ] ANTHROPIC_API_KEY set in backend environment
- [ ] Database initialized with `init-render-db.sh`
- [ ] Health check returns: `{"status": "healthy"}`
- [ ] Frontend loads patient list
- [ ] AI analysis works (click button → see risk assessment)

---

## ⚠️ Common Issues & Quick Fixes

### Issue: Backend build fails
**Fix**: Check `backend/Dockerfile` exists and `package.json` is valid

### Issue: CORS errors in browser
**Fix**: 
1. Backend → Environment → Set `CORS_ORIGIN=https://ckd-analyzer-frontend.onrender.com`
2. Save (redeploys automatically)

### Issue: Database connection fails
**Fix**: Use **Internal Database URL** (not External) in backend `DATABASE_URL`

### Issue: AI analysis fails
**Fix**: Verify `ANTHROPIC_API_KEY` is correct in backend environment

### Issue: App loads slowly (30-60s first time)
**Cause**: Free tier sleeps after 15min inactivity
**Fix**: Pre-warm with `curl https://ckd-analyzer-backend.onrender.com/health`

---

## 📚 Full Documentation

- **Complete Guide**: `RENDER_DEPLOYMENT_GUIDE.md` (detailed 600+ line guide)
- **Database Init SQL**: `RENDER_DATABASE_INIT.sql` (manual SQL if needed)
- **Init Script**: `scripts/init-render-db.sh` (automated database setup)
- **Hackathon Guide**: `docs/hackathon-deployment-guide.md` (demo tips)

---

## 🎯 Production Upgrade (Optional)

**Want to remove sleep timer?**
- Upgrade backend to paid tier: $7/month
- Dashboard → ckd-analyzer-backend → Settings → Change Instance Type → Starter ($7/mo)
- No more cold starts!

**Database expires in 90 days?**
- Upgrade database: $7/month for persistent storage
- Includes automatic backups

---

## 💡 Pro Tips

1. **Enable Auto-Deploy**: 
   - Each service → Settings → Auto-Deploy → ON
   - Now `git push` auto-deploys!

2. **Monitor Logs**:
   - Dashboard → Service → "Logs" tab
   - Watch real-time deployment & runtime logs

3. **Custom Domain** (Optional):
   - Settings → Custom Domain → Add your domain
   - Free SSL included

4. **Environment Groups** (Advanced):
   - Create shared env vars across services
   - Dashboard → Environment Groups → Create

---

## 🆘 Need Help?

1. **Check Logs**: Dashboard → Service → Logs tab
2. **Render Docs**: https://render.com/docs
3. **Render Discord**: https://render.com/discord
4. **Full Guide**: Read `RENDER_DEPLOYMENT_GUIDE.md`

---

**🎉 That's it! Your Healthcare AI CKD Analyzer is now live!**

Share your demo URL:
- Frontend: `https://ckd-analyzer-frontend.onrender.com`
- Backend API: `https://ckd-analyzer-backend.onrender.com`

Good luck! 🚀
