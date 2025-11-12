import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'healthcare_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const getPool = () => pool;

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✓ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
};
