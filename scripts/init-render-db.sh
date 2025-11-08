#!/bin/bash
# Initialize Render PostgreSQL Database
# Run this after creating the database on Render

set -e

echo "🏥 CKD Risk Screening System - Database Initialization"
echo "======================================================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/init-render-db.sh <DATABASE_URL>"
  echo ""
  echo "Get your DATABASE_URL from:"
  echo "1. Go to https://dashboard.render.com"
  echo "2. Click on your 'ckd-analyzer-db' database"
  echo "3. Copy the 'Internal Database URL' (starts with postgresql://)"
  echo ""
  echo "Example:"
  echo "./scripts/init-render-db.sh 'postgresql://postgres:...@dpg-.../ckd_analyzer'"
  exit 1
fi

DATABASE_URL="$1"

echo "📊 Initializing database schema and mock data..."
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql is not installed"
  echo ""
  echo "Install PostgreSQL client:"
  echo "  - macOS: brew install postgresql"
  echo "  - Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "  - Windows: Download from https://www.postgresql.org/download/"
  exit 1
fi

# Run initialization script
echo "Running init.sql..."
psql "$DATABASE_URL" -f infrastructure/postgres/init.sql

echo ""
echo "✅ Database initialized successfully!"
echo ""
echo "Verifying data..."
echo ""

# Verify patients
PATIENT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM patients;")
echo "   Patients: $PATIENT_COUNT (expected: 5)"

# Verify observations
OBS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM observations;")
echo "   Observations: $OBS_COUNT (expected: 33)"

# Verify conditions
COND_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM conditions;")
echo "   Conditions: $COND_COUNT (expected: 16)"

# List patients
echo ""
echo "📋 Mock Patients:"
psql "$DATABASE_URL" -c "SELECT medical_record_number, first_name, last_name FROM patients ORDER BY medical_record_number;"

echo ""
echo "🎉 Database ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Deploy backend: Check 'ckd-analyzer-backend' service in Render"
echo "2. Set ANTHROPIC_API_KEY in backend environment variables"
echo "3. Deploy frontend: Check 'ckd-analyzer-frontend' service in Render"
echo "4. Test the application!"
