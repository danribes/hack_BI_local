import { Pool } from 'pg';
import nodemailer, { Transporter } from 'nodemailer';

interface EmailConfig {
  id: number;
  doctor_email: string;
  enabled: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  from_email?: string;
  from_name?: string;
  created_at: Date;
  updated_at: Date;
}

interface EmailMessage {
  to: string;
  subject: string;
  message: string;
  priority: string;
  patientName: string;
  mrn: string;
}

export class EmailService {
  private db: Pool;
  private transporter: Transporter | null = null;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Initialize email transporter with SMTP settings
   */
  private async initializeTransporter(): Promise<void> {
    const config = await this.getConfig();

    if (!config || !config.smtp_host) {
      // Use default test account for development/testing
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Using Ethereal test email account (emails won\'t be delivered)');
      return;
    }

    // Use configured SMTP settings
    this.transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port || 587,
      secure: config.smtp_port === 465,
      auth: config.smtp_user && config.smtp_password ? {
        user: config.smtp_user,
        pass: config.smtp_password,
      } : undefined,
    });

    console.log(`📧 Email service initialized with SMTP: ${config.smtp_host}`);
  }

  /**
   * Get email configuration from database
   */
  async getConfig(): Promise<EmailConfig | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM email_config WHERE id = 1'
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching email config:', error);
      return null;
    }
  }

  /**
   * Update email configuration
   */
  async updateConfig(
    doctorEmail: string,
    enabled: boolean,
    smtpSettings?: {
      smtp_host?: string;
      smtp_port?: number;
      smtp_user?: string;
      smtp_password?: string;
      from_email?: string;
      from_name?: string;
    }
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO email_config (id, doctor_email, enabled, smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, updated_at)
         VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id)
         DO UPDATE SET
           doctor_email = $1,
           enabled = $2,
           smtp_host = $3,
           smtp_port = $4,
           smtp_user = $5,
           smtp_password = $6,
           from_email = $7,
           from_name = $8,
           updated_at = NOW()`,
        [
          doctorEmail,
          enabled,
          smtpSettings?.smtp_host || null,
          smtpSettings?.smtp_port || null,
          smtpSettings?.smtp_user || null,
          smtpSettings?.smtp_password || null,
          smtpSettings?.from_email || null,
          smtpSettings?.from_name || 'CKD Analyzer System',
        ]
      );

      // Reinitialize transporter with new settings
      this.transporter = null;
    } catch (error) {
      console.error('Error updating email config:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendNotification(messageData: EmailMessage): Promise<boolean> {
    const result = await this.sendNotificationWithDetails(messageData);
    return result.success;
  }

  /**
   * Send email notification with detailed result
   */
  async sendNotificationWithDetails(messageData: EmailMessage): Promise<{
    success: boolean;
    previewUrl?: string;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Get configuration
      const config = await this.getConfig();

      if (!config || !config.enabled) {
        console.log('⚠️  Email notifications are disabled');
        return { success: false, error: 'Email notifications are disabled' };
      }

      if (!config.doctor_email) {
        console.log('⚠️  No doctor email configured');
        return { success: false, error: 'No doctor email configured' };
      }

      // Initialize transporter if not already done
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      if (!this.transporter) {
        throw new Error('Failed to initialize email transporter');
      }

      // Format the email message
      const formattedMessage = this.formatMessage(messageData);
      const fromEmail = config.from_email || 'noreply@ckd-analyzer.com';
      const fromName = config.from_name || 'CKD Analyzer System';

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: config.doctor_email,
        subject: messageData.subject,
        text: formattedMessage.text,
        html: formattedMessage.html,
      });

      console.log(`✓ Email sent to ${config.doctor_email}: ${info.messageId}`);

      // Log the sent message
      await this.logMessage(
        config.doctor_email,
        messageData.subject,
        formattedMessage.text,
        'sent',
        info.messageId
      );

      // For test accounts, get the preview URL
      let previewUrl: string | undefined;
      if (info.messageId.includes('ethereal')) {
        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
        if (previewUrl) {
          console.log(`📧 Preview email: ${previewUrl}`);
        }
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl
      };
    } catch (error) {
      console.error('Error sending email notification:', error);

      // Log the failed message
      try {
        const config = await this.getConfig();
        if (config) {
          await this.logMessage(
            config.doctor_email || 'unknown',
            messageData.subject,
            messageData.message,
            'failed',
            null,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      } catch (logError) {
        console.error('Error logging failed email:', logError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format message for email
   */
  private formatMessage(data: EmailMessage): { text: string; html: string } {
    const priorityEmoji = this.getPriorityEmoji(data.priority);
    const priorityColor = this.getPriorityColor(data.priority);

    // Plain text version
    const text = `
${priorityEmoji} ${data.subject}

Patient: ${data.patientName}
MRN: ${data.mrn}
Priority: ${data.priority}

${data.message}

---
Sent from CKD Analyzer System
    `.trim();

    // HTML version
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${priorityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
    .patient-info { background-color: white; padding: 15px; border-left: 4px solid ${priorityColor}; margin: 15px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    .priority-badge { display: inline-block; padding: 5px 10px; background-color: ${priorityColor}; color: white; border-radius: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">${priorityEmoji} Patient Alert</h2>
    </div>
    <div class="content">
      <div class="patient-info">
        <p><strong>Patient:</strong> ${data.patientName}</p>
        <p><strong>MRN:</strong> ${data.mrn}</p>
        <p><strong>Priority:</strong> <span class="priority-badge">${data.priority}</span></p>
      </div>
      <div style="background-color: white; padding: 15px; border-radius: 4px;">
        <h3 style="margin-top: 0;">Alert Details</h3>
        <p>${data.message}</p>
      </div>
    </div>
    <div class="footer">
      <p>Sent from CKD Analyzer System</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { text, html };
  }

  /**
   * Get emoji for priority level
   */
  private getPriorityEmoji(priority: string): string {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚡';
      case 'MODERATE':
        return '📋';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Get color for priority level
   */
  private getPriorityColor(priority: string): string {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        return '#dc2626'; // red-600
      case 'HIGH':
        return '#ea580c'; // orange-600
      case 'MODERATE':
        return '#2563eb'; // blue-600
      default:
        return '#6b7280'; // gray-500
    }
  }

  /**
   * Log sent/failed email message
   */
  private async logMessage(
    toEmail: string,
    subject: string,
    message: string,
    status: 'sent' | 'failed' | 'pending',
    messageId: string | null,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO email_messages (to_email, subject, message, status, email_message_id, error_message, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [toEmail, subject, message, status, messageId, errorMessage || null]
      );
    } catch (error) {
      console.error('Error logging email message:', error);
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; previewUrl?: string }> {
    try {
      const config = await this.getConfig();

      if (!config) {
        return {
          success: false,
          message: 'Email not configured. Please add your email address in settings.',
        };
      }

      if (!config.enabled) {
        return {
          success: false,
          message: 'Email notifications are disabled. Please enable them in settings.',
        };
      }

      // Send test email with details
      const result = await this.sendNotificationWithDetails({
        to: config.doctor_email,
        subject: 'Test Email - CKD Analyzer',
        message: 'This is a test email to verify your email notification settings are working correctly.',
        priority: 'MODERATE',
        patientName: 'Test Patient',
        mrn: 'TEST-12345',
      });

      if (result.success) {
        let message = `Test email sent successfully to ${config.doctor_email}`;

        // If using Ethereal test account, include preview URL
        if (result.previewUrl) {
          message += `\n\nℹ️ Note: You are using a test email account. Since no SMTP server is configured, emails are sent to a test inbox.\n\nView your test email here: ${result.previewUrl}`;
        }

        return {
          success: true,
          message,
          previewUrl: result.previewUrl
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to send test email. Please check your SMTP settings.',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
