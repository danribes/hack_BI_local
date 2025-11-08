/**
 * Patient Service
 *
 * Service layer for patient data operations.
 * Handles fetching patient demographics, observations, conditions, and risk assessments.
 * Implements three-tier CKD risk stratification protocol.
 */

import { query } from '../config/database';
import {
  Patient,
  PatientWithAge,
  PatientSummary,
  PatientListItem,
  Observation,
  Condition,
  RiskAssessment,
  LatestObservations,
  RiskTier,
  CKDStage,
  PatientQueryParams
} from '../types/patient';

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
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
 * Add computed fields to patient
 */
function enrichPatient(patient: Patient): PatientWithAge {
  return {
    ...patient,
    age: calculateAge(patient.date_of_birth),
    full_name: `${patient.first_name} ${patient.last_name}`
  };
}

/**
 * Get latest observation value by type
 */
function getLatestObservationValue(observations: Observation[], type: string): number | undefined {
  const filtered = observations
    .filter(obs => obs.observation_type === type && obs.value_numeric !== null)
    .sort((a, b) => new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime());

  return filtered.length > 0 ? filtered[0].value_numeric : undefined;
}

/**
 * Get latest blood pressure reading
 */
function getLatestBloodPressure(observations: Observation[]): LatestObservations['blood_pressure'] | undefined {
  const systolic = getLatestObservationValue(observations, 'blood_pressure_systolic');
  const diastolic = getLatestObservationValue(observations, 'blood_pressure_diastolic');

  if (systolic !== undefined && diastolic !== undefined) {
    return {
      systolic,
      diastolic,
      reading: `${systolic}/${diastolic}`
    };
  }

  return undefined;
}

/**
 * Extract latest observations for key CKD parameters
 */
function extractLatestObservations(observations: Observation[]): LatestObservations {
  return {
    eGFR: getLatestObservationValue(observations, 'eGFR'),
    uACR: getLatestObservationValue(observations, 'uACR'),
    HbA1c: getLatestObservationValue(observations, 'HbA1c'),
    blood_pressure: getLatestBloodPressure(observations),
    BMI: getLatestObservationValue(observations, 'BMI')
  };
}

/**
 * Check if patient has diabetes
 * ICD-10 codes E10-E14 (all diabetes types)
 */
function hasDiabetes(conditions: Condition[]): boolean {
  return conditions.some(condition =>
    condition.clinical_status === 'active' &&
    (
      condition.condition_code.startsWith('E10') ||  // Type 1 diabetes
      condition.condition_code.startsWith('E11') ||  // Type 2 diabetes
      condition.condition_code.startsWith('E12') ||  // Malnutrition-related diabetes
      condition.condition_code.startsWith('E13') ||  // Other specified diabetes
      condition.condition_code.startsWith('E14')     // Unspecified diabetes
    )
  );
}

/**
 * Check if patient has hypertension
 * ICD-10 code I10 (Essential Hypertension)
 */
function hasHypertension(conditions: Condition[]): boolean {
  return conditions.some(condition =>
    condition.clinical_status === 'active' &&
    (
      condition.condition_code === 'I10' ||         // Essential hypertension
      condition.condition_code.startsWith('I11') || // Hypertensive heart disease
      condition.condition_code.startsWith('I12') || // Hypertensive chronic kidney disease
      condition.condition_code.startsWith('I13') || // Hypertensive heart and chronic kidney disease
      condition.condition_code.startsWith('I15')    // Secondary hypertension
    )
  );
}

/**
 * Determine CKD stage from eGFR
 * Based on KDIGO CKD classification
 */
function determineCKDStage(eGFR: number | undefined): CKDStage | undefined {
  if (eGFR === undefined) return undefined;

  if (eGFR >= 90) return '1';        // Normal or high
  if (eGFR >= 60) return '2';        // Mildly decreased
  if (eGFR >= 45) return '3a';       // Mild to moderate decrease
  if (eGFR >= 30) return '3b';       // Moderate to severe decrease
  if (eGFR >= 15) return '4';        // Severe decrease
  return '5';                        // Kidney failure
}

/**
 * Calculate CKD Risk Tier (Three-Tier Stratification Protocol)
 *
 * Tier 1 (Low Risk): No diabetes/hypertension, eGFR >= 60, uACR < 30
 * Tier 2 (Moderate Risk): One risk factor (diabetes OR hypertension), regular monitoring needed
 * Tier 3 (High Risk): Both diabetes AND hypertension, OR abnormal labs (eGFR < 60 or uACR >= 30)
 */
function calculateRiskTier(
  diabetes: boolean,
  hypertension: boolean,
  eGFR: number | undefined,
  uACR: number | undefined
): RiskTier {
  // Check for abnormal lab values (Very High Risk / Confirmed CKD)
  const abnormalEGFR = eGFR !== undefined && eGFR < 60;
  const abnormalUACR = uACR !== undefined && uACR >= 30;

  // Tier 3 (High Risk): Both risk factors OR abnormal labs
  if ((diabetes && hypertension) || abnormalEGFR || abnormalUACR) {
    return 3;
  }

  // Tier 2 (Moderate Risk): One risk factor
  if (diabetes || hypertension) {
    return 2;
  }

  // Tier 1 (Low Risk): No risk factors and normal labs
  return 1;
}

/**
 * Get all patients
 */
export async function getAllPatients(): Promise<PatientWithAge[]> {
  const result = await query('SELECT * FROM patients ORDER BY last_name, first_name');
  return result.rows.map(enrichPatient);
}

/**
 * Get patient by ID
 */
export async function getPatientById(patientId: string): Promise<PatientWithAge | null> {
  const result = await query('SELECT * FROM patients WHERE id = $1', [patientId]);

  if (result.rows.length === 0) {
    return null;
  }

  return enrichPatient(result.rows[0]);
}

/**
 * Get patient by medical record number
 */
export async function getPatientByMRN(mrn: string): Promise<PatientWithAge | null> {
  const result = await query(
    'SELECT * FROM patients WHERE medical_record_number = $1',
    [mrn]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return enrichPatient(result.rows[0]);
}

/**
 * Get patient observations
 */
export async function getPatientObservations(patientId: string): Promise<Observation[]> {
  const result = await query(
    `SELECT * FROM observations
     WHERE patient_id = $1
     ORDER BY observation_date DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * Get patient conditions
 */
export async function getPatientConditions(patientId: string): Promise<Condition[]> {
  const result = await query(
    `SELECT * FROM conditions
     WHERE patient_id = $1
     ORDER BY onset_date DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * Get patient risk assessments
 */
export async function getPatientRiskAssessments(patientId: string): Promise<RiskAssessment[]> {
  const result = await query(
    `SELECT * FROM risk_assessments
     WHERE patient_id = $1
     ORDER BY assessed_at DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * Get complete patient summary with all clinical data
 */
export async function getPatientSummary(patientId: string): Promise<PatientSummary | null> {
  // Fetch all data in parallel
  const [patient, observations, conditions, riskAssessments] = await Promise.all([
    getPatientById(patientId),
    getPatientObservations(patientId),
    getPatientConditions(patientId),
    getPatientRiskAssessments(patientId)
  ]);

  if (!patient) {
    return null;
  }

  // Extract latest observations
  const latestObs = extractLatestObservations(observations);

  // Check for risk factors
  const diabetes = hasDiabetes(conditions);
  const hypertension = hasHypertension(conditions);

  // Calculate risk tier
  const riskTier = calculateRiskTier(diabetes, hypertension, latestObs.eGFR, latestObs.uACR);

  // Determine CKD stage
  const ckdStage = determineCKDStage(latestObs.eGFR);

  return {
    ...patient,
    observations,
    conditions,
    risk_assessments: riskAssessments,
    latest_observations: latestObs,
    risk_tier: riskTier,
    has_diabetes: diabetes,
    has_hypertension: hypertension,
    ckd_stage: ckdStage
  };
}

/**
 * Get patient list with summary info
 */
export async function getPatientList(params?: PatientQueryParams): Promise<PatientListItem[]> {
  // Get all patients (we'll filter in application layer for hackathon simplicity)
  const patients = await getAllPatients();

  // Get summary for each patient
  const patientSummaries = await Promise.all(
    patients.map(patient => getPatientSummary(patient.id))
  );

  // Filter out nulls and convert to list items
  const listItems: PatientListItem[] = patientSummaries
    .filter((summary): summary is PatientSummary => summary !== null)
    .map(summary => ({
      id: summary.id,
      medical_record_number: summary.medical_record_number,
      full_name: summary.full_name,
      age: summary.age,
      gender: summary.gender,
      risk_tier: summary.risk_tier,
      latest_eGFR: summary.latest_observations.eGFR,
      latest_uACR: summary.latest_observations.uACR,
      has_diabetes: summary.has_diabetes,
      has_hypertension: summary.has_hypertension,
      ckd_stage: summary.ckd_stage
    }));

  // Apply filters if provided
  let filtered = listItems;

  if (params) {
    if (params.risk_tier !== undefined) {
      filtered = filtered.filter(p => p.risk_tier === params.risk_tier);
    }

    if (params.has_diabetes !== undefined) {
      filtered = filtered.filter(p => p.has_diabetes === params.has_diabetes);
    }

    if (params.has_hypertension !== undefined) {
      filtered = filtered.filter(p => p.has_hypertension === params.has_hypertension);
    }

    if (params.ckd_stage !== undefined) {
      filtered = filtered.filter(p => p.ckd_stage === params.ckd_stage);
    }

    if (params.min_age !== undefined) {
      filtered = filtered.filter(p => p.age >= params.min_age!);
    }

    if (params.max_age !== undefined) {
      filtered = filtered.filter(p => p.age <= params.max_age!);
    }

    // Sorting
    if (params.sort_by) {
      const sortOrder = params.sort_order === 'desc' ? -1 : 1;

      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (params.sort_by) {
          case 'name':
            aVal = a.full_name;
            bVal = b.full_name;
            break;
          case 'age':
            aVal = a.age;
            bVal = b.age;
            break;
          case 'risk_tier':
            aVal = a.risk_tier || 0;
            bVal = b.risk_tier || 0;
            break;
          case 'eGFR':
            aVal = a.latest_eGFR || 0;
            bVal = b.latest_eGFR || 0;
            break;
          case 'mrn':
            aVal = a.medical_record_number;
            bVal = b.medical_record_number;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });
    }

    // Pagination
    if (params.offset !== undefined) {
      filtered = filtered.slice(params.offset);
    }

    if (params.limit !== undefined) {
      filtered = filtered.slice(0, params.limit);
    }
  }

  return filtered;
}

/**
 * Get patients by risk tier
 */
export async function getPatientsByRiskTier(tier: RiskTier): Promise<PatientListItem[]> {
  return getPatientList({ risk_tier: tier });
}

/**
 * Get high-risk patients (Tier 3)
 * Prioritized for immediate CKD screening
 */
export async function getHighRiskPatients(): Promise<PatientListItem[]> {
  return getPatientsByRiskTier(3);
}

/**
 * Count patients by risk tier
 */
export async function getPatientCountsByRiskTier(): Promise<Record<RiskTier, number>> {
  const allPatients = await getPatientList();

  const counts: Record<RiskTier, number> = { 1: 0, 2: 0, 3: 0 };

  allPatients.forEach(patient => {
    if (patient.risk_tier) {
      counts[patient.risk_tier]++;
    }
  });

  return counts;
}
