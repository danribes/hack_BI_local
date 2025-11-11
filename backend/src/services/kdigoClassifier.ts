/**
 * KDIGO CKD Classification Service
 *
 * Implements the KDIGO (Kidney Disease: Improving Global Outcomes)
 * classification system for chronic kidney disease staging and risk assessment.
 *
 * References:
 * - KDIGO 2024 Clinical Practice Guideline for CKD
 * - KDIGO 2012 CKD Classification and Risk Assessment
 */

export interface KDIGOClassification {
  // GFR Category
  gfrCategory: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
  gfrValue: number;
  gfrDescription: string;

  // Albuminuria Category
  albuminuriaCategory: 'A1' | 'A2' | 'A3';
  uacrValue: number | null;
  albuminuriaDescription: string;

  // Combined Health State
  healthState: string; // e.g., "G3a-A2"

  // Risk Assessment
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  riskColor: 'green' | 'yellow' | 'orange' | 'red';

  // CKD Stage
  ckdStage: number | null; // 1-5, null if not CKD
  ckdStageName: string;

  // Clinical Recommendations
  monitoringFrequency: string;
  requiresNephrologyReferral: boolean;
  requiresDialysisPlanning: boolean;

  // Treatment Recommendations
  recommendRASInhibitor: boolean;
  recommendSGLT2i: boolean;
  targetBP: string;
}

/**
 * Classify GFR category based on eGFR value
 */
export function classifyGFR(egfr: number): {
  category: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
  description: string;
} {
  if (egfr >= 90) {
    return {
      category: 'G1',
      description: 'Normal or high kidney function'
    };
  } else if (egfr >= 60) {
    return {
      category: 'G2',
      description: 'Mildly decreased kidney function'
    };
  } else if (egfr >= 45) {
    return {
      category: 'G3a',
      description: 'Mild to moderate decrease'
    };
  } else if (egfr >= 30) {
    return {
      category: 'G3b',
      description: 'Moderate to severe decrease'
    };
  } else if (egfr >= 15) {
    return {
      category: 'G4',
      description: 'Severely decreased kidney function'
    };
  } else {
    return {
      category: 'G5',
      description: 'Kidney failure (ESRD)'
    };
  }
}

/**
 * Classify albuminuria category based on uACR value
 */
export function classifyAlbuminuria(uacr: number | null): {
  category: 'A1' | 'A2' | 'A3';
  description: string;
} {
  if (uacr === null) {
    // Default to A1 if no uACR available
    return {
      category: 'A1',
      description: 'Normal to mildly increased (not measured)'
    };
  }

  if (uacr < 30) {
    return {
      category: 'A1',
      description: 'Normal to mildly increased'
    };
  } else if (uacr <= 300) {
    return {
      category: 'A2',
      description: 'Moderately increased (microalbuminuria)'
    };
  } else {
    return {
      category: 'A3',
      description: 'Severely increased (macroalbuminuria)'
    };
  }
}

/**
 * Determine risk level based on GFR and albuminuria categories
 */
export function determineRiskLevel(
  gfrCategory: string,
  albuminuriaCategory: string
): {
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  riskColor: 'green' | 'yellow' | 'orange' | 'red';
} {
  // KDIGO Risk Matrix
  const riskMatrix: Record<string, Record<string, { level: 'low' | 'moderate' | 'high' | 'very_high'; color: 'green' | 'yellow' | 'orange' | 'red' }>> = {
    G1: {
      A1: { level: 'low', color: 'green' },
      A2: { level: 'moderate', color: 'yellow' },
      A3: { level: 'high', color: 'orange' }
    },
    G2: {
      A1: { level: 'low', color: 'green' },
      A2: { level: 'moderate', color: 'yellow' },
      A3: { level: 'high', color: 'orange' }
    },
    G3a: {
      A1: { level: 'moderate', color: 'yellow' },
      A2: { level: 'high', color: 'orange' },
      A3: { level: 'very_high', color: 'red' }
    },
    G3b: {
      A1: { level: 'high', color: 'orange' },
      A2: { level: 'very_high', color: 'red' },
      A3: { level: 'very_high', color: 'red' }
    },
    G4: {
      A1: { level: 'very_high', color: 'red' },
      A2: { level: 'very_high', color: 'red' },
      A3: { level: 'very_high', color: 'red' }
    },
    G5: {
      A1: { level: 'very_high', color: 'red' },
      A2: { level: 'very_high', color: 'red' },
      A3: { level: 'very_high', color: 'red' }
    }
  };

  return riskMatrix[gfrCategory][albuminuriaCategory];
}

/**
 * Determine CKD stage based on KDIGO classification
 */
export function determineCKDStage(
  gfrCategory: string,
  albuminuriaCategory: string
): {
  stage: number | null;
  stageName: string;
  isCKD: boolean;
} {
  // G1 and G2 are only CKD if there's kidney damage (A2 or A3)
  if (gfrCategory === 'G1') {
    if (albuminuriaCategory === 'A1') {
      return { stage: null, stageName: 'Not CKD', isCKD: false };
    } else {
      return { stage: 1, stageName: 'CKD Stage 1', isCKD: true };
    }
  }

  if (gfrCategory === 'G2') {
    if (albuminuriaCategory === 'A1') {
      return { stage: null, stageName: 'Not CKD (age-related decline)', isCKD: false };
    } else {
      return { stage: 2, stageName: 'CKD Stage 2', isCKD: true };
    }
  }

  // G3a and G3b are both stage 3
  if (gfrCategory === 'G3a') {
    return { stage: 3, stageName: 'CKD Stage 3a', isCKD: true };
  }

  if (gfrCategory === 'G3b') {
    return { stage: 3, stageName: 'CKD Stage 3b', isCKD: true };
  }

  if (gfrCategory === 'G4') {
    return { stage: 4, stageName: 'CKD Stage 4', isCKD: true };
  }

  if (gfrCategory === 'G5') {
    return { stage: 5, stageName: 'CKD Stage 5 (ESRD)', isCKD: true };
  }

  return { stage: null, stageName: 'Unknown', isCKD: false };
}

/**
 * Get monitoring frequency recommendation
 */
export function getMonitoringFrequency(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'Annually';
    case 'moderate':
      return 'Every 6-12 months';
    case 'high':
      return 'Every 3-6 months';
    case 'very_high':
      return 'Every 1-3 months';
    default:
      return 'As clinically indicated';
  }
}

/**
 * Determine if nephrology referral is needed
 */
export function requiresNephrologyReferral(
  gfrCategory: string,
  albuminuriaCategory: string,
  riskLevel: string
): boolean {
  // Mandatory referral for G4, G5
  if (gfrCategory === 'G4' || gfrCategory === 'G5') {
    return true;
  }

  // Recommended for G3b
  if (gfrCategory === 'G3b') {
    return true;
  }

  // Consider for A3 (severe albuminuria)
  if (albuminuriaCategory === 'A3') {
    return true;
  }

  // Consider for very high risk
  if (riskLevel === 'very_high') {
    return true;
  }

  return false;
}

/**
 * Get blood pressure target
 */
export function getBloodPressureTarget(albuminuriaCategory: string): string {
  if (albuminuriaCategory === 'A1') {
    return '<140/90 mmHg';
  } else {
    return '<130/80 mmHg';
  }
}

/**
 * Main classification function - analyzes patient's kidney health state
 */
export function classifyKDIGOHealthState(
  egfr: number,
  uacr: number | null = null
): KDIGOClassification {
  // Classify GFR
  const gfrClass = classifyGFR(egfr);

  // Classify Albuminuria
  const albClass = classifyAlbuminuria(uacr);

  // Determine combined health state
  const healthState = `${gfrClass.category}-${albClass.category}`;

  // Determine risk level
  const risk = determineRiskLevel(gfrClass.category, albClass.category);

  // Determine CKD stage
  const ckdStage = determineCKDStage(gfrClass.category, albClass.category);

  // Get monitoring frequency
  const monitoringFrequency = getMonitoringFrequency(risk.riskLevel);

  // Check nephrology referral need
  const requiresNephrology = requiresNephrologyReferral(
    gfrClass.category,
    albClass.category,
    risk.riskLevel
  );

  // Dialysis planning needed for G4-G5
  const requiresDialysisPlanning = gfrClass.category === 'G4' || gfrClass.category === 'G5';

  // Treatment recommendations
  const recommendRASInhibitor = albClass.category === 'A2' || albClass.category === 'A3';
  const recommendSGLT2i =
    (albClass.category === 'A2' || albClass.category === 'A3') &&
    (egfr >= 20); // SGLT2i typically for eGFR ≥20

  // BP target
  const targetBP = getBloodPressureTarget(albClass.category);

  return {
    gfrCategory: gfrClass.category,
    gfrValue: egfr,
    gfrDescription: gfrClass.description,

    albuminuriaCategory: albClass.category,
    uacrValue: uacr,
    albuminuriaDescription: albClass.description,

    healthState,

    riskLevel: risk.riskLevel,
    riskColor: risk.riskColor,

    ckdStage: ckdStage.stage,
    ckdStageName: ckdStage.stageName,

    monitoringFrequency,
    requiresNephrologyReferral: requiresNephrology,
    requiresDialysisPlanning,

    recommendRASInhibitor,
    recommendSGLT2i,
    targetBP
  };
}

/**
 * Compare two health states to detect progression/regression
 */
export function compareHealthStates(
  previousState: KDIGOClassification,
  currentState: KDIGOClassification
): {
  hasChanged: boolean;
  changeType: 'improved' | 'worsened' | 'stable';
  gfrChange: number;
  gfrTrend: 'improving' | 'stable' | 'declining';
  albuminuriaChange: number | null;
  albuminuriaTrend: 'improving' | 'stable' | 'worsening' | 'unknown';
  categoryChanged: boolean;
  riskChanged: boolean;
  riskIncreased: boolean;
  needsAlert: boolean;
  alertReason: string[];
} {
  const gfrChange = currentState.gfrValue - previousState.gfrValue;
  const albuminuriaChange =
    (previousState.uacrValue !== null && currentState.uacrValue !== null)
      ? currentState.uacrValue - previousState.uacrValue
      : null;

  // Determine trends
  const gfrTrend = gfrChange > 5 ? 'improving' : gfrChange < -5 ? 'declining' : 'stable';

  let albuminuriaTrend: 'improving' | 'stable' | 'worsening' | 'unknown' = 'unknown';
  if (albuminuriaChange !== null) {
    albuminuriaTrend =
      albuminuriaChange < -10 ? 'improving' :
      albuminuriaChange > 10 ? 'worsening' :
      'stable';
  }

  // Check if categories changed
  const gfrCategoryChanged = previousState.gfrCategory !== currentState.gfrCategory;
  const albuminuriaCategoryChanged =
    previousState.albuminuriaCategory !== currentState.albuminuriaCategory;
  const categoryChanged = gfrCategoryChanged || albuminuriaCategoryChanged;

  // Check if risk changed
  const riskChanged = previousState.riskLevel !== currentState.riskLevel;
  const riskLevels = ['low', 'moderate', 'high', 'very_high'];
  const previousRiskIndex = riskLevels.indexOf(previousState.riskLevel);
  const currentRiskIndex = riskLevels.indexOf(currentState.riskLevel);
  const riskIncreased = currentRiskIndex > previousRiskIndex;

  // Determine overall change
  let changeType: 'improved' | 'worsened' | 'stable' = 'stable';
  if (categoryChanged) {
    if (riskIncreased || gfrTrend === 'declining') {
      changeType = 'worsened';
    } else {
      changeType = 'improved';
    }
  } else if (gfrTrend === 'declining' || albuminuriaTrend === 'worsening') {
    changeType = 'worsened';
  } else if (gfrTrend === 'improving' || albuminuriaTrend === 'improving') {
    changeType = 'improved';
  }

  // Determine if alert needed
  const alertReason: string[] = [];
  let needsAlert = false;

  if (gfrCategoryChanged && gfrTrend === 'declining') {
    needsAlert = true;
    alertReason.push(`GFR declined from ${previousState.gfrCategory} to ${currentState.gfrCategory}`);
  }

  if (albuminuriaCategoryChanged && albuminuriaTrend === 'worsening') {
    needsAlert = true;
    alertReason.push(`Albuminuria increased from ${previousState.albuminuriaCategory} to ${currentState.albuminuriaCategory}`);
  }

  if (riskIncreased) {
    needsAlert = true;
    alertReason.push(`Risk level increased from ${previousState.riskLevel} to ${currentState.riskLevel}`);
  }

  if (currentState.gfrValue < 30 && previousState.gfrValue >= 30) {
    needsAlert = true;
    alertReason.push('eGFR dropped below 30 - Stage 4 CKD');
  }

  if (currentState.gfrValue < 15 && previousState.gfrValue >= 15) {
    needsAlert = true;
    alertReason.push('eGFR dropped below 15 - Kidney failure (Stage 5)');
  }

  if (currentState.uacrValue && currentState.uacrValue > 300 &&
      (!previousState.uacrValue || previousState.uacrValue <= 300)) {
    needsAlert = true;
    alertReason.push('uACR exceeded 300 mg/g - Severe albuminuria');
  }

  if (!previousState.requiresNephrologyReferral && currentState.requiresNephrologyReferral) {
    needsAlert = true;
    alertReason.push('Nephrology referral now recommended');
  }

  return {
    hasChanged: categoryChanged || Math.abs(gfrChange) > 5 || (albuminuriaChange !== null && Math.abs(albuminuriaChange) > 10),
    changeType,
    gfrChange,
    gfrTrend,
    albuminuriaChange,
    albuminuriaTrend,
    categoryChanged,
    riskChanged,
    riskIncreased,
    needsAlert,
    alertReason
  };
}
