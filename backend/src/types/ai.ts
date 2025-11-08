/**
 * AI Service Types
 *
 * TypeScript types for AI-powered risk analysis using Claude.
 */

import { PatientSummary } from './patient';

/**
 * AI Risk Analysis Request
 * Input data for AI-powered CKD risk assessment
 */
export interface AIRiskAnalysisRequest {
  patient: PatientSummary;
  analysisType?: 'ckd_risk' | 'comprehensive';
  includeRecommendations?: boolean;
  includeTrends?: boolean;
}

/**
 * AI Risk Analysis Response
 * Structured output from Claude AI risk assessment
 */
export interface AIRiskAnalysisResponse {
  patient_id: string;
  risk_score: number; // 0.00 to 1.00
  risk_level: 'low' | 'medium' | 'high';
  risk_tier: 1 | 2 | 3; // Three-tier stratification

  // Clinical findings
  key_findings: {
    abnormal_labs: string[];
    risk_factors: string[];
    protective_factors: string[];
  };

  // CKD-specific analysis
  ckd_analysis: {
    current_stage: string | null;
    kidney_function: 'normal' | 'mildly_reduced' | 'moderately_reduced' | 'severely_reduced' | 'kidney_failure';
    kidney_damage: 'none' | 'microalbuminuria' | 'macroalbuminuria';
    progression_risk: 'low' | 'moderate' | 'high';
  };

  // Risk factors breakdown
  risk_factors: {
    diabetes: {
      present: boolean;
      control_status?: 'well_controlled' | 'suboptimal' | 'poorly_controlled';
      hba1c?: number;
    };
    hypertension: {
      present: boolean;
      control_status?: 'well_controlled' | 'elevated' | 'uncontrolled';
      blood_pressure?: string;
    };
    other_factors: string[];
  };

  // AI-generated insights
  reasoning: string;
  clinical_summary: string;

  // Actionable recommendations
  recommendations: {
    immediate_actions: string[];
    follow_up: string[];
    lifestyle_modifications: string[];
    screening_tests: string[];
  };

  // Metadata
  analyzed_at: string;
  model_version: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Claude API Configuration
 */
export interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Prompt Context for CKD Risk Analysis
 * Structured data passed to Claude for analysis
 */
export interface CKDAnalysisContext {
  demographics: {
    age: number;
    gender: string;
  };
  diagnoses: Array<{
    code: string;
    name: string;
    status: string;
  }>;
  latest_labs: {
    eGFR?: number;
    uACR?: number;
    HbA1c?: number;
    blood_pressure?: string;
    other: Array<{
      type: string;
      value: number;
      unit: string;
    }>;
  };
  risk_tier: 1 | 2 | 3;
  ckd_stage?: string;
}

/**
 * AI Error Response
 */
export interface AIError {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
}
