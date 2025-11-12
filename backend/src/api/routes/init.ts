import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';
import { classifyKDIGO, getCKDSeverity, getMonitoringFrequencyCategory } from '../../utils/kdigo';

const router = Router();

/**
 * POST /api/init/populate
 * Populate database with initial patient data
 */
router.post('/populate', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    // Check if patients already exist
    const checkResult = await pool.query('SELECT COUNT(*) FROM patients');
    const patientCount = parseInt(checkResult.rows[0].count);

    if (patientCount > 0) {
      return res.json({
        status: 'success',
        message: 'Database already contains patients',
        patient_count: patientCount
      });
    }

    console.log('Populating database with initial patients...');

    // Insert 5 initial patients
    await pool.query(`
      INSERT INTO patients (
        id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone,
        weight, height, smoking_status, cvd_history, family_history_esrd,
        on_ras_inhibitor, on_sglt2i, nephrotoxic_meds, nephrologist_referral,
        diagnosis_date, last_visit_date, next_visit_date
      ) VALUES
      (
        '11111111-1111-1111-1111-111111111111', 'MRN001', 'John', 'Anderson', '1958-03-15', 'male',
        'john.anderson@email.com', '+1-555-0101',
        92.5, 172, 'Former', true, false,
        true, false, true, false,
        '2022-05-20', '2025-10-15', '2025-11-28'
      ),
      (
        '22222222-2222-2222-2222-222222222222', 'MRN002', 'Maria', 'Rodriguez', '1965-07-22', 'female',
        'maria.rodriguez@email.com', '+1-555-0102',
        82.0, 162, 'Never', false, false,
        true, false, false, false,
        '2023-08-10', '2025-10-28', '2026-04-28'
      ),
      (
        '33333333-3333-3333-3333-333333333333', 'MRN003', 'David', 'Chen', '1980-11-08', 'male',
        'david.chen@email.com', '+1-555-0103',
        75.0, 178, 'Never', false, false,
        false, false, false, false,
        NULL, '2025-11-03', '2026-05-03'
      ),
      (
        '44444444-4444-4444-4444-444444444444', 'MRN004', 'Sarah', 'Johnson', '1952-05-30', 'female',
        'sarah.johnson@email.com', '+1-555-0104',
        78.5, 160, 'Current', true, true,
        true, true, false, true,
        '2021-03-15', '2025-11-02', '2025-11-20'
      ),
      (
        '55555555-5555-5555-5555-555555555555', 'MRN005', 'Michael', 'Brown', '1975-09-12', 'male',
        'michael.brown@email.com', '+1-555-0105',
        88.0, 180, 'Never', false, false,
        false, false, false, false,
        '2024-01-20', '2025-10-20', '2026-04-20'
      )
    `);

    // Get final count
    const finalResult = await pool.query('SELECT COUNT(*) FROM patients');
    const finalCount = parseInt(finalResult.rows[0].count);

    console.log(`✓ Database populated with ${finalCount} patients`);

    res.json({
      status: 'success',
      message: 'Database populated successfully',
      patient_count: finalCount
    });

  } catch (error) {
    console.error('[Init API] Error populating database:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to populate database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/init/status
 * Check database status
 */
/**
 * POST /api/init/migrate
 * Run database migrations to add missing columns
 */
router.post('/migrate', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    console.log('Running database migrations...');

    // Add monitoring and treatment columns if they don't exist
    await pool.query(`
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS home_monitoring_device VARCHAR(100);
    `);
    await pool.query(`
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS home_monitoring_active BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS ckd_treatment_active BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS ckd_treatment_type VARCHAR(100);
    `);

    // Update existing NULL values to defaults
    await pool.query(`
      UPDATE patients SET home_monitoring_active = false WHERE home_monitoring_active IS NULL;
    `);
    await pool.query(`
      UPDATE patients SET ckd_treatment_active = false WHERE ckd_treatment_active IS NULL;
    `);

    console.log('✓ Database migrations completed successfully');

    res.json({
      status: 'success',
      message: 'Database migrations completed successfully'
    });

  } catch (error) {
    console.error('[Init API] Error running migrations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to run database migrations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/init/populate-tracking-tables
 * Populate CKD and non-CKD patient tracking tables with risk factors and treatments
 */
router.post('/populate-tracking-tables', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    console.log('Populating patient tracking tables...');

    // Get all patients with their latest observations
    const patientsResult = await pool.query(`
      SELECT
        p.id,
        p.cvd_history,
        p.smoking_status,
        p.family_history_esrd,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'eGFR'
         ORDER BY observation_date DESC LIMIT 1) as latest_egfr,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'uACR'
         ORDER BY observation_date DESC LIMIT 1) as latest_uacr,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'BMI'
         ORDER BY observation_date DESC LIMIT 1) as latest_bmi,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'HbA1c'
         ORDER BY observation_date DESC LIMIT 1) as latest_hba1c
      FROM patients p
    `);

    const treatments = [
      { name: 'Jardiance (Empagliflozin)', class: 'SGLT2i' },
      { name: 'Farxiga (Dapagliflozin)', class: 'SGLT2i' },
      { name: 'Invokana (Canagliflozin)', class: 'SGLT2i' },
      { name: 'Kerendia (Finerenone)', class: 'MRA' },
      { name: 'Vicadrostat (Investigational)', class: 'Investigational' }
    ];

    let ckdPatientsProcessed = 0;
    let nonCkdPatientsProcessed = 0;

    for (const patient of patientsResult.rows) {
      const egfr = patient.latest_egfr || 90;
      const uacr = patient.latest_uacr || 15;

      const kdigo = classifyKDIGO(egfr, uacr);
      const monitoringFreq = getMonitoringFrequencyCategory(kdigo);

      if (kdigo.has_ckd) {
        // CKD Patient - Insert into ckd_patient_data
        const severity = getCKDSeverity(kdigo.ckd_stage);
        const isMonitored = kdigo.risk_level === 'high' || kdigo.risk_level === 'very_high';

        const ckdDataResult = await pool.query(`
          INSERT INTO ckd_patient_data (
            patient_id, ckd_severity, ckd_stage,
            kdigo_gfr_category, kdigo_albuminuria_category, kdigo_health_state,
            is_monitored, monitoring_device, monitoring_frequency
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (patient_id) DO UPDATE SET
            ckd_severity = EXCLUDED.ckd_severity,
            ckd_stage = EXCLUDED.ckd_stage,
            is_monitored = EXCLUDED.is_monitored,
            monitoring_frequency = EXCLUDED.monitoring_frequency,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          patient.id,
          severity,
          kdigo.ckd_stage,
          kdigo.gfr_category,
          kdigo.albuminuria_category,
          kdigo.health_state,
          isMonitored,
          isMonitored ? 'Minuteful Kidney Kit' : null,
          monitoringFreq
        ]);

        const ckdDataId = ckdDataResult.rows[0].id;

        // Assign treatment to all CKD patients
        const randomTreatment = treatments[Math.floor(Math.random() * treatments.length)];
        await pool.query(`
          INSERT INTO ckd_treatments (
            ckd_patient_data_id, treatment_name, treatment_class, is_active, start_date
          ) VALUES ($1, $2, $3, $4, CURRENT_DATE)
          ON CONFLICT DO NOTHING
        `, [ckdDataId, randomTreatment.name, randomTreatment.class, true]);

        // Update is_treated flag
        await pool.query(`
          UPDATE ckd_patient_data SET is_treated = true WHERE id = $1
        `, [ckdDataId]);

        ckdPatientsProcessed++;

      } else {
        // Non-CKD Patient - Insert into non_ckd_patient_data
        const riskLevel = kdigo.risk_level === 'very_high' ? 'high' : kdigo.risk_level;
        const isMonitored = kdigo.risk_level === 'high' || kdigo.risk_level === 'very_high';

        const nonCkdDataResult = await pool.query(`
          INSERT INTO non_ckd_patient_data (
            patient_id, risk_level, kdigo_health_state,
            is_monitored, monitoring_device, monitoring_frequency
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (patient_id) DO UPDATE SET
            risk_level = EXCLUDED.risk_level,
            is_monitored = EXCLUDED.is_monitored,
            monitoring_frequency = EXCLUDED.monitoring_frequency,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          patient.id,
          riskLevel,
          kdigo.health_state,
          isMonitored,
          isMonitored ? 'Minuteful Kidney Kit' : null,
          monitoringFreq
        ]);

        const nonCkdDataId = nonCkdDataResult.rows[0].id;

        // Add risk factors
        const riskFactors: Array<{ type: string; value: string; severity: string }> = [];

        if (patient.cvd_history) {
          riskFactors.push({ type: 'cardiovascular_disease', value: 'History of CVD', severity: 'moderate' });
        }

        if (patient.smoking_status === 'Current') {
          riskFactors.push({ type: 'smoking', value: 'Current smoker', severity: 'severe' });
        } else if (patient.smoking_status === 'Former') {
          riskFactors.push({ type: 'smoking', value: 'Former smoker', severity: 'mild' });
        }

        if (patient.family_history_esrd) {
          riskFactors.push({ type: 'family_history', value: 'Family history of ESRD', severity: 'moderate' });
        }

        if (patient.latest_bmi && patient.latest_bmi >= 30) {
          riskFactors.push({ type: 'obesity', value: `BMI ${patient.latest_bmi}`, severity: patient.latest_bmi >= 35 ? 'severe' : 'moderate' });
        }

        if (patient.latest_hba1c && patient.latest_hba1c >= 6.5) {
          riskFactors.push({ type: 'diabetes', value: `HbA1c ${patient.latest_hba1c}%`, severity: patient.latest_hba1c >= 8.0 ? 'severe' : 'moderate' });
        }

        // Insert risk factors
        for (const rf of riskFactors) {
          await pool.query(`
            INSERT INTO non_ckd_risk_factors (
              non_ckd_patient_data_id, risk_factor_type, risk_factor_value, severity
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [nonCkdDataId, rf.type, rf.value, rf.severity]);
        }

        nonCkdPatientsProcessed++;
      }
    }

    console.log(`✓ Processed ${ckdPatientsProcessed} CKD patients`);
    console.log(`✓ Processed ${nonCkdPatientsProcessed} non-CKD patients`);

    res.json({
      status: 'success',
      message: 'Patient tracking tables populated successfully',
      ckd_patients: ckdPatientsProcessed,
      non_ckd_patients: nonCkdPatientsProcessed
    });

  } catch (error) {
    console.error('[Init API] Error populating tracking tables:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to populate tracking tables',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/init/assign-monitoring-treatment
 * Assign monitoring and treatment based on risk classification (DEPRECATED - use populate-tracking-tables)
 */
router.post('/assign-monitoring-treatment', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    // Get all patients with their latest observations
    const patientsResult = await pool.query(`
      SELECT
        p.id,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'eGFR'
         ORDER BY observation_date DESC LIMIT 1) as latest_egfr,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'uACR'
         ORDER BY observation_date DESC LIMIT 1) as latest_uacr
      FROM patients p
    `);

    const treatments = [
      'Jardiance (Empagliflozin)',
      'Farxiga (Dapagliflozin)',
      'Invokana (Canagliflozin)',
      'Kerendia (Finerenone)',
      'Vicadrostat (Investigational)'
    ];

    let monitoringAssigned = 0;
    let treatmentAssigned = 0;

    for (const patient of patientsResult.rows) {
      const egfr = patient.latest_egfr || 90;
      const uacr = patient.latest_uacr || 15;

      const kdigo = classifyKDIGO(egfr, uacr);

      // Assign Minuteful Kidney Kit to all high-risk patients (CKD or non-CKD)
      if (kdigo.risk_level === 'high' || kdigo.risk_level === 'very_high') {
        await pool.query(`
          UPDATE patients
          SET home_monitoring_device = $1,
              home_monitoring_active = $2
          WHERE id = $3
        `, ['Minuteful Kidney Kit', true, patient.id]);
        monitoringAssigned++;
      }

      // Assign treatment to all CKD patients
      if (kdigo.has_ckd) {
        // Randomly assign one of the treatments
        const randomTreatment = treatments[Math.floor(Math.random() * treatments.length)];

        await pool.query(`
          UPDATE patients
          SET ckd_treatment_active = $1,
              ckd_treatment_type = $2
          WHERE id = $3
        `, [true, randomTreatment, patient.id]);
        treatmentAssigned++;
      }
    }

    console.log(`✓ Assigned monitoring to ${monitoringAssigned} high-risk patients`);
    console.log(`✓ Assigned treatment to ${treatmentAssigned} CKD patients`);

    res.json({
      status: 'success',
      message: 'Monitoring and treatment assigned successfully',
      monitoring_assigned: monitoringAssigned,
      treatment_assigned: treatmentAssigned
    });

  } catch (error) {
    console.error('[Init API] Error assigning monitoring/treatment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assign monitoring and treatment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/status', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    const patientResult = await pool.query('SELECT COUNT(*) FROM patients');
    const patientCount = parseInt(patientResult.rows[0].count);

    const observationResult = await pool.query('SELECT COUNT(*) FROM observations');
    const observationCount = parseInt(observationResult.rows[0].count);

    const conditionResult = await pool.query('SELECT COUNT(*) FROM conditions');
    const conditionCount = parseInt(conditionResult.rows[0].count);

    res.json({
      status: 'success',
      database: {
        patients: patientCount,
        observations: observationCount,
        conditions: conditionCount,
        is_empty: patientCount === 0
      }
    });

  } catch (error) {
    console.error('[Init API] Error checking status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check database status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/init/populate-realistic-cohort
 * Populate database with realistic patient distribution matching real-world prevalence
 * Body: { patient_count: number } (default: 1000)
 */
router.post('/populate-realistic-cohort', async (req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();
    const targetCount = req.body.patient_count || 1000;

    console.log(`Generating ${targetCount} patients with real-world prevalence...`);

    // Get current max MRN to avoid duplicates
    const maxMrnResult = await pool.query(`
      SELECT medical_record_number FROM patients
      WHERE medical_record_number ~ '^MRN[0-9]+$'
      ORDER BY CAST(SUBSTRING(medical_record_number FROM 4) AS INTEGER) DESC
      LIMIT 1
    `);

    let startingMrnNumber = 1;
    if (maxMrnResult.rows.length > 0) {
      const maxMrn = maxMrnResult.rows[0].medical_record_number;
      startingMrnNumber = parseInt(maxMrn.substring(3)) + 1;
      console.log(`Starting from MRN number: ${startingMrnNumber}`);
    }

    // Distribution based on real-world prevalence
    const distribution = {
      nonCkdLowModerate: Math.floor(targetCount * 0.245), // 24.5%
      nonCkdHigh: Math.floor(targetCount * 0.40), // 40%
      ckdMild: Math.floor(targetCount * 0.08), // 8%
      ckdModerate: Math.floor(targetCount * 0.25), // 25%
      ckdSevere: Math.floor(targetCount * 0.02), // 2%
      ckdKidneyFailure: Math.floor(targetCount * 0.005) // 0.5%
    };

    // Monitoring/treatment percentages
    const nonCkdHighMonitoredPercent = 0.60; // 60% of high-risk non-CKD
    const ckdMonitoredPercent = 0.90; // 90% of all CKD
    const ckdTreatedPercent = 0.80; // 80% of all CKD

    const treatments = [
      { name: 'Jardiance (Empagliflozin)', class: 'SGLT2i' },
      { name: 'Farxiga (Dapagliflozin)', class: 'SGLT2i' },
      { name: 'Invokana (Canagliflozin)', class: 'SGLT2i' },
      { name: 'Kerendia (Finerenone)', class: 'MRA' },
      { name: 'Vicadrostat (Investigational)', class: 'Investigational' }
    ];

    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Donald', 'Margaret', 'Mark', 'Sandra', 'Paul', 'Ashley', 'Steven', 'Kimberly', 'Andrew', 'Emily', 'Kenneth', 'Donna', 'Joshua', 'Michelle'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

    let patientsCreated = 0;
    const today = new Date();

    // Helper function to generate patient
    const generatePatient = async (category: string, _index: number) => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const gender = Math.random() > 0.5 ? 'male' : 'female';

      // Age 66-90 with random variation
      const age = 66 + Math.floor(Math.random() * 25);
      const birthYear = today.getFullYear() - age;
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const dateOfBirth = new Date(birthYear, birthMonth, birthDay);

      // Generate labs based on category
      let egfr: number, uacr: number, severity: string | null, ckdStage: number | null;
      let riskLevel: string | null, isMonitored: boolean, isTreated: boolean;

      switch (category) {
        case 'nonCkdLowModerate':
          egfr = 75 + Math.random() * 30; // 75-105
          uacr = Math.random() * 25; // 0-25
          severity = null;
          ckdStage = null;
          riskLevel = Math.random() > 0.5 ? 'low' : 'moderate';
          isMonitored = false;
          isTreated = false;
          break;

        case 'nonCkdHigh':
          egfr = 60 + Math.random() * 20; // 60-80
          uacr = 30 + Math.random() * 270; // 30-300
          severity = null;
          ckdStage = null;
          riskLevel = 'high';
          isMonitored = Math.random() < nonCkdHighMonitoredPercent;
          isTreated = false;
          break;

        case 'ckdMild':
          egfr = 65 + Math.random() * 25; // 65-90
          uacr = 30 + Math.random() * 70; // 30-100
          severity = 'mild';
          ckdStage = Math.random() > 0.5 ? 1 : 2;
          riskLevel = null;
          isMonitored = Math.random() < ckdMonitoredPercent;
          isTreated = Math.random() < ckdTreatedPercent;
          break;

        case 'ckdModerate':
          egfr = 30 + Math.random() * 30; // 30-60
          uacr = 30 + Math.random() * 270; // 30-300
          severity = 'moderate';
          ckdStage = 3;
          riskLevel = null;
          isMonitored = Math.random() < ckdMonitoredPercent;
          isTreated = Math.random() < ckdTreatedPercent;
          break;

        case 'ckdSevere':
          egfr = 15 + Math.random() * 15; // 15-30
          uacr = 100 + Math.random() * 400; // 100-500
          severity = 'severe';
          ckdStage = 4;
          riskLevel = null;
          isMonitored = Math.random() < ckdMonitoredPercent;
          isTreated = Math.random() < ckdTreatedPercent;
          break;

        case 'ckdKidneyFailure':
          egfr = 5 + Math.random() * 10; // 5-15
          uacr = 300 + Math.random() * 200; // 300-500
          severity = 'kidney_failure';
          ckdStage = 5;
          riskLevel = null;
          isMonitored = true; // All kidney failure patients monitored
          isTreated = true; // All kidney failure patients treated
          break;

        default:
          throw new Error('Invalid category');
      }

      // Insert patient
      const patientResult = await pool.query(`
        INSERT INTO patients (
          medical_record_number, first_name, last_name, date_of_birth, gender,
          email, phone, last_visit_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        `MRN${String(startingMrnNumber + patientsCreated).padStart(6, '0')}`,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
      ]);

      const newPatientId = patientResult.rows[0].id;

      // Insert observations
      await pool.query(`
        INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status)
        VALUES
          ($1, 'eGFR', $2, 'mL/min/1.73m²', $3, 'final'),
          ($1, 'uACR', $4, 'mg/g', $3, 'final')
      `, [newPatientId, egfr, today, uacr]);

      // Calculate KDIGO for health state
      const kdigo = classifyKDIGO(egfr, uacr);
      const monitoringFreq = getMonitoringFrequencyCategory(kdigo);

      // Insert into appropriate tracking table
      if (severity) {
        // CKD patient
        const ckdDataResult = await pool.query(`
          INSERT INTO ckd_patient_data (
            patient_id, ckd_severity, ckd_stage,
            kdigo_gfr_category, kdigo_albuminuria_category, kdigo_health_state,
            is_monitored, monitoring_device, monitoring_frequency, is_treated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          newPatientId, severity, ckdStage,
          kdigo.gfr_category, kdigo.albuminuria_category, kdigo.health_state,
          isMonitored, isMonitored ? 'Minuteful Kidney Kit' : null, monitoringFreq, isTreated
        ]);

        // Add treatment if treated
        if (isTreated) {
          const randomTreatment = treatments[Math.floor(Math.random() * treatments.length)];
          await pool.query(`
            INSERT INTO ckd_treatments (
              ckd_patient_data_id, treatment_name, treatment_class, is_active, start_date
            ) VALUES ($1, $2, $3, true, $4)
          `, [ckdDataResult.rows[0].id, randomTreatment.name, randomTreatment.class, today]);
        }
      } else {
        // Non-CKD patient
        await pool.query(`
          INSERT INTO non_ckd_patient_data (
            patient_id, risk_level, kdigo_health_state,
            is_monitored, monitoring_device, monitoring_frequency
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          newPatientId, riskLevel, kdigo.health_state,
          isMonitored, isMonitored ? 'Minuteful Kidney Kit' : null, monitoringFreq
        ]);
      }

      patientsCreated++;
      if (patientsCreated % 100 === 0) {
        console.log(`✓ Created ${patientsCreated} patients...`);
      }
    };

    // Generate patients for each category
    console.log('Generating Non-CKD Low/Moderate Risk patients...');
    for (let i = 0; i < distribution.nonCkdLowModerate; i++) {
      await generatePatient('nonCkdLowModerate', i);
    }

    console.log('Generating Non-CKD High Risk patients...');
    for (let i = 0; i < distribution.nonCkdHigh; i++) {
      await generatePatient('nonCkdHigh', i);
    }

    console.log('Generating Mild CKD patients...');
    for (let i = 0; i < distribution.ckdMild; i++) {
      await generatePatient('ckdMild', i);
    }

    console.log('Generating Moderate CKD patients...');
    for (let i = 0; i < distribution.ckdModerate; i++) {
      await generatePatient('ckdModerate', i);
    }

    console.log('Generating Severe CKD patients...');
    for (let i = 0; i < distribution.ckdSevere; i++) {
      await generatePatient('ckdSevere', i);
    }

    console.log('Generating Kidney Failure patients...');
    for (let i = 0; i < distribution.ckdKidneyFailure; i++) {
      await generatePatient('ckdKidneyFailure', i);
    }

    console.log(`✓ Successfully created ${patientsCreated} patients with realistic distribution`);

    res.json({
      status: 'success',
      message: 'Realistic patient cohort generated successfully',
      patients_created: patientsCreated,
      distribution: {
        'Non-CKD Low/Moderate Risk': distribution.nonCkdLowModerate,
        'Non-CKD High Risk': distribution.nonCkdHigh,
        'Mild CKD': distribution.ckdMild,
        'Moderate CKD': distribution.ckdModerate,
        'Severe CKD': distribution.ckdSevere,
        'Kidney Failure': distribution.ckdKidneyFailure
      },
      monitoring_treatment: {
        'Non-CKD High Risk Monitored': `${nonCkdHighMonitoredPercent * 100}%`,
        'CKD Monitored': `${ckdMonitoredPercent * 100}%`,
        'CKD Treated': `${ckdTreatedPercent * 100}%`
      }
    });

  } catch (error) {
    console.error('[Init API] Error populating realistic cohort:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to populate realistic cohort',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/init/update-patient-ages
 * Update all patient ages to be over 65 with random variation
 */
router.post('/update-patient-ages', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    console.log('Updating patient ages to 65+ with random variation...');

    // Get all patients
    const patientsResult = await pool.query('SELECT id, first_name, last_name, date_of_birth FROM patients');

    let updatedCount = 0;
    const today = new Date();

    for (const patient of patientsResult.rows) {
      // Calculate random age between 66 and 90 years old
      const randomAge = 66 + Math.floor(Math.random() * 25); // 66-90 years

      // Calculate new date of birth
      const birthYear = today.getFullYear() - randomAge;
      const birthMonth = Math.floor(Math.random() * 12); // 0-11
      const birthDay = Math.floor(Math.random() * 28) + 1; // 1-28 (safe for all months)

      const newDateOfBirth = new Date(birthYear, birthMonth, birthDay);

      // Update patient's date of birth
      await pool.query(
        'UPDATE patients SET date_of_birth = $1 WHERE id = $2',
        [newDateOfBirth, patient.id]
      );

      updatedCount++;

      console.log(`✓ Updated ${patient.first_name} ${patient.last_name}: Age ${randomAge}`);
    }

    console.log(`✓ Updated ${updatedCount} patients to ages 65+`);

    res.json({
      status: 'success',
      message: 'All patient ages updated to 65+ with random variation',
      patients_updated: updatedCount,
      age_range: '66-90 years'
    });

  } catch (error) {
    console.error('[Init API] Error updating patient ages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update patient ages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
