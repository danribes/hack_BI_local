/**
 * Progression Tracking API Routes
 *
 * Endpoints for KDIGO health state progression monitoring
 */

import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';
import { runProgressionMonitoring } from '../../services/progressionMonitor';
import { classifyKDIGOHealthState } from '../../services/kdigoClassifier';
import { initializeBaseline, generateNextCycle, getProgressionState } from '../../services/dynamicProgressionGenerator';
import { advanceCohortCycle } from '../../services/enhancedProgressionGenerator';

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
router.get('/summary', async (_req: Request, res: Response): Promise<any> => {
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
router.post('/run-monitoring', async (_req: Request, res: Response): Promise<any> => {
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

/**
 * POST /api/progression/patient/:patientId/initialize
 * Initialize baseline (cycle 0) for a patient
 */
router.post('/patient/:patientId/initialize', async (req: Request, res: Response): Promise<any> => {
  try {
    const { patientId } = req.params;

    console.log(`[Progression API] Initializing baseline for patient ${patientId}...`);

    const baseline = await initializeBaseline(patientId);

    res.json({
      status: 'success',
      message: 'Baseline initialized',
      cycle: baseline,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to initialize baseline',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/progression/patient/:patientId/next-cycle
 * Generate the next cycle for a patient
 * Body: { currentCycle: number }
 */
router.post('/patient/:patientId/next-cycle', async (req: Request, res: Response): Promise<any> => {
  try {
    const { patientId } = req.params;
    const { currentCycle } = req.body;

    if (typeof currentCycle !== 'number' || currentCycle < 0 || currentCycle > 23) {
      return res.status(400).json({ error: 'Invalid currentCycle. Must be between 0 and 23.' });
    }

    console.log(`[Progression API] Generating cycle ${currentCycle + 1} for patient ${patientId}...`);

    const nextCycle = await generateNextCycle(patientId, currentCycle);

    res.json({
      status: 'success',
      message: `Cycle ${nextCycle.cycle_number} generated`,
      cycle: nextCycle,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to generate next cycle',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/progression/patient/:patientId/state
 * Get progression state (progression type, decline rates) for a patient
 */
router.get('/patient/:patientId/state', async (req: Request, res: Response): Promise<any> => {
  try {
    const { patientId } = req.params;

    const state = await getProgressionState(patientId);

    res.json({
      status: 'success',
      progression_state: state
    });

  } catch (error) {
    console.error('[Progression API] Error:', error);
    res.status(500).json({
      error: 'Failed to get progression state',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/progression/advance-cycle
 * Advance the entire cohort by one cycle (Next Cycle button)
 * Generates data for ALL patients for the next cycle
 */
router.post('/advance-cycle', async (_req: Request, res: Response): Promise<any> => {
  try {
    console.log('[Progression API] Advancing cohort cycle...');

    const startTime = Date.now();
    const result = await advanceCohortCycle();
    const duration = Date.now() - startTime;

    res.json({
      status: 'success',
      message: `Successfully advanced to cycle ${result.new_cycle}`,
      result: {
        new_cycle: result.new_cycle,
        patients_processed: result.patients_processed,
        transitions_detected: result.transitions_detected,
        alerts_generated: result.alerts_generated,
        treatment_changes: result.treatment_changes,
        processing_time_ms: duration
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[Progression API] Error advancing cycle:', error);
    res.status(500).json({
      error: 'Failed to advance cycle',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/progression/current-cycle
 * Get the current system cycle number
 */
router.get('/current-cycle', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    const result = await pool.query('SELECT * FROM cycle_metadata WHERE id = 1');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cycle metadata not found' });
    }

    res.json({
      status: 'success',
      cycle_metadata: result.rows[0]
    });

  } catch (error) {
    console.error('[Progression API] Error getting current cycle:', error);
    res.status(500).json({
      error: 'Failed to get current cycle',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/progression/reset-simulation
 * Reset the simulation to cycle 0 (clear all progression data)
 */
router.post('/reset-simulation', async (_req: Request, res: Response): Promise<any> => {
  try {
    console.log('[Progression API] Resetting simulation...');

    const pool = getPool();

    // Clear all progression data
    await pool.query('DELETE FROM adherence_history');
    await pool.query('DELETE FROM monitoring_alerts');
    await pool.query('DELETE FROM state_transitions');
    await pool.query('DELETE FROM health_state_history');
    await pool.query('DELETE FROM patient_treatments');
    await pool.query('DELETE FROM treatment_recommendations');
    await pool.query('DELETE FROM patient_progression_state');

    // Reset cycle to 0
    await pool.query(`
      UPDATE cycle_metadata
      SET current_cycle = 0,
          last_advance_date = NULL,
          simulation_start_date = NOW(),
          updated_at = NOW()
      WHERE id = 1
    `);

    res.json({
      status: 'success',
      message: 'Simulation reset to cycle 0',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[Progression API] Error resetting simulation:', error);
    res.status(500).json({
      error: 'Failed to reset simulation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/progression/patient/:patientId/treatments
 * Get active treatments for a patient
 */
router.get('/patient/:patientId/treatments', async (req: Request, res: Response): Promise<any> => {
  try {
    const { patientId } = req.params;
    const pool = getPool();

    const treatmentsResult = await pool.query(`
      SELECT *
      FROM patient_treatments
      WHERE patient_id = $1
      ORDER BY started_cycle DESC
    `, [patientId]);

    const adherenceResult = await pool.query(`
      SELECT ah.*, pt.medication_name, pt.medication_class
      FROM adherence_history ah
      JOIN patient_treatments pt ON ah.treatment_id = pt.id
      WHERE ah.patient_id = $1
      ORDER BY ah.cycle_number DESC
      LIMIT 24
    `, [patientId]);

    res.json({
      status: 'success',
      treatments: treatmentsResult.rows,
      adherence_history: adherenceResult.rows
    });

  } catch (error) {
    console.error('[Progression API] Error getting treatments:', error);
    res.status(500).json({
      error: 'Failed to get treatments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/progression/patient/:patientId/start-treatment
 * Manually start a treatment for a patient
 */
router.post('/patient/:patientId/start-treatment', async (req: Request, res: Response): Promise<any> => {
  try {
    const { patientId } = req.params;
    const { medication_name, medication_class, adherence = 0.8 } = req.body;

    if (!medication_name || !medication_class) {
      return res.status(400).json({ error: 'medication_name and medication_class are required' });
    }

    const pool = getPool();

    // Get current cycle
    const cycleResult = await pool.query('SELECT current_cycle FROM cycle_metadata WHERE id = 1');
    const currentCycle = cycleResult.rows[0].current_cycle;

    // Treatment effects
    const treatmentEffects: { [key: string]: { egfr: number; uacr: number } } = {
      RAS_INHIBITOR: { egfr: 1.0, uacr: 0.30 },
      SGLT2I: { egfr: 1.75, uacr: 0.375 },
      GLP1_RA: { egfr: 0.65, uacr: 0.225 }
    };

    const effect = treatmentEffects[medication_class] || { egfr: 0.5, uacr: 0.20 };

    // Insert treatment
    const result = await pool.query(`
      INSERT INTO patient_treatments (
        patient_id,
        medication_name,
        medication_class,
        started_cycle,
        started_date,
        status,
        baseline_adherence,
        current_adherence,
        expected_egfr_benefit,
        expected_uacr_reduction
      ) VALUES ($1, $2, $3, $4, NOW(), 'active', $5, $5, $6, $7)
      RETURNING *
    `, [patientId, medication_name, medication_class, currentCycle, adherence, effect.egfr, effect.uacr]);

    res.json({
      status: 'success',
      message: `Treatment ${medication_name} started`,
      treatment: result.rows[0]
    });

  } catch (error) {
    console.error('[Progression API] Error starting treatment:', error);
    res.status(500).json({
      error: 'Failed to start treatment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
