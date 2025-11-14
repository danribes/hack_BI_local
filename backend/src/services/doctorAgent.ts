import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PatientContext {
  patientId?: string;
  includeRecentLabs?: boolean;
  includeRiskAssessment?: boolean;
}

export class DoctorAgentService {
  private anthropic: Anthropic;
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Main chat endpoint - handles doctor queries with optional patient context
   */
  async chat(
    messages: ChatMessage[],
    context?: PatientContext
  ): Promise<string> {
    try {
      // Check if this is a population-level query
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        const populationData = await this.checkForPopulationQuery(lastUserMessage.content);
        if (populationData) {
          // Enhance system prompt with population data
          const systemPrompt = await this.buildSystemPrompt(context);
          const enhancedPrompt = systemPrompt + '\n\n--- POPULATION DATA ---\n' + populationData;

          // Convert messages to Anthropic format
          const anthropicMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          }));

          // Call Claude API with enhanced context
          const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 4096,
            system: enhancedPrompt,
            messages: anthropicMessages,
          });

          const textContent = response.content.find(block => block.type === 'text');
          return textContent ? (textContent as any).text : 'No response generated';
        }
      }

      // Build system prompt based on context
      const systemPrompt = await this.buildSystemPrompt(context);

      // Convert messages to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      // Extract text from response
      const textContent = response.content.find(block => block.type === 'text');
      return textContent ? (textContent as any).text : 'No response generated';
    } catch (error) {
      console.error('Error in doctor agent chat:', error);
      throw new Error(`Failed to process chat request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if the user's question is asking for population-level data
   * and fetches relevant statistics from the database
   */
  private async checkForPopulationQuery(question: string): Promise<string | null> {
    const lowerQ = question.toLowerCase();

    // Detect population-level questions
    const isPopulationQuery =
      lowerQ.includes('how many') ||
      lowerQ.includes('count') ||
      lowerQ.includes('patients without ckd') ||
      lowerQ.includes('high risk') ||
      lowerQ.includes('patients need') ||
      lowerQ.includes('show me patients');

    if (!isPopulationQuery) {
      return null;
    }

    try {
      let dataResponse = 'Database Query Results:\n\n';

      // Query 1: High-risk patients without CKD
      if (lowerQ.includes('without ckd') || lowerQ.includes('high risk')) {
        // Try new view first, fallback to direct query if view doesn't exist
        let highRiskQuery = `
          SELECT COUNT(*) as count
          FROM v_tier3_risk_classification
          WHERE risk_level = 'HIGH'
          AND (recent_egfr >= 60 OR recent_egfr IS NULL)
          AND (recent_uacr <= 30 OR recent_uacr IS NULL)
        `;

        let highRiskResult;
        try {
          highRiskResult = await this.db.query(highRiskQuery);
        } catch (viewError) {
          // Fallback to direct query if view doesn't exist
          highRiskQuery = `
            SELECT COUNT(DISTINCT p.id) as count
            FROM patients p
            WHERE (p.has_diabetes = true OR p.has_hypertension = true
                   OR EXTRACT(YEAR FROM AGE(p.date_of_birth)) > 60
                   OR p.has_heart_failure = true OR p.has_cad = true)
          `;
          highRiskResult = await this.db.query(highRiskQuery);
        }

        const highRiskCount = highRiskResult.rows[0]?.count || 0;

        dataResponse += `High-Risk Patients WITHOUT CKD: ${highRiskCount}\n`;
        dataResponse += `(These are patients with risk factors like diabetes, hypertension, or age >60)\n\n`;

        // Get breakdown by risk factor (fallback version)
        const breakdownQuery = `
          SELECT
            CASE
              WHEN has_diabetes THEN 'Diabetes'
              WHEN has_hypertension THEN 'Hypertension'
              WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) > 60 THEN 'Age > 60'
              WHEN has_heart_failure THEN 'Heart Failure'
              WHEN has_cad THEN 'Coronary Artery Disease'
              ELSE 'Other'
            END as risk_factor,
            COUNT(*) as count
          FROM patients
          WHERE has_diabetes = true OR has_hypertension = true
                OR EXTRACT(YEAR FROM AGE(date_of_birth)) > 60
                OR has_heart_failure = true OR has_cad = true
          GROUP BY risk_factor
          ORDER BY count DESC
        `;
        const breakdownResult = await this.db.query(breakdownQuery);

        if (breakdownResult.rows.length > 0) {
          dataResponse += 'Breakdown by Risk Factor:\n';
          breakdownResult.rows.forEach((row: any) => {
            dataResponse += `- ${row.risk_factor}: ${row.count} patients\n`;
          });
          dataResponse += '\n';
        }
      }

      // Query 2: Patients needing lab orders
      if (lowerQ.includes('need') || lowerQ.includes('lab') || lowerQ.includes('screening')) {
        let labNeededResult;
        try {
          const labNeededQuery = `
            SELECT COUNT(*) as count
            FROM v_patients_requiring_action
            WHERE action_category = 'ORDER_LABS'
          `;
          labNeededResult = await this.db.query(labNeededQuery);
        } catch (viewError) {
          // Fallback: patients with risk factors but missing recent labs
          const labNeededQuery = `
            SELECT COUNT(DISTINCT p.id) as count
            FROM patients p
            WHERE (p.has_diabetes = true OR p.has_hypertension = true)
            AND NOT EXISTS (
              SELECT 1 FROM observations o
              WHERE o.patient_id = p.id
              AND o.observation_type IN ('eGFR', 'uACR')
              AND o.observation_date >= CURRENT_DATE - INTERVAL '12 months'
            )
          `;
          labNeededResult = await this.db.query(labNeededQuery);
        }

        const labNeededCount = labNeededResult.rows[0]?.count || 0;
        dataResponse += `Patients Needing Lab Orders: ${labNeededCount}\n`;
        dataResponse += `(Patients with risk factors but no recent eGFR or uACR in last 12 months)\n\n`;
      }

      // Query 3: Total patient statistics
      const statsQuery = `
        SELECT
          COUNT(*) as total_patients,
          COUNT(*) FILTER (WHERE has_diabetes = true) as diabetes_count,
          COUNT(*) FILTER (WHERE has_hypertension = true) as hypertension_count,
          COUNT(*) FILTER (WHERE has_heart_failure = true) as heart_failure_count,
          COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(date_of_birth)) > 60) as age_over_60_count
        FROM patients
      `;
      const statsResult = await this.db.query(statsQuery);
      const stats = statsResult.rows[0];

      dataResponse += 'Overall Patient Statistics:\n';
      dataResponse += `- Total Patients: ${stats?.total_patients || 0}\n`;
      dataResponse += `- With Diabetes: ${stats?.diabetes_count || 0}\n`;
      dataResponse += `- With Hypertension: ${stats?.hypertension_count || 0}\n`;
      dataResponse += `- With Heart Failure: ${stats?.heart_failure_count || 0}\n`;
      dataResponse += `- Age > 60: ${stats?.age_over_60_count || 0}\n`;

      return dataResponse;
    } catch (error) {
      console.error('Error fetching population data:', error);
      return 'Error fetching population statistics from database.';
    }
  }

  /**
   * Builds system prompt with patient context if provided
   */
  private async buildSystemPrompt(context?: PatientContext): Promise<string> {
    let basePrompt = `You are an AI medical assistant helping doctors manage primary care patients, with a focus on chronic kidney disease (CKD) and related conditions.

Your role:
- Answer clinical questions about patients
- Provide evidence-based recommendations following KDIGO 2024 guidelines
- Help interpret lab results and risk assessments
- Suggest appropriate monitoring intervals and treatments
- Alert doctors to critical findings
- Answer population-level questions using database queries

Important guidelines:
- Always prioritize patient safety
- Cite clinical guidelines when making recommendations
- Acknowledge uncertainty and suggest consulting specialists when appropriate
- Use clear, professional medical terminology
- Provide actionable insights

Available data includes:
- Patient demographics and medical history
- Lab results (eGFR, creatinine, uACR, HbA1c, etc.)
- KDIGO risk classification
- Current medications and treatments
- Comorbidities (diabetes, hypertension, CVD)
- Risk factors and progression indicators

Database Capabilities:
You have access to query the patient database for population-level statistics. When asked questions like:
- "How many patients have X condition?"
- "Show me patients without CKD who are at high risk"
- "Which patients need lab work ordered?"

You can request database queries using natural language. The system will execute the query and provide results.

Key database tables/views available:
- patients: All patient demographics and comorbidities
- v_tier3_risk_classification: Risk assessment for all patients (includes fallback screening)
- v_patients_requiring_action: Patients needing immediate doctor action
- Non-CKD high-risk patients: Use risk classification view filtered by normal eGFR/uACR but with risk factors`;

    // Add patient-specific context if provided
    if (context?.patientId) {
      const patientData = await this.getPatientContext(
        context.patientId,
        context.includeRecentLabs,
        context.includeRiskAssessment
      );

      if (patientData) {
        basePrompt += `\n\n--- CURRENT PATIENT CONTEXT ---\n${patientData}`;
      }
    }

    return basePrompt;
  }

  /**
   * Retrieves comprehensive patient data for context
   */
  private async getPatientContext(
    patientId: string,
    includeRecentLabs: boolean = true,
    includeRiskAssessment: boolean = true
  ): Promise<string> {
    try {
      let contextParts: string[] = [];

      // Get basic patient info
      const patientQuery = `
        SELECT
          medical_record_number, first_name, last_name, date_of_birth, gender,
          weight, height, smoking_status, has_diabetes, has_hypertension,
          has_heart_failure, has_cad, cvd_history, family_history_esrd,
          on_ras_inhibitor, on_sglt2i, nephrotoxic_meds,
          nephrologist_referral, diagnosis_date, last_visit_date, next_visit_date
        FROM patients
        WHERE id = $1
      `;
      const patientResult = await this.db.query(patientQuery, [patientId]);

      if (patientResult.rows.length === 0) {
        return 'Patient not found';
      }

      const patient = patientResult.rows[0];
      const age = this.calculateAge(patient.date_of_birth);

      contextParts.push(`Patient: ${patient.first_name} ${patient.last_name} (MRN: ${patient.medical_record_number})
Age: ${age} years, Gender: ${patient.gender}
Weight: ${patient.weight}kg, Height: ${patient.height}cm, BMI: ${this.calculateBMI(patient.weight, patient.height)}

Comorbidities:
- Diabetes: ${patient.has_diabetes ? 'Yes' : 'No'}
- Hypertension: ${patient.has_hypertension ? 'Yes' : 'No'}
- Heart Failure: ${patient.has_heart_failure ? 'Yes' : 'No'}
- Coronary Artery Disease: ${patient.has_cad ? 'Yes' : 'No'}
- CVD History: ${patient.cvd_history ? 'Yes' : 'No'}
- Family History of ESRD: ${patient.family_history_esrd ? 'Yes' : 'No'}

Current Medications:
- RAS Inhibitor: ${patient.on_ras_inhibitor ? 'Yes' : 'No'}
- SGLT2 Inhibitor: ${patient.on_sglt2i ? 'Yes' : 'No'}
- Nephrotoxic Medications: ${patient.nephrotoxic_meds || 'None'}

Status:
- Nephrology Referral: ${patient.nephrologist_referral ? 'Yes' : 'No'}
- Smoking: ${patient.smoking_status || 'Unknown'}
- Last Visit: ${patient.last_visit_date || 'Not recorded'}
- Next Visit: ${patient.next_visit_date || 'Not scheduled'}`);

      // Get recent lab results
      if (includeRecentLabs) {
        const labQuery = `
          SELECT
            observation_type, value, unit, observed_date, reference_range,
            status
          FROM observations
          WHERE patient_id = $1
          ORDER BY observed_date DESC
          LIMIT 20
        `;
        const labResult = await this.db.query(labQuery, [patientId]);

        if (labResult.rows.length > 0) {
          contextParts.push('\nRecent Lab Results:');
          labResult.rows.forEach(lab => {
            const abnormal = lab.status === 'abnormal' ? ' [ABNORMAL]' : '';
            contextParts.push(
              `- ${lab.observation_type}: ${lab.value} ${lab.unit} (Ref: ${lab.reference_range}) - ${lab.observed_date}${abnormal}`
            );
          });
        }
      }

      // Get risk assessment
      if (includeRiskAssessment) {
        const riskQuery = `
          SELECT
            kdigo_category, ckd_stage, risk_level, risk_score,
            recommendations, created_at
          FROM patient_risk_assessments
          WHERE patient_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const riskResult = await this.db.query(riskQuery, [patientId]);

        if (riskResult.rows.length > 0) {
          const risk = riskResult.rows[0];
          contextParts.push(`\nCurrent Risk Assessment (as of ${risk.created_at}):
- KDIGO Category: ${risk.kdigo_category}
- CKD Stage: ${risk.ckd_stage}
- Risk Level: ${risk.risk_level}
- Risk Score: ${risk.risk_score}
- Recommendations: ${risk.recommendations || 'None'}`);
        }
      }

      // Get active conditions
      const conditionsQuery = `
        SELECT condition_name, severity, clinical_status, onset_date
        FROM conditions
        WHERE patient_id = $1 AND clinical_status = 'active'
        ORDER BY onset_date DESC
      `;
      const conditionsResult = await this.db.query(conditionsQuery, [patientId]);

      if (conditionsResult.rows.length > 0) {
        contextParts.push('\nActive Conditions:');
        conditionsResult.rows.forEach(condition => {
          contextParts.push(
            `- ${condition.condition_name} (${condition.severity}) - Since ${condition.onset_date}`
          );
        });
      }

      return contextParts.join('\n');
    } catch (error) {
      console.error('Error fetching patient context:', error);
      return 'Error fetching patient data';
    }
  }

  /**
   * Analyzes patient data and generates proactive alerts
   */
  async analyzePatientForAlerts(patientId: string): Promise<{
    hasAlert: boolean;
    alertType?: string;
    priority?: string;
    message?: string;
  }> {
    try {
      const patientContext = await this.getPatientContext(patientId, true, true);

      const analysisPrompt = `Based on the following patient data, identify if there are any critical findings or urgent actions needed.

${patientContext}

Analyze for:
1. Critical lab values requiring immediate action
2. Significant changes in kidney function (eGFR decline)
3. Untreated high-risk conditions
4. Missing recommended treatments (e.g., SGLT2i for eligible patients)
5. Overdue nephrology referrals

If there are critical findings, respond with:
ALERT: [type]
PRIORITY: [CRITICAL/HIGH/MODERATE]
MESSAGE: [concise clinical message for doctor]

If no critical findings, respond with:
NO ALERT`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: analysisPrompt,
        }],
      });

      const textContent = response.content.find(block => block.type === 'text');
      const analysis = textContent ? (textContent as any).text : '';

      if (analysis.includes('NO ALERT')) {
        return { hasAlert: false };
      }

      // Parse alert information
      const alertTypeMatch = analysis.match(/ALERT:\s*(.+)/);
      const priorityMatch = analysis.match(/PRIORITY:\s*(CRITICAL|HIGH|MODERATE)/);
      const messageMatch = analysis.match(/MESSAGE:\s*(.+)/);

      return {
        hasAlert: true,
        alertType: alertTypeMatch?.[1]?.trim() || 'General Alert',
        priority: priorityMatch?.[1] || 'MODERATE',
        message: messageMatch?.[1]?.trim() || analysis,
      };
    } catch (error) {
      console.error('Error analyzing patient for alerts:', error);
      return { hasAlert: false };
    }
  }

  /**
   * Generates a summary of patient status changes
   */
  async summarizePatientChanges(
    patientId: string,
    changes: any
  ): Promise<string> {
    try {
      const patientContext = await this.getPatientContext(patientId, false, true);

      const summaryPrompt = `A patient's data has changed. Summarize the clinical significance in 2-3 sentences for a doctor notification.

Patient Context:
${patientContext}

Changes Detected:
${JSON.stringify(changes, null, 2)}

Provide a concise clinical summary suitable for a notification.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: summaryPrompt,
        }],
      });

      const textContent = response.content.find(block => block.type === 'text');
      return textContent ? (textContent as any).text : 'Patient data updated';
    } catch (error) {
      console.error('Error summarizing changes:', error);
      return 'Patient data has been updated. Please review.';
    }
  }

  // Helper functions
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private calculateBMI(weight: number, height: number): string {
    if (!weight || !height) return 'N/A';
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  }
}
