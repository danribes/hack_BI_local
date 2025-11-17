import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';
import { classifyKDIGO, getRiskCategoryLabel } from '../../utils/kdigo';

const router = Router();

/**
 * Generate patient evolution summary by comparing current and previous cycle values
 */
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
 * GET /api/patients/statistics
 * Get comprehensive patient statistics for filtering UI
 * Returns hierarchical counts for CKD and non-CKD patients
 * NOTE: This route MUST be defined before /:id to avoid routing conflicts
 */
router.get('/statistics', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    // Get CKD patient statistics (severity breakdown with treatment status)
    const ckdStatsResult = await pool.query(`
      SELECT
        cpd.ckd_severity,
        cpd.is_treated,
        COUNT(*) as count
      FROM ckd_patient_data cpd
      INNER JOIN patients p ON cpd.patient_id = p.id
      GROUP BY cpd.ckd_severity, cpd.is_treated
      ORDER BY
        CASE cpd.ckd_severity
          WHEN 'mild' THEN 1
          WHEN 'moderate' THEN 2
          WHEN 'severe' THEN 3
          WHEN 'kidney_failure' THEN 4
        END,
        cpd.is_treated DESC
    `);

    // Get non-CKD patient statistics (risk level breakdown with monitoring status)
    const nonCkdStatsResult = await pool.query(`
      SELECT
        npd.risk_level,
        npd.is_monitored,
        COUNT(*) as count
      FROM non_ckd_patient_data npd
      INNER JOIN patients p ON npd.patient_id = p.id
      GROUP BY npd.risk_level, npd.is_monitored
      ORDER BY
        CASE npd.risk_level
          WHEN 'low' THEN 1
          WHEN 'moderate' THEN 2
          WHEN 'high' THEN 3
        END,
        npd.is_monitored DESC
    `);

    // Process CKD statistics into hierarchical structure
    const ckdStats: any = {
      total: 0,
      mild: { total: 0, treated: 0, not_treated: 0 },
      moderate: { total: 0, treated: 0, not_treated: 0 },
      severe: { total: 0, treated: 0, not_treated: 0 },
      kidney_failure: { total: 0, treated: 0, not_treated: 0 }
    };

    ckdStatsResult.rows.forEach((row: any) => {
      const count = parseInt(row.count);
      const severity = row.ckd_severity;
      const isTreated = row.is_treated;

      ckdStats.total += count;

      if (ckdStats[severity]) {
        ckdStats[severity].total += count;
        if (isTreated) {
          ckdStats[severity].treated += count;
        } else {
          ckdStats[severity].not_treated += count;
        }
      }
    });

    // Process non-CKD statistics into hierarchical structure
    const nonCkdStats: any = {
      total: 0,
      low: { total: 0, monitored: 0, not_monitored: 0 },
      moderate: { total: 0, monitored: 0, not_monitored: 0 },
      high: { total: 0, monitored: 0, not_monitored: 0 }
    };

    nonCkdStatsResult.rows.forEach((row: any) => {
      const count = parseInt(row.count);
      const riskLevel = row.risk_level;
      const isMonitored = row.is_monitored;

      nonCkdStats.total += count;

      if (nonCkdStats[riskLevel]) {
        nonCkdStats[riskLevel].total += count;
        if (isMonitored) {
          nonCkdStats[riskLevel].monitored += count;
        } else {
          nonCkdStats[riskLevel].not_monitored += count;
        }
      }
    });

    res.json({
      status: 'success',
      statistics: {
        total_patients: ckdStats.total + nonCkdStats.total,
        ckd: ckdStats,
        non_ckd: nonCkdStats
      }
    });

  } catch (error) {
    console.error('[Patients API] Error fetching statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/patients/:id
 * Get complete patient details including observations, conditions, and risk assessments
 * NOTE: This route MUST be defined after specific routes like /statistics
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

    const observationsResult = await pool.query(`
      SELECT
        observation_type,
        value_numeric,
        value_text,
        unit,
        observation_date,
        notes,
        month_number
      FROM observations
      WHERE patient_id = $1
      ORDER BY observation_type, month_number DESC
    `, [id]);

    // Get latest observations for KDIGO calculation (most recent cycle only)
    const latestObservationsResult = await pool.query(`
      SELECT DISTINCT ON (observation_type)
        observation_type,
        value_numeric,
        value_text,
        unit,
        observation_date,
        notes,
        month_number
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

    // Calculate KDIGO classification using latest observations
    const egfrObs = latestObservationsResult.rows.find(obs => obs.observation_type === 'eGFR');
    const uacrObs = latestObservationsResult.rows.find(obs => obs.observation_type === 'uACR');

    const egfr = egfrObs?.value_numeric || 90;
    const uacr = uacrObs?.value_numeric || 15;

    const kdigoClassification = classifyKDIGO(egfr, uacr);
    const riskCategory = getRiskCategoryLabel(kdigoClassification);

    // Derive comorbidity flags from conditions
    const conditions = conditionsResult.rows;
    const comorbidities = {
      has_diabetes: conditions.some(c => c.condition_code?.startsWith('E1') && c.clinical_status === 'active'),
      has_type1_diabetes: conditions.some(c => c.condition_code?.startsWith('E10') && c.clinical_status === 'active'),
      has_type2_diabetes: conditions.some(c => c.condition_code?.startsWith('E11') && c.clinical_status === 'active'),
      has_hypertension: conditions.some(c => (c.condition_code?.startsWith('I10') || c.condition_code?.startsWith('I11') || c.condition_code?.startsWith('I12') || c.condition_code?.startsWith('I13')) && c.clinical_status === 'active'),
      has_essential_hypertension: conditions.some(c => c.condition_code === 'I10' && c.clinical_status === 'active'),
      has_heart_failure: conditions.some(c => c.condition_code?.startsWith('I50') && c.clinical_status === 'active'),
      has_cad: conditions.some(c => c.condition_code?.startsWith('I25') && c.clinical_status === 'active'),
      has_mi: conditions.some(c => (c.condition_code?.startsWith('I21') || c.condition_code?.startsWith('I22')) && c.clinical_status === 'active'),
      has_atrial_fibrillation: conditions.some(c => c.condition_code?.startsWith('I48') && c.clinical_status === 'active'),
      has_stroke: conditions.some(c => (c.condition_code?.startsWith('I63') || c.condition_code?.startsWith('I64')) && c.clinical_status === 'active'),
      has_peripheral_vascular_disease: conditions.some(c => c.condition_code?.startsWith('I73') && c.clinical_status === 'active'),
      has_obesity: conditions.some(c => c.condition_code?.startsWith('E66') && c.clinical_status === 'active'),
      has_hyperlipidemia: conditions.some(c => c.condition_code?.startsWith('E78') && c.clinical_status === 'active'),
      has_gout: conditions.some(c => c.condition_code?.startsWith('M10') && c.clinical_status === 'active'),
      has_lupus: conditions.some(c => c.condition_code?.startsWith('M32') && c.clinical_status === 'active'),
      has_ra: conditions.some(c => (c.condition_code?.startsWith('M05') || c.condition_code?.startsWith('M06')) && c.clinical_status === 'active'),
      has_polycystic_kidney_disease: conditions.some(c => c.condition_code?.startsWith('Q61') && c.clinical_status === 'active'),
    };

    // Extract vital signs from latest observations for backward compatibility
    const latestObservations = latestObservationsResult.rows;
    const systolicBP = latestObservations.find(o => o.observation_type === 'blood_pressure_systolic');
    const diastolicBP = latestObservations.find(o => o.observation_type === 'blood_pressure_diastolic');
    const heartRate = latestObservations.find(o => o.observation_type === 'heart_rate');
    const oxygenSat = latestObservations.find(o => o.observation_type === 'oxygen_saturation');
    const bmiObs = latestObservations.find(o => o.observation_type === 'BMI');

    const vitalSigns = {
      systolic_bp: systolicBP?.value_numeric || null,
      diastolic_bp: diastolicBP?.value_numeric || null,
      heart_rate: heartRate?.value_numeric || null,
      oxygen_saturation: oxygenSat?.value_numeric || null,
      bmi: bmiObs?.value_numeric || null,
    };

    res.json({
      status: 'success',
      patient: {
        ...patient,
        observations: observationsResult.rows,
        conditions: conditionsResult.rows,
        risk_assessment: riskResult.rows[0] || null,
        kdigo_classification: kdigoClassification,
        risk_category: riskCategory,
        // Comorbidity flags derived from conditions
        ...comorbidities,
        // Vital signs from observations
        ...vitalSigns,
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
