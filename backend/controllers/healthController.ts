import { Request, Response } from 'express';
import { getDbPool } from '../config/db.ts';

export const getHealthStatus = async (req: Request, res: Response) => {
  const pool = getDbPool();
  let dbStatus = 'disconnected (mock fallback active)';

  if (pool) {
    try {
      const [rows] = await pool.query('SELECT 1 as val');
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
    }
  }

  res.status(200).json({
    status: 'success',
    service: 'FinMate API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
};
