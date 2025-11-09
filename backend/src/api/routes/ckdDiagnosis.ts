/**
 * CKD Diagnosis Detection API Routes
 *
 * Endpoints for managing CKD diagnosis detection, treatment protocols,
 * and doctor action queue
 */

import { Router, Request, Response } from 'express';
import {
  getPendingDoctorActions,
  completeDoctorAction,
  confirmCKDDiagnosis,
  approveTreatmentProtocol,
  getPatientDiagnosisHistory,
  getPatientTreatmentProtocols
} from '../../services/ckdDiagnosisDetection';
import { query } from '../../config/database';

const router = Router();

/**
 * GET /api/ckd-diagnosis/actions
 * Get pending doctor actions (diagnosis confirmations, treatment approvals)
 */
router.get('/actions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { action_type, priority } = req.query;

    const actions = await getPendingDoctorActions(
      action_type as string | undefined,
      priority as string | undefined
    );

    res.json({
      status: 'success',
      data: actions,
      count: actions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching doctor actions:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch doctor actions',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ckd-diagnosis/actions/:id
 * Get specific doctor action with full details
 */
router.get('/actions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        daq.*,
        p.first_name,
        p.last_name,
        p.medical_record_number,
        p.age,
        p.gender,
        p.ckd_stage,
        cde.egfr_at_diagnosis,
        cde.ckd_stage_at_diagnosis,
        cde.detection_trigger,
        ctp.protocol_name,
        ctp.medication_orders,
        ctp.lab_monitoring_schedule,
        ctp.referrals,
        ctp.lifestyle_modifications
      FROM doctor_action_queue daq
      JOIN patients p ON daq.patient_id = p.id
      LEFT JOIN ckd_diagnosis_events cde ON daq.diagnosis_event_id = cde.id
      LEFT JOIN ckd_treatment_protocols ctp ON daq.treatment_protocol_id = ctp.id
      WHERE daq.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        error: 'Action not found',
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
    console.error('Error fetching action details:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch action details',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ckd-diagnosis/actions/:id/confirm-diagnosis
 * Confirm CKD diagnosis
 */
router.post('/actions/:id/confirm-diagnosis', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { confirmed_by, notes } = req.body;

    if (!confirmed_by) {
      res.status(400).json({
        status: 'error',
        error: 'confirmed_by is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get the action
    const actionResult = await query(
      `SELECT diagnosis_event_id FROM doctor_action_queue WHERE id = $1`,
      [id]
    );

    if (actionResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        error: 'Action not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const diagnosisEventId = actionResult.rows[0].diagnosis_event_id;

    // Confirm diagnosis
    await confirmCKDDiagnosis(diagnosisEventId, confirmed_by, notes);

    // Complete the action
    await completeDoctorAction(id, confirmed_by, notes, true);

    res.json({
      status: 'success',
      message: 'CKD diagnosis confirmed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error confirming diagnosis:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to confirm diagnosis',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ckd-diagnosis/actions/:id/approve-treatment
 * Approve early treatment protocol
 */
router.post('/actions/:id/approve-treatment', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { approved_by, notes } = req.body;

    if (!approved_by) {
      res.status(400).json({
        status: 'error',
        error: 'approved_by is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get the action
    const actionResult = await query(
      `SELECT treatment_protocol_id FROM doctor_action_queue WHERE id = $1`,
      [id]
    );

    if (actionResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        error: 'Action not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const protocolId = actionResult.rows[0].treatment_protocol_id;

    // Approve treatment protocol
    await approveTreatmentProtocol(protocolId, approved_by, notes);

    // Complete the action
    await completeDoctorAction(id, approved_by, notes, true);

    res.json({
      status: 'success',
      message: 'Treatment protocol approved and initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error approving treatment:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to approve treatment',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ckd-diagnosis/actions/:id/decline
 * Decline/reject an action
 */
router.post('/actions/:id/decline', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { declined_by, notes } = req.body;

    if (!declined_by) {
      res.status(400).json({
        status: 'error',
        error: 'declined_by is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    await completeDoctorAction(id, declined_by, notes, false);

    res.json({
      status: 'success',
      message: 'Action declined',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error declining action:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to decline action',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ckd-diagnosis/patient/:patientId/history
 * Get CKD diagnosis history for a patient
 */
router.get('/patient/:patientId/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const history = await getPatientDiagnosisHistory(patientId);

    res.json({
      status: 'success',
      data: history,
      count: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching diagnosis history:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch diagnosis history',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ckd-diagnosis/patient/:patientId/protocols
 * Get treatment protocols for a patient
 */
router.get('/patient/:patientId/protocols', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const protocols = await getPatientTreatmentProtocols(patientId);

    res.json({
      status: 'success',
      data: protocols,
      count: protocols.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching treatment protocols:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch treatment protocols',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ckd-diagnosis/stats
 * Get CKD diagnosis detection statistics
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get diagnosis counts
    const diagnosisStats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE diagnosis_confirmed = true) as confirmed_diagnoses,
        COUNT(*) FILTER (WHERE diagnosis_confirmed = false) as pending_confirmation,
        COUNT(*) as total_diagnoses,
        COUNT(DISTINCT patient_id) as patients_diagnosed
      FROM ckd_diagnosis_events
      WHERE diagnosis_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Get treatment protocol stats
    const treatmentStats = await query(`
      SELECT
        status,
        COUNT(*) as count
      FROM ckd_treatment_protocols
      GROUP BY status
    `);

    // Get pending action counts
    const actionStats = await query(`
      SELECT
        action_type,
        priority,
        COUNT(*) as count
      FROM doctor_action_queue
      WHERE status = 'pending'
      GROUP BY action_type, priority
    `);

    res.json({
      status: 'success',
      data: {
        diagnoses: diagnosisStats.rows[0],
        treatments: treatmentStats.rows,
        pending_actions: actionStats.rows
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching CKD diagnosis stats:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
