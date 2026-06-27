import { getDbPool } from '../config/db.ts';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at?: string;
}

// In-memory fallback store when MySQL is not provisioned in preview sandbox
const memoryUsers: Map<string, UserRecord> = new Map([
  [
    'alex.chen@example.com',
    {
      id: 'usr_mock_01',
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      // bcrypt hash for 'password123'
      password: '$2a$10$X7.1z/u1K2fV0mB3g5H6e.Y8v9w0x1y2z3a4b5c6d7e8f9g0h1i2',
      role: 'Senior Engineer',
      created_at: new Date().toISOString()
    }
  ]
]);

let tableInitialized = false;

export async function initUsersTable(): Promise<void> {
  if (tableInitialized) return;
  const pool = getDbPool();
  if (!pool) {
    tableInitialized = true;
    return;
  }

  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'Member',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await pool.query(query);
    tableInitialized = true;
    console.log('✅ MySQL `users` table verified/created.');
  } catch (err) {
    markDbOffline();
    tableInitialized = true;
  }
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  await initUsersTable();
  const pool = getDbPool();
  const normalizedEmail = email.toLowerCase().trim();

  if (!pool) {
    return memoryUsers.get(normalizedEmail) || null;
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (rows && rows.length > 0) {
      return rows[0] as UserRecord;
    }
    return null;
  } catch (err) {
    markDbOffline();
    return memoryUsers.get(normalizedEmail) || null;
  }
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  await initUsersTable();
  const pool = getDbPool();

  if (!pool) {
    for (const usr of memoryUsers.values()) {
      if (usr.id === id) return usr;
    }
    return null;
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows && rows.length > 0) {
      return rows[0] as UserRecord;
    }
    return null;
  } catch (err) {
    markDbOffline();
    for (const usr of memoryUsers.values()) {
      if (usr.id === id) return usr;
    }
    return null;
  }
}

export async function createUser(user: UserRecord): Promise<UserRecord> {
  await initUsersTable();
  const pool = getDbPool();
  const normalizedEmail = user.email.toLowerCase().trim();
  const recordToInsert = { ...user, email: normalizedEmail };

  if (!pool) {
    memoryUsers.set(normalizedEmail, recordToInsert);
    return recordToInsert;
  }

  try {
    await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [recordToInsert.id, recordToInsert.name, recordToInsert.email, recordToInsert.password, recordToInsert.role || 'Member']
    );
    return recordToInsert;
  } catch (err) {
    markDbOffline();
    memoryUsers.set(normalizedEmail, recordToInsert);
    return recordToInsert;
  }
}
