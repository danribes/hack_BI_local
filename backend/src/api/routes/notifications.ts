/**
 * Notifications API Routes
 *
 * Endpoints for managing doctor notifications about patient risk state changes
 */

import { Router, Request, Response } from 'express';
import { query } from '../../config/database';

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications with optional filtering
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      priority,
      patient_id,
      limit = '50',
      offset = '0'
    } = req.query;

    let sql = `
      SELECT
        dn.*,
        p.first_name,
        p.last_name,
        p.medical_record_number,
        p.monitoring_status
      FROM doctor_notifications dn
      JOIN patients p ON dn.patient_id = p.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND dn.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      sql += ` AND dn.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (patient_id) {
      sql += ` AND dn.patient_id = $${paramIndex}`;
      params.push(patient_id);
      paramIndex++;
    }

    sql += ` ORDER BY dn.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string, 10));
    params.push(parseInt(offset as string, 10));

    const result = await query(sql, params);

    // Get total count
    let countSql = `
      SELECT COUNT(*) as total
      FROM doctor_notifications dn
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status) {
      countSql += ` AND dn.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (priority) {
      countSql += ` AND dn.priority = $${countParamIndex}`;
      countParams.push(priority);
      countParamIndex++;
    }

    if (patient_id) {
      countSql += ` AND dn.patient_id = $${countParamIndex}`;
      countParams.push(patient_id);
    }

    const countResult = await query(countSql, countParams);

    res.json({
      status: 'success',
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total, 10),
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        count: result.rows.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/notifications/pending
 * Get pending notifications that need to be sent
 */
router.get('/pending', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT
        dn.*,
        p.first_name,
        p.last_name,
        p.medical_record_number
      FROM doctor_notifications dn
      JOIN patients p ON dn.patient_id = p.id
      WHERE dn.status = 'pending'
      ORDER BY
        CASE dn.priority
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MODERATE' THEN 3
          ELSE 4
        END,
        dn.created_at ASC
    `);

    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pending notifications:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch pending notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/notifications/:id
 * Get a specific notification by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        dn.*,
        p.first_name,
        p.last_name,
        p.medical_record_number,
        p.age,
        p.gender,
        prh.assessment_date,
        prh.risk_priority as current_risk_priority,
        prh.ckd_stage,
        prh.egfr
      FROM doctor_notifications dn
      JOIN patients p ON dn.patient_id = p.id
      LEFT JOIN patient_risk_history prh ON dn.risk_history_id = prh.id
      WHERE dn.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        error: 'Notification not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      status: 'success',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch notification',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/notifications/:id/acknowledge
 * Mark notification as acknowledged by doctor
 */
router.put('/:id/acknowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE doctor_notifications
      SET
        status = 'acknowledged',
        acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        error: 'Notification not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      status: 'success',
      data: result.rows[0],
      message: 'Notification acknowledged',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to acknowledge notification',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/notifications/stats/summary
 * Get notification statistics
 */
router.get('/stats/summary', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT
        status,
        priority,
        COUNT(*) as count
      FROM doctor_notifications
      GROUP BY status, priority
      ORDER BY
        CASE priority
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MODERATE' THEN 3
          ELSE 4
        END,
        status
    `);

    // Get total counts by status
    const statusCounts = await query(`
      SELECT
        status,
        COUNT(*) as count
      FROM doctor_notifications
      GROUP BY status
    `);

    // Get unacknowledged count
    const unacknowledgedResult = await query(`
      SELECT COUNT(*) as count
      FROM doctor_notifications
      WHERE status IN ('pending', 'sent', 'delivered', 'read')
    `);

    res.json({
      status: 'success',
      data: {
        by_priority_and_status: result.rows,
        by_status: statusCounts.rows,
        unacknowledged: parseInt(unacknowledgedResult.rows[0].count, 10)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch notification statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/notifications/patient/:patientId/history
 * Get notification history for a specific patient
 */
router.get('/patient/:patientId/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const result = await query(`
      SELECT
        dn.*,
        prh.assessment_date,
        prh.risk_priority,
        prh.severity_score
      FROM doctor_notifications dn
      LEFT JOIN patient_risk_history prh ON dn.risk_history_id = prh.id
      WHERE dn.patient_id = $1
      ORDER BY dn.created_at DESC
    `, [patientId]);

    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching patient notification history:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patient notification history',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
