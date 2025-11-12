/**
 * KDIGO CKD Classification Utility
 * Calculates health state, risk level, and CKD stage based on eGFR and uACR
 */

export interface KDIGOClassification {
  // GFR Category
  gfr_category: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
  gfr_description: string;

  // Albuminuria Category
  albuminuria_category: 'A1' | 'A2' | 'A3';
  albuminuria_description: string;

  // Health State
  health_state: string; // e.g., "G3a-A2"

  // Risk Assessment
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  risk_color: 'green' | 'yellow' | 'orange' | 'red';

  // CKD Status
  has_ckd: boolean;
  ckd_stage: number | null; // 1-5, null if no CKD
  ckd_stage_name: string;

  // Clinical Flags
  requires_nephrology_referral: boolean;
  requires_dialysis_planning: boolean;
  recommend_ras_inhibitor: boolean;
  recommend_sglt2i: boolean;

  // Monitoring
  target_bp: string;
  monitoring_frequency: string;
}

/**
 * Determine GFR category from eGFR value
 */
export function getGFRCategory(egfr: number): { category: string; description: string } {
  if (egfr >= 90) {
    return { category: 'G1', description: 'Normal or High' };
  } else if (egfr >= 60) {
    return { category: 'G2', description: 'Mildly Decreased' };
  } else if (egfr >= 45) {
    return { category: 'G3a', description: 'Mild to Moderate Decrease' };
  } else if (egfr >= 30) {
    return { category: 'G3b', description: 'Moderate to Severe Decrease' };
  } else if (egfr >= 15) {
    return { category: 'G4', description: 'Severely Decreased' };
  } else {
    return { category: 'G5', description: 'Kidney Failure' };
  }
}

/**
 * Determine Albuminuria category from uACR value
 */
export function getAlbuminuriaCategory(uacr: number): { category: string; description: string } {
  if (uacr < 30) {
    return { category: 'A1', description: 'Normal to Mildly Increased' };
  } else if (uacr <= 300) {
    return { category: 'A2', description: 'Moderately Increased' };
  } else {
    return { category: 'A3', description: 'Severely Increased' };
  }
}

/**
 * Determine CKD stage
 */
export function getCKDStage(egfr: number, uacr: number): { stage: number | null; name: string; has_ckd: boolean } {
  // Stage 5: Kidney Failure
  if (egfr < 15) {
    return { stage: 5, name: 'Stage 5 (Kidney Failure)', has_ckd: true };
  }

  // Stage 4: Severely Decreased
  if (egfr < 30) {
    return { stage: 4, name: 'Stage 4 (Severe)', has_ckd: true };
  }

  // Stage 3b: Moderate to Severe
  if (egfr < 45) {
    return { stage: 3, name: 'Stage 3b (Moderate to Severe)', has_ckd: true };
  }

  // Stage 3a: Mild to Moderate (always CKD)
  if (egfr < 60) {
    return { stage: 3, name: 'Stage 3a (Mild to Moderate)', has_ckd: true };
  }

  // Stage 2: Mild decrease with kidney damage (requires proteinuria)
  if (egfr >= 60 && egfr < 90 && uacr >= 30) {
    return { stage: 2, name: 'Stage 2 (Mild Decrease with Damage)', has_ckd: true };
  }

  // Stage 1: Normal/High with kidney damage (requires proteinuria)
  if (egfr >= 90 && uacr >= 30) {
    return { stage: 1, name: 'Stage 1 (Normal Function with Damage)', has_ckd: true };
  }

  // No CKD
  return { stage: null, name: 'No CKD', has_ckd: false };
}

/**
 * Calculate KDIGO risk level based on GFR and Albuminuria categories
 * Following KDIGO 2024 risk stratification matrix
 */
export function getKDIGORiskLevel(gfrCat: string, albCat: string): {
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  risk_color: 'green' | 'yellow' | 'orange' | 'red';
} {
  // Very High Risk (Red)
  if (gfrCat === 'G5' || gfrCat === 'G4') {
    return { risk_level: 'very_high', risk_color: 'red' };
  }

  if (gfrCat === 'G3b' && (albCat === 'A2' || albCat === 'A3')) {
    return { risk_level: 'very_high', risk_color: 'red' };
  }

  if (gfrCat === 'G3a' && albCat === 'A3') {
    return { risk_level: 'very_high', risk_color: 'red' };
  }

  // High Risk (Orange)
  if (gfrCat === 'G3b' && albCat === 'A1') {
    return { risk_level: 'high', risk_color: 'orange' };
  }

  if (gfrCat === 'G3a' && albCat === 'A2') {
    return { risk_level: 'high', risk_color: 'orange' };
  }

  if ((gfrCat === 'G1' || gfrCat === 'G2') && albCat === 'A3') {
    return { risk_level: 'high', risk_color: 'orange' };
  }

  // Moderate Risk (Yellow)
  if (gfrCat === 'G3a' && albCat === 'A1') {
    return { risk_level: 'moderate', risk_color: 'yellow' };
  }

  if ((gfrCat === 'G1' || gfrCat === 'G2') && albCat === 'A2') {
    return { risk_level: 'moderate', risk_color: 'yellow' };
  }

  // Low Risk (Green)
  return { risk_level: 'low', risk_color: 'green' };
}

/**
 * Complete KDIGO classification
 */
export function classifyKDIGO(egfr: number, uacr: number): KDIGOClassification {
  const gfrInfo = getGFRCategory(egfr);
  const albInfo = getAlbuminuriaCategory(uacr);
  const ckdInfo = getCKDStage(egfr, uacr);
  const riskInfo = getKDIGORiskLevel(gfrInfo.category, albInfo.category);

  const health_state = `${gfrInfo.category}-${albInfo.category}`;

  // Clinical recommendations
  const requires_nephrology = gfrInfo.category === 'G4' || gfrInfo.category === 'G5' ||
                              (gfrInfo.category === 'G3b') ||
                              (albInfo.category === 'A3');

  const requires_dialysis = gfrInfo.category === 'G5' ||
                           (gfrInfo.category === 'G4' && egfr < 20);

  const recommend_ras = albInfo.category === 'A2' || albInfo.category === 'A3';
  const recommend_sglt2i = ckdInfo.stage !== null && ckdInfo.stage >= 2 && ckdInfo.stage <= 4;

  // BP target based on proteinuria
  const target_bp = albInfo.category === 'A1' ? '<140/90 mmHg' : '<130/80 mmHg';

  // Monitoring frequency based on risk
  let monitoring_frequency: string;
  switch (riskInfo.risk_level) {
    case 'very_high':
      monitoring_frequency = 'Every 1-3 months';
      break;
    case 'high':
      monitoring_frequency = 'Every 3-6 months';
      break;
    case 'moderate':
      monitoring_frequency = 'Every 6-12 months';
      break;
    default:
      monitoring_frequency = 'Annually';
  }

  return {
    gfr_category: gfrInfo.category as any,
    gfr_description: gfrInfo.description,
    albuminuria_category: albInfo.category as any,
    albuminuria_description: albInfo.description,
    health_state,
    risk_level: riskInfo.risk_level,
    risk_color: riskInfo.risk_color,
    has_ckd: ckdInfo.has_ckd,
    ckd_stage: ckdInfo.stage,
    ckd_stage_name: ckdInfo.name,
    requires_nephrology_referral: requires_nephrology,
    requires_dialysis_planning: requires_dialysis,
    recommend_ras_inhibitor: recommend_ras,
    recommend_sglt2i: recommend_sglt2i,
    target_bp,
    monitoring_frequency
  };
}

/**
 * Get CKD severity classification based on stage
 */
export function getCKDSeverity(ckdStage: number | null): 'mild' | 'moderate' | 'severe' | 'kidney_failure' | null {
  if (ckdStage === null) return null;

  switch (ckdStage) {
    case 1:
    case 2:
      return 'mild';
    case 3:
      return 'moderate';
    case 4:
      return 'severe';
    case 5:
      return 'kidney_failure';
    default:
      return null;
  }
}

/**
 * Get human-readable severity label
 */
export function getCKDSeverityLabel(severity: 'mild' | 'moderate' | 'severe' | 'kidney_failure' | null): string {
  switch (severity) {
    case 'mild':
      return 'Mild CKD';
    case 'moderate':
      return 'Moderate CKD';
    case 'severe':
      return 'Severe CKD';
    case 'kidney_failure':
      return 'Kidney Failure';
    default:
      return 'No CKD';
  }
}

/**
 * Get monitoring frequency category for database storage
 */
export function getMonitoringFrequencyCategory(kdigo: KDIGOClassification): string {
  switch (kdigo.risk_level) {
    case 'very_high':
      return 'monthly'; // Every 1-3 months
    case 'high':
      return 'quarterly'; // Every 3-6 months
    case 'moderate':
      return 'biannually'; // Every 6-12 months
    default:
      return 'annually'; // Annually
  }
}

/**
 * Get risk category label for patient list grouping (NEW NOMENCLATURE)
 */
export function getRiskCategoryLabel(classification: KDIGOClassification): string {
  if (!classification.has_ckd) {
    // Non-CKD patients
    switch (classification.risk_level) {
      case 'low':
        return 'Low Risk';
      case 'moderate':
        return 'Moderate Risk';
      case 'high':
      case 'very_high':
        return 'High Risk';
      default:
        return 'Low Risk';
    }
  } else {
    // CKD patients - Use severity-based labels
    const severity = getCKDSeverity(classification.ckd_stage);
    return getCKDSeverityLabel(severity);
  }
}
