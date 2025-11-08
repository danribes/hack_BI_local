/**
 * Risk Processing Service
 *
 * Orchestrates the complete CKD risk analysis workflow.
 * Fetches patient data, calls AI service, stores results, and returns assessments.
 */

import { getPatientSummary, getPatientsByRiskTier } from './patientService';
import { analyzeCKDRisk } from './aiService';
import { query } from '../config/database';
import { AIRiskAnalysisResponse } from '../types/ai';

/**
 * Process Configuration
 */
export interface ProcessConfig {
  storeResults?: boolean; // Store results in database (default: true)
  includePatientData?: boolean; // Include full patient data in response (default: true)
  skipCache?: boolean; // Skip cached results and re-analyze (default: false)
}

/**
 * Process Result
 */
export interface ProcessResult {
  success: boolean;
  patient_id: string;
  analysis?: AIRiskAnalysisResponse;
  error?: string;
  cached?: boolean; // Whether result was from cache
  processing_time_ms?: number; // Time taken to process
}

/**
 * Batch Process Result
 */
export interface BatchProcessResult {
  total: number;
  successful: number;
  failed: number;
  results: ProcessResult[];
  total_processing_time_ms: number;
}

/**
 * Process a single patient's CKD risk analysis
 *
 * @param patientId - Patient UUID
 * @param config - Processing configuration
 * @returns Process result with analysis or error
 */
export async function processPatientRiskAnalysis(
  patientId: string,
  config: ProcessConfig = {}
): Promise<ProcessResult> {
  const startTime = Date.now();
  const {
    storeResults = true,
    includePatientData: _includePatientData = true,
    skipCache = false,
  } = config;

  try {
    // Check for cached analysis if not skipping cache
    if (!skipCache) {
      const cachedAnalysis = await getCachedAnalysis(patientId);
      if (cachedAnalysis) {
        return {
          success: true,
          patient_id: patientId,
          analysis: cachedAnalysis,
          cached: true,
          processing_time_ms: Date.now() - startTime,
        };
      }
    }

    // Fetch complete patient summary (includes observations, conditions, etc.)
    const patientSummary = await getPatientSummary(patientId);

    if (!patientSummary) {
      return {
        success: false,
        patient_id: patientId,
        error: 'Patient not found',
        processing_time_ms: Date.now() - startTime,
      };
    }

    // Call AI service to analyze CKD risk
    const analysis = await analyzeCKDRisk({
      patient: patientSummary,
    });

    // Store results in database if configured
    if (storeResults) {
      await storeAnalysisResult(analysis);
    }

    return {
      success: true,
      patient_id: patientId,
      analysis,
      cached: false,
      processing_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`Error processing patient ${patientId}:`, error);
    return {
      success: false,
      patient_id: patientId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Process multiple patients in batch
 *
 * @param patientIds - Array of patient UUIDs
 * @param config - Processing configuration
 * @returns Batch process results
 */
export async function processPatientsBatch(
  patientIds: string[],
  config: ProcessConfig = {}
): Promise<BatchProcessResult> {
  const startTime = Date.now();
  const results: ProcessResult[] = [];

  // Process patients concurrently (with reasonable limit)
  const BATCH_SIZE = 5; // Process 5 patients at a time
  for (let i = 0; i < patientIds.length; i += BATCH_SIZE) {
    const batch = patientIds.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((patientId) => processPatientRiskAnalysis(patientId, config))
    );
    results.push(...batchResults);
  }

  // Calculate statistics
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: patientIds.length,
    successful,
    failed,
    results,
    total_processing_time_ms: Date.now() - startTime,
  };
}

/**
 * Process high-risk patients (Tier 3)
 *
 * @param config - Processing configuration
 * @returns Batch process results for high-risk patients
 */
export async function processHighRiskPatients(
  config: ProcessConfig = {}
): Promise<BatchProcessResult> {
  // Fetch all Tier 3 (high-risk) patients
  const highRiskPatients = await getPatientsByRiskTier(3);
  const patientIds = highRiskPatients.map((p) => p.id);

  console.log(`Processing ${patientIds.length} high-risk patients (Tier 3)`);

  return processPatientsBatch(patientIds, config);
}

/**
 * Process all patients by risk tier
 *
 * @param tier - Risk tier (1, 2, or 3)
 * @param config - Processing configuration
 * @returns Batch process results
 */
export async function processPatientsByTier(
  tier: 1 | 2 | 3,
  config: ProcessConfig = {}
): Promise<BatchProcessResult> {
  const patients = await getPatientsByRiskTier(tier);
  const patientIds = patients.map((p) => p.id);

  console.log(`Processing ${patientIds.length} patients in Tier ${tier}`);

  return processPatientsBatch(patientIds, config);
}

/**
 * Get cached analysis for a patient
 * Returns most recent analysis if less than 24 hours old
 *
 * @param patientId - Patient UUID
 * @returns Cached analysis or null
 */
async function getCachedAnalysis(
  patientId: string
): Promise<AIRiskAnalysisResponse | null> {
  try {
    const result = await query(
      `SELECT * FROM risk_assessments
       WHERE patient_id = $1
       ORDER BY analyzed_at DESC
       LIMIT 1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const cached = result.rows[0];

    // Check if cached analysis is less than 24 hours old
    const analyzedAt = new Date(cached.analyzed_at);
    const now = new Date();
    const hoursSinceAnalysis =
      (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceAnalysis > 24) {
      return null; // Cached data too old
    }

    // Reconstruct AIRiskAnalysisResponse from database row
    return {
      patient_id: cached.patient_id,
      risk_score: parseFloat(cached.risk_score),
      risk_level: cached.risk_level,
      risk_tier: cached.risk_tier,
      key_findings: cached.key_findings,
      ckd_analysis: cached.ckd_analysis,
      risk_factors: cached.risk_factors,
      reasoning: cached.reasoning,
      clinical_summary: cached.clinical_summary,
      recommendations: cached.recommendations,
      confidence: cached.confidence,
      model_version: cached.model_version,
      analyzed_at: cached.analyzed_at,
    };
  } catch (error) {
    console.error('Error fetching cached analysis:', error);
    return null;
  }
}

/**
 * Store analysis result in database
 *
 * @param analysis - AI risk analysis response
 */
async function storeAnalysisResult(
  analysis: AIRiskAnalysisResponse
): Promise<void> {
  try {
    await query(
      `INSERT INTO risk_assessments (
        patient_id,
        risk_score,
        risk_level,
        risk_tier,
        key_findings,
        ckd_analysis,
        risk_factors,
        reasoning,
        clinical_summary,
        recommendations,
        confidence,
        model_version,
        analyzed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (patient_id, analyzed_at)
      DO UPDATE SET
        risk_score = EXCLUDED.risk_score,
        risk_level = EXCLUDED.risk_level,
        risk_tier = EXCLUDED.risk_tier,
        key_findings = EXCLUDED.key_findings,
        ckd_analysis = EXCLUDED.ckd_analysis,
        risk_factors = EXCLUDED.risk_factors,
        reasoning = EXCLUDED.reasoning,
        clinical_summary = EXCLUDED.clinical_summary,
        recommendations = EXCLUDED.recommendations,
        confidence = EXCLUDED.confidence,
        model_version = EXCLUDED.model_version`,
      [
        analysis.patient_id,
        analysis.risk_score,
        analysis.risk_level,
        analysis.risk_tier,
        JSON.stringify(analysis.key_findings),
        JSON.stringify(analysis.ckd_analysis),
        JSON.stringify(analysis.risk_factors),
        analysis.reasoning,
        analysis.clinical_summary,
        JSON.stringify(analysis.recommendations),
        analysis.confidence,
        analysis.model_version,
        analysis.analyzed_at,
      ]
    );

    console.log(
      `Stored risk assessment for patient ${analysis.patient_id} (${analysis.risk_level} risk)`
    );
  } catch (error) {
    console.error('Error storing analysis result:', error);
    throw error;
  }
}

/**
 * Get recent analyses
 *
 * @param limit - Number of recent analyses to return
 * @returns Array of recent analyses
 */
export async function getRecentAnalyses(
  limit: number = 10
): Promise<AIRiskAnalysisResponse[]> {
  try {
    const result = await query(
      `SELECT * FROM risk_assessments
       ORDER BY analyzed_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      patient_id: row.patient_id,
      risk_score: parseFloat(row.risk_score),
      risk_level: row.risk_level,
      risk_tier: row.risk_tier,
      key_findings: row.key_findings,
      ckd_analysis: row.ckd_analysis,
      risk_factors: row.risk_factors,
      reasoning: row.reasoning,
      clinical_summary: row.clinical_summary,
      recommendations: row.recommendations,
      confidence: row.confidence,
      model_version: row.model_version,
      analyzed_at: row.analyzed_at,
    }));
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    return [];
  }
}

/**
 * Get analysis statistics
 *
 * @returns Statistics about risk analyses
 */
export async function getAnalysisStatistics(): Promise<{
  total_analyses: number;
  by_risk_level: {
    low: number;
    medium: number;
    high: number;
  };
  by_risk_tier: {
    tier_1: number;
    tier_2: number;
    tier_3: number;
  };
  average_risk_score: number;
  last_analyzed: string | null;
}> {
  try {
    const result = await query(
      `SELECT
        COUNT(*) as total_analyses,
        COUNT(*) FILTER (WHERE risk_level = 'low') as low_risk,
        COUNT(*) FILTER (WHERE risk_level = 'medium') as medium_risk,
        COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk,
        COUNT(*) FILTER (WHERE risk_tier = 1) as tier_1,
        COUNT(*) FILTER (WHERE risk_tier = 2) as tier_2,
        COUNT(*) FILTER (WHERE risk_tier = 3) as tier_3,
        AVG(risk_score) as avg_risk_score,
        MAX(analyzed_at) as last_analyzed
       FROM risk_assessments`
    );

    const stats = result.rows[0];

    return {
      total_analyses: parseInt(stats.total_analyses),
      by_risk_level: {
        low: parseInt(stats.low_risk),
        medium: parseInt(stats.medium_risk),
        high: parseInt(stats.high_risk),
      },
      by_risk_tier: {
        tier_1: parseInt(stats.tier_1),
        tier_2: parseInt(stats.tier_2),
        tier_3: parseInt(stats.tier_3),
      },
      average_risk_score: parseFloat(stats.avg_risk_score) || 0,
      last_analyzed: stats.last_analyzed,
    };
  } catch (error) {
    console.error('Error fetching analysis statistics:', error);
    throw error;
  }
}

/**
 * Clear cached analyses older than specified hours
 *
 * @param olderThanHours - Clear analyses older than this many hours (default: 24)
 * @returns Number of analyses cleared
 */
export async function clearOldAnalyses(
  olderThanHours: number = 24
): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM risk_assessments
       WHERE analyzed_at < NOW() - INTERVAL '${olderThanHours} hours'
       RETURNING id`
    );

    const deletedCount = result.rows.length;
    console.log(`Cleared ${deletedCount} analyses older than ${olderThanHours} hours`);

    return deletedCount;
  } catch (error) {
    console.error('Error clearing old analyses:', error);
    return 0;
  }
}
