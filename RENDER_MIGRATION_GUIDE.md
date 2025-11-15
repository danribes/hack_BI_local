# Running Database Migration on Render.com

This guide explains how to run the lab value simulation migration on your Render.com deployment.

## Prerequisites

Your application should be deployed on Render.com with:
- Backend service running
- PostgreSQL database service configured
- Database connected to backend

## Option 1: Using the Migration API Endpoint (Easiest) ✅

This is the **recommended method** for Render.com deployments.

### Step 1: Access Your Backend URL

Your backend should be deployed at a URL like:
```
https://your-backend-service.onrender.com
```

### Step 2: Call the Migration Endpoint

You can run the migration using any of these methods:

#### A. Using curl (from your terminal):

```bash
curl -X POST https://your-backend-service.onrender.com/api/init/migrate-month-tracking
```

#### B. Using a web browser:

You can use a REST client browser extension like:
- **Thunder Client** (VS Code extension)
- **Postman**
- **REST Client** (VS Code extension)

Or create a simple HTML file and open it in your browser:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Run Migration</title>
</head>
<body>
    <h1>Run Month Tracking Migration</h1>
    <button onclick="runMigration()">Run Migration</button>
    <pre id="result"></pre>

    <script>
        async function runMigration() {
            const button = document.querySelector('button');
            const result = document.getElementById('result');

            button.disabled = true;
            result.textContent = 'Running migration...';

            try {
                const response = await fetch('https://your-backend-service.onrender.com/api/init/migrate-month-tracking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                result.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                result.textContent = 'Error: ' + error.message;
            } finally {
                button.disabled = false;
            }
        }
    </script>
</body>
</html>
```

#### C. Using JavaScript fetch in browser console:

1. Open your frontend application in the browser
2. Open browser DevTools (F12)
3. Go to the Console tab
4. Paste and run this code:

```javascript
fetch('https://your-backend-service.onrender.com/api/init/migrate-month-tracking', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Expected Response:

```json
{
  "status": "success",
  "message": "Month tracking migration completed successfully",
  "details": {
    "column_added": true,
    "index_created": true,
    "rows_updated": 1234,
    "column_info": {
      "column_name": "month_number",
      "data_type": "integer",
      "is_nullable": "NO"
    }
  }
}
```

## Option 2: Using Render Shell (Advanced)

If you have access to Render's shell feature:

### Step 1: Access the Shell

1. Go to your Render Dashboard
2. Select your PostgreSQL database service
3. Click "Connect" → "External Connection" to get connection details

### Step 2: Connect via psql

From your local machine (if you have psql installed):

```bash
psql postgres://username:password@hostname:port/database_name
```

### Step 3: Run Migration SQL

Once connected, paste the migration SQL:

```sql
-- Add month_number column
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS month_number INTEGER DEFAULT 1 CHECK (month_number >= 1 AND month_number <= 12);

-- Create index
CREATE INDEX IF NOT EXISTS idx_observations_month ON observations(patient_id, month_number, observation_type);

-- Add comment
COMMENT ON COLUMN observations.month_number IS 'Month number (1-12) for tracking historical lab values. Month 12 represents the most recent values.';

-- Update existing data
UPDATE observations
SET month_number = 1
WHERE month_number IS NULL;

-- Make column NOT NULL
ALTER TABLE observations
ALTER COLUMN month_number SET NOT NULL;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'observations' AND column_name = 'month_number';
```

## Option 3: Using Render Dashboard SQL Editor

Some Render plans include a SQL editor:

1. Go to your Render Dashboard
2. Select your PostgreSQL database
3. Click on "Connect" or "Shell"
4. Use the SQL editor to run the migration commands from Option 2

## Verification

After running the migration, verify it worked:

### Method 1: Check via API

```bash
curl https://your-backend-service.onrender.com/api/init/status
```

This should return database status without errors.

### Method 2: Test the Simulation Feature

1. Open your frontend application
2. Click on any patient
3. Look for the purple "Simulate New Labs" button in the Laboratory Results section
4. Click it - if the migration worked, it should generate new values

### Method 3: Direct Database Query

Connect to your database and run:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'observations' AND column_name = 'month_number';
```

Expected output:
```
 column_name  | data_type | is_nullable
--------------+-----------+-------------
 month_number | integer   | NO
```

## Troubleshooting

### Error: "Failed to run month tracking migration"

**Possible Causes:**
1. Database connection issue
2. Insufficient permissions
3. Table doesn't exist

**Solution:**
- Check Render logs for your backend service
- Verify database connection string in environment variables
- Ensure the `observations` table exists

### Error: "Column already exists"

This is actually fine! The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times.

### Error: "Cannot access backend URL"

**Solution:**
- Verify your backend service is running on Render
- Check the service URL in Render dashboard
- Ensure CORS is configured to accept requests

### Migration Seems Stuck

**Solution:**
- Check Render logs for your backend service
- The migration might be processing many rows
- Wait a few minutes and check logs again

## After Migration

Once the migration is complete, you can use the lab simulation features:

### Single Patient Simulation:
1. Navigate to any patient detail page
2. Click the purple **"Simulate New Labs"** button
3. New lab values will be generated

### Cohort Advancement:
1. From the main patient list
2. Click the green **"Advance All Patients (Next Month)"** button
3. All patients will advance to the next month

## Render-Specific Notes

### Environment Variables

Ensure these are set in your Render backend service:
- `DB_HOST` - PostgreSQL hostname
- `DB_PORT` - PostgreSQL port (usually 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

### Database Backups

Before running the migration, you may want to create a backup:
1. Go to Render Dashboard → Your Database
2. Click "Backups"
3. Create a manual backup

This allows you to restore if something goes wrong.

### Logs

Monitor migration progress in Render:
1. Go to your Backend service
2. Click "Logs"
3. You should see output like:
   ```
   Running month tracking migration...
   ✓ Added month_number column
   ✓ Created index on month_number
   ✓ Updated 1234 existing observations to month 1
   ✓ Month tracking migration completed successfully
   ```

## Need Help?

If you encounter issues:

1. Check Render service logs
2. Verify database connection
3. Ensure environment variables are set correctly
4. Try the migration endpoint again (it's safe to run multiple times)

---

**Migration Endpoint:** `POST /api/init/migrate-month-tracking`

**No authentication required** (as per your current setup)

The migration is **idempotent** - safe to run multiple times without issues! ✅
