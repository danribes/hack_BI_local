/**
 * AI Service
 *
 * Orchestrates AI-powered CKD risk analysis using Claude.
 * Prepares patient data, calls Claude API, and structures the response.
 */

import { callClaudeJSON, getModelVersion } from '../ai/claudeClient';
import { PatientSummary } from '../types/patient';
import {
  AIRiskAnalysisRequest,
  AIRiskAnalysisResponse,
  CKDAnalysisContext,
} from '../types/ai';

/**
 * Build analysis context from patient summary
 * Transforms patient data into structured format for Claude
 */
function buildAnalysisContext(patient: PatientSummary): CKDAnalysisContext {
  return {
    demographics: {
      age: patient.age,
      gender: patient.gender,
    },
    diagnoses: patient.conditions.map(condition => ({
      code: condition.condition_code,
      name: condition.condition_name,
      status: condition.clinical_status,
    })),
    latest_labs: {
      eGFR: patient.latest_observations.eGFR,
      uACR: patient.latest_observations.uACR,
      HbA1c: patient.latest_observations.HbA1c,
      blood_pressure: patient.latest_observations.blood_pressure?.reading,
      other: patient.observations
        .filter(obs => !['eGFR', 'uACR', 'HbA1c', 'blood_pressure_systolic', 'blood_pressure_diastolic'].includes(obs.observation_type))
        .slice(0, 5) // Include up to 5 other recent observations
        .map(obs => ({
          type: obs.observation_type,
          value: obs.value_numeric || 0,
          unit: obs.unit || '',
        })),
    },
    risk_tier: patient.risk_tier,
    ckd_stage: patient.ckd_stage,
  };
}

/**
 * Create system prompt for CKD risk analysis
 * Defines Claude's role and expertise
 */
function createSystemPrompt(): string {
  return `You are an expert clinical decision support AI specializing in chronic kidney disease (CKD) risk assessment.

Your role is to analyze patient clinical data and provide evidence-based risk assessments following KDIGO guidelines and the three-tier CKD screening protocol:

**Three-Tier Risk Stratification:**
- Tier 1 (Low Risk): No diabetes or hypertension, normal kidney function (eGFR ≥60, uACR <30)
- Tier 2 (Moderate Risk): One risk factor (diabetes OR hypertension), regular monitoring needed
- Tier 3 (High Risk): Both diabetes AND hypertension, OR abnormal labs (eGFR <60 or uACR ≥30)

**Clinical Thresholds:**
- eGFR <60 mL/min/1.73m²: Reduced kidney function (CKD Stage 3+)
- uACR ≥30 mg/g: Microalbuminuria (kidney damage marker)
- uACR ≥300 mg/g: Macroalbuminuria (severe kidney damage)
- HbA1c ≥6.5%: Diabetes diagnosis threshold
- HbA1c 7-9%: Suboptimal control
- HbA1c >9%: Poorly controlled
- BP ≥140/90 mmHg: Hypertension threshold

**KDIGO CKD Stages:**
- Stage 1: eGFR ≥90 with kidney damage markers
- Stage 2: eGFR 60-89 with kidney damage markers
- Stage 3a: eGFR 45-59
- Stage 3b: eGFR 30-44
- Stage 4: eGFR 15-29
- Stage 5: eGFR <15 (kidney failure)

Provide your analysis as a JSON object with structured risk assessment, clinical insights, and actionable recommendations.`;
}

/**
 * Create user prompt for specific patient analysis
 * Formats patient data for Claude
 */
function createUserPrompt(context: CKDAnalysisContext): string {
  const { demographics, diagnoses, latest_labs, risk_tier, ckd_stage } = context;

  return `Analyze the following patient for CKD risk:

**Patient Demographics:**
- Age: ${demographics.age} years
- Gender: ${demographics.gender}

**Active Diagnoses:**
${diagnoses.length > 0
  ? diagnoses.map(d => `- ${d.name} (${d.code})`).join('\n')
  : '- None'}

**Latest Laboratory Results:**
${latest_labs.eGFR !== undefined ? `- eGFR: ${latest_labs.eGFR} mL/min/1.73m²` : '- eGFR: Not available'}
${latest_labs.uACR !== undefined ? `- uACR: ${latest_labs.uACR} mg/g` : '- uACR: Not available'}
${latest_labs.HbA1c !== undefined ? `- HbA1c: ${latest_labs.HbA1c}%` : '- HbA1c: Not available'}
${latest_labs.blood_pressure ? `- Blood Pressure: ${latest_labs.blood_pressure} mmHg` : '- Blood Pressure: Not available'}
${latest_labs.other.length > 0
  ? latest_labs.other.map(o => `- ${o.type}: ${o.value} ${o.unit}`).join('\n')
  : ''}

**Current Classification:**
- Risk Tier: Tier ${risk_tier}
${ckd_stage ? `- CKD Stage: Stage ${ckd_stage}` : '- CKD Stage: Not classified'}

Please provide a comprehensive CKD risk assessment in the following JSON format:

\`\`\`json
{
  "risk_score": <number between 0.00 and 1.00>,
  "risk_level": "<low|medium|high>",
  "key_findings": {
    "abnormal_labs": ["<list of concerning lab values>"],
    "risk_factors": ["<list of risk factors present>"],
    "protective_factors": ["<list of protective factors>"]
  },
  "ckd_analysis": {
    "current_stage": "<CKD stage or null>",
    "kidney_function": "<normal|mildly_reduced|moderately_reduced|severely_reduced|kidney_failure>",
    "kidney_damage": "<none|microalbuminuria|macroalbuminuria>",
    "progression_risk": "<low|moderate|high>"
  },
  "risk_factors": {
    "diabetes": {
      "present": <boolean>,
      "control_status": "<well_controlled|suboptimal|poorly_controlled or null>",
      "hba1c": <number or null>
    },
    "hypertension": {
      "present": <boolean>,
      "control_status": "<well_controlled|elevated|uncontrolled or null>",
      "blood_pressure": "<reading or null>"
    },
    "other_factors": ["<other risk factors>"]
  },
  "reasoning": "<detailed clinical reasoning for risk assessment>",
  "clinical_summary": "<concise 2-3 sentence summary>",
  "recommendations": {
    "immediate_actions": ["<urgent actions needed>"],
    "follow_up": ["<follow-up appointments and monitoring>"],
    "lifestyle_modifications": ["<lifestyle recommendations>"],
    "screening_tests": ["<recommended tests if labs are missing>"]
  },
  "confidence": "<high|medium|low>"
}
\`\`\`

Base your analysis on evidence-based guidelines and provide actionable clinical recommendations.`;
}

/**
 * Analyze patient CKD risk using Claude AI
 *
 * @param request - Patient data and analysis request
 * @returns Structured AI risk assessment
 */
export async function analyzeCKDRisk(
  request: AIRiskAnalysisRequest
): Promise<AIRiskAnalysisResponse> {
  const { patient } = request;

  // Build analysis context
  const context = buildAnalysisContext(patient);

  // Create prompts
  const systemPrompt = createSystemPrompt();
  const userPrompt = createUserPrompt(context);

  console.log(`[AI Service] Analyzing CKD risk for patient ${patient.id}...`);

  try {
    // Call Claude AI
    const aiResponse = await callClaudeJSON<Partial<AIRiskAnalysisResponse>>(
      systemPrompt,
      userPrompt
    );

    // Construct complete response with metadata
    const response: AIRiskAnalysisResponse = {
      patient_id: patient.id,
      risk_score: aiResponse.risk_score || 0.5,
      risk_level: aiResponse.risk_level || 'medium',
      risk_tier: patient.risk_tier,
      key_findings: aiResponse.key_findings || {
        abnormal_labs: [],
        risk_factors: [],
        protective_factors: [],
      },
      ckd_analysis: aiResponse.ckd_analysis || {
        current_stage: patient.ckd_stage || null,
        kidney_function: 'normal',
        kidney_damage: 'none',
        progression_risk: 'low',
      },
      risk_factors: aiResponse.risk_factors || {
        diabetes: { present: false },
        hypertension: { present: false },
        other_factors: [],
      },
      reasoning: aiResponse.reasoning || 'Analysis completed.',
      clinical_summary: aiResponse.clinical_summary || 'Risk assessment performed.',
      recommendations: aiResponse.recommendations || {
        immediate_actions: [],
        follow_up: [],
        lifestyle_modifications: [],
        screening_tests: [],
      },
      analyzed_at: new Date().toISOString(),
      model_version: getModelVersion(),
      confidence: aiResponse.confidence || 'medium',
    };

    console.log(`[AI Service] Analysis complete. Risk Level: ${response.risk_level}, Score: ${response.risk_score}`);

    return response;
  } catch (error) {
    console.error('[AI Service] Analysis failed:', error);
    throw new Error(`CKD risk analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch analyze multiple patients
 * Useful for population health screening
 *
 * @param patients - Array of patient summaries
 * @returns Array of AI risk assessments
 */
export async function analyzeBatch(
  patients: PatientSummary[]
): Promise<AIRiskAnalysisResponse[]> {
  console.log(`[AI Service] Batch analyzing ${patients.length} patients...`);

  // Analyze patients sequentially to avoid rate limits
  // For production, implement proper rate limiting and parallel processing
  const results: AIRiskAnalysisResponse[] = [];

  for (const patient of patients) {
    try {
      const result = await analyzeCKDRisk({ patient });
      results.push(result);
    } catch (error) {
      console.error(`[AI Service] Failed to analyze patient ${patient.id}:`, error);
      // Continue with next patient even if one fails
    }
  }

  console.log(`[AI Service] Batch analysis complete. Analyzed ${results.length}/${patients.length} patients.`);

  return results;
}
