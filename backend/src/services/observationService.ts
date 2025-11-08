/**
 * Observation Service
 *
 * Service layer for clinical observation (lab results) operations.
 * Provides helper functions for querying and analyzing observations.
 */

import { query } from '../config/database';
import { Observation, ObservationType } from '../types/patient';

/**
 * Get observations by type for a patient
 * Useful for tracking specific lab values over time (e.g., eGFR trends)
 */
export async function getObservationsByType(
  patientId: string,
  observationType: ObservationType
): Promise<Observation[]> {
  const result = await query(
    `SELECT * FROM observations
     WHERE patient_id = $1 AND observation_type = $2
     ORDER BY observation_date DESC`,
    [patientId, observationType]
  );

  return result.rows;
}

/**
 * Get latest observation of a specific type for a patient
 * Returns the most recent value for a given observation type
 */
export async function getLatestObservation(
  patientId: string,
  observationType: ObservationType
): Promise<Observation | null> {
  const result = await query(
    `SELECT * FROM observations
     WHERE patient_id = $1 AND observation_type = $2
     ORDER BY observation_date DESC
     LIMIT 1`,
    [patientId, observationType]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get observation trend (historical values) for a patient
 * Returns time-series data for trend analysis
 */
export async function getObservationTrend(
  patientId: string,
  observationType: ObservationType,
  limit: number = 10
): Promise<Observation[]> {
  const result = await query(
    `SELECT * FROM observations
     WHERE patient_id = $1 AND observation_type = $2
     ORDER BY observation_date DESC
     LIMIT $3`,
    [patientId, observationType, limit]
  );

  return result.rows;
}

/**
 * Get observations within a date range
 * Useful for analyzing lab values during a specific time period
 */
export async function getObservationsInDateRange(
  patientId: string,
  startDate: string,
  endDate: string
): Promise<Observation[]> {
  const result = await query(
    `SELECT * FROM observations
     WHERE patient_id = $1
       AND observation_date >= $2
       AND observation_date <= $3
     ORDER BY observation_date DESC`,
    [patientId, startDate, endDate]
  );

  return result.rows;
}

/**
 * Get all observations of a specific type across all patients
 * Useful for population health analytics
 */
export async function getObservationsByTypeAllPatients(
  observationType: ObservationType
): Promise<Observation[]> {
  const result = await query(
    `SELECT * FROM observations
     WHERE observation_type = $1
     ORDER BY observation_date DESC`,
    [observationType]
  );

  return result.rows;
}

/**
 * Get abnormal observations for a patient
 * Returns observations that fall outside normal ranges
 *
 * Abnormal thresholds:
 * - eGFR < 60 mL/min/1.73m² (kidney function declining)
 * - uACR >= 30 mg/g (kidney damage/microalbuminuria)
 * - HbA1c >= 6.5% (diabetes diagnosis threshold)
 * - Blood pressure: systolic >= 140 or diastolic >= 90 (hypertension)
 */
export async function getAbnormalObservations(patientId: string): Promise<Observation[]> {
  const result = await query(
    `SELECT * FROM observations
     WHERE patient_id = $1
       AND (
         (observation_type = 'eGFR' AND value_numeric < 60) OR
         (observation_type = 'uACR' AND value_numeric >= 30) OR
         (observation_type = 'HbA1c' AND value_numeric >= 6.5) OR
         (observation_type = 'blood_pressure_systolic' AND value_numeric >= 140) OR
         (observation_type = 'blood_pressure_diastolic' AND value_numeric >= 90) OR
         (observation_type = 'potassium' AND (value_numeric < 3.5 OR value_numeric > 5.0))
       )
     ORDER BY observation_date DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * Get key CKD screening observations for a patient
 * Returns latest eGFR, uACR, and HbA1c values (core CKD screening labs)
 */
export async function getKeyScreeningObservations(patientId: string): Promise<{
  eGFR: Observation | null;
  uACR: Observation | null;
  HbA1c: Observation | null;
}> {
  const [eGFR, uACR, HbA1c] = await Promise.all([
    getLatestObservation(patientId, 'eGFR'),
    getLatestObservation(patientId, 'uACR'),
    getLatestObservation(patientId, 'HbA1c')
  ]);

  return { eGFR, uACR, HbA1c };
}

/**
 * Check if patient has recent observations
 * Returns true if patient has observations within the last N days
 */
export async function hasRecentObservations(
  patientId: string,
  daysAgo: number = 180
): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const result = await query(
    `SELECT COUNT(*) as count FROM observations
     WHERE patient_id = $1
       AND observation_date >= $2`,
    [patientId, cutoffDate.toISOString()]
  );

  return parseInt(result.rows[0].count) > 0;
}

/**
 * Get patients missing key screening observations
 * Returns list of patient IDs who don't have recent eGFR or uACR values
 * Useful for identifying patients who need screening
 */
export async function getPatientsMissingScreening(daysAgo: number = 365): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const result = await query(
    `SELECT DISTINCT p.id
     FROM patients p
     WHERE NOT EXISTS (
       SELECT 1 FROM observations o
       WHERE o.patient_id = p.id
         AND o.observation_type IN ('eGFR', 'uACR')
         AND o.observation_date >= $1
     )`,
    [cutoffDate.toISOString()]
  );

  return result.rows.map(row => row.id);
}
