import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';
import { classifyKDIGO, getRiskCategoryLabel } from '../../utils/kdigo';

const router = Router();

/**
 * GET /api/patients/filter
 * Flexible filtering endpoint - all parameters optional
 * Query parameters:
 *   - has_ckd: boolean ('true' or 'false')
 *   - severity: 'mild' | 'moderate' | 'severe' | 'kidney_failure'
 *   - ckd_stage: 1 | 2 | 3 | 4 | 5
 *   - risk_level: 'low' | 'moderate' | 'high'
 *   - is_monitored: boolean ('true' or 'false')
 *   - is_treated: boolean ('true' or 'false') - CKD patients only
 *   - monitoring_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually'
 *   - treatment_name: string (e.g., 'Jardiance')
 */
router.get('/filter', async (req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();
    const {
      has_ckd,
      severity,
      ckd_stage,
      risk_level,
      is_monitored,
      is_treated,
      monitoring_frequency,
      treatment_name
    } = req.query;

    // Build dynamic query based on provided filters
    let baseQuery = `
      SELECT DISTINCT
        p.id,
        p.medical_record_number,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.email,
        p.phone,
        p.last_visit_date,
        p.created_at
    `;

    let fromClause = ' FROM patients p';
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCounter = 1;

    // Determine if we need CKD or non-CKD tables
    if (has_ckd === 'true') {
      fromClause += ' INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id';

      // CKD-specific filters
      if (severity) {
        whereConditions.push(`cpd.ckd_severity = $${paramCounter++}`);
        queryParams.push(severity);
      }

      if (ckd_stage) {
        whereConditions.push(`cpd.ckd_stage = $${paramCounter++}`);
        queryParams.push(parseInt(ckd_stage as string));
      }

      if (is_monitored !== undefined) {
        whereConditions.push(`cpd.is_monitored = $${paramCounter++}`);
        queryParams.push(is_monitored === 'true');
      }

      if (is_treated !== undefined) {
        whereConditions.push(`cpd.is_treated = $${paramCounter++}`);
        queryParams.push(is_treated === 'true');
      }

      if (monitoring_frequency) {
        whereConditions.push(`cpd.monitoring_frequency = $${paramCounter++}`);
        queryParams.push(monitoring_frequency);
      }

      // Filter by treatment name
      if (treatment_name) {
        fromClause += ' INNER JOIN ckd_treatments ct ON cpd.id = ct.ckd_patient_data_id';
        whereConditions.push(`ct.treatment_name ILIKE $${paramCounter++}`);
        whereConditions.push('ct.is_active = true');
        queryParams.push(`%${treatment_name}%`);
      }

    } else if (has_ckd === 'false') {
      fromClause += ' INNER JOIN non_ckd_patient_data npd ON p.id = npd.patient_id';

      // Non-CKD specific filters
      if (risk_level) {
        whereConditions.push(`npd.risk_level = $${paramCounter++}`);
        queryParams.push(risk_level);
      }

      if (is_monitored !== undefined) {
        whereConditions.push(`npd.is_monitored = $${paramCounter++}`);
        queryParams.push(is_monitored === 'true');
      }

      if (monitoring_frequency) {
        whereConditions.push(`npd.monitoring_frequency = $${paramCounter++}`);
        queryParams.push(monitoring_frequency);
      }
    } else {
      // No CKD filter specified - return all patients with basic info
      // This allows combining with other filters later if needed
    }

    // Build final query
    let finalQuery = baseQuery + fromClause;
    if (whereConditions.length > 0) {
      finalQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    finalQuery += ' ORDER BY p.last_name ASC, p.first_name ASC';

    // Execute query
    const result = await pool.query(finalQuery, queryParams);

    res.json({
      status: 'success',
      filters_applied: {
        has_ckd: has_ckd || 'not_specified',
        severity: severity || 'not_specified',
        ckd_stage: ckd_stage || 'not_specified',
        risk_level: risk_level || 'not_specified',
        is_monitored: is_monitored || 'not_specified',
        is_treated: is_treated || 'not_specified',
        monitoring_frequency: monitoring_frequency || 'not_specified',
        treatment_name: treatment_name || 'not_specified'
      },
      count: result.rows.length,
      patients: result.rows
    });

  } catch (error) {
    console.error('[Patients API] Error filtering patients:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to filter patients',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/patients
 * Get all patients with tracking data from new tables
 */
router.get('/', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    // Get patients with data from tracking tables
    const result = await pool.query(`
      SELECT
        p.id,
        p.medical_record_number,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.email,
        p.phone,
        p.last_visit_date,
        p.created_at,
        -- Legacy fields (for backward compatibility)
        p.home_monitoring_device,
        p.home_monitoring_active,
        p.ckd_treatment_active,
        p.ckd_treatment_type,
        -- Latest observations
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'eGFR'
         ORDER BY observation_date DESC LIMIT 1) as latest_egfr,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'uACR'
         ORDER BY observation_date DESC LIMIT 1) as latest_uacr,
        -- CKD patient data
        cpd.ckd_severity,
        cpd.ckd_stage,
        cpd.kdigo_health_state as ckd_health_state,
        cpd.is_monitored as ckd_is_monitored,
        cpd.monitoring_device as ckd_monitoring_device,
        cpd.monitoring_frequency as ckd_monitoring_frequency,
        cpd.is_treated as ckd_is_treated,
        -- Non-CKD patient data
        npd.risk_level as non_ckd_risk_level,
        npd.kdigo_health_state as non_ckd_health_state,
        npd.is_monitored as non_ckd_is_monitored,
        npd.monitoring_device as non_ckd_monitoring_device,
        npd.monitoring_frequency as non_ckd_monitoring_frequency
      FROM patients p
      LEFT JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
      LEFT JOIN non_ckd_patient_data npd ON p.id = npd.patient_id
      ORDER BY p.last_name ASC, p.first_name ASC
    `);

    // Calculate KDIGO classification for each patient
    const patientsWithRisk = result.rows.map(patient => {
      const egfr = patient.latest_egfr || 90;
      const uacr = patient.latest_uacr || 15;

      const kdigo = classifyKDIGO(egfr, uacr);
      const risk_category = getRiskCategoryLabel(kdigo);

      // Use data from tracking tables if available, otherwise fall back to legacy fields
      const is_monitored = kdigo.has_ckd
        ? (patient.ckd_is_monitored !== null ? patient.ckd_is_monitored : patient.home_monitoring_active)
        : (patient.non_ckd_is_monitored !== null ? patient.non_ckd_is_monitored : patient.home_monitoring_active);

      const monitoring_device = kdigo.has_ckd
        ? (patient.ckd_monitoring_device || patient.home_monitoring_device)
        : (patient.non_ckd_monitoring_device || patient.home_monitoring_device);

      return {
        ...patient,
        kdigo_classification: kdigo,
        risk_category,
        // Simplified tracking data
        is_monitored,
        monitoring_device,
        is_treated: kdigo.has_ckd ? (patient.ckd_is_treated || patient.ckd_treatment_active) : false
      };
    });

    res.json({
      status: 'success',
      count: patientsWithRisk.length,
      patients: patientsWithRisk
    });

  } catch (error) {
    console.error('[Patients API] Error fetching patients:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patients',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/patients/:id
 * Get complete patient details including observations, conditions, and risk assessments
 */
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Get patient basic info
    const patientResult = await pool.query(`
      SELECT *
      FROM patients
      WHERE id = $1
    `, [id]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    const patient = patientResult.rows[0];

    // Get latest observations grouped by type
    const observationsResult = await pool.query(`
      SELECT DISTINCT ON (observation_type)
        observation_type,
        value_numeric,
        value_text,
        unit,
        observation_date,
        notes
      FROM observations
      WHERE patient_id = $1
      ORDER BY observation_type, observation_date DESC
    `, [id]);

    // Get active conditions
    const conditionsResult = await pool.query(`
      SELECT
        condition_code,
        condition_name,
        clinical_status,
        onset_date,
        severity,
        notes
      FROM conditions
      WHERE patient_id = $1
      ORDER BY
        CASE clinical_status
          WHEN 'active' THEN 1
          WHEN 'inactive' THEN 2
          WHEN 'resolved' THEN 3
        END,
        recorded_date DESC
    `, [id]);

    // Get latest risk assessment
    const riskResult = await pool.query(`
      SELECT
        risk_score,
        risk_level,
        recommendations,
        reasoning,
        assessed_at
      FROM risk_assessments
      WHERE patient_id = $1
      ORDER BY assessed_at DESC
      LIMIT 1
    `, [id]);

    // Calculate KDIGO classification
    const egfrObs = observationsResult.rows.find(obs => obs.observation_type === 'eGFR');
    const uacrObs = observationsResult.rows.find(obs => obs.observation_type === 'uACR');

    const egfr = egfrObs?.value_numeric || 90;
    const uacr = uacrObs?.value_numeric || 15;

    const kdigoClassification = classifyKDIGO(egfr, uacr);
    const riskCategory = getRiskCategoryLabel(kdigoClassification);

    res.json({
      status: 'success',
      patient: {
        ...patient,
        observations: observationsResult.rows,
        conditions: conditionsResult.rows,
        risk_assessment: riskResult.rows[0] || null,
        kdigo_classification: kdigoClassification,
        risk_category: riskCategory,
        // Home monitoring
        home_monitoring_device: patient.home_monitoring_device || null,
        home_monitoring_active: patient.home_monitoring_active || false,
        // Treatment tracking
        ckd_treatment_active: patient.ckd_treatment_active || false,
        ckd_treatment_type: patient.ckd_treatment_type || null
      }
    });

  } catch (error) {
    console.error('[Patients API] Error fetching patient:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
