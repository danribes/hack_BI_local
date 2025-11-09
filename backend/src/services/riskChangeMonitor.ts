/**
 * Risk Change Monitor Service
 *
 * Listens to PostgreSQL notifications about patient data changes,
 * runs risk assessments, and detects state changes requiring doctor notification.
 */

import { Pool } from 'pg';
import { getPatientById } from './patientService';
import { assessPatientRisk } from './riskMonitoringService';
import { detectCKDDiagnosisOnset, processNewCKDDiagnosis } from './ckdDiagnosisDetection';

export interface RiskChangeResult {
  priority_changed: boolean;
  state_escalated: boolean;
  requires_notification: boolean;
  old_priority: string | null;
  new_priority: string;
}

/**
 * PostgreSQL LISTEN/NOTIFY listener for patient data changes
 */
export class RiskChangeMonitor {
  private pool: Pool;
  private client: any = null;
  private isListening = false;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Start listening to patient data updates
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('[RiskChangeMonitor] Already listening');
      return;
    }

    try {
      // Get a dedicated client for LISTEN
      this.client = await this.pool.connect();

      console.log('[RiskChangeMonitor] Starting to listen for patient data updates...');

      // Set up notification handler
      this.client.on('notification', async (msg: any) => {
        console.log('[RiskChangeMonitor] Received notification:', msg.channel);

        try {
          const payload = JSON.parse(msg.payload);
          console.log('[RiskChangeMonitor] Payload:', payload);

          if (msg.channel === 'patient_data_updated') {
            await this.handlePatientDataUpdate(payload);
          } else if (msg.channel === 'send_doctor_notification') {
            await this.handleSendNotification(payload);
          }
        } catch (error) {
          console.error('[RiskChangeMonitor] Error processing notification:', error);
        }
      });

      // Start listening to the channels
      await this.client.query('LISTEN patient_data_updated');
      await this.client.query('LISTEN send_doctor_notification');

      this.isListening = true;
      console.log('[RiskChangeMonitor] ✓ Listening to channels: patient_data_updated, send_doctor_notification');
    } catch (error) {
      console.error('[RiskChangeMonitor] Error starting listener:', error);
      if (this.client) {
        this.client.release();
        this.client = null;
      }
      throw error;
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    if (!this.isListening || !this.client) {
      return;
    }

    try {
      await this.client.query('UNLISTEN patient_data_updated');
      await this.client.query('UNLISTEN send_doctor_notification');
      this.client.release();
      this.client = null;
      this.isListening = false;
      console.log('[RiskChangeMonitor] Stopped listening');
    } catch (error) {
      console.error('[RiskChangeMonitor] Error stopping listener:', error);
    }
  }

  /**
   * Handle patient data update notification
   */
  private async handlePatientDataUpdate(payload: any): Promise<void> {
    const { patient_id, mrn, table, timestamp } = payload;

    console.log(`[RiskChangeMonitor] Patient data updated: ${mrn} (${patient_id}) in ${table} at ${timestamp}`);
    console.log('[RiskChangeMonitor] Running risk assessment...');

    try {
      // Fetch updated patient data
      const patient = await getPatientById(patient_id);

      if (!patient) {
        console.error(`[RiskChangeMonitor] Patient not found: ${patient_id}`);
        return;
      }

      // Run risk assessment
      const assessment = assessPatientRisk(patient);

      console.log(`[RiskChangeMonitor] Assessment complete for ${mrn}:`, {
        priority: assessment.priority,
        score: assessment.severity_score,
        alerts: assessment.alert_count
      });

      // Record the assessment and check for state changes
      const result = await this.recordRiskAssessment(patient_id, assessment);

      console.log(`[RiskChangeMonitor] State change detection:`, {
        changed: result.priority_changed,
        escalated: result.state_escalated,
        notify: result.requires_notification,
        old: result.old_priority,
        new: result.new_priority
      });

      // If notification is required, create it
      if (result.requires_notification) {
        await this.createStateChangeNotification(patient, assessment, result);
      }

      // Check for CKD diagnosis onset
      console.log(`[RiskChangeMonitor] Checking for CKD diagnosis onset...`);
      const diagnosisResult = await detectCKDDiagnosisOnset(patient);

      if (diagnosisResult.newly_diagnosed && diagnosisResult.diagnosis_event_id) {
        console.log(`[RiskChangeMonitor] 🔔 NEW CKD DIAGNOSIS DETECTED for ${mrn}!`);
        console.log(`   - Diagnosis Event ID: ${diagnosisResult.diagnosis_event_id}`);
        console.log(`   - Requires Confirmation: ${diagnosisResult.requires_confirmation}`);
        console.log(`   - Treatment Recommended: ${diagnosisResult.treatment_protocol_recommended}`);

        // Process the new diagnosis (create actions, protocols, notifications)
        await processNewCKDDiagnosis(patient, diagnosisResult.diagnosis_event_id);

        console.log(`[RiskChangeMonitor] ✓ CKD diagnosis workflow initiated for ${mrn}`);
      } else {
        console.log(`[RiskChangeMonitor] No new CKD diagnosis for ${mrn}`);
      }

    } catch (error) {
      console.error(`[RiskChangeMonitor] Error processing patient ${mrn}:`, error);
    }
  }

  /**
   * Record risk assessment in database and detect state changes
   */
  private async recordRiskAssessment(
    patientId: string,
    assessment: any
  ): Promise<RiskChangeResult> {
    const query = `
      SELECT * FROM record_risk_assessment(
        $1::UUID,  -- patient_id
        $2::VARCHAR(20),  -- risk_priority
        $3::INTEGER,  -- risk_score
        $4::INTEGER,  -- alert_count
        $5::INTEGER,  -- severity_score
        $6::INTEGER,  -- ckd_stage
        $7::DECIMAL(5, 2),  -- egfr
        $8::VARCHAR(20),  -- egfr_trend
        $9::DECIMAL(5, 2),  -- egfr_change
        $10::JSONB,  -- alerts_json
        $11::VARCHAR(50)  -- triggered_by
      )
    `;

    const values = [
      patientId,
      assessment.priority,
      assessment.severity_score,
      assessment.alert_count,
      assessment.severity_score,
      assessment.stage,
      assessment.egfr,
      assessment.egfr_trend,
      assessment.egfr_change,
      JSON.stringify(assessment.alerts),
      'auto_trigger'
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('[RiskChangeMonitor] Error recording risk assessment:', error);
      throw error;
    }
  }

  /**
   * Create a notification for the doctor about state change
   */
  private async createStateChangeNotification(
    patient: any,
    assessment: any,
    changeResult: RiskChangeResult
  ): Promise<void> {
    const { old_priority, new_priority, state_escalated, state_improved } = changeResult;

    // Determine notification type and message
    let notificationType = 'state_change';
    let subject = '';
    let message = '';

    if (state_escalated) {
      notificationType = assessment.priority === 'CRITICAL' ? 'critical_alert' : 'monitoring_required';

      subject = `🚨 URGENT: Patient ${patient.full_name} risk escalated to ${new_priority}`;

      message = `
Patient Alert - Risk State Escalation

Patient: ${patient.full_name} (MRN: ${patient.medical_record_number})
Age: ${patient.age} | Gender: ${patient.gender}

RISK STATUS CHANGE:
  Previous: ${old_priority || 'Not assessed'}
  Current: ${new_priority} ⚠️
  Risk Score: ${assessment.severity_score}

CKD Status:
  Stage: ${assessment.stage}
  eGFR: ${assessment.egfr} mL/min/1.73m² (${assessment.egfr_trend}, ${assessment.egfr_change > 0 ? '+' : ''}${assessment.egfr_change}%)

ALERTS (${assessment.alert_count}):
${assessment.alerts.map((a: any, i: number) => `  ${i + 1}. [${a.severity}] ${a.message}
     Action: ${a.action}`).join('\n\n')}

MONITORING STATUS:
  Status: ACTIVE (automatically activated)
  Activation: ${new Date().toISOString()}

RECOMMENDED ACTIONS:
${new_priority === 'CRITICAL' ? '  • Review patient within 24-48 hours' : ''}
${new_priority === 'HIGH' ? '  • Schedule appointment within 1-2 weeks' : ''}
  • Review all alerts and implement recommended actions
  • Update treatment plan as needed
  • Consider specialist referral if not already done

This is an automated notification from the CKD Monitoring System.
      `.trim();

    } else if (state_improved) {
      subject = `✓ Patient ${patient.full_name} risk improved to ${new_priority}`;

      message = `
Patient Alert - Risk State Improvement

Patient: ${patient.full_name} (MRN: ${patient.medical_record_number})

RISK STATUS CHANGE:
  Previous: ${old_priority}
  Current: ${new_priority} ✓
  Risk Score: ${assessment.severity_score}

The patient's risk status has improved. Continue current treatment plan and monitor for sustained improvement.

Remaining Alerts: ${assessment.alert_count}
      `.trim();
    } else {
      // State changed but not escalated/improved (rare case)
      subject = `Patient ${patient.full_name} risk status updated`;
      message = `Patient ${patient.full_name} (MRN: ${patient.medical_record_number}) risk status changed from ${old_priority} to ${new_priority}.`;
    }

    // Call database function to create notification
    const query = `
      SELECT create_doctor_notification(
        $1::UUID,  -- patient_id
        NULL,  -- risk_history_id (will be linked automatically)
        $2::VARCHAR(50),  -- notification_type
        $3::VARCHAR(20),  -- priority
        $4::VARCHAR(200),  -- subject
        $5::TEXT,  -- message
        $6::VARCHAR(20),  -- old_priority
        $7::VARCHAR(20),  -- new_priority
        $8::JSONB,  -- alert_summary
        $9::VARCHAR(100)  -- doctor_email
      ) AS notification_id
    `;

    const values = [
      patient.id,
      notificationType,
      assessment.priority,
      subject,
      message,
      old_priority,
      new_priority,
      JSON.stringify({
        alert_count: assessment.alert_count,
        severity_score: assessment.severity_score,
        top_alerts: assessment.alerts.slice(0, 3)
      }),
      'doctor@hospital.com' // TODO: Get actual doctor email from patient assignment
    ];

    try {
      const result = await this.pool.query(query, values);
      const notificationId = result.rows[0].notification_id;
      console.log(`[RiskChangeMonitor] ✓ Notification created: ${notificationId}`);
    } catch (error) {
      console.error('[RiskChangeMonitor] Error creating notification:', error);
    }
  }

  /**
   * Handle request to send a notification
   */
  private async handleSendNotification(payload: any): Promise<void> {
    const { notification_id, priority, patient_id } = payload;

    console.log(`[RiskChangeMonitor] Send notification request: ${notification_id} (Priority: ${priority})`);

    try {
      // Fetch notification details
      const query = `
        SELECT
          dn.*,
          p.first_name,
          p.last_name,
          p.medical_record_number
        FROM doctor_notifications dn
        JOIN patients p ON dn.patient_id = p.id
        WHERE dn.id = $1
      `;

      const result = await this.pool.query(query, [notification_id]);

      if (result.rows.length === 0) {
        console.error(`[RiskChangeMonitor] Notification not found: ${notification_id}`);
        return;
      }

      const notification = result.rows[0];

      // Send notification (email, SMS, etc.)
      await this.sendNotification(notification);

      // Update notification status
      await this.pool.query(
        `UPDATE doctor_notifications
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [notification_id]
      );

      console.log(`[RiskChangeMonitor] ✓ Notification sent: ${notification_id}`);
    } catch (error) {
      console.error('[RiskChangeMonitor] Error sending notification:', error);

      // Update notification with error
      await this.pool.query(
        `UPDATE doctor_notifications
         SET status = 'failed', error_message = $2, retry_count = retry_count + 1
         WHERE id = $1`,
        [notification_id, error instanceof Error ? error.message : 'Unknown error']
      );
    }
  }

  /**
   * Send notification via email/SMS/push
   * This is a placeholder - implement actual notification logic here
   */
  private async sendNotification(notification: any): Promise<void> {
    console.log('\n========================================');
    console.log('📧 DOCTOR NOTIFICATION');
    console.log('========================================');
    console.log(`To: ${notification.doctor_email}`);
    console.log(`Subject: ${notification.subject}`);
    console.log('----------------------------------------');
    console.log(notification.message);
    console.log('========================================\n');

    // TODO: Implement actual email sending
    // For example, using nodemailer, SendGrid, AWS SES, etc.
    //
    // await emailService.send({
    //   to: notification.doctor_email,
    //   subject: notification.subject,
    //   text: notification.message,
    //   html: generateEmailHTML(notification)
    // });

    // For now, just log to console
    return Promise.resolve();
  }
}

/**
 * Global monitor instance
 */
let monitorInstance: RiskChangeMonitor | null = null;

/**
 * Initialize and start the risk change monitor
 */
export async function initializeRiskChangeMonitor(pool: Pool): Promise<RiskChangeMonitor> {
  if (monitorInstance) {
    console.log('[RiskChangeMonitor] Monitor already initialized');
    return monitorInstance;
  }

  monitorInstance = new RiskChangeMonitor(pool);
  await monitorInstance.startListening();

  return monitorInstance;
}

/**
 * Get the monitor instance
 */
export function getMonitorInstance(): RiskChangeMonitor | null {
  return monitorInstance;
}

/**
 * Stop the monitor
 */
export async function stopRiskChangeMonitor(): Promise<void> {
  if (monitorInstance) {
    await monitorInstance.stopListening();
    monitorInstance = null;
  }
}
