import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import { classifyKDIGO } from '../utils/kdigo';

interface LabValues {
  egfr?: number;
  uacr?: number;
  creatinine?: number;
  bun?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  hba1c?: number;
  glucose?: number;
  hemoglobin?: number;
  heart_rate?: number;
  oxygen_saturation?: number;
}

interface PatientContext {
  patientId: string;
  firstName: string;
  lastName: string;
  age: number;
  isCkd: boolean;
  currentHealthState?: string;
  previousHealthState?: string;
  treatmentActive: boolean;
  treatmentType?: string;
  cycleNumber: number;
  previousCycleNumber?: number;
  // KDIGO clinical recommendations
  recommendRasInhibitor?: boolean;
  recommendSglt2i?: boolean;
  requiresNephrologyReferral?: boolean;
  riskLevel?: 'low' | 'moderate' | 'high' | 'very_high';
  gfrCategory?: string;
  albuminuriaCategory?: string;
}

interface AIAnalysisResult {
  hasSignificantChanges: boolean;
  commentText: string;
  clinicalSummary: string;
  keyChanges: string[];
  recommendedActions: string[];
  severity: 'info' | 'warning' | 'critical';
  concernLevel: 'none' | 'mild' | 'moderate' | 'high';
}

export class AIUpdateAnalysisService {
  private anthropic: Anthropic;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Analyzes patient update and generates AI-powered comment
   */
  async analyzePatientUpdate(
    patientContext: PatientContext,
    previousLabValues: LabValues,
    newLabValues: LabValues
  ): Promise<AIAnalysisResult> {
    // Calculate changes
    const changes = this.calculateLabChanges(previousLabValues, newLabValues);

    // Check if there are significant changes (threshold: any change > 5% or important clinical thresholds)
    const hasSignificantChanges = this.hasSignificantChanges(changes, previousLabValues, newLabValues);

    if (!hasSignificantChanges) {
      console.log('[AI Analysis] No significant changes detected for patient, skipping AI comment generation');
      return {
        hasSignificantChanges: false,
        commentText: '',
        clinicalSummary: '',
        keyChanges: [],
        recommendedActions: [],
        severity: 'info',
        concernLevel: 'none'
      };
    }

    console.log('[AI Analysis] Significant changes detected, generating AI analysis...');

    // Call Claude AI to analyze the changes
    const aiAnalysis = await this.generateAIAnalysis(patientContext, previousLabValues, newLabValues, changes);

    return aiAnalysis;
  }

  /**
   * Calculates percentage and absolute changes in lab values
   */
  private calculateLabChanges(previous: LabValues, current: LabValues): Record<string, { absolute: number; percentage: number }> {
    const changes: Record<string, { absolute: number; percentage: number }> = {};

    const keys = Object.keys(current) as Array<keyof LabValues>;
    for (const key of keys) {
      const prevValue = previous[key];
      const currValue = current[key];

      if (prevValue !== undefined && currValue !== undefined) {
        const absolute = currValue - prevValue;
        const percentage = prevValue !== 0 ? (absolute / prevValue) * 100 : 0;
        changes[key] = { absolute, percentage };
      }
    }

    return changes;
  }

  /**
   * Determines if changes are clinically significant
   * Uses sensitive thresholds appropriate for CKD monitoring
   */
  private hasSignificantChanges(
    changes: Record<string, { absolute: number; percentage: number }>,
    previous: LabValues,
    current: LabValues
  ): boolean {
    // Check for significant changes in key metrics
    // Note: Thresholds lowered to catch gradual but clinically important changes

    // eGFR: >=1.5 ml/min/1.73m² change or >2% change
    // Even small declines (1.5-3 units) are clinically significant in CKD monitoring
    if (changes.egfr && (Math.abs(changes.egfr.absolute) >= 1.5 || Math.abs(changes.egfr.percentage) > 2)) {
      console.log(`[AI Analysis] Significant eGFR change detected: ${changes.egfr.absolute.toFixed(1)} units (${changes.egfr.percentage.toFixed(1)}%)`);
      return true;
    }

    // uACR: >10% change or crossing albuminuria categories
    // Proteinuria changes are important markers of kidney disease progression
    if (changes.uacr && Math.abs(changes.uacr.percentage) > 10) {
      console.log(`[AI Analysis] Significant uACR change detected: ${changes.uacr.percentage.toFixed(1)}%`);
      return true;
    }

    // Check albuminuria category crossing (A1, A2, A3)
    if (previous.uacr !== undefined && current.uacr !== undefined) {
      const prevCategory = this.getAlbuminuriaCategory(previous.uacr);
      const currCategory = this.getAlbuminuriaCategory(current.uacr);
      if (prevCategory !== currCategory) {
        console.log(`[AI Analysis] Albuminuria category change: ${prevCategory} → ${currCategory}`);
        return true;
      }
    }

    // Creatinine: >10% change
    // Lower threshold for creatinine as it's a key indicator
    if (changes.creatinine && Math.abs(changes.creatinine.percentage) > 10) {
      console.log(`[AI Analysis] Significant creatinine change: ${changes.creatinine.percentage.toFixed(1)}%`);
      return true;
    }

    // Blood pressure: significant hypertension or changes >10 mmHg
    if (current.systolic_bp && (current.systolic_bp > 160 || current.systolic_bp < 90)) {
      console.log(`[AI Analysis] Abnormal blood pressure: ${current.systolic_bp} mmHg`);
      return true;
    }
    if (changes.systolic_bp && Math.abs(changes.systolic_bp.absolute) > 10) {
      console.log(`[AI Analysis] Significant BP change: ${changes.systolic_bp.absolute.toFixed(1)} mmHg`);
      return true;
    }

    // HbA1c: >0.3% change or poor control
    // Important for diabetic CKD patients
    if (changes.hba1c && (Math.abs(changes.hba1c.absolute) > 0.3 || (current.hba1c && current.hba1c > 8))) {
      console.log(`[AI Analysis] Significant HbA1c change or poor control`);
      return true;
    }

    // Hemoglobin: anemia concerns or >5% change
    // Anemia is common in CKD and requires monitoring
    if (current.hemoglobin && current.hemoglobin < 10) {
      console.log(`[AI Analysis] Anemia detected: ${current.hemoglobin} g/dL`);
      return true;
    }
    if (changes.hemoglobin && Math.abs(changes.hemoglobin.percentage) > 5) {
      console.log(`[AI Analysis] Significant hemoglobin change: ${changes.hemoglobin.percentage.toFixed(1)}%`);
      return true;
    }

    // If no significant changes detected, log for debugging
    console.log(`[AI Analysis] No significant changes detected - largest changes:`, {
      egfr: changes.egfr ? `${changes.egfr.absolute.toFixed(1)} units` : 'none',
      uacr: changes.uacr ? `${changes.uacr.percentage.toFixed(1)}%` : 'none',
      creatinine: changes.creatinine ? `${changes.creatinine.percentage.toFixed(1)}%` : 'none'
    });

    return false;
  }

  /**
   * Gets KDIGO albuminuria category
   */
  private getAlbuminuriaCategory(uacr: number): string {
    if (uacr < 30) return 'A1';
    if (uacr < 300) return 'A2';
    return 'A3';
  }

  /**
   * Calls Claude AI to generate clinical analysis
   */
  private async generateAIAnalysis(
    context: PatientContext,
    previous: LabValues,
    current: LabValues,
    changes: Record<string, { absolute: number; percentage: number }>
  ): Promise<AIAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(context, previous, current, changes);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      return this.parseAIResponse(responseText);
    } catch (error) {
      console.error('Error calling Claude AI for update analysis:', error);
      // Return a fallback analysis
      return this.generateFallbackAnalysis(context, previous, current, changes);
    }
  }

  /**
   * Builds the prompt for Claude AI analysis
   */
  private buildAnalysisPrompt(
    context: PatientContext,
    previous: LabValues,
    current: LabValues,
    changes: Record<string, { absolute: number; percentage: number }>
  ): string {
    // Build clinical recommendations summary
    const clinicalRecommendations: string[] = [];
    if (context.recommendRasInhibitor) {
      clinicalRecommendations.push('RAS Inhibitor (ACE-I/ARB) recommended');
    }
    if (context.recommendSglt2i) {
      clinicalRecommendations.push('SGLT2 Inhibitor recommended');
    }
    if (context.requiresNephrologyReferral) {
      clinicalRecommendations.push('Nephrology referral required');
    }

    const recommendationsText = clinicalRecommendations.length > 0
      ? clinicalRecommendations.join(', ')
      : 'Standard monitoring';

    return `You are an expert nephrologist analyzing patient lab value changes. Generate a concise clinical analysis of the following patient update.

**Patient Context:**
- Name: ${context.firstName} ${context.lastName}
- Age: ${context.age}
- Patient Type: ${context.isCkd ? 'CKD Patient' : 'At-Risk Patient'}
- Current Health State: ${context.currentHealthState || 'Unknown'} (${context.gfrCategory || 'Unknown'}/${context.albuminuriaCategory || 'Unknown'})
- Previous Health State: ${context.previousHealthState || 'Unknown'}
- Risk Level: ${context.riskLevel || 'Unknown'}
- Treatment Status: ${context.treatmentActive ? `Active (${context.treatmentType || 'Unknown'})` : 'NOT ON TREATMENT'}
- Clinical Recommendations: ${recommendationsText}
- Cycle: ${context.previousCycleNumber || 'N/A'} → ${context.cycleNumber}

**Previous Lab Values (Cycle ${context.previousCycleNumber || 'N/A'}):**
${this.formatLabValues(previous)}

**Current Lab Values (Cycle ${context.cycleNumber}):**
${this.formatLabValues(current)}

**Calculated Changes:**
${this.formatChanges(changes)}

**Task:**
Analyze these changes and provide a structured response in the following JSON format:

{
  "commentText": "A brief, patient-friendly summary (1-2 sentences) of the update",
  "clinicalSummary": "A detailed clinical interpretation (2-3 sentences) for healthcare providers",
  "keyChanges": ["Change 1", "Change 2", "Change 3"],
  "recommendedActions": ["Action 1", "Action 2", "Action 3"],
  "severity": "info|warning|critical",
  "concernLevel": "none|mild|moderate|high"
}

**CRITICAL CLINICAL GUIDELINES:**

1. **Treatment Initiation Logic:**
   - If patient is NOT ON TREATMENT and has CKD (especially Stage 3 or higher), ALWAYS recommend initiating appropriate CKD treatment
   - If patient shows WORSENING kidney function (declining eGFR, rising uACR) and NOT ON TREATMENT, this is URGENT - recommend immediate treatment initiation
   - NEVER say "maintain current treatment plan" or "continue current treatment" when treatment status is "NOT ON TREATMENT"
   - If NOT ON TREATMENT, use phrases like "initiate treatment", "start therapy", "begin pharmacological intervention"

2. **Treatment Adequacy Assessment:**
   - If patient IS on treatment but condition is WORSENING, recommend treatment intensification or adjustment
   - If patient IS on treatment and STABLE/IMPROVING, acknowledge treatment effectiveness

3. **Severity Assessment:**
   - Stage 4 CKD (G4) or higher without treatment = CRITICAL severity, HIGH concern
   - Declining eGFR without treatment = WARNING or CRITICAL severity
   - Rising albuminuria without treatment = WARNING severity
   - Any progression to higher risk category = at least WARNING severity

4. **Actionable Recommendations:**
   - Be SPECIFIC: Instead of "continue monitoring", say "Initiate RAS inhibitor therapy" or "Start SGLT2 inhibitor"
   - Reference the Clinical Recommendations field when treatment is indicated but not started
   - For deteriorating patients, prioritize treatment initiation over monitoring

5. **Health State Changes:**
   - Worsening health state (G3b→G4, A1→A2, etc.) = clear deterioration, needs intervention
   - "Stable" only means no category changes, but patient still needs treatment if indicated
   - Even "stable" severe CKD without treatment requires urgent action

Return ONLY the JSON response, no additional text.`;
  }

  /**
   * Formats lab values for display
   */
  private formatLabValues(labs: LabValues): string {
    const lines: string[] = [];

    if (labs.egfr !== undefined) lines.push(`- eGFR: ${labs.egfr.toFixed(1)} mL/min/1.73m²`);
    if (labs.uacr !== undefined) lines.push(`- uACR: ${labs.uacr.toFixed(1)} mg/g`);
    if (labs.creatinine !== undefined) lines.push(`- Serum Creatinine: ${labs.creatinine.toFixed(2)} mg/dL`);
    if (labs.bun !== undefined) lines.push(`- BUN: ${labs.bun.toFixed(1)} mg/dL`);
    if (labs.systolic_bp !== undefined && labs.diastolic_bp !== undefined) {
      lines.push(`- Blood Pressure: ${labs.systolic_bp}/${labs.diastolic_bp} mmHg`);
    }
    if (labs.hba1c !== undefined) lines.push(`- HbA1c: ${labs.hba1c.toFixed(1)}%`);
    if (labs.glucose !== undefined) lines.push(`- Glucose: ${labs.glucose.toFixed(0)} mg/dL`);
    if (labs.hemoglobin !== undefined) lines.push(`- Hemoglobin: ${labs.hemoglobin.toFixed(1)} g/dL`);
    if (labs.heart_rate !== undefined) lines.push(`- Heart Rate: ${labs.heart_rate} bpm`);
    if (labs.oxygen_saturation !== undefined) lines.push(`- O2 Saturation: ${labs.oxygen_saturation}%`);

    return lines.join('\n');
  }

  /**
   * Formats changes for display
   */
  private formatChanges(changes: Record<string, { absolute: number; percentage: number }>): string {
    const lines: string[] = [];

    for (const [key, change] of Object.entries(changes)) {
      const direction = change.absolute > 0 ? '↑' : '↓';
      const absValue = Math.abs(change.absolute).toFixed(2);
      const pctValue = Math.abs(change.percentage).toFixed(1);
      lines.push(`- ${key}: ${direction} ${absValue} (${pctValue}%)`);
    }

    return lines.length > 0 ? lines.join('\n') : 'No changes detected';
  }

  /**
   * Parses Claude AI response
   */
  private parseAIResponse(responseText: string): AIAnalysisResult {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        hasSignificantChanges: true,
        commentText: parsed.commentText || 'Patient labs updated',
        clinicalSummary: parsed.clinicalSummary || '',
        keyChanges: parsed.keyChanges || [],
        recommendedActions: parsed.recommendedActions || [],
        severity: parsed.severity || 'info',
        concernLevel: parsed.concernLevel || 'none'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Response text:', responseText);
      throw error;
    }
  }

  /**
   * Generates fallback analysis if AI call fails
   */
  private generateFallbackAnalysis(
    context: PatientContext,
    _previous: LabValues,
    _current: LabValues,
    changes: Record<string, { absolute: number; percentage: number }>
  ): AIAnalysisResult {
    const keyChanges: string[] = [];
    let severity: 'info' | 'warning' | 'critical' = 'info';
    let concernLevel: 'none' | 'mild' | 'moderate' | 'high' = 'none';

    // Analyze key metrics
    if (changes.egfr) {
      const change = changes.egfr;
      if (change.absolute < -10) {
        keyChanges.push(`eGFR declined by ${Math.abs(change.absolute).toFixed(1)} mL/min/1.73m²`);
        severity = 'warning';
        concernLevel = 'moderate';
      } else if (change.absolute > 5) {
        keyChanges.push(`eGFR improved by ${change.absolute.toFixed(1)} mL/min/1.73m²`);
      }
    }

    if (changes.uacr) {
      const change = changes.uacr;
      if (change.percentage > 50) {
        keyChanges.push(`Albuminuria increased by ${change.percentage.toFixed(0)}%`);
        // Escalate severity if not already critical
        if (severity === 'info') {
          severity = 'warning';
        } else if (severity === 'warning') {
          severity = 'critical';
        }
        concernLevel = 'high';
      } else if (change.percentage < -30) {
        keyChanges.push(`Albuminuria decreased by ${Math.abs(change.percentage).toFixed(0)}%`);
      }
    }

    return {
      hasSignificantChanges: true,
      commentText: `Patient labs updated (Cycle ${context.cycleNumber}). ${keyChanges.length > 0 ? keyChanges[0] : 'Labs reviewed.'}`,
      clinicalSummary: `Lab values updated from cycle ${context.previousCycleNumber} to ${context.cycleNumber}. ${context.treatmentActive ? 'Patient is on active treatment.' : 'Patient not currently on CKD treatment.'}`,
      keyChanges,
      recommendedActions: ['Review latest lab trends', 'Monitor kidney function'],
      severity,
      concernLevel
    };
  }

  /**
   * Creates AI-generated comment in database
   */
  async createAIUpdateComment(
    patientId: string,
    analysis: AIAnalysisResult,
    cycleNumber: number,
    previousLabValues: LabValues,
    newLabValues: LabValues
  ): Promise<string | null> {
    if (!analysis.hasSignificantChanges) {
      return null; // No comment needed
    }

    try {
      // Calculate KDIGO classification from the new lab values instead of querying the database
      // (kdigo_classification is computed on-the-fly, not stored in the patients table)
      const currentKdigo = classifyKDIGO(
        newLabValues.egfr || 90,
        newLabValues.uacr || 15
      );

      // Extract and validate health state (max 10 chars)
      let healthStateTo = currentKdigo.health_state || 'Unknown';
      if (healthStateTo && healthStateTo.length > 10) {
        console.warn(`[AI Update] health_state too long (${healthStateTo.length} chars), truncating:`, healthStateTo);
        healthStateTo = healthStateTo.substring(0, 10);
      }

      // Extract risk level (always one of the valid values from KDIGO classification)
      const riskLevelTo: 'low' | 'moderate' | 'high' | 'very_high' = currentKdigo.risk_level || 'low';

      // Determine if patient has CKD from classification
      const isCkdPatient = currentKdigo.has_ckd || false;

      // Determine change_type based on lab values
      let changeType: string | null = null;
      if (previousLabValues.egfr !== undefined && previousLabValues.egfr !== null &&
          newLabValues.egfr !== undefined && newLabValues.egfr !== null) {
        const egfrChange = newLabValues.egfr - previousLabValues.egfr;
        if (egfrChange > 0) {
          changeType = 'improved'; // eGFR increase is improvement
        } else if (egfrChange < -3) { // Significant decline
          changeType = 'worsened';
        } else {
          changeType = 'stable';
        }
      } else if (previousLabValues.uacr !== undefined && previousLabValues.uacr !== null &&
                 newLabValues.uacr !== undefined && newLabValues.uacr !== null) {
        const uacrChange = newLabValues.uacr - previousLabValues.uacr;
        if (uacrChange < 0) {
          changeType = 'improved'; // uACR decrease is improvement
        } else if (uacrChange > 30) { // Significant increase
          changeType = 'worsened';
        } else {
          changeType = 'stable';
        }
      } else {
        changeType = 'initial';
      }

      // Validate severity
      const validSeverities = ['info', 'warning', 'critical'];
      const severity = validSeverities.includes(analysis.severity) ? analysis.severity : 'info';

      // Validate comment text
      const commentText = analysis.commentText || 'AI-generated update analysis';

      // Validate clinical summary
      const clinicalSummary = analysis.clinicalSummary || '';

      // Validate recommended actions (ensure it's an array)
      const recommendedActions = Array.isArray(analysis.recommendedActions) ? analysis.recommendedActions : [];

      console.log('[AI Update] Creating comment with values:', {
        patientId,
        healthStateTo,
        riskLevelTo,
        changeType,
        isCkdPatient,
        severity,
        cycleNumber,
        egfr_from: previousLabValues.egfr,
        egfr_to: newLabValues.egfr,
        uacr_from: previousLabValues.uacr,
        uacr_to: newLabValues.uacr,
        comment_text_length: commentText.length,
        has_recommended_actions: Array.isArray(recommendedActions) && recommendedActions.length > 0
      });

      const result = await this.pool.query(
        `INSERT INTO patient_health_state_comments (
          patient_id,
          comment_text,
          comment_type,
          health_state_to,
          risk_level_to,
          change_type,
          is_ckd_patient,
          clinical_summary,
          recommended_actions,
          mitigation_measures,
          severity,
          cycle_number,
          egfr_from,
          egfr_to,
          egfr_change,
          uacr_from,
          uacr_to,
          uacr_change,
          created_by,
          created_by_type,
          visibility
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING id`,
        [
          patientId,
          commentText,
          'ai_generated',
          healthStateTo,
          riskLevelTo,
          changeType,
          isCkdPatient,
          clinicalSummary,
          recommendedActions,
          [], // mitigation_measures - empty array for AI-generated comments
          severity,
          cycleNumber,
          previousLabValues.egfr !== undefined && previousLabValues.egfr !== null ? previousLabValues.egfr : null,
          newLabValues.egfr !== undefined && newLabValues.egfr !== null ? newLabValues.egfr : null,
          (newLabValues.egfr !== undefined && newLabValues.egfr !== null &&
           previousLabValues.egfr !== undefined && previousLabValues.egfr !== null)
            ? newLabValues.egfr - previousLabValues.egfr : null,
          previousLabValues.uacr !== undefined && previousLabValues.uacr !== null ? previousLabValues.uacr : null,
          newLabValues.uacr !== undefined && newLabValues.uacr !== null ? newLabValues.uacr : null,
          (newLabValues.uacr !== undefined && newLabValues.uacr !== null &&
           previousLabValues.uacr !== undefined && previousLabValues.uacr !== null)
            ? newLabValues.uacr - previousLabValues.uacr : null,
          'AI Analysis System',
          'ai',
          'visible'
        ]
      );

      console.log('[AI Update] Comment created successfully, ID:', result.rows[0].id);
      return result.rows[0].id;
    } catch (error) {
      console.error('[AI Update] Error creating AI update comment:', error);
      if (error instanceof Error) {
        console.error('[AI Update] Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  /**
   * Fetches previous lab values for a patient
   */
  async getPreviousLabValues(patientId: string, beforeCycle: number): Promise<LabValues> {
    const result = await this.pool.query(
      `SELECT
        observation_type,
        value_numeric,
        value_text
      FROM observations
      WHERE patient_id = $1
        AND month_number < $2
      ORDER BY month_number DESC
      LIMIT 20`,
      [patientId, beforeCycle]
    );

    return this.parseObservationsToLabValues(result.rows);
  }

  /**
   * Fetches latest lab values for a patient
   */
  async getLatestLabValues(patientId: string, cycle: number): Promise<LabValues> {
    const result = await this.pool.query(
      `SELECT
        observation_type,
        value_numeric,
        value_text
      FROM observations
      WHERE patient_id = $1
        AND month_number = $2
      ORDER BY observation_date DESC`,
      [patientId, cycle]
    );

    return this.parseObservationsToLabValues(result.rows);
  }

  /**
   * Parses observation rows to lab values object
   */
  private parseObservationsToLabValues(rows: any[]): LabValues {
    const labValues: LabValues = {};

    for (const row of rows) {
      const value = row.value_numeric || parseFloat(row.value_text);
      if (isNaN(value)) continue;

      switch (row.observation_type) {
        case 'egfr':
          labValues.egfr = value;
          break;
        case 'uacr':
          labValues.uacr = value;
          break;
        case 'serum_creatinine':
          labValues.creatinine = value;
          break;
        case 'bun':
          labValues.bun = value;
          break;
        case 'systolic_bp':
          labValues.systolic_bp = value;
          break;
        case 'diastolic_bp':
          labValues.diastolic_bp = value;
          break;
        case 'hba1c':
          labValues.hba1c = value;
          break;
        case 'glucose':
          labValues.glucose = value;
          break;
        case 'hemoglobin':
          labValues.hemoglobin = value;
          break;
        case 'heart_rate':
          labValues.heart_rate = value;
          break;
        case 'oxygen_saturation':
          labValues.oxygen_saturation = value;
          break;
      }
    }

    return labValues;
  }
}
