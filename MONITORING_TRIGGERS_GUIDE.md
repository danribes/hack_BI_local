# CKD Patient Monitoring Trigger System

## Overview

This system automatically monitors CKD patients for risk state changes and sends notifications to doctors when a patient's condition deteriorates or improves.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│  Trigger: Patient Data Update                                   │
│  ↓                                                               │
│  Function: detect_risk_state_change()                           │
│  ↓                                                               │
│  NOTIFY: patient_data_updated                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│               Node.js Backend (LISTEN)                           │
├─────────────────────────────────────────────────────────────────┤
│  RiskChangeMonitor Service                                       │
│  ↓                                                               │
│  1. Fetch updated patient data                                  │
│  2. Run risk assessment algorithm                               │
│  3. Call record_risk_assessment() function                      │
│  4. Detect state changes (priority changed?)                    │
│  5. If escalated/improved → create notification                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              Notification System                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Create doctor_notifications record                           │
│  • NOTIFY: send_doctor_notification                             │
│  • Email/SMS/Push notification sent                             │
│  • Update monitoring_status to 'active' if critical             │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database Schema

#### patient_risk_history
Tracks all risk assessments over time:
- `risk_priority`: CRITICAL, HIGH, MODERATE, LOW
- `severity_score`: Calculated score
- `previous_priority`: For detecting changes
- `priority_changed`: Boolean flag
- `state_escalated`: Boolean (got worse)
- `state_improved`: Boolean (got better)

#### doctor_notifications
Stores notifications sent to doctors:
- `notification_type`: state_change, critical_alert, monitoring_required
- `priority`: CRITICAL, HIGH, MODERATE
- `subject`: Email subject
- `message`: Full notification message
- `status`: pending, sent, delivered, read, acknowledged

#### patients table additions
- `monitoring_status`: active, inactive, paused
- `current_risk_priority`: Latest priority
- `current_risk_score`: Latest score
- `last_risk_assessment_date`: Timestamp

### 2. Database Triggers

#### Trigger: trg_patient_update
Fires when patient demographic/clinical data changes:
```sql
CREATE TRIGGER trg_patient_update
    AFTER UPDATE ON patients
    FOR EACH ROW
    WHEN (
        OLD.weight IS DISTINCT FROM NEW.weight OR
        OLD.on_ras_inhibitor IS DISTINCT FROM NEW.on_ras_inhibitor OR
        OLD.nephrotoxic_meds IS DISTINCT FROM NEW.nephrotoxic_meds
        -- ... other fields
    )
    EXECUTE FUNCTION detect_risk_state_change();
```

#### Trigger: trg_observation_change
Fires when new lab results are added:
```sql
CREATE TRIGGER trg_observation_change
    AFTER INSERT OR UPDATE ON observations
    FOR EACH ROW
    EXECUTE FUNCTION detect_risk_state_change();
```

### 3. PostgreSQL Functions

#### detect_risk_state_change()
- Sends a NOTIFY message to the backend via `pg_notify()`
- Payload includes patient_id, MRN, table name, timestamp

#### record_risk_assessment()
- Records the assessment in `patient_risk_history`
- Compares with previous priority to detect changes
- Updates `patients` table with current risk state
- Automatically activates monitoring for CRITICAL/HIGH patients
- Returns: priority_changed, state_escalated, requires_notification

#### create_doctor_notification()
- Creates a notification record
- Sends NOTIFY for backend to process email/SMS

### 4. Backend Service: RiskChangeMonitor

Located in: `backend/src/services/riskChangeMonitor.ts`

#### Responsibilities:
1. **Listen to PostgreSQL NOTIFY events**
   - `patient_data_updated` - when patient data changes
   - `send_doctor_notification` - when notification needs sending

2. **Process patient data updates:**
   ```typescript
   handlePatientDataUpdate(payload) {
     1. Fetch updated patient data
     2. Run assessPatientRisk() algorithm
     3. Call record_risk_assessment() DB function
     4. Check if notification required
     5. Create notification if needed
   }
   ```

3. **Send notifications:**
   - Email (placeholder - integrate with SendGrid/AWS SES)
   - SMS (placeholder - integrate with Twilio)
   - Push notifications (placeholder)

### 5. API Endpoints

#### Notifications Management
- `GET /api/notifications` - List all notifications
- `GET /api/notifications/pending` - Pending notifications
- `GET /api/notifications/:id` - Get notification details
- `PUT /api/notifications/:id/acknowledge` - Mark as acknowledged
- `GET /api/notifications/stats/summary` - Statistics
- `GET /api/notifications/patient/:patientId/history` - Patient notification history

#### Monitoring
- `GET /api/monitoring/scan` - Full patient scan
- `GET /api/monitoring/critical` - Critical priority patients
- `GET /api/monitoring/priority/:priority` - Filter by priority

## How It Works: Complete Flow

### Scenario: Doctor updates patient's lab results

1. **Database Insert:**
   ```sql
   INSERT INTO observations (patient_id, observation_type, value_numeric, observation_date)
   VALUES ('patient-uuid', 'eGFR', 18.5, NOW());
   ```

2. **Trigger Fires:**
   - `trg_observation_change` executes
   - Calls `detect_risk_state_change()`
   - Sends NOTIFY: `patient_data_updated`

3. **Backend Receives Notification:**
   ```
   [RiskChangeMonitor] Received notification: patient_data_updated
   Payload: { patient_id: 'uuid', mrn: 'MRN123', table: 'observations' }
   ```

4. **Risk Assessment:**
   - Fetch patient data with new eGFR
   - Run algorithm: eGFR 18.5 → Stage 5 CKD
   - Severity score: 45 (CRITICAL)
   - Alerts: 8 critical issues found

5. **State Change Detection:**
   ```
   Previous: HIGH (score 25)
   Current: CRITICAL (score 45)
   State escalated: TRUE
   Requires notification: TRUE
   ```

6. **Database Updates:**
   ```sql
   -- Insert risk history
   INSERT INTO patient_risk_history ...

   -- Update patient
   UPDATE patients SET
     current_risk_priority = 'CRITICAL',
     monitoring_status = 'active',
     monitoring_activated_date = NOW()
   ```

7. **Notification Created:**
   ```
   Subject: 🚨 URGENT: Patient John Doe risk escalated to CRITICAL

   Patient Alert - Risk State Escalation

   RISK STATUS CHANGE:
     Previous: HIGH
     Current: CRITICAL ⚠️
     Risk Score: 45

   ALERTS (8):
     1. [CRITICAL] Rapid eGFR decline (-22%)
        Action: Urgent nephrology referral

     2. [CRITICAL] Severe hyperkalemia (K+ 6.2 mEq/L)
        Action: Immediate evaluation for cardiac monitoring

   MONITORING STATUS:
     Status: ACTIVE (automatically activated)

   RECOMMENDED ACTIONS:
     • Review patient within 24-48 hours
     • Review all alerts and implement actions
   ```

8. **Notification Sent:**
   - Email to assigned doctor
   - Status updated: pending → sent
   - Doctor can view in Notifications Dashboard

9. **Doctor Acknowledges:**
   - Clicks "Acknowledge" in dashboard
   - `PUT /api/notifications/{id}/acknowledge`
   - Status updated: sent → acknowledged

## Testing the System

### 1. Apply Database Migration

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db

# Run migration
\i /migrations/003_add_monitoring_triggers.sql

# Verify triggers
SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trg_%';

# Verify functions
SELECT proname FROM pg_proc WHERE proname LIKE '%risk%';
```

### 2. Start Backend with Monitor

The monitor starts automatically when backend starts:

```bash
# Backend logs will show:
[RiskChangeMonitor] Starting to listen for patient data updates...
✓ Listening to channels: patient_data_updated, send_doctor_notification
```

### 3. Test: Update Patient Weight

```sql
-- This should trigger the monitor
UPDATE patients
SET weight = 95.5
WHERE medical_record_number = 'MRN001';
```

Expected output:
```
[RiskChangeMonitor] Patient data updated: MRN001 (uuid) in patients
[RiskChangeMonitor] Running risk assessment...
[RiskChangeMonitor] Assessment complete for MRN001:
  priority: HIGH
  score: 25
  alerts: 5
```

### 4. Test: Add Critical Lab Result

```sql
-- Add dangerously high potassium
INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date)
VALUES (
  (SELECT id FROM patients WHERE medical_record_number = 'MRN001'),
  'potassium',
  6.5,
  'mEq/L',
  NOW()
);
```

Expected outcome:
- Priority escalates to CRITICAL
- Notification created
- Monitoring status set to 'active'
- Email notification logged to console

### 5. View Notifications in Frontend

1. Start frontend: `http://localhost:5173`
2. Navigate to "📧 Notifications" tab
3. See the new notification
4. Click "Acknowledge" to mark as read

## Monitoring Status Management

### Automatic Activation

Monitoring is automatically activated when:
- Patient reaches CRITICAL priority
- Patient reaches HIGH priority
- State escalates (e.g., MODERATE → HIGH)

### Manual Management

```sql
-- Activate monitoring
UPDATE patients
SET monitoring_status = 'active'
WHERE medical_record_number = 'MRN001';

-- Pause monitoring (e.g., patient on vacation)
UPDATE patients
SET monitoring_status = 'paused'
WHERE medical_record_number = 'MRN001';

-- Deactivate (e.g., patient improved)
UPDATE patients
SET monitoring_status = 'inactive'
WHERE medical_record_number = 'MRN001';
```

## Notification Configuration

### Email Integration (TODO)

To send real emails, integrate with email service:

```typescript
// In riskChangeMonitor.ts, update sendNotification()

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

await transporter.sendMail({
  from: 'ckd-monitoring@hospital.com',
  to: notification.doctor_email,
  subject: notification.subject,
  text: notification.message,
  html: generateEmailHTML(notification)
});
```

### SMS Integration (TODO)

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  from: process.env.TWILIO_PHONE_NUMBER,
  to: doctor.phone,
  body: notification.subject
});
```

## Performance Considerations

### Database Load
- Triggers fire only when clinical data changes
- Use indexes on patient_id, monitoring_status
- NOTIFY is very lightweight (<1ms overhead)

### Backend Performance
- Single LISTEN connection per backend instance
- Non-blocking async processing
- Can handle 100s of updates per second

### Scaling
- Multiple backend instances can all LISTEN
- Each will process the same events (idempotent)
- Use distributed locks if needed

## Troubleshooting

### Monitor not receiving notifications

```bash
# Check if backend is listening
docker-compose logs backend | grep "Listening to channels"

# Test NOTIFY manually
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db
SELECT pg_notify('patient_data_updated', '{"test": true}');
```

### Triggers not firing

```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trg_patient_update';

-- Check trigger function
SELECT prosrc FROM pg_proc WHERE proname = 'detect_risk_state_change';

-- Enable trigger logging
SET client_min_messages TO NOTICE;
UPDATE patients SET weight = 80 WHERE id = 'some-uuid';
```

### Notifications not created

```sql
-- Check if notification was inserted
SELECT * FROM doctor_notifications ORDER BY created_at DESC LIMIT 5;

-- Check risk history
SELECT * FROM patient_risk_history ORDER BY assessment_date DESC LIMIT 5;
```

## Security

### Permissions
```sql
-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE ON patient_risk_history TO healthcare_user;
GRANT SELECT, INSERT, UPDATE ON doctor_notifications TO healthcare_user;

-- Revoke NOTIFY/LISTEN from public
REVOKE EXECUTE ON FUNCTION pg_notify FROM PUBLIC;
```

### Data Privacy
- Notifications contain PHI - ensure encrypted transport
- Use HTTPS for API endpoints
- Encrypt email content
- Audit notification access

## Future Enhancements

1. **Machine Learning Integration**
   - Predict risk escalation before it happens
   - Personalized alert thresholds

2. **Multi-channel Notifications**
   - SMS for critical alerts
   - Push notifications to mobile app
   - Integration with paging systems

3. **Smart Notification Batching**
   - Group multiple alerts for same patient
   - Daily digest for non-critical alerts

4. **Alert Fatigue Prevention**
   - Track acknowledge rates
   - Adjust sensitivity based on outcomes
   - Snooze functionality

5. **Escalation Pathways**
   - Auto-escalate if not acknowledged within X hours
   - On-call rotation integration
   - Multi-tier escalation (RN → MD → Nephrologist)

## References

- PostgreSQL NOTIFY/LISTEN: https://www.postgresql.org/docs/current/sql-notify.html
- KDIGO CKD Guidelines: https://kdigo.org/guidelines/ckd-evaluation-and-management/
- Node.js pg library: https://node-postgres.com/
