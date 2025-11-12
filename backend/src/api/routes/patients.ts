import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';

const router = Router();

/**
 * GET /api/patients
 * Get all patients
 */
router.get('/', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    const result = await pool.query(`
      SELECT
        id,
        medical_record_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        email,
        phone,
        last_visit_date,
        created_at
      FROM patients
      ORDER BY last_name ASC, first_name ASC
    `);

    res.json({
      status: 'success',
      count: result.rows.length,
      patients: result.rows
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
 * Get a single patient by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const result = await pool.query(`
      SELECT *
      FROM patients
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.json({
      status: 'success',
      patient: result.rows[0]
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
