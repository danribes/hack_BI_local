# Clinical Alerts Email Notification System

## Overview

The CKD Analyzer system now includes automatic email notifications for critical clinical events. Emails are sent to the doctor whenever:

1. **Patient Worsening** - Kidney function declines significantly between cycles
2. **Health State Deterioration** - CKD stage progression detected
3. **Poor Medication Adherence** - Adherence drops below 75%
4. **Minuteful Kidney Alerts** - Home monitoring shows worsening uACR with AI-powered scheduling

---

## Setup Instructions

### Step 1: Configure Email Settings in Database

Run this SQL to set up email configuration:

```sql
-- Insert or update email configuration
INSERT INTO email_config (
  id,
  doctor_email,
  enabled,
  smtp_host,
  smtp_port,
  smtp_user,
  smtp_password,
  from_email,
  from_name
) VALUES (
  1,
  'your-email@example.com',  -- YOUR EMAIL ADDRESS
  true,                       -- Enable notifications
  'smtp.gmail.com',          -- SMTP server (Gmail example)
  587,                       -- Port (587 for TLS)
  'your-email@gmail.com',    -- SMTP username
  'your-app-password',       -- SMTP password (see below for Gmail)
  'noreply@ckd-analyzer.com', -- From email
  'CKD Analyzer System'      -- From name
)
ON CONFLICT (id) DO UPDATE SET
  doctor_email = EXCLUDED.doctor_email,
  enabled = EXCLUDED.enabled,
  smtp_host = EXCLUDED.smtp_host,
  smtp_port = EXCLUDED.smtp_port,
  smtp_user = EXCLUDED.smtp_user,
  smtp_password = EXCLUDED.smtp_password,
  from_email = EXCLUDED.from_email,
  from_name = EXCLUDED.from_name,
  updated_at = NOW();
```

### Step 2: Gmail Configuration (If Using Gmail)

**Important:** Gmail requires an "App Password" (not your regular password):

1. Go to Google Account Settings: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to "App passwords": https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Use this 16-character password in the `smtp_password` field above

**Gmail Settings:**
```sql
smtp_host = 'smtp.gmail.com'
smtp_port = 587
smtp_user = 'your-gmail@gmail.com'
smtp_password = 'abcd efgh ijkl mnop'  -- 16-char app password
```

### Step 3: Other Email Providers

**Outlook/Office 365:**
```sql
smtp_host = 'smtp.office365.com'
smtp_port = 587
```

**Yahoo Mail:**
```sql
smtp_host = 'smtp.mail.yahoo.com'
smtp_port = 587
```

**Custom SMTP Server:**
```sql
smtp_host = 'mail.yourprovider.com'
smtp_port = 587  -- or 465 for SSL
```

### Step 4: Test Configuration

Use the test endpoint to verify email is working:

```bash
curl -X POST https://ckd-analyzer-backend.onrender.com/api/email/test
```

You should receive a test email. If using the default test account (no SMTP configured), you'll get an Ethereal test URL to view the email online.

---

## Alert Scenarios

### 1. Patient Worsening (Cycle-to-Cycle)

**Triggers:**
- eGFR decline >10% OR
- uACR increase >25%

**Example Email:**
```
Subject: 🔻 ALERT: Karen Anderson - Kidney Function Worsening
Priority: HIGH

Clinical Changes:
• eGFR declined from 48.2 to 42.1 mL/min/1.73m² (12.7% decrease)
  ⚠️ This represents significant kidney function decline

Recommended Actions:
• Review current treatment regimen
• Consider therapy intensification
• Schedule urgent follow-up appointment
• Check medication adherence
• Review for contributing factors (infections, NSAIDs, volume depletion)
```

### 2. Health State Deterioration

**Triggers:**
- CKD stage progression (e.g., G3a → G3b, G3b → G4)

**Example Email:**
```
Subject: ⚠️ CRITICAL: Amanda Allen - Health State Deteriorated to G4-A2
Priority: CRITICAL

State Change:
• Previous: G3b-A2
• Current: G4-A2

Clinical Significance:
• Patient has progressed to Stage 4 CKD (Severe decrease)
• High risk for progression to kidney failure
• Nephrology co-management essential

Recommended Actions:
• URGENT: Nephrology referral if not already done
• Assess for kidney replacement therapy readiness
• Review for CKD complications (anemia, bone disease, acidosis)
• Increase monitoring frequency
• Patient education on disease progression
```

### 3. Poor Medication Adherence

**Triggers:**
- Adherence score <75% (POOR category)

**Example Email:**
```
Subject: 💊 ALERT: John Smith - Poor Medication Adherence (68%)
Priority: HIGH

Adherence Assessment:
• Overall Adherence Score: 68%
• Category: POOR
• This indicates patient is taking <75% of prescribed medications

Clinical Impact:
• Poor adherence is associated with faster CKD progression
• Increased risk of cardiovascular events
• Suboptimal blood pressure and proteinuria control

Recommended Interventions:
• Schedule urgent patient consultation to discuss adherence barriers
• Common barriers: cost, side effects, complexity, forgetfulness
• Consider:
  - Medication synchronization
  - Pill organizers or reminder apps
  - Patient assistance programs for cost issues
  - Simplification of regimen if possible
  - Home nursing support if appropriate
• Reassess after intervention to ensure improvement
```

### 4. Minuteful Kidney Worsening uACR + AI Scheduling

**Triggers:**
- Home monitoring detects uACR increase >30%

**Example Email:**
```
Subject: 🏠 URGENT: Sarah Johnson - Minuteful Kidney Shows Worsening uACR
Priority: CRITICAL

Home Monitoring Results:
• Previous uACR: 125.3 mg/g
• Current uACR: 185.7 mg/g
• Change: +48.2% increase
• Device: Minuteful Kidney home monitoring kit

Clinical Significance:
• Significant worsening of proteinuria detected at home
• This may indicate:
  - Disease progression
  - Medication non-adherence
  - Acute kidney injury
  - Volume status changes

🤖 AI-Powered Blood Analysis Scheduling Recommendation:

**⚡ URGENT - Schedule within 24-48 hours**

Rationale:
Based on the severity of uACR increase (>48%), immediate blood work
is recommended to:
1. Rule out acute kidney injury (compare serum creatinine)
2. Assess for metabolic complications
3. Verify home monitoring accuracy
4. Guide urgent treatment adjustments

Suggested Timing: Schedule patient for blood draw tomorrow or next
available urgent slot

Required Lab Tests:
• Comprehensive Metabolic Panel (CMP)
• Complete Blood Count (CBC)
• eGFR with creatinine
• Quantitative urine protein or PCR
• Hemoglobin A1c (if diabetic)
• Lipid panel
```

---

## AI-Powered Scheduling Logic

The system uses intelligent algorithms to recommend appropriate timing for blood analysis:

### Urgency Levels

**URGENT (24-48 hours):**
- eGFR decline >25% OR
- uACR increase >100% OR
- eGFR <20 mL/min/1.73m²

**PROMPT (3-5 days):**
- eGFR decline 15-25% OR
- uACR increase 50-100%

**ROUTINE (1-2 weeks):**
- Lesser changes requiring confirmation

---

## Email Templates

All emails include:
- ✅ Patient name and MRN
- ✅ Priority badge (CRITICAL/HIGH/MODERATE)
- ✅ Clinical changes with specific values
- ✅ Clinical significance/interpretation
- ✅ Actionable recommended steps
- ✅ Professional HTML formatting
- ✅ Plain text fallback for compatibility

---

## Testing

### Test with Development Account

If no SMTP is configured, the system uses Ethereal (test email service):

1. Click "Update Patient Records" for a worsening patient
2. Check backend logs for preview URL
3. Open URL to view the test email
4. Example: `https://ethereal.email/message/xxxxx`

### Test with Real SMTP

1. Configure email settings (see Step 1)
2. Update a patient that meets alert criteria
3. Check your inbox for the alert email
4. Verify all information is correct

---

## Monitoring & Logs

### View Sent Emails

```sql
-- Recent emails sent
SELECT
  to_email,
  subject,
  status,
  sent_at,
  error_message
FROM email_messages
ORDER BY sent_at DESC
LIMIT 20;
```

### Check Email Configuration

```sql
-- Current configuration
SELECT
  doctor_email,
  enabled,
  smtp_host,
  smtp_port,
  from_email,
  from_name,
  updated_at
FROM email_config
WHERE id = 1;
```

### Backend Logs

Look for these log messages:
```
[Clinical Alerts] Checking alerts for patient MRN000914...
✓ Worsening trends alert sent for MRN000914
✓ Health state deterioration alert sent for MRN000926
✓ Poor adherence alert sent for MRN000931
✓ Minuteful worsening uACR alert sent for MRN000994
[Clinical Alerts] ✓ Alert checking completed
```

---

## Troubleshooting

### Emails Not Sending

1. **Check if enabled:**
   ```sql
   SELECT enabled FROM email_config WHERE id = 1;
   ```

2. **Verify SMTP settings:**
   - Test with `curl -X POST /api/email/test`
   - Check for authentication errors in logs

3. **Gmail-specific:**
   - Ensure 2-Step Verification is enabled
   - Use App Password (not regular password)
   - Check "Less secure app access" if using old Gmail

4. **Firewall issues:**
   - Ensure ports 587 (TLS) or 465 (SSL) are open
   - Try alternative ports if blocked

### Emails Going to Spam

1. Configure SPF/DKIM records for your domain
2. Use a professional from_email address
3. Ask recipient to whitelist sender
4. Use authenticated SMTP server

### Alert Not Triggered

1. **Verify conditions are met:**
   - Check eGFR/uACR changes are above thresholds
   - Ensure patient has baseline data to compare

2. **Check backend logs:**
   ```bash
   # On Render dashboard, go to Logs tab
   # Look for [Clinical Alerts] messages
   ```

3. **Manually test service:**
   - Patient must have multiple cycles of data
   - Alert only triggers if change exceeds threshold

---

## Security Notes

- ⚠️ **Never commit SMTP passwords to git**
- ✅ Store credentials as environment variables in production
- ✅ Use App Passwords (Gmail) or OAuth2 when possible
- ✅ Enable TLS/SSL for email transmission
- ✅ Regularly rotate SMTP credentials
- ✅ Restrict database access to email_config table

---

## Future Enhancements

Potential improvements:
- SMS notifications for critical alerts
- Customizable alert thresholds per patient
- Email preferences UI in frontend
- Alert acknowledgment tracking
- Summary digests (daily/weekly)
- Multi-recipient support (care team)
