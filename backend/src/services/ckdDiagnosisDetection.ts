/**
 * CKD Diagnosis Detection Service
 *
 * Detects when patients transition from at-risk to CKD diagnosis
 * and initiates early treatment protocols.
 */

import { query } from '../config/database';
import { PatientListItem } from '../types/patient';

export interface DiagnosisDetectionResult {
  newly_diagnosed: boolean;
  diagnosis_event_id: string | null;
  requires_confirmation: boolean;
  treatment_protocol_recommended: boolean;
}

export interface CKDDiagnosisEvent {
  id: string;
  patient_id: string;
  diagnosis_date: string;
  ckd_stage_at_diagnosis: string;
  egfr_at_diagnosis: number;
  previous_ckd_status: string;
  previous_risk_level: string;
  detection_trigger: string;
  doctor_notified: boolean;
  diagnosis_confirmed: boolean;
}

export interface TreatmentProtocol {
  id: string;
  patient_id: string;
  protocol_name: string;
  protocol_type: string;
  ckd_stage: string;
  status: string;
  medication_orders: any;
  lab_monitoring_schedule: any;
  referrals: any;
  lifestyle_modifications: any;
}

export interface DoctorAction {
  id: string;
  patient_id: string;
  action_type: string;
  priority: string;
  action_title: string;
  action_description: string;
  recommended_action: string;
  status: string;
  due_date: string;
}

/**
 * Check if patient meets CKD diagnostic criteria and detect new diagnoses
 */
export async function detectCKDDiagnosisOnset(
  patient: PatientListItem,
  previousEGFR?: number
): Promise<DiagnosisDetectionResult> {
  const currentEGFR = patient.latest_observations?.eGFR || 0;
  const uACR = patient.latest_observations?.uACR || 0;

  // Determine CKD stage
  let currentStage = 1;
  if (currentEGFR < 15) currentStage = 5;
  else if (currentEGFR < 30) currentStage = 4;
  else if (currentEGFR < 45) currentStage = 3;
  else if (currentEGFR < 60) currentStage = 3;
  else if (currentEGFR < 90 && uACR > 30) currentStage = 2;

  try {
    const result = await query(
      `SELECT * FROM detect_ckd_diagnosis_onset($1, $2, $3, $4, $5)`,
      [
        patient.id,
        currentEGFR,
        currentStage,
        uACR,
        previousEGFR || null
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[CKD Diagnosis Detection] Error detecting diagnosis onset:', error);
    throw error;
  }
}

/**
 * Process newly detected CKD diagnosis
 * Creates doctor actions and treatment protocols
 */
export async function processNewCKDDiagnosis(
  patient: PatientListItem,
  diagnosisEventId: string
): Promise<{
  confirmationAction: DoctorAction;
  treatmentProtocol: TreatmentProtocol;
  treatmentApprovalAction: DoctorAction;
}> {
  console.log(`[CKD Diagnosis] Processing new CKD diagnosis for patient ${patient.medical_record_number}`);

  const currentEGFR = patient.latest_observations?.eGFR || 0;
  const uACR = patient.latest_observations?.uACR || 0;

  // Determine CKD stage
  let ckdStage = '2';
  if (currentEGFR < 15) ckdStage = '5';
  else if (currentEGFR < 30) ckdStage = '4';
  else if (currentEGFR < 45) ckdStage = '3b';
  else if (currentEGFR < 60) ckdStage = '3a';
  else if (currentEGFR < 90 && uACR > 30) ckdStage = '2';

  // Build clinical summary
  const clinicalSummary = {
    current_egfr: currentEGFR,
    uacr: uACR,
    ckd_stage: ckdStage,
    age: patient.age,
    comorbidities: {
      diabetes: patient.has_diabetes,
      hypertension: patient.has_hypertension,
      cvd: patient.cvd_history
    },
    current_medications: {
      ras_inhibitor: patient.on_ras_inhibitor,
      sglt2i: patient.on_sglt2i
    },
    risk_factors: {
      smoking: patient.smoking_status === 'Current',
      nephrotoxic_meds: patient.nephrotoxic_meds
    }
  };

  try {
    // Step 1: Create doctor action for diagnosis confirmation
    const confirmationResult = await query(
      `SELECT create_ckd_diagnosis_action($1, $2, $3, $4, $5) as action_id`,
      [
        patient.id,
        diagnosisEventId,
        'confirm_ckd_diagnosis',
        'HIGH',
        JSON.stringify(clinicalSummary)
      ]
    );

    const confirmationActionId = confirmationResult.rows[0].action_id;

    // Step 2: Generate early treatment protocol
    const protocolResult = await query(
      `SELECT generate_early_treatment_protocol($1, $2, $3, $4) as protocol_id`,
      [
        patient.id,
        diagnosisEventId,
        ckdStage,
        currentEGFR
      ]
    );

    const protocolId = protocolResult.rows[0].protocol_id;

    // Step 3: Create doctor action for treatment approval
    const treatmentActionResult = await query(
      `SELECT create_ckd_diagnosis_action($1, $2, $3, $4, $5) as action_id`,
      [
        patient.id,
        diagnosisEventId,
        'approve_treatment',
        'HIGH',
        JSON.stringify(clinicalSummary)
      ]
    );

    const treatmentActionId = treatmentActionResult.rows[0].action_id;

    // Step 4: Link treatment protocol to action
    await query(
      `UPDATE doctor_action_queue SET treatment_protocol_id = $1 WHERE id = $2`,
      [protocolId, treatmentActionId]
    );

    // Step 5: Send notification to doctor
    await createCKDDiagnosisNotification(patient, diagnosisEventId, confirmationActionId);

    // Fetch created entities
    const confirmationAction = await getDoctorAction(confirmationActionId);
    const treatmentProtocol = await getTreatmentProtocol(protocolId);
    const treatmentApprovalAction = await getDoctorAction(treatmentActionId);

    console.log(`[CKD Diagnosis] ✓ Diagnosis workflow created:`);
    console.log(`  - Confirmation action: ${confirmationActionId}`);
    console.log(`  - Treatment protocol: ${protocolId}`);
    console.log(`  - Approval action: ${treatmentActionId}`);

    return {
      confirmationAction,
      treatmentProtocol,
      treatmentApprovalAction
    };
  } catch (error) {
    console.error('[CKD Diagnosis] Error processing new diagnosis:', error);
    throw error;
  }
}

/**
 * Create notification for CKD diagnosis detection
 */
async function createCKDDiagnosisNotification(
  patient: PatientListItem,
  diagnosisEventId: string,
  actionId: string
): Promise<void> {
  const currentEGFR = patient.latest_observations?.eGFR || 0;
  const uACR = patient.latest_observations?.uACR || 0;

  let ckdStage = '2';
  if (currentEGFR < 15) ckdStage = '5';
  else if (currentEGFR < 30) ckdStage = '4';
  else if (currentEGFR < 45) ckdStage = '3b';
  else if (currentEGFR < 60) ckdStage = '3a';
  else if (currentEGFR < 90 && uACR > 30) ckdStage = '2';

  const subject = `⚠️ NEW: CKD Diagnosis Detected - ${patient.full_name} (Stage ${ckdStage})`;

  const message = `
CKD DIAGNOSIS DETECTION ALERT

Patient: ${patient.full_name}
MRN: ${patient.medical_record_number}
Age: ${patient.age} | Gender: ${patient.gender}

═══════════════════════════════════════════════════════
DIAGNOSTIC CRITERIA MET - CKD STAGE ${ckdStage}
═══════════════════════════════════════════════════════

Current Clinical Status:
  • eGFR: ${currentEGFR.toFixed(1)} mL/min/1.73m²
  • Urine ACR: ${uACR.toFixed(0)} mg/g
  • CKD Stage: ${ckdStage}

${currentEGFR < 60 ? '✓ eGFR < 60 mL/min/1.73m² (persistent kidney function decline)' : ''}
${currentEGFR >= 60 && uACR > 30 ? '✓ eGFR 60-89 with significant proteinuria (uACR >30)' : ''}

Previous Status: ${patient.current_risk_priority || 'At Risk'}

Comorbidities:
${patient.has_diabetes ? '  • Diabetes Mellitus' : ''}
${patient.has_hypertension ? '  • Hypertension' : ''}
${patient.cvd_history ? '  • Cardiovascular Disease' : ''}

Risk Factors:
${patient.smoking_status === 'Current' ? '  • Active Smoking' : ''}
${patient.nephrotoxic_meds ? '  • Nephrotoxic Medications' : ''}

═══════════════════════════════════════════════════════
REQUIRED ACTIONS
═══════════════════════════════════════════════════════

1. CONFIRM CKD DIAGNOSIS
   Review patient clinical data and confirm diagnosis
   → Action required in Doctor Action Queue

2. APPROVE EARLY TREATMENT PROTOCOL
   Evidence-based early CKD management protocol generated
   → Includes: RAS inhibitor, SGLT2i, BP control, lifestyle modifications
   → Action required in Doctor Action Queue

═══════════════════════════════════════════════════════
EARLY TREATMENT BENEFITS
═══════════════════════════════════════════════════════

Early intervention in Stage ${ckdStage} CKD can:
  • Slow disease progression by 30-50%
  • Delay dialysis need by 2-5 years
  • Reduce cardiovascular events by 20-30%
  • Improve quality of life

TIME-SENSITIVE: Early treatment initiation is critical for best outcomes.

═══════════════════════════════════════════════════════

View full details and take action in the CKD Diagnosis Queue.

This is an automated alert from the CKD Diagnosis Detection System.
  `.trim();

  await query(
    `SELECT create_doctor_notification($1, NULL, $2, $3, $4, $5, NULL, NULL, $6, $7)`,
    [
      patient.id,
      'ckd_diagnosis_detected',
      'HIGH',
      subject,
      message,
      JSON.stringify({
        diagnosis_event_id: diagnosisEventId,
        action_id: actionId,
        ckd_stage: ckdStage,
        egfr: currentEGFR,
        detection_type: 'automatic'
      }),
      'doctor@hospital.com'
    ]
  );

  // Update diagnosis event as notified
  await query(
    `UPDATE ckd_diagnosis_events
     SET doctor_notified = true, doctor_notification_sent_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [diagnosisEventId]
  );
}

/**
 * Get doctor action by ID
 */
async function getDoctorAction(actionId: string): Promise<DoctorAction> {
  const result = await query(
    `SELECT * FROM doctor_action_queue WHERE id = $1`,
    [actionId]
  );
  return result.rows[0];
}

/**
 * Get treatment protocol by ID
 */
async function getTreatmentProtocol(protocolId: string): Promise<TreatmentProtocol> {
  const result = await query(
    `SELECT * FROM ckd_treatment_protocols WHERE id = $1`,
    [protocolId]
  );
  return result.rows[0];
}

/**
 * Approve treatment protocol
 */
export async function approveTreatmentProtocol(
  protocolId: string,
  approvedBy: string,
  notes?: string
): Promise<void> {
  await query(
    `UPDATE ckd_treatment_protocols
     SET
       status = 'approved',
       treatment_approved = true,
       treatment_approved_by = $2,
       treatment_approved_at = CURRENT_TIMESTAMP,
       approval_notes = $3,
       initiated_date = CURRENT_TIMESTAMP,
       initiated_by = $2
     WHERE id = $1`,
    [protocolId, approvedBy, notes || '']
  );

  // Update patient record
  await query(
    `UPDATE patients
     SET
       on_early_treatment_protocol = true,
       treatment_protocol_start_date = CURRENT_DATE
     WHERE id = (SELECT patient_id FROM ckd_treatment_protocols WHERE id = $1)`,
    [protocolId]
  );

  console.log(`[CKD Diagnosis] Treatment protocol ${protocolId} approved by ${approvedBy}`);
}

/**
 * Confirm CKD diagnosis
 */
export async function confirmCKDDiagnosis(
  diagnosisEventId: string,
  confirmedBy: string,
  notes?: string
): Promise<void> {
  await query(
    `UPDATE ckd_diagnosis_events
     SET
       diagnosis_confirmed = true,
       diagnosis_confirmed_by = $2,
       diagnosis_confirmed_at = CURRENT_TIMESTAMP,
       clinical_notes = $3
     WHERE id = $1`,
    [diagnosisEventId, confirmedBy, notes || '']
  );

  // Update patient record
  await query(
    `UPDATE patients
     SET ckd_diagnosis_confirmed = true
     WHERE id = (SELECT patient_id FROM ckd_diagnosis_events WHERE id = $1)`,
    [diagnosisEventId]
  );

  console.log(`[CKD Diagnosis] Diagnosis ${diagnosisEventId} confirmed by ${confirmedBy}`);
}

/**
 * Get pending doctor actions
 */
export async function getPendingDoctorActions(
  actionType?: string,
  priority?: string
): Promise<DoctorAction[]> {
  let sql = `
    SELECT
      daq.*,
      p.first_name,
      p.last_name,
      p.medical_record_number,
      p.age,
      p.gender
    FROM doctor_action_queue daq
    JOIN patients p ON daq.patient_id = p.id
    WHERE daq.status = 'pending'
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (actionType) {
    sql += ` AND daq.action_type = $${paramIndex}`;
    params.push(actionType);
    paramIndex++;
  }

  if (priority) {
    sql += ` AND daq.priority = $${paramIndex}`;
    params.push(priority);
  }

  sql += ` ORDER BY
    CASE daq.priority
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'MODERATE' THEN 3
      ELSE 4
    END,
    daq.created_at ASC
  `;

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Complete doctor action
 */
export async function completeDoctorAction(
  actionId: string,
  completedBy: string,
  notes?: string,
  approved: boolean = true
): Promise<void> {
  await query(
    `UPDATE doctor_action_queue
     SET
       status = $2,
       completed_at = CURRENT_TIMESTAMP,
       completed_by = $3,
       completion_notes = $4
     WHERE id = $1`,
    [actionId, approved ? 'completed' : 'declined', completedBy, notes || '']
  );

  console.log(`[CKD Diagnosis] Action ${actionId} ${approved ? 'completed' : 'declined'} by ${completedBy}`);
}

/**
 * Get CKD diagnosis events for a patient
 */
export async function getPatientDiagnosisHistory(patientId: string): Promise<CKDDiagnosisEvent[]> {
  const result = await query(
    `SELECT * FROM ckd_diagnosis_events
     WHERE patient_id = $1
     ORDER BY diagnosis_date DESC`,
    [patientId]
  );
  return result.rows;
}

/**
 * Get treatment protocols for a patient
 */
export async function getPatientTreatmentProtocols(patientId: string): Promise<TreatmentProtocol[]> {
  const result = await query(
    `SELECT * FROM ckd_treatment_protocols
     WHERE patient_id = $1
     ORDER BY created_at DESC`,
    [patientId]
  );
  return result.rows;
}
