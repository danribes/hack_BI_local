/**
 * Risk Analysis API Routes
 *
 * REST API endpoints for CKD risk analysis using Claude AI.
 * Exposes the risk processing service to frontend applications.
 */

import { Router, Request, Response } from 'express';
import {
  processPatientRiskAnalysis,
  processPatientsBatch,
  processHighRiskPatients,
  processPatientsByTier,
  getRecentAnalyses,
  getAnalysisStatistics,
  clearOldAnalyses,
  ProcessConfig,
} from '../../services/riskProcessingService';

const router = Router();

/**
 * POST /api/analyze/:patientId
 * Analyze a single patient's CKD risk
 *
 * Request params:
 *   - patientId: Patient UUID
 *
 * Request body (optional):
 *   - storeResults: boolean (default: true)
 *   - includePatientData: boolean (default: true)
 *   - skipCache: boolean (default: false)
 *
 * Response:
 *   - success: boolean
 *   - patient_id: string
 *   - analysis?: AIRiskAnalysisResponse
 *   - error?: string
 *   - cached?: boolean
 *   - processing_time_ms?: number
 */
router.post('/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    // Validate patient ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid patient ID format. Must be a valid UUID.',
      });
      return;
    }

    // Extract configuration from request body
    const config: ProcessConfig = {
      storeResults: req.body.storeResults ?? true,
      includePatientData: req.body.includePatientData ?? true,
      skipCache: req.body.skipCache ?? false,
    };

    // Process patient risk analysis
    const result = await processPatientRiskAnalysis(patientId, config);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in POST /api/analyze/:patientId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during risk analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/analyze/batch
 * Analyze multiple patients in batch
 *
 * Request body:
 *   - patientIds: string[] (required) - Array of patient UUIDs
 *   - storeResults?: boolean (default: true)
 *   - includePatientData?: boolean (default: true)
 *   - skipCache?: boolean (default: false)
 *
 * Response:
 *   - total: number
 *   - successful: number
 *   - failed: number
 *   - results: ProcessResult[]
 *   - total_processing_time_ms: number
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { patientIds } = req.body;

    // Validate patientIds
    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'patientIds must be a non-empty array of patient UUIDs',
      });
      return;
    }

    // Validate each patient ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = patientIds.filter((id) => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid patient ID format detected',
        invalidIds: invalidIds.slice(0, 5), // Show first 5 invalid IDs
      });
      return;
    }

    // Limit batch size
    const MAX_BATCH_SIZE = 50;
    if (patientIds.length > MAX_BATCH_SIZE) {
      res.status(400).json({
        success: false,
        error: `Batch size exceeds maximum allowed (${MAX_BATCH_SIZE})`,
        provided: patientIds.length,
        maximum: MAX_BATCH_SIZE,
      });
      return;
    }

    // Extract configuration
    const config: ProcessConfig = {
      storeResults: req.body.storeResults ?? true,
      includePatientData: req.body.includePatientData ?? true,
      skipCache: req.body.skipCache ?? false,
    };

    // Process batch
    const result = await processPatientsBatch(patientIds, config);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in POST /api/analyze/batch:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during batch analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/analyze/high-risk
 * Analyze all high-risk (Tier 3) patients
 *
 * Request body (optional):
 *   - storeResults?: boolean (default: true)
 *   - includePatientData?: boolean (default: true)
 *   - skipCache?: boolean (default: false)
 *
 * Response:
 *   - total: number
 *   - successful: number
 *   - failed: number
 *   - results: ProcessResult[]
 *   - total_processing_time_ms: number
 */
router.post('/high-risk', async (req: Request, res: Response) => {
  try {
    const config: ProcessConfig = {
      storeResults: req.body.storeResults ?? true,
      includePatientData: req.body.includePatientData ?? true,
      skipCache: req.body.skipCache ?? false,
    };

    const result = await processHighRiskPatients(config);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in POST /api/analyze/high-risk:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during high-risk patient analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/analyze/tier/:tier
 * Analyze all patients in a specific risk tier
 *
 * Request params:
 *   - tier: 1 | 2 | 3
 *
 * Request body (optional):
 *   - storeResults?: boolean (default: true)
 *   - includePatientData?: boolean (default: true)
 *   - skipCache?: boolean (default: false)
 *
 * Response:
 *   - total: number
 *   - successful: number
 *   - failed: number
 *   - results: ProcessResult[]
 *   - total_processing_time_ms: number
 */
router.post('/tier/:tier', async (req: Request, res: Response) => {
  try {
    const tierParam = parseInt(req.params.tier);

    // Validate tier
    if (![1, 2, 3].includes(tierParam)) {
      res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be 1, 2, or 3.',
        provided: req.params.tier,
      });
      return;
    }

    const tier = tierParam as 1 | 2 | 3;

    const config: ProcessConfig = {
      storeResults: req.body.storeResults ?? true,
      includePatientData: req.body.includePatientData ?? true,
      skipCache: req.body.skipCache ?? false,
    };

    const result = await processPatientsByTier(tier, config);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in POST /api/analyze/tier/:tier:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during tier-based analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analyze/recent
 * Get recent risk analyses
 *
 * Query params:
 *   - limit?: number (default: 10, max: 100)
 *
 * Response:
 *   - analyses: AIRiskAnalysisResponse[]
 *   - count: number
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit as string) || 10,
      100 // Max limit
    );

    const analyses = await getRecentAnalyses(limit);

    res.status(200).json({
      analyses,
      count: analyses.length,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/analyze/recent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error fetching recent analyses',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analyze/statistics
 * Get aggregate statistics about risk analyses
 *
 * Response:
 *   - total_analyses: number
 *   - by_risk_level: { low: number, medium: number, high: number }
 *   - by_risk_tier: { tier_1: number, tier_2: number, tier_3: number }
 *   - average_risk_score: number
 *   - last_analyzed: string | null
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await getAnalysisStatistics();

    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error in GET /api/analyze/statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error fetching statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/analyze/cache
 * Clear old cached analyses
 *
 * Query params:
 *   - olderThanHours?: number (default: 24)
 *
 * Response:
 *   - success: boolean
 *   - deletedCount: number
 *   - olderThanHours: number
 */
router.delete('/cache', async (req: Request, res: Response) => {
  try {
    const olderThanHours = parseInt(req.query.olderThanHours as string) || 24;

    // Validate hours (must be positive)
    if (olderThanHours <= 0) {
      res.status(400).json({
        success: false,
        error: 'olderThanHours must be a positive number',
      });
      return;
    }

    const deletedCount = await clearOldAnalyses(olderThanHours);

    res.status(200).json({
      success: true,
      deletedCount,
      olderThanHours,
    });
  } catch (error) {
    console.error('Error in DELETE /api/analyze/cache:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error clearing cache',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analyze/health
 * Health check endpoint for risk analysis service
 *
 * Response:
 *   - status: string
 *   - service: string
 *   - timestamp: string
 */
router.get('/health', async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'risk-analysis',
    timestamp: new Date().toISOString(),
  });
});

export default router;
