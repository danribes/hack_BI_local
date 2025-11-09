// Patient data types
export interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  age: number;
  gender: string;
  risk_tier: number;
  latest_eGFR: string;
  latest_uACR: string;
  has_diabetes: boolean;
  has_hypertension: boolean;
  ckd_stage: string;
}

export interface PatientListResponse {
  status: string;
  data: Patient[];
  count: number;
  timestamp: string;
}

// Risk Assessment types
export interface RiskAssessment {
  risk_score: number;
  risk_level: string;
  risk_tier: number;
  key_findings: string[];
  ckd_analysis: {
    stage: string;
    kidney_function: string;
    albuminuria_level: string;
    progression_risk: string;
  };
  recommendations: {
    immediate_actions: string[];
    follow_up: string[];
    lifestyle_modifications: string[];
    monitoring: string[];
  };
  assessed_at: string;
}

export interface RiskAnalysisResponse {
  status: string;
  data: RiskAssessment;
  timestamp: string;
}
