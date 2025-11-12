import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';

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

export default router;
