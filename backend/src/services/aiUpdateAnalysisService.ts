import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';

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
   */
  private hasSignificantChanges(
    changes: Record<string, { absolute: number; percentage: number }>,
    previous: LabValues,
    current: LabValues
  ): boolean {
    // Check for significant changes in key metrics

    // eGFR: >5 ml/min/1.73m² change or >10% change
    if (changes.egfr && (Math.abs(changes.egfr.absolute) > 5 || Math.abs(changes.egfr.percentage) > 10)) {
      return true;
    }

    // uACR: >30% change or crossing albuminuria categories
    if (changes.uacr && Math.abs(changes.uacr.percentage) > 30) {
      return true;
    }

    // Check albuminuria category crossing
    if (previous.uacr !== undefined && current.uacr !== undefined) {
      const prevCategory = this.getAlbuminuriaCategory(previous.uacr);
      const currCategory = this.getAlbuminuriaCategory(current.uacr);
      if (prevCategory !== currCategory) {
        return true;
      }
    }

    // Creatinine: >20% change
    if (changes.creatinine && Math.abs(changes.creatinine.percentage) > 20) {
      return true;
    }

    // Blood pressure: significant hypertension changes
    if (current.systolic_bp && (current.systolic_bp > 160 || current.systolic_bp < 90)) {
      return true;
    }

    // HbA1c: >0.5% change or poor control
    if (changes.hba1c && (Math.abs(changes.hba1c.absolute) > 0.5 || (current.hba1c && current.hba1c > 8))) {
      return true;
    }

    // Hemoglobin: anemia concerns
    if (current.hemoglobin && current.hemoglobin < 10) {
      return true;
    }

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
    return `You are an expert nephrologist analyzing patient lab value changes. Generate a concise clinical analysis of the following patient update.

**Patient Context:**
- Name: ${context.firstName} ${context.lastName}
- Age: ${context.age}
- Patient Type: ${context.isCkd ? 'CKD Patient' : 'At-Risk Patient'}
- Current Health State: ${context.currentHealthState || 'Unknown'}
- Previous Health State: ${context.previousHealthState || 'Unknown'}
- Treatment Status: ${context.treatmentActive ? `Active (${context.treatmentType || 'Unknown'})` : 'Not on CKD treatment'}
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

**Guidelines:**
1. Focus on clinically significant changes
2. Consider trends in the context of treatment status
3. Provide actionable recommendations
4. Use clear, professional medical language
5. Severity: "info" for stable/improving, "warning" for concerning changes, "critical" for urgent issues
6. Concern level based on clinical urgency and risk

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
    previous: LabValues,
    current: LabValues,
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
        if (severity !== 'critical') {
          severity = 'warning';
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
      const result = await this.pool.query(
        `INSERT INTO patient_health_state_comments (
          patient_id,
          comment_text,
          comment_type,
          clinical_summary,
          recommended_actions,
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id`,
        [
          patientId,
          analysis.commentText,
          'ai_update_analysis', // New comment type
          analysis.clinicalSummary,
          analysis.recommendedActions,
          analysis.severity,
          cycleNumber,
          previousLabValues.egfr || null,
          newLabValues.egfr || null,
          newLabValues.egfr && previousLabValues.egfr ? newLabValues.egfr - previousLabValues.egfr : null,
          previousLabValues.uacr || null,
          newLabValues.uacr || null,
          newLabValues.uacr && previousLabValues.uacr ? newLabValues.uacr - previousLabValues.uacr : null,
          'AI Analysis System',
          'system',
          true
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('Error creating AI update comment:', error);
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
