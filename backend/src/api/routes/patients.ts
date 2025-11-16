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

    // Extract vital signs from observations for backward compatibility
    const observations = observationsResult.rows;
    const systolicBP = observations.find(o => o.observation_type === 'blood_pressure_systolic');
    const diastolicBP = observations.find(o => o.observation_type === 'blood_pressure_diastolic');
    const heartRate = observations.find(o => o.observation_type === 'heart_rate');
    const oxygenSat = observations.find(o => o.observation_type === 'oxygen_saturation');
    const bmiObs = observations.find(o => o.observation_type === 'BMI');

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

/**
 * POST /api/patients/:id/simulate-new-labs
 * Simulate new random lab values for a single patient
 * This triggers AI assessment of the patient with the new values
 */
router.post('/:id/simulate-new-labs', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: patientId } = req.params;
    const pool = getPool();

    // Get patient info to determine current state
    const patientResult = await pool.query(`
      SELECT p.*, cpd.ckd_stage, cpd.ckd_severity
      FROM patients p
      LEFT JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
      WHERE p.id = $1
    `, [patientId]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    const patient = patientResult.rows[0];

    // Determine current max month number for this patient
    const monthResult = await pool.query(`
      SELECT COALESCE(MAX(month_number), 0) as current_month
      FROM observations
      WHERE patient_id = $1
    `, [patientId]);

    const currentMonth = monthResult.rows[0].current_month;
    const newMonth = currentMonth >= 12 ? 12 : currentMonth + 1;

    // If we're at month 12 and advancing, we need to handle the rollover
    if (currentMonth === 12) {
      // Copy month 12 to month 1 and delete months 2-12
      await pool.query(`
        DELETE FROM observations
        WHERE patient_id = $1 AND month_number BETWEEN 2 AND 12
      `, [patientId]);

      await pool.query(`
        UPDATE observations
        SET month_number = 1
        WHERE patient_id = $1 AND month_number = 12
      `, [patientId]);
    }

    // Generate realistic lab values based on patient state
    const ckdStage = patient.ckd_stage || 2;
    const hasDiabetes = patient.on_sglt2i || Math.random() > 0.5;

    // eGFR based on CKD stage with some variation
    let baseEGFR;
    switch (ckdStage) {
      case 5: baseEGFR = 10 + Math.random() * 5; break;
      case 4: baseEGFR = 15 + Math.random() * 15; break;
      case 3: baseEGFR = 30 + Math.random() * 30; break;
      case 2: baseEGFR = 60 + Math.random() * 29; break;
      default: baseEGFR = 90 + Math.random() * 30; break;
    }
    const eGFR = Number(baseEGFR.toFixed(1));

    // Creatinine inversely related to eGFR
    const creatinine = Number((175 / (eGFR + 50) + 0.3).toFixed(2));

    // BUN
    const bun = Number((7 + Math.random() * 25).toFixed(1));

    // uACR - higher in later stages
    const baseUACR = ckdStage >= 3 ? 30 + Math.random() * 300 : Math.random() * 50;
    const uacr = Number(baseUACR.toFixed(1));

    // Blood pressure
    const systolic = Math.floor(110 + Math.random() * 50);
    const diastolic = Math.floor(65 + Math.random() * 30);

    // Metabolic panel
    const hemoglobin = Number((11 + Math.random() * 6).toFixed(1));
    const potassium = Number((3.5 + Math.random() * 2).toFixed(1));
    const calcium = Number((8.5 + Math.random() * 2).toFixed(1));
    const phosphorus = Number((2.5 + Math.random() * 3).toFixed(1));
    const albumin = Number((3.0 + Math.random() * 2).toFixed(1));

    // Lipid panel
    const ldl = Number((70 + Math.random() * 120).toFixed(0));
    const hdl = Number((30 + Math.random() * 50).toFixed(0));
    const totalCholesterol = Number((ldl + hdl + Math.random() * 50).toFixed(0));
    const triglycerides = Number((50 + Math.random() * 200).toFixed(0));

    // Diabetes markers (if applicable)
    const hba1c = hasDiabetes ? Number((5.7 + Math.random() * 5).toFixed(1)) : Number((4.5 + Math.random() * 1).toFixed(1));
    const glucose = hasDiabetes ? Number((100 + Math.random() * 150).toFixed(0)) : Number((70 + Math.random() * 40).toFixed(0));

    // Insert new observations
    const observationDate = new Date();
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
      { type: 'glucose', value: glucose, unit: 'mg/dL' }
    ];

    for (const obs of observations) {
      await pool.query(`
        INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, month_number, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'final')
      `, [patientId, obs.type, obs.value, obs.unit, observationDate, newMonth]);
    }

    res.json({
      status: 'success',
      message: `New lab values simulated for month ${newMonth}`,
      data: {
        month: newMonth,
        patient_id: patientId,
        observation_count: observations.length,
        key_values: {
          eGFR,
          creatinine,
          uacr,
          hba1c
        }
      }
    });

  } catch (error) {
    console.error('[Patients API] Error simulating lab values:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to simulate lab values',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/patients/advance-cycle
 * Advance all patients to the next cycle/month
 * - Generates new lab values for all patients
 * - If at month 12, copies month 12 to month 1 and clears months 2-12
 * - Otherwise, increments the cycle counter
 * Query params:
 *   - batch_size: number of patients to process (default: 50, max: 200)
 */
router.post('/advance-cycle', async (req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();
    const batchSize = Math.min(parseInt(req.query.batch_size as string) || 50, 200);

    // Get all patients with their current month
    const patientsResult = await pool.query(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        cpd.ckd_stage,
        cpd.ckd_severity,
        COALESCE(MAX(o.month_number), 0) as current_month
      FROM patients p
      LEFT JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
      LEFT JOIN observations o ON p.id = o.patient_id
      GROUP BY p.id, p.first_name, p.last_name, cpd.ckd_stage, cpd.ckd_severity
      LIMIT $1
    `, [batchSize]);

    const patients = patientsResult.rows;

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
        { type: 'glucose', value: glucose, unit: 'mg/dL' }
      ];

      observations.forEach(obs => {
        allObservations.push([patient.id, obs.type, obs.value, obs.unit, observationDate, newMonth]);
      });
    }

    // Batch insert all observations at once
    if (allObservations.length > 0) {
      const values = allObservations.map((_obs, idx) => {
        const base = idx * 6;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, 'final')`;
      }).join(',');

      const params = allObservations.flat();

      await pool.query(`
        INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, month_number, status)
        VALUES ${values}
      `, params);
    }

    res.json({
      status: 'success',
      message: `Cycle advanced for ${patients.length} patients`,
      data: {
        patients_processed: patients.length,
        batch_size: batchSize,
        observations_created: allObservations.length
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

export default router;
