import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, closePool, getPoolStats, query, getPool } from './config/database';
import patientRoutes from './api/routes/patients';
import analyzeRoutes from './api/routes/analyze';
import monitoringRoutes from './api/routes/monitoring';
import notificationRoutes from './api/routes/notifications';
import ckdDiagnosisRoutes from './api/routes/ckdDiagnosis';
import { initializeRiskChangeMonitor, stopRiskChangeMonitor } from './services/riskChangeMonitor';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Healthcare AI Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Healthcare AI Clinical Data Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      dbHealth: '/api/db/health',
      dbTest: '/api/db/test',
      patients: {
        list: 'GET /api/patients',
        detail: 'GET /api/patients/:id',
        byMRN: 'GET /api/patients/mrn/:mrn',
        observations: 'GET /api/patients/:id/observations',
        conditions: 'GET /api/patients/:id/conditions',
        riskAssessments: 'GET /api/patients/:id/risk-assessments',
        byRiskTier: 'GET /api/patients/risk-tier/:tier',
        highRisk: 'GET /api/patients/high-risk',
        stats: 'GET /api/patients/stats/risk-tiers'
      },
      analyze: {
        singlePatient: 'POST /api/analyze/:patientId',
        batch: 'POST /api/analyze/batch',
        highRisk: 'POST /api/analyze/high-risk',
        byTier: 'POST /api/analyze/tier/:tier',
        recent: 'GET /api/analyze/recent',
        statistics: 'GET /api/analyze/statistics',
        clearCache: 'DELETE /api/analyze/cache',
        health: 'GET /api/analyze/health'
      },
      monitoring: {
        scan: 'GET /api/monitoring/scan',
        stats: 'GET /api/monitoring/stats',
        critical: 'GET /api/monitoring/critical',
        byPriority: 'GET /api/monitoring/priority/:priority'
      },
      notifications: {
        list: 'GET /api/notifications',
        pending: 'GET /api/notifications/pending',
        detail: 'GET /api/notifications/:id',
        acknowledge: 'PUT /api/notifications/:id/acknowledge',
        stats: 'GET /api/notifications/stats/summary',
        patientHistory: 'GET /api/notifications/patient/:patientId/history'
      },
      ckdDiagnosis: {
        actions: 'GET /api/ckd-diagnosis/actions',
        actionDetail: 'GET /api/ckd-diagnosis/actions/:id',
        confirmDiagnosis: 'POST /api/ckd-diagnosis/actions/:id/confirm-diagnosis',
        approveTreatment: 'POST /api/ckd-diagnosis/actions/:id/approve-treatment',
        declineAction: 'POST /api/ckd-diagnosis/actions/:id/decline',
        patientHistory: 'GET /api/ckd-diagnosis/patient/:patientId/history',
        patientProtocols: 'GET /api/ckd-diagnosis/patient/:patientId/protocols',
        stats: 'GET /api/ckd-diagnosis/stats'
      }
    }
  });
});

// Database health check endpoint
app.get('/api/db/health', async (_req: Request, res: Response) => {
  try {
    const isConnected = await testConnection();
    const stats = getPoolStats();

    if (isConnected) {
      res.json({
        status: 'ok',
        message: 'Database connection successful',
        database: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          name: process.env.DB_NAME,
          user: process.env.DB_USER
        },
        pool: stats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Database query test endpoint (for development/testing)
app.get('/api/db/test', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT COUNT(*) as patient_count FROM patients');
    res.json({
      status: 'ok',
      message: 'Database query successful',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database query failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/patients', patientRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ckd-diagnosis', ckdDiagnosisRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: ['/health', '/api']
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, async () => {
  console.log('='.repeat(60));
  console.log('🏥 Healthcare AI Clinical Data Analyzer - Backend');
  console.log('='.repeat(60));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  DB health: http://localhost:${PORT}/api/db/health`);
  console.log(`👥 Patients API: http://localhost:${PORT}/api/patients`);
  console.log(`🤖 AI Analysis: http://localhost:${PORT}/api/analyze`);
  console.log(`🔍 Risk Monitoring: http://localhost:${PORT}/api/monitoring`);
  console.log(`📧 Notifications: http://localhost:${PORT}/api/notifications`);
  console.log(`🏥 CKD Diagnosis: http://localhost:${PORT}/api/ckd-diagnosis`);
  console.log(`📖 API info: http://localhost:${PORT}/api`);
  console.log('='.repeat(60));

  // Test database connection on startup
  console.log('Testing database connection...');
  await testConnection();

  // Initialize Risk Change Monitor
  console.log('Initializing Risk Change Monitor...');
  try {
    const pool = getPool();
    await initializeRiskChangeMonitor(pool);
    console.log('✓ Risk Change Monitor active - listening for patient data updates');
  } catch (error) {
    console.error('⚠️  Failed to initialize Risk Change Monitor:', error);
    console.log('Server will continue without automatic monitoring');
  }

  console.log('='.repeat(60));
  console.log('Ready to accept requests...\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM signal received: closing HTTP server');
  await stopRiskChangeMonitor();
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT signal received: closing HTTP server');
  await stopRiskChangeMonitor();
  await closePool();
  process.exit(0);
});

export default app;
