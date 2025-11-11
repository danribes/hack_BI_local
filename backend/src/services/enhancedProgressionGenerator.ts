/**
 * Enhanced Progression Generator with Treatment and Adherence
 *
 * Core Algorithm Principles:
 * 1. Natural trajectory: ALL patients worsen over time (CKD is progressive)
 * 2. Treatment effect: Only treated patients can improve or stabilize
 * 3. Adherence modulation: Good adherence → improvement; Poor adherence → worsening continues
 * 4. Coherent evolution: eGFR and uACR change realistically based on disease + treatment + adherence
 */

import { getPool } from '../config/database';
import { classifyKDIGOHealthState, KDIGOClassification, compareHealthStates } from './kdigoClassifier';

// ============================================
// Types
// ============================================

interface PatientProgressionState {
  patient_id: string;
  progression_type: 'progressive' | 'stable' | 'improving' | 'rapid';
  baseline_egfr: number;
  baseline_uacr: number;
  egfr_decline_rate: number;  // Monthly decline rate (always negative for untreated)
  uacr_change_rate: number;   // Monthly % increase (always positive for untreated)
  natural_trajectory: string;
  base_decline_locked: boolean;
}

interface ActiveTreatment {
  id: string;
  medication_name: string;
  medication_class: string;
  current_adherence: number; // 0-1
  started_cycle: number;
  expected_egfr_benefit: number | null;
  expected_uacr_reduction: number | null;
}

interface CycleGenerationResult {
  cycle_number: number;
  egfr_value: number;
  uacr_value: number;
  classification: KDIGOClassification;
  measured_at: Date;
  is_treated: boolean;
  average_adherence: number | null;
  treatment_effect_egfr: number | null;
  treatment_effect_uacr: number | null;
  transition_detected: boolean;
  transition_details?: {
    from_state: string;
    to_state: string;
    change_type: 'improved' | 'worsened' | 'stable';
    alert_generated: boolean;
    alert_severity?: 'critical' | 'warning' | 'info';
  };
}

// ============================================
// Treatment Effect Constants
// ============================================

const TREATMENT_EFFECTS = {
  // RAS Inhibitors (ACE-I, ARBs): Slow eGFR decline, reduce proteinuria
  RAS_INHIBITOR: {
    egfr_benefit_min: 0.5,   // Slow decline by 0.5 mL/min/month at minimum
    egfr_benefit_max: 1.5,   // Up to 1.5 mL/min/month with perfect adherence
    uacr_reduction_min: 0.20, // 20% reduction minimum
    uacr_reduction_max: 0.40, // Up to 40% reduction
  },
  // SGLT2 Inhibitors: Significant kidney protection
  SGLT2I: {
    egfr_benefit_min: 1.0,   // Strong eGFR protection
    egfr_benefit_max: 2.5,   // Very strong with perfect adherence
    uacr_reduction_min: 0.25, // 25% reduction minimum
    uacr_reduction_max: 0.50, // Up to 50% reduction
  },
  // GLP-1 Receptor Agonists: Moderate kidney benefits
  GLP1_RA: {
    egfr_benefit_min: 0.3,
    egfr_benefit_max: 1.0,
    uacr_reduction_min: 0.15,
    uacr_reduction_max: 0.30,
  },
  // Combination therapy bonus (additive effects)
  COMBINATION_BONUS: 0.2, // 20% additional benefit for combination therapy
};

// ============================================
// Core Functions
// ============================================

/**
 * Get or create progression state for a patient
 * Ensures ALL patients have a natural WORSENING trajectory
 */
export async function getOrCreateProgressionState(patientId: string): Promise<PatientProgressionState> {
  const pool = getPool();

  // Check if progression state exists
  const existingState = await pool.query(`
    SELECT * FROM patient_progression_state
    WHERE patient_id = $1
  `, [patientId]);

  if (existingState.rows.length > 0) {
    return existingState.rows[0];
  }

  // Create new progression state based on patient's baseline labs
  const patientResult = await pool.query(`
    SELECT
      p.id,
      o1.value_numeric as egfr,
      o2.value_numeric as uacr
    FROM patients p
    LEFT JOIN LATERAL (
      SELECT value_numeric FROM observations
      WHERE patient_id = p.id AND observation_type = 'eGFR'
      ORDER BY observation_date DESC LIMIT 1
    ) o1 ON true
    LEFT JOIN LATERAL (
      SELECT value_numeric FROM observations
      WHERE patient_id = p.id AND observation_type = 'uACR'
      ORDER BY observation_date DESC LIMIT 1
    ) o2 ON true
    WHERE p.id = $1
  `, [patientId]);

  if (patientResult.rows.length === 0) {
    throw new Error('Patient not found');
  }

  const patient = patientResult.rows[0];
  const baseline_egfr = patient.egfr || (60 + Math.random() * 30); // 60-90 if missing
  const baseline_uacr = patient.uacr || (20 + Math.random() * 50);  // 20-70 if missing

  // Assign progression type with realistic CKD distribution
  const random = Math.random();
  let progression_type: PatientProgressionState['progression_type'];
  let egfr_decline_rate: number;
  let uacr_change_rate: number;

  if (random < 0.05) {
    // 5% - Rapid progressors
    progression_type = 'rapid';
    egfr_decline_rate = -(0.8 + Math.random() * 0.4); // -0.8 to -1.2 mL/min/month (-9.6 to -14.4/year)
    uacr_change_rate = 0.04 + Math.random() * 0.06;   // +4% to +10% per month
  } else if (random < 0.35) {
    // 30% - Progressive decliners
    progression_type = 'progressive';
    egfr_decline_rate = -(0.3 + Math.random() * 0.3); // -0.3 to -0.6 mL/min/month (-3.6 to -7.2/year)
    uacr_change_rate = 0.015 + Math.random() * 0.025; // +1.5% to +4% per month
  } else if (random < 0.50) {
    // 15% - Moderate decliners (labeled as "stable" but still declining)
    progression_type = 'stable';
    egfr_decline_rate = -(0.15 + Math.random() * 0.15); // -0.15 to -0.3 mL/min/month (-1.8 to -3.6/year)
    uacr_change_rate = 0.005 + Math.random() * 0.015;   // +0.5% to +2% per month
  } else {
    // 50% - Slow progressors (labeled as "improving" but slowly declining without treatment)
    progression_type = 'improving';
    egfr_decline_rate = -(0.05 + Math.random() * 0.10); // -0.05 to -0.15 mL/min/month (-0.6 to -1.8/year)
    uacr_change_rate = 0.001 + Math.random() * 0.009;   // +0.1% to +1% per month
  }

  // Store progression state
  const insertResult = await pool.query(`
    INSERT INTO patient_progression_state (
      patient_id,
      progression_type,
      baseline_egfr,
      baseline_uacr,
      egfr_decline_rate,
      uacr_change_rate,
      natural_trajectory,
      base_decline_locked,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *
  `, [patientId, progression_type, baseline_egfr, baseline_uacr, egfr_decline_rate, uacr_change_rate, 'worsening', true]);

  return insertResult.rows[0];
}

/**
 * Get patient's active treatments
 */
async function getActiveTreatments(patientId: string): Promise<ActiveTreatment[]> {
  const pool = getPool();

  const result = await pool.query(`
    SELECT
      id,
      medication_name,
      medication_class,
      current_adherence,
      started_cycle,
      expected_egfr_benefit,
      expected_uacr_reduction
    FROM patient_treatments
    WHERE patient_id = $1 AND status = 'active'
  `, [patientId]);

  return result.rows;
}

/**
 * Calculate treatment effect on eGFR and uACR based on medications and adherence
 */
function calculateTreatmentEffect(
  treatments: ActiveTreatment[]
): { egfr_effect: number; uacr_effect: number; average_adherence: number } {
  if (treatments.length === 0) {
    return { egfr_effect: 0, uacr_effect: 0, average_adherence: 0 };
  }

  let total_egfr_benefit = 0;
  let total_uacr_reduction = 0;
  let adherence_sum = 0;

  for (const treatment of treatments) {
    const effect = TREATMENT_EFFECTS[treatment.medication_class as keyof typeof TREATMENT_EFFECTS];

    if (effect) {
      // Adherence modulates the treatment effect (0 = no benefit, 1 = full benefit)
      const adherence_factor = treatment.current_adherence;

      // Calculate eGFR benefit (slows decline)
      const egfr_benefit = effect.egfr_benefit_min +
        (effect.egfr_benefit_max - effect.egfr_benefit_min) * adherence_factor;

      // Calculate uACR reduction
      const uacr_reduction = effect.uacr_reduction_min +
        (effect.uacr_reduction_max - effect.uacr_reduction_min) * adherence_factor;

      total_egfr_benefit += egfr_benefit;
      total_uacr_reduction += uacr_reduction;
      adherence_sum += treatment.current_adherence;
    }
  }

  // Combination therapy bonus
  if (treatments.length > 1) {
    total_egfr_benefit *= (1 + TREATMENT_EFFECTS.COMBINATION_BONUS);
    total_uacr_reduction *= (1 + TREATMENT_EFFECTS.COMBINATION_BONUS);
  }

  const average_adherence = adherence_sum / treatments.length;

  return {
    egfr_effect: total_egfr_benefit,
    uacr_effect: total_uacr_reduction,
    average_adherence
  };
}

/**
 * Generate next cycle for a single patient with enhanced algorithm
 */
export async function generateEnhancedCycle(
  patientId: string,
  targetCycle: number
): Promise<CycleGenerationResult> {
  const pool = getPool();

  // Get progression state
  const progressionState = await getOrCreateProgressionState(patientId);

  // Get previous cycle data
  const previousCycleResult = await pool.query(`
    SELECT *
    FROM health_state_history
    WHERE patient_id = $1 AND cycle_number = $2
    ORDER BY measured_at DESC
    LIMIT 1
  `, [patientId, targetCycle - 1]);

  let previous_egfr: number;
  let previous_uacr: number;
  let previous_state: string | null = null;

  if (previousCycleResult.rows.length === 0 && targetCycle === 0) {
    // Initialize baseline (cycle 0)
    previous_egfr = progressionState.baseline_egfr;
    previous_uacr = progressionState.baseline_uacr;
  } else if (previousCycleResult.rows.length === 0) {
    throw new Error(`Previous cycle ${targetCycle - 1} not found. Generate cycles sequentially.`);
  } else {
    previous_egfr = parseFloat(previousCycleResult.rows[0].egfr_value);
    previous_uacr = parseFloat(previousCycleResult.rows[0].uacr_value);
    previous_state = previousCycleResult.rows[0].health_state;
  }

  // Get active treatments
  const treatments = await getActiveTreatments(patientId);
  const is_treated = treatments.length > 0;

  // Calculate treatment effect
  const { egfr_effect, uacr_effect, average_adherence } = calculateTreatmentEffect(treatments);

  // === CORE ALGORITHM ===
  // Natural decline + Treatment effect modulated by adherence

  // 1. Natural disease progression (always worsening)
  const natural_egfr_decline = progressionState.egfr_decline_rate; // Always negative
  const natural_uacr_increase_rate = progressionState.uacr_change_rate; // Always positive

  // 2. Treatment counteracts natural decline
  //    - If untreated: only natural decline
  //    - If treated with poor adherence: minimal benefit, disease still progresses
  //    - If treated with good adherence: decline slowed or reversed

  // Random biological variation (±10% of expected change)
  const egfr_noise = (Math.random() - 0.5) * 0.3; // ±0.15 mL/min
  const uacr_noise_factor = 1 + (Math.random() - 0.5) * 0.10; // ±5%

  // Calculate new eGFR
  let egfr_change = natural_egfr_decline; // Start with natural decline

  if (is_treated) {
    // Treatment slows or reverses decline based on adherence
    egfr_change += egfr_effect; // Add treatment benefit (counteracts decline)

    // Poor adherence (<50%) means disease mostly progresses despite treatment
    if (average_adherence < 0.5) {
      // Disease wins - reduce treatment benefit
      egfr_change = natural_egfr_decline * 0.7 + egfr_effect * 0.3;
    }
  }

  const new_egfr = Math.max(5, previous_egfr + egfr_change + egfr_noise);

  // Calculate new uACR
  let uacr_change_factor = 1 + natural_uacr_increase_rate; // Natural increase

  if (is_treated) {
    // Treatment reduces uACR
    uacr_change_factor *= (1 - uacr_effect); // Reduce by treatment effect

    // Poor adherence means less uACR reduction
    if (average_adherence < 0.5) {
      uacr_change_factor = 1 + natural_uacr_increase_rate * 0.7 - uacr_effect * 0.3;
    }
  }

  const new_uacr = Math.max(5, previous_uacr * uacr_change_factor * uacr_noise_factor);

  // Classify the new state
  const classification = classifyKDIGOHealthState(new_egfr, new_uacr);

  // Store in database
  const measured_at = new Date();
  await pool.query(`
    INSERT INTO health_state_history (
      patient_id,
      measured_at,
      cycle_number,
      egfr_value,
      uacr_value,
      gfr_category,
      albuminuria_category,
      health_state,
      risk_level,
      risk_color,
      ckd_stage,
      monitoring_frequency,
      nephrology_referral_needed,
      dialysis_planning_needed,
      treatment_recommendations,
      is_treated,
      active_treatments,
      average_adherence,
      treatment_effect_egfr,
      treatment_effect_uacr
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
  `, [
    patientId,
    measured_at,
    targetCycle,
    new_egfr.toFixed(2),
    new_uacr.toFixed(2),
    classification.gfrCategory,
    classification.albuminuriaCategory,
    classification.healthState,
    classification.riskLevel,
    classification.riskColor,
    classification.ckdStage,
    classification.monitoringFrequency,
    classification.requiresNephrologyReferral,
    classification.requiresDialysisPlanning,
    JSON.stringify({
      ras_inhibitor: classification.recommendRASInhibitor,
      sglt2_inhibitor: classification.recommendSGLT2i,
      bp_target: classification.targetBP
    }),
    is_treated,
    treatments.map(t => t.medication_class),
    is_treated ? average_adherence : null,
    is_treated ? egfr_effect : null,
    is_treated ? uacr_effect : null
  ]);

  // Update adherence history for treated patients
  if (is_treated && targetCycle > 0) {
    for (const treatment of treatments) {
      await updateAdherenceHistory(
        treatment.id,
        patientId,
        targetCycle,
        measured_at,
        treatment.current_adherence,
        new_egfr,
        new_uacr,
        previous_egfr,
        previous_uacr
      );
    }
  }

  const result: CycleGenerationResult = {
    cycle_number: targetCycle,
    egfr_value: new_egfr,
    uacr_value: new_uacr,
    classification,
    measured_at,
    is_treated,
    average_adherence: is_treated ? average_adherence : null,
    treatment_effect_egfr: is_treated ? egfr_effect : null,
    treatment_effect_uacr: is_treated ? uacr_effect : null,
    transition_detected: false
  };

  // Detect state transitions
  if (previous_state && targetCycle > 0) {
    const previous_classification = classifyKDIGOHealthState(previous_egfr, previous_uacr);
    const comparison = compareHealthStates(previous_classification, classification);

    if (comparison.hasChanged) {
      await recordTransition(
        patientId,
        targetCycle - 1,
        targetCycle,
        previous_state,
        classification.healthState,
        previous_egfr,
        new_egfr,
        previous_uacr,
        new_uacr,
        previous_classification,
        classification,
        comparison,
        measured_at
      );

      result.transition_detected = true;
      result.transition_details = {
        from_state: previous_state,
        to_state: classification.healthState,
        change_type: comparison.changeType,
        alert_generated: comparison.needsAlert,
        alert_severity: comparison.needsAlert ? (
          comparison.alertReason.some(r => r.includes('Critical') || r.includes('below 30') || r.includes('below 15')) ? 'critical' :
          comparison.alertReason.some(r => r.includes('Category') || r.includes('Risk level increased')) ? 'warning' : 'info'
        ) : undefined
      };
    }
  }

  return result;
}

/**
 * Update adherence history
 */
async function updateAdherenceHistory(
  treatmentId: string,
  patientId: string,
  cycle: number,
  measuredAt: Date,
  adherenceScore: number,
  currentEgfr: number,
  currentUacr: number,
  baselineEgfr: number,
  baselineUacr: number
): Promise<void> {
  const pool = getPool();

  const egfrChange = currentEgfr - baselineEgfr;
  const uacrChange = currentUacr - baselineUacr;

  let adherenceIndicator: string;
  if (adherenceScore >= 0.9) adherenceIndicator = 'excellent';
  else if (adherenceScore >= 0.7) adherenceIndicator = 'good';
  else if (adherenceScore >= 0.5) adherenceIndicator = 'fair';
  else if (adherenceScore >= 0.3) adherenceIndicator = 'poor';
  else adherenceIndicator = 'very_poor';

  await pool.query(`
    INSERT INTO adherence_history (
      treatment_id,
      patient_id,
      cycle_number,
      measured_at,
      adherence_score,
      calculation_method,
      egfr_value,
      uacr_value,
      egfr_change_from_baseline,
      uacr_change_from_baseline,
      actual_egfr,
      adherence_indicator
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (treatment_id, cycle_number) DO UPDATE
    SET adherence_score = EXCLUDED.adherence_score,
        actual_egfr = EXCLUDED.actual_egfr,
        adherence_indicator = EXCLUDED.adherence_indicator
  `, [
    treatmentId,
    patientId,
    cycle,
    measuredAt,
    adherenceScore,
    'lab_trend',
    currentEgfr,
    currentUacr,
    egfrChange,
    uacrChange,
    currentEgfr,
    adherenceIndicator
  ]);
}

/**
 * Record state transition
 */
async function recordTransition(
  patientId: string,
  fromCycle: number,
  toCycle: number,
  fromState: string,
  toState: string,
  fromEgfr: number,
  toEgfr: number,
  fromUacr: number,
  toUacr: number,
  fromClassification: KDIGOClassification,
  toClassification: KDIGOClassification,
  comparison: any,
  transitionDate: Date
): Promise<void> {
  const pool = getPool();

  const transitionResult = await pool.query(`
    INSERT INTO state_transitions (
      patient_id,
      transition_date,
      from_cycle,
      to_cycle,
      from_health_state,
      to_health_state,
      from_gfr_category,
      to_gfr_category,
      from_albuminuria_category,
      to_albuminuria_category,
      from_risk_level,
      to_risk_level,
      change_type,
      egfr_change,
      uacr_change,
      egfr_trend,
      uacr_trend,
      category_changed,
      risk_increased,
      crossed_critical_threshold,
      alert_generated,
      alert_severity,
      from_egfr,
      to_egfr,
      from_uacr,
      to_uacr
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    RETURNING id
  `, [
    patientId,
    transitionDate,
    fromCycle,
    toCycle,
    fromState,
    toState,
    fromClassification.gfrCategory,
    toClassification.gfrCategory,
    fromClassification.albuminuriaCategory,
    toClassification.albuminuriaCategory,
    fromClassification.riskLevel,
    toClassification.riskLevel,
    comparison.changeType,
    (toEgfr - fromEgfr).toFixed(2),
    (toUacr - fromUacr).toFixed(2),
    toEgfr > fromEgfr ? 'improving' : (toEgfr < fromEgfr ? 'declining' : 'stable'),
    toUacr > fromUacr ? 'worsening' : (toUacr < fromUacr ? 'improving' : 'stable'),
    comparison.alertReason.includes('Category changed'),
    comparison.alertReason.includes('Risk level increased'),
    comparison.alertReason.includes('Critical threshold'),
    comparison.needsAlert,
    comparison.needsAlert ? (
      comparison.alertReason.some((r: string) => r.includes('Critical') || r.includes('below 30') || r.includes('below 15')) ? 'critical' :
      comparison.alertReason.some((r: string) => r.includes('Category') || r.includes('Risk level increased')) ? 'warning' : 'info'
    ) : null,
    fromEgfr,
    toEgfr,
    fromUacr,
    toUacr
  ]);

  const transitionId = transitionResult.rows[0].id;

  // Generate alert if needed
  if (comparison.needsAlert) {
    const severity: 'critical' | 'warning' | 'info' =
      comparison.alertReason.some((r: string) => r.includes('Critical') || r.includes('below 30') || r.includes('below 15')) ? 'critical' :
      comparison.alertReason.some((r: string) => r.includes('Category') || r.includes('Risk level increased')) ? 'warning' : 'info';

    const title = `Health State Transition: ${fromState} → ${toState}`;
    const message = `Patient transitioned from ${fromState} (${fromClassification.riskLevel} risk) to ${toState} (${toClassification.riskLevel} risk). ${comparison.alertReason.join('. ')}`;

    await pool.query(`
      INSERT INTO monitoring_alerts (
        patient_id,
        transition_id,
        alert_type,
        severity,
        priority,
        title,
        message,
        alert_reasons,
        current_health_state,
        previous_health_state,
        egfr_value,
        uacr_value,
        requires_action,
        status,
        generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
    `, [
      patientId,
      transitionId,
      'state_transition',
      severity,
      severity === 'critical' ? 1 : (severity === 'warning' ? 2 : 3),
      title,
      message,
      comparison.alertReason,
      toState,
      fromState,
      toEgfr,
      toUacr,
      severity === 'critical' || severity === 'warning',
      'active'
    ]);
  }
}

/**
 * Advance entire cohort by one cycle
 */
export async function advanceCohortCycle(): Promise<{
  new_cycle: number;
  patients_processed: number;
  transitions_detected: number;
  alerts_generated: number;
  treatment_changes: number;
}> {
  const pool = getPool();

  // Get current cycle
  const cycleResult = await pool.query('SELECT current_cycle FROM cycle_metadata WHERE id = 1');
  const currentCycle = cycleResult.rows[0].current_cycle;
  const nextCycle = currentCycle + 1;

  if (nextCycle > 24) {
    throw new Error('Maximum cycles (24) reached');
  }

  // Get all patients
  const patientsResult = await pool.query('SELECT id FROM patients');
  const patients = patientsResult.rows;

  let transitionsCount = 0;
  let alertsCount = 0;
  let treatmentChanges = 0;

  // Process each patient
  for (const patient of patients) {
    const result = await generateEnhancedCycle(patient.id, nextCycle);

    if (result.transition_detected) {
      transitionsCount++;
      if (result.transition_details?.alert_generated) {
        alertsCount++;
      }
    }

    // Check if treatment should be recommended
    if (result.classification.recommendRASInhibitor || result.classification.recommendSGLT2i) {
      const existingTreatments = await getActiveTreatments(patient.id);
      const hasRAS = existingTreatments.some(t => t.medication_class === 'RAS_INHIBITOR');
      const hasSGLT2 = existingTreatments.some(t => t.medication_class === 'SGLT2I');

      if (result.classification.recommendRASInhibitor && !hasRAS) {
        // Potentially start treatment (10% chance for simulation)
        if (Math.random() < 0.10) {
          await initiateRandomTreatment(patient.id, 'RAS_INHIBITOR', nextCycle);
          treatmentChanges++;
        }
      }

      if (result.classification.recommendSGLT2i && !hasSGLT2) {
        // Potentially start treatment (10% chance for simulation)
        if (Math.random() < 0.10) {
          await initiateRandomTreatment(patient.id, 'SGLT2I', nextCycle);
          treatmentChanges++;
        }
      }
    }

    // Simulate adherence changes for existing treatments (some patients improve/worsen adherence)
    await updateRandomAdherence(patient.id, nextCycle);
  }

  // Advance system cycle
  await pool.query(`
    UPDATE cycle_metadata
    SET current_cycle = $1, last_advance_date = NOW(), updated_at = NOW()
    WHERE id = 1
  `, [nextCycle]);

  return {
    new_cycle: nextCycle,
    patients_processed: patients.length,
    transitions_detected: transitionsCount,
    alerts_generated: alertsCount,
    treatment_changes: treatmentChanges
  };
}

/**
 * Initiate treatment for a patient (simulation)
 */
async function initiateRandomTreatment(
  patientId: string,
  medicationClass: string,
  cycle: number
): Promise<void> {
  const pool = getPool();

  const medications: { [key: string]: string[] } = {
    RAS_INHIBITOR: ['Lisinopril', 'Enalapril', 'Losartan', 'Valsartan'],
    SGLT2I: ['Empagliflozin', 'Dapagliflozin', 'Canagliflozin'],
    GLP1_RA: ['Semaglutide', 'Liraglutide', 'Dulaglutide']
  };

  const medicationName = medications[medicationClass][Math.floor(Math.random() * medications[medicationClass].length)];
  const baselineAdherence = 0.6 + Math.random() * 0.3; // 60-90% initial adherence

  const effect = TREATMENT_EFFECTS[medicationClass as keyof typeof TREATMENT_EFFECTS];
  const expectedEgfrBenefit = effect ? (effect.egfr_benefit_min + effect.egfr_benefit_max) / 2 : null;
  const expectedUacrReduction = effect ? (effect.uacr_reduction_min + effect.uacr_reduction_max) / 2 : null;

  await pool.query(`
    INSERT INTO patient_treatments (
      patient_id,
      medication_name,
      medication_class,
      started_cycle,
      started_date,
      status,
      baseline_adherence,
      current_adherence,
      expected_egfr_benefit,
      expected_uacr_reduction
    ) VALUES ($1, $2, $3, $4, NOW(), 'active', $5, $5, $6, $7)
  `, [patientId, medicationName, medicationClass, cycle, baselineAdherence, expectedEgfrBenefit, expectedUacrReduction]);
}

/**
 * Update adherence randomly (simulate real-world adherence changes)
 */
async function updateRandomAdherence(patientId: string, cycle: number): Promise<void> {
  const pool = getPool();

  const treatments = await getActiveTreatments(patientId);

  for (const treatment of treatments) {
    // 20% chance of adherence change
    if (Math.random() < 0.20) {
      // Small random walk in adherence (±5-15%)
      const change = (Math.random() - 0.5) * 0.30; // ±15%
      const newAdherence = Math.max(0.1, Math.min(1.0, treatment.current_adherence + change));

      await pool.query(`
        UPDATE patient_treatments
        SET current_adherence = $1, updated_at = NOW()
        WHERE id = $2
      `, [newAdherence, treatment.id]);
    }
  }
}
