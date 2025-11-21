# Quick Start Guide - Local Docker Deployment

Get the Healthcare AI Clinical Data Analyzer running on your local machine in 3 minutes.

## Prerequisites Check

Before starting, ensure you have:

- [ ] Docker Desktop installed and running
- [ ] Docker Compose v2.0+ available
- [ ] Anthropic API Key (get from https://console.anthropic.com)
- [ ] Ports 3000, 5433, and 8080 available

### Verify Docker Installation

```bash
docker --version          # Should show v20.10+
docker-compose --version  # Should show v2.0+
docker info              # Should connect without errors
```

## Step-by-Step Setup

### 1. Get the Code

```bash
git clone <repository-url>
cd hack_BI_local
```

### 2. Configure API Key

The `.env` file already exists. Just add your Anthropic API key:

```bash
# Open .env file
nano .env   # or use your preferred editor

# Find this line:
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Replace with your actual API key:
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXX

# Save and exit (Ctrl+X, then Y, then Enter in nano)
```

### 3. Start Everything

```bash
docker-compose up -d
```

This command will:
- Pull Docker images (first time only, ~2 minutes)
- Build backend and frontend containers (~3-4 minutes first time)
- Start PostgreSQL database
- Initialize database schema
- Start all services

### 4. Wait for Services to Start

Monitor the startup process:

```bash
# Watch logs (Ctrl+C to exit)
docker-compose logs -f

# Or check service status
docker-compose ps
```

All services should show status `Up` and `healthy` after ~30-60 seconds.

### 5. Access the Application

Open your browser and visit:

**Frontend**: http://localhost:8080

You should see the Healthcare AI Clinical Data Analyzer interface.

## Verify Everything Works

### Check Backend Health

```bash
curl http://localhost:3000/health
```

Should return: `{"status":"healthy","timestamp":"..."}`

### Check Database Connection

```bash
docker-compose exec postgres pg_isready -U healthcare_user
```

Should return: `postgres:5432 - accepting connections`

### Check Frontend

Open http://localhost:8080 - you should see the application UI.

## Common First-Time Issues

### Issue: Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**: Stop the conflicting service or change ports in `docker-compose.yml`

```bash
# Find what's using the port
lsof -i :3000   # On macOS/Linux
netstat -ano | findstr :3000   # On Windows

# Then either kill that process or edit docker-compose.yml
```

### Issue: API Key Not Working

**Error**: Backend logs show "Invalid API key" or authentication errors

**Solution**: Verify your `.env` file:

```bash
# Check the API key is set correctly
cat .env | grep ANTHROPIC_API_KEY

# Make sure there are no extra spaces or quotes
# Correct format: ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Issue: Services Won't Start

**Error**: Container exits immediately or shows unhealthy

**Solution**: Check the logs for the specific service

```bash
# View logs for failing service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Try rebuilding from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Database Not Initializing

**Error**: Backend can't connect to database

**Solution**: Reset the database

```bash
# Stop everything and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait for postgres to be healthy
docker-compose ps
```

## Development Mode (Optional)

If you want to modify code with hot reload:

```bash
# Stop production containers
docker-compose down

# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Frontend will be on port 5173 (Vite dev server) and auto-reload on changes.

## Stop the Application

```bash
# Stop but keep data
docker-compose down

# Stop and remove all data (fresh start next time)
docker-compose down -v
```

## Next Steps

Now that everything is running:

1. Explore the application at http://localhost:8080
2. Try adding a patient and running AI analysis
3. Check the [README.md](README.md) for detailed features
4. Review [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md) for advanced topics

## Quick Command Reference

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db

# Check service status
docker-compose ps

# Restart a specific service
docker-compose restart backend
```

## Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Review the [Troubleshooting section](README.md#-troubleshooting) in README
3. Ensure Docker is running: `docker info`
4. Verify ports are available: `docker-compose ps`

---

**Estimated Setup Time**: 5-10 minutes (including Docker image downloads)

**Ready to deploy?** Just run: `docker-compose up -d` 🚀
