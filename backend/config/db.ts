import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
export let isDbOffline = false;

export function markDbOffline() {
  if (!isDbOffline) {
    console.log('ℹ️ Running in sandbox preview mode with in-memory storage fallback.');
    isDbOffline = true;
  }
}

/**
 * Lazy initialization of MySQL Connection Pool.
 * Fails safely if credentials are not configured, allowing app preview.
 */
export function getDbPool(): mysql.Pool | null {
  if (isDbOffline) return null;

  if (!pool) {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;

    console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_USER =", process.env.DB_USER);
console.log("Current Directory =", process.cwd());
    
    if (!host || !user) {
      console.log('ℹ️ MySQL database credentials not configured. Running with in-memory storage.');
      return null;
    }

    try {
      pool = mysql.createPool({
        host: host || 'localhost',
        user: user || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'finmate_db',
        port: Number(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('✅ MySQL connection pool initialized.');
    } catch (error) {
      markDbOffline();
      return null;
    }
  }
  return pool;
}

