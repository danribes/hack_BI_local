# Deployment Options

Choose how you want to run the Healthcare AI application:

---

## 🏠 **Local Deployment (Recommended for Development)**

Run everything on your computer using Docker.

**Pros:**
- ⚡ **Very fast** (0.1-0.3 second response times)
- 💰 **Completely free** (no cloud costs)
- 🔒 **Private** (data never leaves your machine)
- 🚫 **No internet required** (after initial setup)
- 🎯 **Perfect for demos** (no warm-up time)

**Cons:**
- 🖥️ Requires Docker Desktop installed
- 📱 Not accessible from internet (local network only)

**Setup time:** 5 minutes

**👉 [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md)**

### Quick Start (Local)

```bash
# 1. Start services
docker compose up -d

# 2. Wait 30 seconds, then generate patients
curl -X POST http://localhost:3000/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'

# 3. Open browser
# http://localhost:8080
```

---

## ☁️ **Render Deployment (For Production/Sharing)**

Deploy to Render's cloud platform for public access.

**Pros:**
- 🌐 **Accessible from anywhere** (internet URL)
- 🔐 **Automatic HTTPS** (SSL certificates)
- 📊 **Easy to share** (send link to others)
- 🔄 **Auto-deploys** from git

**Cons:**
- 🐌 **Slower** on free tier (2-5 second response times)
- 😴 **Services sleep** after 15 min inactivity (free tier)
- 💵 **May incur costs** on paid tier

**Setup time:** 15-30 minutes

**👉 [RENDER_QUICK_START.md](RENDER_QUICK_START.md)**

**👉 [docs/RENDER_DEPLOYMENT_GUIDE.md](docs/RENDER_DEPLOYMENT_GUIDE.md)**

### Quick Start (Render)

1. Set environment variables in Render dashboard
2. Deploy services
3. Run:
```bash
curl -X POST https://your-backend.onrender.com/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```
4. Open: `https://your-frontend.onrender.com`

---

## 📊 Comparison

| Feature | Local | Render |
|---------|-------|--------|
| **Speed** | ⚡⚡⚡ Very Fast | 🐌 Slower (free tier) |
| **Cost** | 💰 Free | 💵 Free tier available |
| **Setup** | ⏱️ 5 minutes | ⏱️ 15-30 minutes |
| **Internet** | ❌ Not required | ✅ Required |
| **Sharing** | 🏠 Local network only | 🌐 Anyone with link |
| **Performance** | 0.1-0.3s response | 2-5s response |
| **Database** | Docker volume | Managed PostgreSQL |
| **SSL/HTTPS** | ❌ No | ✅ Automatic |
| **Best for** | Demos, development | Production, sharing |

---

## 🎯 Which Should You Choose?

### Choose **Local** if you want:
- ✅ Fastest performance
- ✅ Quick demo setup (5 minutes)
- ✅ No internet dependency
- ✅ Free forever
- ✅ Private data (doesn't leave your machine)

### Choose **Render** if you want:
- ✅ Share with remote team members
- ✅ Public demo URL
- ✅ Production deployment
- ✅ Automatic HTTPS/SSL
- ✅ No Docker installation required

---

## 🚀 Recommended Workflow

**Best practice:** Use both!

1. **Develop locally** (fast iterations)
   ```bash
   docker compose up -d
   # Make changes, test locally
   ```

2. **Deploy to Render** (when ready to share)
   ```bash
   git push origin main
   # Render auto-deploys
   ```

This gives you the **best of both worlds**:
- Fast local development
- Production deployment for sharing

---

## 📚 Full Documentation

### Local Deployment
- **Quick Start:** [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md)
- **Docker Compose:** [docker-compose.yml](docker-compose.yml)

### Render Deployment
- **Quick Start:** [RENDER_QUICK_START.md](RENDER_QUICK_START.md)
- **Complete Guide:** [docs/RENDER_DEPLOYMENT_GUIDE.md](docs/RENDER_DEPLOYMENT_GUIDE.md)

### Feature Guides
- **Patient Filtering:** [docs/PATIENT_FILTERING_GUIDE.md](docs/PATIENT_FILTERING_GUIDE.md)
- **Patient Distribution:** [docs/REALISTIC_PATIENT_DISTRIBUTION_GUIDE.md](docs/REALISTIC_PATIENT_DISTRIBUTION_GUIDE.md)
- **Lab Values:** [docs/LAB_VALUES_CLINICAL_ESSENTIALITY_ANALYSIS.md](docs/LAB_VALUES_CLINICAL_ESSENTIALITY_ANALYSIS.md)

---

## ⚡ Ultra Quick Start (Local)

**Just want to see it work? One command:**

```bash
docker compose up -d && sleep 40 && curl -X POST http://localhost:3000/api/init/populate-realistic-cohort -H "Content-Type: application/json" -d '{"patient_count": 1000}' && echo "\n\n✅ Done! Open http://localhost:8080"
```

Then open: **http://localhost:8080**

---

## 🆘 Need Help?

### Local Issues
See [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md#troubleshooting)

### Render Issues
See [RENDER_DEPLOYMENT_GUIDE.md](docs/RENDER_DEPLOYMENT_GUIDE.md#troubleshooting-on-render)

### Common Commands

**Local:**
```bash
docker compose logs -f          # View logs
docker compose restart          # Restart services
docker compose down -v          # Clean slate
```

**Render:**
```bash
# Check logs in Render Dashboard → Your Service → Logs
curl https://your-backend.onrender.com/api/patients/statistics
```

---

**Ready to start?**
- 🏠 [Local Deployment Guide →](LOCAL_DEPLOYMENT_GUIDE.md)
- ☁️ [Render Deployment Guide →](RENDER_QUICK_START.md)
