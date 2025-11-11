/**
 * Progression Tracking API Routes
 *
 * Endpoints for KDIGO health state progression monitoring
 */

import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';
import { runProgressionMonitoring } from '../../services/progressionMonitor';
import { classifyKDIGOHealthState } from '../../services/kdigoClassifier';

const router = Router();

/**
 * GET /api/progression/patient/:patientId
 * Get progression history for a specific patient
 */
router.get('/patient/:patientId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { patientId } = req.params;
    const { months = 24 } = req.query;

    const pool = getPool();

    // Get patient info
    const patientResult = await pool.query(`
      SELECT id, medical_record_number, first_name, last_name, date_of_birth
      FROM patients
      WHERE id = $1
    `, [patientId]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patientResult.rows[0];

    // Get progression history
    const historyResult = await pool.query(`
      SELECT *
      FROM health_state_history
      WHERE patient_id = $1
      AND measured_at >= NOW() - ($2 || ' months')::INTERVAL
      ORDER BY measured_at ASC
    `, [patientId, months]);

    // Get transitions
    const transitionsResult = await pool.query(`
      SELECT *
      FROM state_transitions
      WHERE patient_id = $1
      AND transition_date >= NOW() - ($2 || ' months')::INTERVAL
      ORDER BY transition_date DESC
    `, [patientId, months]);

    // Get active alerts
    const alertsResult = await pool.query(`
      SELECT *
      FROM monitoring_alerts
      WHERE patient_id = $1
      AND status = 'active'
      ORDER BY generated_at DESC
    `, [patientId]);

    // Get pending recommendations
    const recommendationsResult = await pool.query(`
      SELECT *
      FROM action_recommendations
      WHERE patient_id = $1
      AND status = 'pending'
      ORDER BY priority ASC, generated_at DESC
    `, [patientId]);

    res.json({
      patient,
      progression_history: historyResult.rows,
      transitions: transitionsResult.rows,
      active_alerts: alertsResult.rows,
      pending_recommendations: recommendationsResult.rows,
      summary: {
        total_measurements: historyResult.rows.length,
        total_transitions: transitionsResult.rows.length,
        active_alerts_count: alertsResult.rows.length,
        pending_recommendations_count: recommendationsResult.rows.length,
        current_state: historyResult.rows.length > 0 ?
          historyResult.rows[historyResult.rows.length - 1].health_state : null,
        baseline_state: historyResult.rows.length > 0 ?
          historyResult.rows[0].health_state : null
      }
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to get progression history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/progression/alerts
 * Get all active alerts across all patients
 */
router.get('/alerts', async (req: Request, res: Response): Promise<any> => {
  try {
    const { severity, status = 'active', limit = 100 } = req.query;

    const pool = getPool();

    let query = `
      SELECT
        a.*,
        p.medical_record_number,
        p.first_name,
        p.last_name
      FROM monitoring_alerts a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.status = $1
    `;

    const params: any[] = [status];

    if (severity) {
      query += ` AND a.severity = $${params.length + 1}`;
      params.push(severity);
    }

    query += ` ORDER BY a.priority ASC, a.generated_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      alerts: result.rows,
      total_count: result.rows.length,
      filters: { severity, status }
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to get alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/progression/recommendations
 * Get pending recommendations across all patients
 */
router.get('/recommendations', async (req: Request, res: Response): Promise<any> => {
  try {
    const { type, urgency, status = 'pending', limit = 100 } = req.query;

    const pool = getPool();

    let query = `
      SELECT
        r.*,
        p.medical_record_number,
        p.first_name,
        p.last_name
      FROM action_recommendations r
      JOIN patients p ON r.patient_id = p.id
      WHERE r.status = $1
    `;

    const params: any[] = [status];

    if (type) {
      query += ` AND r.recommendation_type = $${params.length + 1}`;
      params.push(type);
    }

    if (urgency) {
      query += ` AND r.urgency = $${params.length + 1}`;
      params.push(urgency);
    }

    query += ` ORDER BY r.priority ASC, r.generated_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      recommendations: result.rows,
      total_count: result.rows.length,
      filters: { type, urgency, status }
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/progression/summary
 * Get system-wide progression summary
 */
router.get('/summary', async (req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    // Get counts by risk level
    const riskDistResult = await pool.query(`
      SELECT
        risk_level,
        COUNT(*) as patient_count
      FROM (
        SELECT DISTINCT ON (patient_id)
          patient_id,
          risk_level
        FROM health_state_history
        ORDER BY patient_id, measured_at DESC
      ) latest
      GROUP BY risk_level
      ORDER BY
        CASE risk_level
          WHEN 'low' THEN 1
          WHEN 'moderate' THEN 2
          WHEN 'high' THEN 3
          WHEN 'very_high' THEN 4
        END
    `);

    // Get transition stats
    const transitionStatsResult = await pool.query(`
      SELECT
        COUNT(*) as total_transitions,
        COUNT(CASE WHEN change_type = 'worsened' THEN 1 END) as worsening_count,
        COUNT(CASE WHEN change_type = 'improved' THEN 1 END) as improving_count,
        COUNT(CASE WHEN crossed_critical_threshold THEN 1 END) as critical_threshold_count
      FROM state_transitions
    `);

    // Get alert stats
    const alertStatsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_alerts,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'active') as critical_alerts,
        COUNT(*) FILTER (WHERE severity = 'warning' AND status = 'active') as warning_alerts
      FROM monitoring_alerts
    `);

    // Get recommendation stats
    const recStatsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_recommendations,
        COUNT(*) FILTER (WHERE urgency = 'urgent' AND status = 'pending') as urgent_recommendations
      FROM action_recommendations
    `);

    // Get patients requiring urgent attention
    const urgentPatientsResult = await pool.query(`
      SELECT DISTINCT
        p.id,
        p.medical_record_number,
        p.first_name,
        p.last_name,
        COUNT(DISTINCT a.id) as alert_count,
        COUNT(DISTINCT r.id) as recommendation_count
      FROM patients p
      INNER JOIN monitoring_alerts a ON p.id = a.patient_id AND a.status = 'active' AND a.severity = 'critical'
      LEFT JOIN action_recommendations r ON p.id = r.patient_id AND r.status = 'pending'
      GROUP BY p.id, p.medical_record_number, p.first_name, p.last_name
      ORDER BY alert_count DESC, recommendation_count DESC
      LIMIT 20
    `);

    res.json({
      risk_distribution: riskDistResult.rows,
      transition_stats: transitionStatsResult.rows[0],
      alert_stats: alertStatsResult.rows[0],
      recommendation_stats: recStatsResult.rows[0],
      patients_requiring_urgent_attention: urgentPatientsResult.rows,
      generated_at: new Date()
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to get summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/progression/run-monitoring
 * Run the progression monitoring cycle
 */
router.post('/run-monitoring', async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('[Progression API] Starting monitoring cycle...');

    const results = await runProgressionMonitoring();

    res.json({
      status: 'success',
      message: 'Progression monitoring completed',
      results,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to run monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/progression/classify
 * Classify a patient's KDIGO health state from lab values
 */
router.post('/classify', async (req: Request, res: Response): Promise<any> => {
  try {
    const { egfr, uacr } = req.body;

    if (!egfr || typeof egfr !== 'number') {
      return res.status(400).json({ error: 'eGFR value required' });
    }

    const classification = classifyKDIGOHealthState(egfr, uacr || null);

    res.json({
      classification,
      input: { egfr, uacr: uacr || null }
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to classify',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/progression/alerts/:alertId
 * Update alert status (acknowledge, resolve, dismiss)
 */
router.patch('/alerts/:alertId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { alertId } = req.params;
    const { status, acknowledged_by, action_taken } = req.body;

    if (!status || !['acknowledged', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const pool = getPool();

    const updateFields: string[] = ['status = $2'];
    const params: any[] = [alertId, status];

    if (acknowledged_by) {
      updateFields.push(`acknowledged_by = $${params.length + 1}`);
      params.push(acknowledged_by);
      updateFields.push(`acknowledged_at = NOW()`);
    }

    if (status === 'resolved') {
      updateFields.push(`resolved_at = NOW()`);
    }

    if (action_taken) {
      updateFields.push(`action_taken = $${params.length + 1}`);
      params.push(action_taken);
      updateFields.push(`action_taken_at = NOW()`);
    }

    const result = await pool.query(`
      UPDATE monitoring_alerts
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      status: 'success',
      alert: result.rows[0]
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to update alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/progression/recommendations/:recommendationId
 * Update recommendation status
 */
router.patch('/recommendations/:recommendationId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { recommendationId } = req.params;
    const { status, implemented_by, completion_notes, outcome } = req.body;

    if (!status || !['in_progress', 'completed', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const pool = getPool();

    const updateFields: string[] = ['status = $2'];
    const params: any[] = [recommendationId, status];

    if (implemented_by) {
      updateFields.push(`implemented_by = $${params.length + 1}`);
      params.push(implemented_by);
      updateFields.push(`implemented_at = NOW()`);
    }

    if (completion_notes) {
      updateFields.push(`completion_notes = $${params.length + 1}`);
      params.push(completion_notes);
    }

    if (outcome) {
      updateFields.push(`outcome = $${params.length + 1}`);
      params.push(outcome);
    }

    const result = await pool.query(`
      UPDATE action_recommendations
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({
      status: 'success',
      recommendation: result.rows[0]
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to update recommendation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
