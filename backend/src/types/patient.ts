/**
 * Patient Data Types
 *
 * TypeScript types for patient records, observations, conditions, and risk assessments.
 * These types align with the PostgreSQL database schema.
 */

/**
 * Patient Demographics
 * Core patient information from the patients table
 */
export interface Patient {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO 8601 date string
  gender: 'male' | 'female' | 'other' | 'unknown';
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Patient with computed fields
 * Includes age and full name for convenience
 */
export interface PatientWithAge extends Patient {
  age: number;
  full_name: string;
}

/**
 * Clinical Observation (Lab Result)
 * Represents a single lab test result or vital sign measurement
 */
export interface Observation {
  id: string;
  patient_id: string;
  observation_type: ObservationType;
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  observation_date: string; // ISO 8601 timestamp
  status: 'preliminary' | 'final' | 'amended';
  notes?: string;
  created_at: string;
}

/**
 * Clinical observation types
 * Based on common CKD screening lab tests and vitals
 */
export type ObservationType =
  | 'eGFR'                      // Estimated Glomerular Filtration Rate (kidney function)
  | 'serum_creatinine'          // Creatinine level
  | 'uACR'                      // Urine Albumin-to-Creatinine Ratio (kidney damage)
  | 'blood_pressure_systolic'   // Systolic BP
  | 'blood_pressure_diastolic'  // Diastolic BP
  | 'HbA1c'                     // Hemoglobin A1c (diabetes control)
  | 'BMI'                       // Body Mass Index
  | 'potassium'                 // Potassium level
  | 'LDL_cholesterol'           // LDL cholesterol
  | 'HDL_cholesterol'           // HDL cholesterol
  | 'triglycerides'             // Triglycerides
  | string;                     // Allow for other types

/**
 * Clinical Condition (Diagnosis)
 * Represents a patient's medical condition/diagnosis
 */
export interface Condition {
  id: string;
  patient_id: string;
  condition_code: string;        // ICD-10 code (e.g., 'E11.9', 'I10')
  condition_name: string;
  clinical_status: 'active' | 'resolved' | 'inactive';
  onset_date?: string;           // ISO 8601 date
  recorded_date: string;         // ISO 8601 timestamp
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
  created_at: string;
}

/**
 * Risk Assessment
 * AI-generated risk assessment for CKD
 */
export interface RiskAssessment {
  id: string;
  patient_id: string;
  risk_score: number;            // 0.00 to 1.00
  risk_level: 'low' | 'medium' | 'high';
  recommendations: string[];
  reasoning: string;
  assessed_at: string;           // ISO 8601 timestamp
  created_at: string;
}

/**
 * Patient Summary
 * Complete patient record with related clinical data
 * Used for CKD risk analysis and screening
 */
export interface PatientSummary extends PatientWithAge {
  // Clinical data
  observations: Observation[];
  conditions: Condition[];
  risk_assessments: RiskAssessment[];

  // Derived/computed fields for screening
  latest_observations: LatestObservations;
  risk_tier: RiskTier;
  has_diabetes: boolean;
  has_hypertension: boolean;
  ckd_stage?: CKDStage;
}

/**
 * Latest observation values
 * Most recent values for key CKD screening parameters
 */
export interface LatestObservations {
  eGFR?: number;
  uACR?: number;
  HbA1c?: number;
  blood_pressure?: {
    systolic: number;
    diastolic: number;
    reading: string; // e.g., "120/80"
  };
  BMI?: number;
}

/**
 * CKD Risk Tier (Three-Tier Stratification)
 * Based on the recommended screening protocol
 */
export type RiskTier = 1 | 2 | 3;

/**
 * CKD Risk Tier Details
 * Describes the risk tier with criteria and actions
 */
export interface RiskTierInfo {
  tier: RiskTier;
  label: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  description: string;
  criteria: string[];
  actions: string[];
}

/**
 * CKD Stage
 * Based on eGFR values
 */
export type CKDStage = '1' | '2' | '3a' | '3b' | '4' | '5';

/**
 * CKD Stage Details
 * Clinical information about each CKD stage
 */
export interface CKDStageInfo {
  stage: CKDStage;
  label: string;
  eGFR_range: string;
  description: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'kidney_failure';
}

/**
 * Patient List Item
 * Minimal patient info for list views
 */
export interface PatientListItem {
  id: string;
  medical_record_number: string;
  full_name: string;
  age: number;
  gender: string;
  risk_tier?: RiskTier;
  latest_eGFR?: number;
  latest_uACR?: number;
  has_diabetes: boolean;
  has_hypertension: boolean;
  ckd_stage?: CKDStage;
}

/**
 * Query parameters for patient list
 */
export interface PatientQueryParams {
  risk_tier?: RiskTier;
  has_diabetes?: boolean;
  has_hypertension?: boolean;
  ckd_stage?: CKDStage;
  min_age?: number;
  max_age?: number;
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'age' | 'risk_tier' | 'eGFR' | 'mrn';
  sort_order?: 'asc' | 'desc';
}

/**
 * API Response wrappers
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  timestamp: string;
}
