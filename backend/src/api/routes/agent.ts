import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { DoctorAgentService } from '../../services/doctorAgent';

export function createAgentRouter(db: Pool): Router {
  const router = Router();
  const agentService = new DoctorAgentService(db);

  /**
   * POST /api/agent/chat
   * Main chat endpoint for doctor queries
   */
  router.post('/chat', async (req: Request, res: Response): Promise<any> => {
    try {
      const { messages, patientId, includeRecentLabs, includeRiskAssessment } = req.body;

      // Validate input
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: 'Invalid request: messages array is required',
        });
      }

      // Validate message format
      for (const msg of messages) {
        if (!msg.role || !msg.content) {
          return res.status(400).json({
            error: 'Invalid message format: each message must have role and content',
          });
        }
        if (!['user', 'assistant'].includes(msg.role)) {
          return res.status(400).json({
            error: 'Invalid role: must be either "user" or "assistant"',
          });
        }
      }

      // Build context if patient ID is provided
      const context = patientId ? {
        patientId,
        includeRecentLabs: includeRecentLabs !== false, // Default true
        includeRiskAssessment: includeRiskAssessment !== false, // Default true
      } : undefined;

      // Call agent service
      const response = await agentService.chat(messages, context);

      res.json({
        response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in agent chat:', error);
      res.status(500).json({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/agent/analyze-patient/:patientId
   * Analyze a specific patient for alerts and recommendations
   */
  router.post('/analyze-patient/:patientId', async (req: Request, res: Response): Promise<any> => {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          error: 'Patient ID is required',
        });
      }

      const alertResult = await agentService.analyzePatientForAlerts(patientId);

      res.json({
        patientId,
        ...alertResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error analyzing patient:', error);
      res.status(500).json({
        error: 'Failed to analyze patient',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/agent/quick-question
   * Quick Q&A without patient context (for general clinical questions)
   */
  router.post('/quick-question', async (req: Request, res: Response): Promise<any> => {
    try {
      const { question } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({
          error: 'Question is required',
        });
      }

      const messages = [
        {
          role: 'user' as const,
          content: question,
        },
      ];

      const response = await agentService.chat(messages);

      res.json({
        question,
        response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error processing quick question:', error);
      res.status(500).json({
        error: 'Failed to process question',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/agent/health
   * Check if agent service is operational
   */
  router.get('/health', async (_req: Request, res: Response): Promise<any> => {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      res.json({
        status: 'operational',
        hasApiKey: !!apiKey,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
