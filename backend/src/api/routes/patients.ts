/**
 * Patient API Routes
 *
 * RESTful API endpoints for patient data.
 * Provides access to patient demographics, observations, conditions, and risk assessments.
 */

import { Router, Request, Response } from 'express';
import {
  getPatientByMRN,
  getPatientSummary,
  getPatientList,
  getPatientObservations,
  getPatientConditions,
  getPatientRiskAssessments,
  getPatientsByRiskTier,
  getHighRiskPatients,
  getPatientCountsByRiskTier
} from '../../services/patientService';
import { PatientQueryParams, RiskTier } from '../../types/patient';

const router = Router();

/**
 * GET /api/patients
 * Get list of all patients with summary info
 *
 * Query parameters:
 * - risk_tier: Filter by risk tier (1, 2, or 3)
 * - has_diabetes: Filter by diabetes status (true/false)
 * - has_hypertension: Filter by hypertension status (true/false)
 * - ckd_stage: Filter by CKD stage ('1', '2', '3a', '3b', '4', '5')
 * - min_age: Minimum age
 * - max_age: Maximum age
 * - sort_by: Sort field (name, age, risk_tier, eGFR, mrn)
 * - sort_order: Sort direction (asc, desc)
 * - limit: Maximum number of results
 * - offset: Number of results to skip
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params: PatientQueryParams = {
      risk_tier: req.query.risk_tier ? parseInt(req.query.risk_tier as string) as RiskTier : undefined,
      has_diabetes: req.query.has_diabetes === 'true' ? true : req.query.has_diabetes === 'false' ? false : undefined,
      has_hypertension: req.query.has_hypertension === 'true' ? true : req.query.has_hypertension === 'false' ? false : undefined,
      ckd_stage: req.query.ckd_stage as PatientQueryParams['ckd_stage'],
      min_age: req.query.min_age ? parseInt(req.query.min_age as string) : undefined,
      max_age: req.query.max_age ? parseInt(req.query.max_age as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      sort_by: req.query.sort_by as PatientQueryParams['sort_by'],
      sort_order: req.query.sort_order as 'asc' | 'desc' | undefined
    };

    const patients = await getPatientList(params);

    res.json({
      status: 'success',
      data: patients,
      count: patients.length,
      filters: params,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching patient list:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patient list',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/patients/stats/risk-tiers
 * Get patient counts by risk tier
 */
router.get('/stats/risk-tiers', async (_req: Request, res: Response) => {
  try {
    const counts = await getPatientCountsByRiskTier();

    res.json({
      status: 'success',
      data: {
        tier_1_low_risk: counts[1],
        tier_2_moderate_risk: counts[2],
        tier_3_high_risk: counts[3],
        total: counts[1] + counts[2] + counts[3]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching risk tier stats:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch risk tier statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/patients/risk-tier/:tier
 * Get patients by risk tier
 *
 * Path parameters:
 * - tier: Risk tier (1, 2, or 3)
 */
router.get('/risk-tier/:tier', async (req: Request, res: Response) => {
  try {
    const tier = parseInt(req.params.tier);

    if (![1, 2, 3].includes(tier)) {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid risk tier',
        message: 'Risk tier must be 1, 2, or 3',
        timestamp: new Date().toISOString()
      });
    }

    const patients = await getPatientsByRiskTier(tier as RiskTier);

    res.json({
      status: 'success',
      data: patients,
      count: patients.length,
      risk_tier: tier,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching patients by risk tier:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patients by risk tier',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/patients/high-risk
 * Get high-risk patients (Tier 3) for prioritized screening
 */
router.get('/high-risk', async (_req: Request, res: Response) => {
  try {
    const patients = await getHighRiskPatients();

    res.json({
      status: 'success',
      data: patients,
      count: patients.length,
      note: 'These patients are prioritized for immediate CKD screening',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching high-risk patients:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch high-risk patients',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/patients/mrn/:mrn
 * Get patient by medical record number
 *
 * Path parameters:
 * - mrn: Medical record number (e.g., 'MRN001')
 */
router.get('/mrn/:mrn', async (req: Request, res: Response) => {
  try {
    const mrn = req.params.mrn;
    const patient = await getPatientByMRN(mrn);

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        error: 'Patient not found',
        message: `No patient found with MRN: ${mrn}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'success',
      data: patient,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching patient by MRN:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patient',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/patients/:id
 * Get complete patient summary with all clinical data
 *
 * Path parameters:
 * - id: Patient UUID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientId)) {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid patient ID',
        message: 'Patient ID must be a valid UUID',
        timestamp: new Date().toISOString()
      });
    }

    const patient = await getPatientSummary(patientId);

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        error: 'Patient not found',
        message: `No patient found with ID: ${patientId}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'success',
      data: patient,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching patient summary:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patient summary',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/patients/:id/observations
 * Get patient observations (lab results)
 *
 * Path parameters:
 * - id: Patient UUID
 */
router.get('/:id/observations', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const observations = await getPatientObservations(patientId);

    res.json({
      status: 'success',
      data: observations,
      count: observations.length,
      patient_id: patientId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching patient observations:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patient observations',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/patients/:id/conditions
 * Get patient conditions (diagnoses)
 *
 * Path parameters:
 * - id: Patient UUID
 */
router.get('/:id/conditions', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const conditions = await getPatientConditions(patientId);

    res.json({
      status: 'success',
      data: conditions,
      count: conditions.length,
      patient_id: patientId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching patient conditions:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patient conditions',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/patients/:id/risk-assessments
 * Get patient risk assessments (AI-generated)
 *
 * Path parameters:
 * - id: Patient UUID
 */
router.get('/:id/risk-assessments', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const assessments = await getPatientRiskAssessments(patientId);

    res.json({
      status: 'success',
      data: assessments,
      count: assessments.length,
      patient_id: patientId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching patient risk assessments:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patient risk assessments',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
