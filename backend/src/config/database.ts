/**
 * Database Configuration and Connection Pool
 *
 * This module configures the PostgreSQL connection pool using node-postgres (pg).
 * It provides a centralized database connection that can be used throughout the application.
 */

import { Pool, QueryResult } from 'pg';

// Database configuration from environment variables
// Support both DATABASE_URL (Render) and individual vars (local dev)
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // SSL required for Render PostgreSQL
      ssl: {
        rejectUnauthorized: false,
      },
      // Connection pool settings
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'healthcare_db',
      user: process.env.DB_USER || 'healthcare_user',
      password: process.env.DB_PASSWORD || 'healthcare_password',
      // Connection pool settings
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

// Create connection pool
const pool = new Pool(dbConfig);

// Pool error handler
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  process.exit(-1);
});

/**
 * Test database connection
 * @returns Promise<boolean> - True if connection successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();

    console.log('✅ Database connection successful');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].db_version.split(',')[0]}`);

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Execute a SQL query
 * @param text - SQL query string
 * @param params - Query parameters (optional)
 * @returns Promise<QueryResult> - Query result
 */
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', { text, error });
    throw error;
  }
}

/**
 * Get database pool stats
 * @returns Pool statistics
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Get the database pool instance
 * @returns Pool instance
 */
export function getPool(): Pool {
  return pool;
}

/**
 * Close all database connections
 * Use this when shutting down the application
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database pool closed');
}

// Export pool for direct access if needed
export { pool };

// Export default query function
export default query;
