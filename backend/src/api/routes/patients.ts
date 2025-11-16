import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';
import { classifyKDIGO, getRiskCategoryLabel } from '../../utils/kdigo';

const router = Router();

/**
 * Generate patient evolution summary by comparing current and previous cycle values
 */
async function generateEvolutionSummary(patientId: string, currentCycle: number, previousCycle: number): Promise<string> {
  const pool = getPool();
  const summaries: string[] = [];

  try {
    // Get current and previous observations for key biomarkers
    const currentObs = await pool.query(`
      SELECT observation_type, value_numeric
      FROM observations
      WHERE patient_id = $1 AND month_number = $2
      AND observation_type IN ('eGFR', 'uACR', 'BP_Systolic', 'BP_Diastolic', 'HbA1c', 'triglycerides', 'LDL')
    `, [patientId, currentCycle]);

    const previousObs = await pool.query(`
      SELECT observation_type, value_numeric
      FROM observations
      WHERE patient_id = $1 AND month_number = $2
      AND observation_type IN ('eGFR', 'uACR', 'BP_Systolic', 'BP_Diastolic', 'HbA1c', 'triglycerides', 'LDL')
    `, [patientId, previousCycle]);

    const current = new Map(currentObs.rows.map((r: any) => [r.observation_type, r.value_numeric]));
    const previous = new Map(previousObs.rows.map((r: any) => [r.observation_type, r.value_numeric]));

    // eGFR analysis
    const currentEGFR = current.get('eGFR');
    const previousEGFR = previous.get('eGFR');
    if (currentEGFR !== undefined && previousEGFR !== undefined) {
      const change = currentEGFR - previousEGFR;
      if (currentEGFR < 15) {
        summaries.push('critical eGFR');
      } else if (change < -5) {
        summaries.push('eGFR worsening');
      } else if (change > 5) {
        summaries.push('eGFR improving');
      }
    }

    // uACR analysis
    const currentUACR = current.get('uACR');
    const previousUACR = previous.get('uACR');
    if (currentUACR !== undefined && previousUACR !== undefined) {
      const change = ((currentUACR - previousUACR) / previousUACR) * 100;
      if (currentUACR > 300) {
        summaries.push('severe albuminuria');
      } else if (change > 20) {
        summaries.push('uACR worsening');
      } else if (change < -20) {
        summaries.push('uACR improving');
      }
    }

    // Blood pressure analysis
    const currentSBP = current.get('BP_Systolic');
    const previousSBP = previous.get('BP_Systolic');
    if (currentSBP !== undefined && previousSBP !== undefined) {
      if (currentSBP > 160) {
        summaries.push('critical BP');
      } else if (currentSBP - previousSBP > 10) {
        summaries.push('BP increasing');
      } else if (previousSBP - currentSBP > 10) {
        summaries.push('BP improving');
      }
    }

    // HbA1c analysis (diabetes control)
    const currentHbA1c = current.get('HbA1c');
    const previousHbA1c = previous.get('HbA1c');
    if (currentHbA1c !== undefined && previousHbA1c !== undefined) {
      if (currentHbA1c >= 6.5 && previousHbA1c < 6.5) {
        summaries.push('diabetes diagnosed');
      } else if (currentHbA1c > 9) {
        summaries.push('poor glucose control');
      } else if (currentHbA1c - previousHbA1c > 0.5) {
        summaries.push('HbA1c worsening');
      }
    }

    // Triglycerides analysis
    const currentTrig = current.get('triglycerides');
    const previousTrig = previous.get('triglycerides');
    if (currentTrig !== undefined && previousTrig !== undefined) {
      if (currentTrig > 200 && previousTrig <= 200) {
        summaries.push('triglycerides elevated');
      } else if (currentTrig - previousTrig > 50) {
        summaries.push('triglycerides worsened');
      }
    }

    // LDL analysis
    const currentLDL = current.get('LDL');
    const previousLDL = previous.get('LDL');
    if (currentLDL !== undefined && previousLDL !== undefined) {
      if (currentLDL > 160) {
        summaries.push('high LDL');
      } else if (currentLDL - previousLDL > 30) {
        summaries.push('LDL increasing');
      }
    }

    return summaries.length > 0 ? summaries.join(', ') : 'stable';
  } catch (error) {
    console.error(`Error generating evolution summary for patient ${patientId}:`, error);
    return 'unknown';
  }
}

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

    // Get current cycle number (max month_number from all observations)
    const currentCycleResult = await pool.query(`
      SELECT COALESCE(MAX(month_number), 1) as current_cycle
      FROM observations
    `);
    const currentCycle = parseInt(currentCycleResult.rows[0]?.current_cycle || '1');

    res.json({
      status: 'success',
      statistics: {
        total_patients: ckdStats.total + nonCkdStats.total,
        ckd: ckdStats,
        non_ckd: nonCkdStats,
        current_cycle: currentCycle
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

    // Get current cycle for this patient
    const currentCycleResult = await pool.query(`
      SELECT COALESCE(MAX(month_number), 1) as current_cycle
      FROM observations
      WHERE patient_id = $1
    `, [id]);
    const currentCycle = parseInt(currentCycleResult.rows[0]?.current_cycle || '1');

    // Get observations from the last 3 cycles (or fewer if at early cycles)
    const cyclesToShow = currentCycle === 12 ? [12] : [currentCycle, Math.max(1, currentCycle - 1), Math.max(1, currentCycle - 2)].filter((v, i, a) => a.indexOf(v) === i);

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
      WHERE patient_id = $1 AND month_number = ANY($2::int[])
      ORDER BY observation_type, month_number DESC
    `, [id, cyclesToShow]);

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
        current_cycle: currentCycle,
        cycles_to_show: cyclesToShow,
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

/**
 * POST /api/patients/advance-cycle
 * Advance a batch of patients to the next cycle
 * - Selects patients PROPORTIONALLY from each CKD severity subgroup
 * - Generates new lab values for patients in the batch
 * - If at cycle 12, copies cycle 12 to cycle 1 and clears cycles 2-12
 * - Otherwise, increments the cycle counter
 * - All other patients NOT in the batch are reset to cycle 1
 * Query params:
 *   - batch_size: number of patients to process (default: 50, max: 1000)
 */
router.post('/advance-cycle', async (req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();
    const batchSize = Math.min(parseInt(req.query.batch_size as string) || 50, 1000);
    const { patient_ids } = req.body;

    let selectedPatients: any[] = [];

    // If patient_ids are provided, use those instead of random selection
    if (patient_ids && Array.isArray(patient_ids) && patient_ids.length > 0) {
      // Get patient data for the specified IDs (both CKD and non-CKD)
      const placeholders = patient_ids.map((_: any, idx: number) => `$${idx + 1}`).join(',');
      const selected = await pool.query(`
        SELECT
          p.id,
          p.first_name,
          p.last_name,
          COALESCE(cpd.ckd_stage, 0) as ckd_stage,
          COALESCE(cpd.ckd_severity, 'none') as ckd_severity,
          COALESCE(nckd.risk_level, 'low') as risk_level,
          COALESCE(MAX(o.month_number), 0) as current_month
        FROM patients p
        LEFT JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
        LEFT JOIN non_ckd_patient_data nckd ON p.id = nckd.patient_id
        LEFT JOIN observations o ON p.id = o.patient_id
        WHERE p.id IN (${placeholders})
        GROUP BY p.id, p.first_name, p.last_name, cpd.ckd_stage, cpd.ckd_severity, nckd.risk_level
      `, patient_ids);

      selectedPatients = selected.rows;
    } else {
      // Select patients proportionally from both CKD and non-CKD groups

      // Get CKD patient counts by severity
      const ckdCountsResult = await pool.query(`
        SELECT cpd.ckd_severity, COUNT(*) as count
        FROM ckd_patient_data cpd
        INNER JOIN patients p ON cpd.patient_id = p.id
        GROUP BY cpd.ckd_severity
      `);

      // Get non-CKD patient counts by risk level
      const nonCkdCountsResult = await pool.query(`
        SELECT nckd.risk_level, COUNT(*) as count
        FROM non_ckd_patient_data nckd
        INNER JOIN patients p ON nckd.patient_id = p.id
        GROUP BY nckd.risk_level
      `);

      const allGroups = [
        ...ckdCountsResult.rows.map((r: any) => ({ type: 'ckd', category: r.ckd_severity, count: parseInt(r.count) })),
        ...nonCkdCountsResult.rows.map((r: any) => ({ type: 'non_ckd', category: r.risk_level, count: parseInt(r.count) }))
      ];

      const totalPatients = allGroups.reduce((sum, group) => sum + group.count, 0);

      // Select patients proportionally from each group
      for (const group of allGroups) {
        const proportion = group.count / totalPatients;
        const sampleSize = Math.max(1, Math.round(proportion * batchSize));

        if (group.type === 'ckd') {
          // Select CKD patients
          const selected = await pool.query(`
            SELECT
              p.id,
              p.first_name,
              p.last_name,
              cpd.ckd_stage,
              cpd.ckd_severity,
              NULL as risk_level,
              COALESCE(MAX(o.month_number), 0) as current_month
            FROM patients p
            INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
            LEFT JOIN observations o ON p.id = o.patient_id
            WHERE cpd.ckd_severity = $1
            GROUP BY p.id, p.first_name, p.last_name, cpd.ckd_stage, cpd.ckd_severity
            ORDER BY RANDOM()
            LIMIT $2
          `, [group.category, sampleSize]);

          selectedPatients.push(...selected.rows);
        } else {
          // Select non-CKD patients
          const selected = await pool.query(`
            SELECT
              p.id,
              p.first_name,
              p.last_name,
              0 as ckd_stage,
              'none' as ckd_severity,
              nckd.risk_level,
              COALESCE(MAX(o.month_number), 0) as current_month
            FROM patients p
            INNER JOIN non_ckd_patient_data nckd ON p.id = nckd.patient_id
            LEFT JOIN observations o ON p.id = o.patient_id
            WHERE nckd.risk_level = $1
            GROUP BY p.id, p.first_name, p.last_name, nckd.risk_level
            ORDER BY RANDOM()
            LIMIT $2
          `, [group.category, sampleSize]);

          selectedPatients.push(...selected.rows);
        }
      }
    }

    const patients = selectedPatients;
    const advancingPatientIds = patients.map((p: any) => p.id);

    if (patients.length === 0) {
      return res.json({
        status: 'success',
        message: 'No patients to process',
        data: {
          patients_processed: 0,
          total_patients: 0
        }
      });
    }

    const observationDate = new Date();
    const allObservations: any[] = [];

    // Process each patient and collect all observations
    for (const patient of patients) {
      const currentMonth = patient.current_month;
      const newMonth = currentMonth >= 12 ? 12 : currentMonth + 1;

      // Handle month 12 rollover
      if (currentMonth === 12) {
        await pool.query(`
          DELETE FROM observations
          WHERE patient_id = $1 AND month_number BETWEEN 2 AND 12
        `, [patient.id]);

        await pool.query(`
          UPDATE observations
          SET month_number = 1
          WHERE patient_id = $1 AND month_number = 12
        `, [patient.id]);
      }

      // Generate realistic lab values
      const ckdStage = patient.ckd_stage || 2;
      const hasDiabetes = Math.random() > 0.5;

      let baseEGFR;
      switch (ckdStage) {
        case 5: baseEGFR = 10 + Math.random() * 5; break;
        case 4: baseEGFR = 15 + Math.random() * 15; break;
        case 3: baseEGFR = 30 + Math.random() * 30; break;
        case 2: baseEGFR = 60 + Math.random() * 29; break;
        default: baseEGFR = 90 + Math.random() * 30; break;
      }

      const eGFR = Number(baseEGFR.toFixed(1));
      const creatinine = Number((175 / (eGFR + 50) + 0.3).toFixed(2));
      const bun = Number((7 + Math.random() * 25).toFixed(1));
      const baseUACR = ckdStage >= 3 ? 30 + Math.random() * 300 : Math.random() * 50;
      const uacr = Number(baseUACR.toFixed(1));
      const systolic = Math.floor(110 + Math.random() * 50);
      const diastolic = Math.floor(65 + Math.random() * 30);
      const hemoglobin = Number((11 + Math.random() * 6).toFixed(1));
      const potassium = Number((3.5 + Math.random() * 2).toFixed(1));
      const calcium = Number((8.5 + Math.random() * 2).toFixed(1));
      const phosphorus = Number((2.5 + Math.random() * 3).toFixed(1));
      const albumin = Number((3.0 + Math.random() * 2).toFixed(1));
      const ldl = Number((70 + Math.random() * 120).toFixed(0));
      const hdl = Number((30 + Math.random() * 50).toFixed(0));
      const totalCholesterol = Number((ldl + hdl + Math.random() * 50).toFixed(0));
      const triglycerides = Number((50 + Math.random() * 200).toFixed(0));
      const hba1c = hasDiabetes ? Number((5.7 + Math.random() * 5).toFixed(1)) : Number((4.5 + Math.random() * 1).toFixed(1));
      const glucose = hasDiabetes ? Number((100 + Math.random() * 150).toFixed(0)) : Number((70 + Math.random() * 40).toFixed(0));

      // Additional variables for comprehensive CKD monitoring
      const bicarbonate = Number((ckdStage >= 3 ? 18 + Math.random() * 8 : 22 + Math.random() * 6).toFixed(1)); // Lower in advanced CKD
      const sodium = Number((135 + Math.random() * 10).toFixed(1));
      const chloride = Number((95 + Math.random() * 15).toFixed(1));
      const magnesium = Number((1.5 + Math.random() * 1.0).toFixed(1));
      const uricAcid = Number((ckdStage >= 3 ? 6 + Math.random() * 4 : 3 + Math.random() * 4).toFixed(1)); // Higher in CKD
      const pth = Number((ckdStage >= 3 ? 65 + Math.random() * 300 : 10 + Math.random() * 55).toFixed(0)); // Elevated in CKD
      const vitaminD = Number((ckdStage >= 3 ? 10 + Math.random() * 20 : 20 + Math.random() * 30).toFixed(1)); // Often low in CKD
      const iron = Number((30 + Math.random() * 140).toFixed(0));
      const ferritin = Number((ckdStage >= 3 ? 50 + Math.random() * 450 : 20 + Math.random() * 280).toFixed(0));
      const tsat = Number((15 + Math.random() * 35).toFixed(1)); // Transferrin saturation %

      // Collect observations for batch insert
      const observations = [
        { type: 'eGFR', value: eGFR, unit: 'mL/min/1.73m²' },
        { type: 'creatinine', value: creatinine, unit: 'mg/dL' },
        { type: 'BUN', value: bun, unit: 'mg/dL' },
        { type: 'uACR', value: uacr, unit: 'mg/g' },
        { type: 'BP_Systolic', value: systolic, unit: 'mmHg' },
        { type: 'BP_Diastolic', value: diastolic, unit: 'mmHg' },
        { type: 'hemoglobin', value: hemoglobin, unit: 'g/dL' },
        { type: 'potassium', value: potassium, unit: 'mEq/L' },
        { type: 'calcium', value: calcium, unit: 'mg/dL' },
        { type: 'phosphorus', value: phosphorus, unit: 'mg/dL' },
        { type: 'albumin', value: albumin, unit: 'g/dL' },
        { type: 'LDL', value: ldl, unit: 'mg/dL' },
        { type: 'HDL', value: hdl, unit: 'mg/dL' },
        { type: 'total_cholesterol', value: totalCholesterol, unit: 'mg/dL' },
        { type: 'triglycerides', value: triglycerides, unit: 'mg/dL' },
        { type: 'HbA1c', value: hba1c, unit: '%' },
        { type: 'glucose', value: glucose, unit: 'mg/dL' },
        // Additional variables for comprehensive patient monitoring
        { type: 'bicarbonate', value: bicarbonate, unit: 'mEq/L' },
        { type: 'sodium', value: sodium, unit: 'mEq/L' },
        { type: 'chloride', value: chloride, unit: 'mEq/L' },
        { type: 'magnesium', value: magnesium, unit: 'mg/dL' },
        { type: 'uric_acid', value: uricAcid, unit: 'mg/dL' },
        { type: 'PTH', value: pth, unit: 'pg/mL' },
        { type: 'vitamin_d', value: vitaminD, unit: 'ng/mL' },
        { type: 'iron', value: iron, unit: 'µg/dL' },
        { type: 'ferritin', value: ferritin, unit: 'ng/mL' },
        { type: 'TSAT', value: tsat, unit: '%' }
      ];

      observations.forEach(obs => {
        allObservations.push([patient.id, obs.type, obs.value, obs.unit, observationDate, newMonth]);
      });
    }

    // Batch insert all observations in chunks to avoid PostgreSQL parameter limit (65535)
    // With 27 observations per patient * 6 params = 162 params per patient
    // Safe batch size: 65535 / 162 ≈ 404 patients at a time
    if (allObservations.length > 0) {
      const BATCH_SIZE = 400 * 27; // 400 patients * 27 observations = 10,800 rows per batch

      for (let i = 0; i < allObservations.length; i += BATCH_SIZE) {
        const batch = allObservations.slice(i, i + BATCH_SIZE);

        const values = batch.map((_obs, idx) => {
          const base = idx * 6;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, 'final')`;
        }).join(',');

        const params = batch.flat();

        await pool.query(`
          INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, month_number, status)
          VALUES ${values}
        `, params);
      }
    }

    // Calculate evolution summaries for each patient
    const patientsWithEvolution = await Promise.all(
      patients.map(async (patient) => {
        const currentMonth = patient.current_month >= 12 ? 12 : patient.current_month + 1;
        const previousMonth = patient.current_month === 0 ? 1 : patient.current_month;

        // Only generate evolution if we have a previous cycle to compare
        let evolutionSummary = 'new patient';
        if (patient.current_month > 0) {
          evolutionSummary = await generateEvolutionSummary(patient.id, currentMonth, previousMonth);
        }

        return {
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          ckd_severity: patient.ckd_severity,
          risk_level: patient.risk_level,
          evolution_summary: evolutionSummary
        };
      })
    );

    // For all other patients NOT in the advancing batch, ensure they stay at month 1
    // by copying their month 1 values if they exist
    let patientsReset = 0;
    if (advancingPatientIds.length > 0) {
      // Get all patients that have observations but are NOT in the advancing batch
      const otherPatientsResult = await pool.query(`
        SELECT DISTINCT patient_id
        FROM observations
        WHERE patient_id NOT IN (${advancingPatientIds.map((_, idx) => `$${idx + 1}`).join(',')})
      `, advancingPatientIds);

      for (const otherPatient of otherPatientsResult.rows) {
        const patientId = otherPatient.patient_id;

        // Get month 1 observations for this patient
        const month1Observations = await pool.query(`
          SELECT
            observation_type,
            value_numeric,
            value_text,
            unit,
            observation_date,
            notes,
            status
          FROM observations
          WHERE patient_id = $1 AND month_number = 1
        `, [patientId]);

        if (month1Observations.rows.length > 0) {
          // Delete all observations for this patient
          await pool.query(`
            DELETE FROM observations
            WHERE patient_id = $1
          `, [patientId]);

          // Re-insert month 1 observations
          const observations = month1Observations.rows;
          const values = observations.map((_obs, idx) => {
            const base = idx * 8;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
          }).join(',');

          const params: any[] = [];
          observations.forEach(obs => {
            params.push(
              patientId,
              obs.observation_type,
              obs.value_numeric,
              obs.value_text,
              obs.unit,
              obs.observation_date,
              obs.notes,
              1 // month_number = 1
            );
          });

          await pool.query(`
            INSERT INTO observations (patient_id, observation_type, value_numeric, value_text, unit, observation_date, notes, month_number)
            VALUES ${values}
          `, params);

          patientsReset++;
        }
      }
    }

    res.json({
      status: 'success',
      message: `Cycle advanced for ${patients.length} patients, ${patientsReset} patients reset to cycle 1`,
      data: {
        patients_processed: patients.length,
        patients_reset_to_month_1: patientsReset,
        batch_size: batchSize,
        observations_created: allObservations.length,
        selected_patients: patientsWithEvolution
      }
    });

  } catch (error) {
    console.error('[Patients API] Error advancing cycle:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to advance cycle',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Reset cycles - Copy last cycle to first and remove the rest
 * POST /api/patients/reset-cycles
 */
router.post('/reset-cycles', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    // Get all patients with their observations
    const patientsResult = await pool.query(`
      SELECT DISTINCT patient_id
      FROM observations
    `);

    const patients = patientsResult.rows;
    let totalProcessed = 0;
    let totalObservationsCopied = 0;

    for (const patient of patients) {
      const patientId = patient.patient_id;

      // Find the maximum month number for this patient
      const maxMonthResult = await pool.query(`
        SELECT MAX(month_number) as max_month
        FROM observations
        WHERE patient_id = $1
      `, [patientId]);

      const maxMonth = maxMonthResult.rows[0]?.max_month;

      if (!maxMonth || maxMonth === 0) {
        continue; // Skip patients with no valid observations
      }

      // Get all observations from the last cycle
      const lastCycleObservations = await pool.query(`
        SELECT
          observation_type,
          value_numeric,
          value_text,
          unit,
          observation_date,
          notes,
          status
        FROM observations
        WHERE patient_id = $1 AND month_number = $2
      `, [patientId, maxMonth]);

      if (lastCycleObservations.rows.length === 0) {
        continue;
      }

      // Delete all existing observations for this patient
      await pool.query(`
        DELETE FROM observations
        WHERE patient_id = $1
      `, [patientId]);

      // Insert observations as month 1
      const observations = lastCycleObservations.rows;
      const values = observations.map((_obs, idx) => {
        const base = idx * 8;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
      }).join(',');

      const params: any[] = [];
      observations.forEach(obs => {
        params.push(
          patientId,
          obs.observation_type,
          obs.value_numeric,
          obs.value_text,
          obs.unit,
          obs.observation_date,
          obs.notes,
          1 // month_number = 1
        );
      });

      await pool.query(`
        INSERT INTO observations (patient_id, observation_type, value_numeric, value_text, unit, observation_date, notes, month_number)
        VALUES ${values}
      `, params);

      totalProcessed++;
      totalObservationsCopied += observations.length;
    }

    res.json({
      status: 'success',
      message: `Cycles reset for ${totalProcessed} patients`,
      data: {
        patients_processed: totalProcessed,
        observations_copied: totalObservationsCopied
      }
    });

  } catch (error) {
    console.error('[Patients API] Error resetting cycles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset cycles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
