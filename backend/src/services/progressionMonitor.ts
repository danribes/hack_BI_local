/**
 * CKD Progression Monitoring Service
 *
 * AI-powered monitoring system that:
 * - Analyzes state transitions
 * - Generates alerts for significant changes
 * - Creates action recommendations based on KDIGO guidelines
 */

import { getPool } from '../config/database';
import { classifyKDIGOHealthState, compareHealthStates, KDIGOClassification } from './kdigoClassifier';

interface StateTransition {
  id: string;
  patient_id: string;
  transition_date: Date;
  from_health_state: string;
  to_health_state: string;
  from_egfr: number;
  to_egfr: number;
  from_uacr: number | null;
  to_uacr: number | null;
  change_type: 'improved' | 'worsened' | 'stable';
  alert_generated: boolean;
  alert_severity: 'info' | 'warning' | 'critical';
  crossed_critical_threshold: boolean;
}

interface PatientInfo {
  medical_record_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
}

/**
 * Generate monitoring alerts for state transitions
 */
export async function generateMonitoringAlerts(): Promise<{
  alertsGenerated: number;
  criticalAlerts: number;
  warningAlerts: number;
}> {
  const pool = getPool();

  try {
    // Get all transitions that need alerts but don't have them yet
    const transitionsResult = await pool.query<StateTransition & PatientInfo>(`
      SELECT
        t.*,
        p.medical_record_number,
        p.first_name,
        p.last_name,
        p.date_of_birth
      FROM state_transitions t
      JOIN patients p ON t.patient_id = p.id
      WHERE t.alert_generated = true
      AND NOT EXISTS (
        SELECT 1 FROM monitoring_alerts ma
        WHERE ma.transition_id = t.id
      )
      ORDER BY t.alert_severity DESC, t.transition_date DESC
    `);

    const transitions = transitionsResult.rows;
    let criticalCount = 0;
    let warningCount = 0;

    for (const transition of transitions) {
      const alert = generateAlertForTransition(transition);

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
          status,
          requires_action,
          generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      `, [
        transition.patient_id,
        transition.id,
        alert.type,
        alert.severity,
        alert.priority,
        alert.title,
        alert.message,
        alert.reasons,
        transition.to_health_state,
        transition.from_health_state,
        transition.to_egfr,
        transition.to_uacr,
        'active',
        alert.requiresAction
      ]);

      if (alert.severity === 'critical') criticalCount++;
      if (alert.severity === 'warning') warningCount++;
    }

    return {
      alertsGenerated: transitions.length,
      criticalAlerts: criticalCount,
      warningAlerts: warningCount
    };

  } catch (error) {
    console.error('[Progression Monitor] Error generating alerts:', error);
    throw error;
  }
}

/**
 * Generate alert details for a specific transition
 */
function generateAlertForTransition(transition: StateTransition & PatientInfo): {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  priority: number;
  title: string;
  message: string;
  reasons: string[];
  requiresAction: boolean;
} {
  const reasons: string[] = [];
  let severity: 'info' | 'warning' | 'critical' = 'info';
  let priority = 3;
  let requiresAction = false;

  // Analyze the transition
  const patientName = `${transition.first_name} ${transition.last_name}`;
  const mrn = transition.medical_record_number;

  // Critical alerts
  if (transition.to_egfr < 15 && transition.from_egfr >= 15) {
    severity = 'critical';
    priority = 1;
    requiresAction = true;
    reasons.push('eGFR dropped below 15 mL/min - Kidney failure (Stage 5 CKD)');
    reasons.push('URGENT: Dialysis planning required immediately');
  } else if (transition.to_egfr < 30 && transition.from_egfr >= 30) {
    severity = 'critical';
    priority = 1;
    requiresAction = true;
    reasons.push('eGFR dropped below 30 mL/min - Stage 4 CKD');
    reasons.push('Mandatory nephrology referral required');
  } else if (transition.to_uacr && transition.to_uacr > 300 && (!transition.from_uacr || transition.from_uacr <= 300)) {
    severity = 'critical';
    priority = 1;
    requiresAction = true;
    reasons.push('uACR exceeded 300 mg/g - Severe albuminuria (A3)');
    reasons.push('High risk of rapid CKD progression');
  }

  // Warning alerts
  if (transition.from_health_state !== transition.to_health_state && severity !== 'critical') {
    severity = 'warning';
    priority = 2;
    requiresAction = true;
    reasons.push(`Health state changed: ${transition.from_health_state} → ${transition.to_health_state}`);
  }

  if (transition.change_type === 'worsened' && severity === 'info') {
    severity = 'warning';
    priority = 2;
    requiresAction = true;
    reasons.push('Kidney function declining');
  }

  // eGFR decline rate
  const egfrChange = transition.to_egfr - transition.from_egfr;
  if (egfrChange < -5) {
    reasons.push(`eGFR declined by ${Math.abs(egfrChange).toFixed(1)} mL/min`);
    if (egfrChange < -10) {
      severity = severity === 'info' ? 'warning' : severity;
      priority = Math.min(priority, 2);
      requiresAction = true;
    }
  }

  // uACR increase
  if (transition.to_uacr && transition.from_uacr) {
    const uacrChange = transition.to_uacr - transition.from_uacr;
    if (uacrChange > 50) {
      reasons.push(`uACR increased by ${uacrChange.toFixed(1)} mg/g`);
      if (uacrChange > 100) {
        severity = severity === 'info' ? 'warning' : severity;
        priority = Math.min(priority, 2);
        requiresAction = true;
      }
    }
  }

  // Crossed into A2 (microalbuminuria)
  if (transition.to_uacr && transition.to_uacr >= 30 && transition.to_uacr <= 300 &&
      (!transition.from_uacr || transition.from_uacr < 30)) {
    reasons.push('Developed microalbuminuria (A2) - initiate RAS inhibitor therapy');
    requiresAction = true;
  }

  // Generate title
  let title = '';
  if (severity === 'critical') {
    title = `🚨 CRITICAL: ${patientName} (${mrn}) - Urgent Action Required`;
  } else if (severity === 'warning') {
    title = `⚠️ WARNING: ${patientName} (${mrn}) - Kidney Function Declining`;
  } else {
    title = `ℹ️ INFO: ${patientName} (${mrn}) - Status Update`;
  }

  // Generate message
  const message = generateAlertMessage(transition, reasons, severity);

  return {
    type: determineAlertType(transition),
    severity,
    priority,
    title,
    message,
    reasons,
    requiresAction
  };
}

/**
 * Determine alert type based on transition characteristics
 */
function determineAlertType(transition: StateTransition): string {
  if (transition.to_egfr < 15) return 'kidney_failure';
  if (transition.to_egfr < 30 && transition.from_egfr >= 30) return 'stage_4_ckd';
  if (transition.crossed_critical_threshold) return 'threshold_crossed';
  if (transition.change_type === 'worsened') return 'declining_function';
  if (transition.from_health_state !== transition.to_health_state) return 'state_change';
  return 'status_update';
}

/**
 * Generate detailed alert message
 */
function generateAlertMessage(
  transition: StateTransition & PatientInfo,
  reasons: string[],
  severity: 'info' | 'warning' | 'critical'
): string {
  const age = calculateAge(transition.date_of_birth);
  const patientName = `${transition.first_name} ${transition.last_name}`;

  let message = `Patient: ${patientName} (${transition.medical_record_number})\n`;
  message += `Age: ${age} years\n\n`;

  message += `KIDNEY FUNCTION STATUS:\n`;
  message += `• Current eGFR: ${transition.to_egfr.toFixed(1)} mL/min/1.73m²\n`;
  message += `• Previous eGFR: ${transition.from_egfr.toFixed(1)} mL/min/1.73m²\n`;
  message += `• Change: ${(transition.to_egfr - transition.from_egfr).toFixed(1)} mL/min/1.73m²\n\n`;

  if (transition.to_uacr !== null && transition.from_uacr !== null) {
    message += `ALBUMINURIA STATUS:\n`;
    message += `• Current uACR: ${transition.to_uacr.toFixed(1)} mg/g\n`;
    message += `• Previous uACR: ${transition.from_uacr.toFixed(1)} mg/g\n`;
    message += `• Change: ${(transition.to_uacr - transition.from_uacr).toFixed(1)} mg/g\n\n`;
  }

  message += `KDIGO CLASSIFICATION:\n`;
  message += `• From: ${transition.from_health_state}\n`;
  message += `• To: ${transition.to_health_state}\n`;
  message += `• Trend: ${transition.change_type.toUpperCase()}\n\n`;

  if (reasons.length > 0) {
    message += `ALERT REASONS:\n`;
    reasons.forEach(reason => {
      message += `• ${reason}\n`;
    });
    message += `\n`;
  }

  if (severity === 'critical') {
    message += `⚠️ IMMEDIATE ACTION REQUIRED\n`;
    message += `This patient requires urgent clinical review and intervention.\n`;
  } else if (severity === 'warning') {
    message += `⚠️ CLINICAL REVIEW RECOMMENDED\n`;
    message += `Please evaluate this patient at next available appointment.\n`;
  }

  return message;
}

/**
 * Generate action recommendations for a transition
 */
export async function generateActionRecommendations(
  transitionId: string
): Promise<void> {
  const pool = getPool();

  try {
    // Get transition details
    const transitionResult = await pool.query<StateTransition & PatientInfo>(`
      SELECT
        t.*,
        p.medical_record_number,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.on_ras_inhibitor,
        p.on_sglt2i
      FROM state_transitions t
      JOIN patients p ON t.patient_id = p.id
      WHERE t.id = $1
    `, [transitionId]);

    if (transitionResult.rows.length === 0) return;

    const transition = transitionResult.rows[0];

    // Get alert ID if exists
    const alertResult = await pool.query(`
      SELECT id FROM monitoring_alerts
      WHERE transition_id = $1
      LIMIT 1
    `, [transitionId]);

    const alertId = alertResult.rows.length > 0 ? alertResult.rows[0].id : null;

    // Classify current state
    const currentState = classifyKDIGOHealthState(transition.to_egfr, transition.to_uacr);

    // Generate recommendations based on KDIGO guidelines
    const recommendations = buildRecommendations(transition, currentState);

    // Insert recommendations into database
    for (const rec of recommendations) {
      await pool.query(`
        INSERT INTO action_recommendations (
          patient_id,
          alert_id,
          transition_id,
          recommendation_type,
          category,
          title,
          description,
          rationale,
          priority,
          urgency,
          timeframe,
          based_on_health_state,
          based_on_risk_level,
          triggered_by,
          action_items,
          status,
          generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      `, [
        transition.patient_id,
        alertId,
        transitionId,
        rec.type,
        rec.category,
        rec.title,
        rec.description,
        rec.rationale,
        rec.priority,
        rec.urgency,
        rec.timeframe,
        currentState.healthState,
        currentState.riskLevel,
        rec.triggeredBy,
        JSON.stringify(rec.actionItems),
        'pending'
      ]);
    }

  } catch (error) {
    console.error('[Progression Monitor] Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Build recommendations based on KDIGO guidelines
 */
function buildRecommendations(
  transition: StateTransition & { on_ras_inhibitor: boolean; on_sglt2i: boolean },
  currentState: KDIGOClassification
): Array<{
  type: string;
  category: string;
  title: string;
  description: string;
  rationale: string;
  priority: number;
  urgency: string;
  timeframe: string;
  triggeredBy: string[];
  actionItems: any;
}> {
  const recommendations: any[] = [];

  // 1. Nephrology Referral
  if (currentState.requiresNephrologyReferral) {
    recommendations.push({
      type: 'referral',
      category: 'specialist_referral',
      title: 'Nephrology Referral Required',
      description: 'Refer patient to nephrology for specialized CKD management',
      rationale: `Patient's current state (${currentState.healthState}) requires nephrology expertise. KDIGO guidelines recommend specialist involvement for ${currentState.gfrCategory} and/or ${currentState.albuminuriaCategory}.`,
      priority: currentState.ckdStage && currentState.ckdStage >= 4 ? 1 : 2,
      urgency: currentState.ckdStage && currentState.ckdStage >= 4 ? 'urgent' : 'semi_urgent',
      timeframe: currentState.ckdStage && currentState.ckdStage >= 4 ? 'Within 2 weeks' : 'Within 1-2 months',
      triggeredBy: [`eGFR ${transition.to_egfr.toFixed(1)} mL/min`, currentState.healthState],
      actionItems: {
        referrals: ['nephrology'],
        urgency_level: currentState.ckdStage && currentState.ckdStage >= 4 ? 'urgent' : 'routine'
      }
    });
  }

  // 2. uACR Monitoring
  if (!transition.to_uacr && currentState.gfrCategory !== 'G1') {
    recommendations.push({
      type: 'monitoring',
      category: 'lab_monitoring',
      title: 'Initiate uACR Monitoring',
      description: 'Begin monitoring urine albumin-to-creatinine ratio',
      rationale: 'uACR measurement is essential for accurate KDIGO classification and risk stratification. Patient currently has reduced eGFR but no albuminuria data.',
      priority: 2,
      urgency: 'semi_urgent',
      timeframe: 'At next visit',
      triggeredBy: ['Missing uACR measurement', currentState.gfrCategory],
      actionItems: {
        lab_tests: ['uACR', 'urinalysis'],
        frequency: 'Every 3-6 months initially'
      }
    });
  }

  // 3. RAS Inhibitor Therapy
  if (currentState.recommendRASInhibitor && !transition.on_ras_inhibitor) {
    recommendations.push({
      type: 'treatment',
      category: 'medication',
      title: 'Initiate RAS Inhibitor Therapy',
      description: 'Start ACE inhibitor or ARB for kidney protection',
      rationale: `Patient has ${currentState.albuminuriaCategory} (uACR ${transition.to_uacr?.toFixed(1)} mg/g). KDIGO guidelines strongly recommend RAS inhibition for albuminuria ≥30 mg/g to slow CKD progression.`,
      priority: transition.to_uacr && transition.to_uacr > 300 ? 1 : 2,
      urgency: transition.to_uacr && transition.to_uacr > 300 ? 'urgent' : 'semi_urgent',
      timeframe: 'Within 1-2 weeks',
      triggeredBy: [`uACR ${transition.to_uacr?.toFixed(1)} mg/g`, currentState.albuminuriaCategory],
      actionItems: {
        medications: {
          start: ['ACE inhibitor (e.g., lisinopril)', 'ARB (e.g., losartan) - if ACE-I not tolerated'],
          monitoring: ['Serum creatinine', 'potassium', 'blood pressure']
        },
        target_bp: currentState.targetBP
      }
    });
  }

  // 4. SGLT2 Inhibitor
  if (currentState.recommendSGLT2i && !transition.on_sglt2i) {
    recommendations.push({
      type: 'treatment',
      category: 'medication',
      title: 'Consider SGLT2 Inhibitor Therapy',
      description: 'Add SGLT2 inhibitor for additional kidney protection',
      rationale: `SGLT2 inhibitors (e.g., empagliflozin, dapagliflozin) provide significant kidney protection in CKD patients. Recommended for eGFR ≥20 with albuminuria.`,
      priority: 2,
      urgency: 'routine',
      timeframe: 'Within 1-3 months',
      triggeredBy: [currentState.healthState, 'Albuminuria present'],
      actionItems: {
        medications: {
          start: ['SGLT2 inhibitor (empagliflozin 10mg or dapagliflozin 10mg)'],
          contraindications_check: ['eGFR <20', 'Type 1 diabetes', 'DKA risk']
        }
      }
    });
  }

  // 5. Increased Monitoring Frequency
  if (transition.change_type === 'worsened') {
    recommendations.push({
      type: 'monitoring',
      category: 'lab_monitoring',
      title: `Increase Monitoring Frequency to ${currentState.monitoringFrequency}`,
      description: 'More frequent lab monitoring due to declining kidney function',
      rationale: `Patient's kidney function is declining (eGFR change: ${(transition.to_egfr - transition.from_egfr).toFixed(1)} mL/min). KDIGO recommends ${currentState.monitoringFrequency} monitoring for ${currentState.riskLevel} risk patients.`,
      priority: 3,
      urgency: 'routine',
      timeframe: currentState.monitoringFrequency,
      triggeredBy: [transition.change_type, currentState.riskLevel],
      actionItems: {
        lab_tests: ['eGFR', 'serum creatinine', 'uACR'],
        frequency: currentState.monitoringFrequency
      }
    });
  }

  // 6. Dialysis Planning (G4-G5)
  if (currentState.requiresDialysisPlanning) {
    recommendations.push({
      type: 'referral',
      category: 'dialysis_planning',
      title: 'Initiate Dialysis Access Planning',
      description: 'Begin planning for renal replacement therapy',
      rationale: `Patient has advanced CKD (Stage ${currentState.ckdStage}). Dialysis access creation should begin before it's urgently needed.`,
      priority: 1,
      urgency: 'urgent',
      timeframe: 'Immediate',
      triggeredBy: [`eGFR ${transition.to_egfr.toFixed(1)} mL/min`, `CKD Stage ${currentState.ckdStage}`],
      actionItems: {
        referrals: ['vascular surgery - AV fistula evaluation', 'transplant center'],
        education: ['Dialysis options', 'transplant evaluation'],
        social_work: ['Financial counseling', 'transportation planning']
      }
    });
  }

  return recommendations;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Run full monitoring cycle - detect transitions, generate alerts, create recommendations
 */
export async function runProgressionMonitoring(): Promise<{
  alertsGenerated: number;
  criticalAlerts: number;
  warningAlerts: number;
  recommendationsGenerated: number;
}> {
  console.log('[Progression Monitor] Starting monitoring cycle...');

  // Generate alerts for all transitions
  const alertStats = await generateMonitoringAlerts();

  console.log(`[Progression Monitor] Generated ${alertStats.alertsGenerated} alerts (${alertStats.criticalAlerts} critical, ${alertStats.warningAlerts} warnings)`);

  // Generate recommendations for transitions that need them
  const pool = getPool();
  const transitionsResult = await pool.query<{ id: string }>(`
    SELECT id FROM state_transitions
    WHERE alert_generated = true
    AND NOT EXISTS (
      SELECT 1 FROM action_recommendations ar
      WHERE ar.transition_id = state_transitions.id
    )
  `);

  let recommendationsCount = 0;
  for (const transition of transitionsResult.rows) {
    await generateActionRecommendations(transition.id);
    recommendationsCount++;
  }

  console.log(`[Progression Monitor] Generated ${recommendationsCount} action recommendations`);

  return {
    ...alertStats,
    recommendationsGenerated: recommendationsCount
  };
}
