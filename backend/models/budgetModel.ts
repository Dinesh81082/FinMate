import { getDbPool, markDbOffline } from '../config/db.ts';
import { memoryTransactions } from './transactionModel.ts';

export interface BudgetRecord {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  created_at?: string;
}

export interface CategoryBudgetView extends BudgetRecord {
  spent: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  exceededCount: number;
}

let memoryBudgets: BudgetRecord[] = [];

let tableInitialized = false;

export async function initBudgetsTable(): Promise<void> {
  if (tableInitialized) return;
  const pool = getDbPool();
  if (!pool) {
    tableInitialized = true;
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_cat (user_id, category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM budgets');
    if (rows[0].count === 0) {
      for (const b of memoryBudgets) {
        await pool.query(`
          INSERT IGNORE INTO budgets (id, user_id, category, amount, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [b.id, b.user_id, b.category, b.amount]);
      }
    }
    tableInitialized = true;
    console.log('✅ MySQL `budgets` table verified/created.');
  } catch (err) {
    console.error("❌ Error initializing budgets table:", err);
    markDbOffline();
    tableInitialized = true;
  }
}

export async function fetchUserBudgets(user_id: string): Promise<{ budgets: CategoryBudgetView[]; summary: BudgetSummary }> {
  await initBudgetsTable();
  const pool = getDbPool();

  if (!pool) {
    const list = memoryBudgets.filter(b => b.user_id === user_id || user_id === 'usr_mock_01');
    const txList = memoryTransactions.filter(tx => (tx.user_id === user_id || user_id === 'usr_mock_01') && tx.type === 'Expense');

    // Aggregate spent per category
    const spentMap: Record<string, number> = {};
    txList.forEach(tx => {
      spentMap[tx.category] = (spentMap[tx.category] || 0) + Number(tx.amount);
    });

    let totalBudget = 0;
    let totalSpent = 0;
    let exceededCount = 0;

    const budgetsView: CategoryBudgetView[] = list.map(b => {
      const amt = Number(b.amount);
      const spent = spentMap[b.category] || 0;
      const remaining = Math.max(0, amt - spent);
      const percentage = amt > 0 ? Math.round((spent / amt) * 100) : 0;
      const isExceeded = spent > amt;

      totalBudget += amt;
      totalSpent += spent;
      if (isExceeded) exceededCount += 1;

      return {
        ...b,
        amount: amt,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round((amt - spent) * 100) / 100,
        percentage,
        isExceeded
      };
    });

    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      budgets: budgetsView,
      summary: {
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        overallPercentage,
        exceededCount
      }
    };
  }

  try {
    const [rows]: any = await pool.query(`
      SELECT 
        b.id, b.user_id, b.category, b.amount, b.created_at,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.user_id = b.user_id 
        AND t.category = b.category 
        AND t.type = 'Expense'
      WHERE b.user_id = ?
      GROUP BY b.id, b.user_id, b.category, b.amount, b.created_at
      ORDER BY b.amount DESC
    `, [user_id]);

    let totalBudget = 0;
    let totalSpent = 0;
    let exceededCount = 0;

    const budgetsView: CategoryBudgetView[] = rows.map((r: any) => {
      const amt = Number(r.amount || 0);
      const spent = Number(r.spent || 0);
      const remaining = amt - spent;
      const percentage = amt > 0 ? Math.round((spent / amt) * 100) : 0;
      const isExceeded = spent > amt;

      totalBudget += amt;
      totalSpent += spent;
      if (isExceeded) exceededCount += 1;

      return {
        id: r.id,
        user_id: r.user_id,
        category: r.category,
        amount: amt,
        created_at: r.created_at,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentage,
        isExceeded
      };
    });

    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      budgets: budgetsView,
      summary: {
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        overallPercentage,
        exceededCount
      }
    };
  } catch (err) {
    console.error("❌ Error fetching budgets:", err);
    markDbOffline();
    return fetchUserBudgets(user_id);
  }
}

export async function createOrUpdateBudgetRecord(record: BudgetRecord): Promise<BudgetRecord> {
  await initBudgetsTable();
  const pool = getDbPool();

  if (!pool) {
    const existingIdx = memoryBudgets.findIndex(b => (b.user_id === record.user_id || record.user_id === 'usr_mock_01') && b.category.toLowerCase() === record.category.toLowerCase());
    if (existingIdx >= 0) {
      memoryBudgets[existingIdx].amount = Number(record.amount);
      return memoryBudgets[existingIdx];
    }
    memoryBudgets.push(record);
    return record;
  }

  try {
    await pool.query(`
      INSERT INTO budgets (id, user_id, category, amount, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE amount = VALUES(amount)
    `, [record.id, record.user_id, record.category, record.amount]);

    return record;
  } catch (err) {
    console.error("❌ Error creating/updating budget:", err);
    markDbOffline();
    return createOrUpdateBudgetRecord(record);
  }
}

export async function updateBudgetRecord(id: string, user_id: string, amount: number, category?: string): Promise<BudgetRecord> {
  await initBudgetsTable();
  const pool = getDbPool();

  if (!pool) {
    const idx = memoryBudgets.findIndex(b => b.id === id && (b.user_id === user_id || user_id === 'usr_mock_01'));
    if (idx === -1) throw new Error('Budget record not found');
    memoryBudgets[idx].amount = Number(amount);
    if (category) memoryBudgets[idx].category = category;
    return memoryBudgets[idx];
  }

  try {
    let query = 'UPDATE budgets SET amount = ?';
    const values: any[] = [amount];
    if (category) {
      query += ', category = ?';
      values.push(category);
    }
    query += ' WHERE id = ? AND user_id = ?';
    values.push(id, user_id);

    const [res]: any = await pool.query(query, values);
    if (res.affectedRows === 0) throw new Error('Budget record not found');

    const [rows]: any = await pool.query('SELECT * FROM budgets WHERE id = ?', [id]);
    return rows[0] as BudgetRecord;
  } catch (err) {
    console.error("❌ Error updating budget:", err);
    markDbOffline();
    return updateBudgetRecord(id, user_id, amount, category);
  }
}

export async function deleteBudgetRecord(id: string, user_id: string): Promise<boolean> {
  await initBudgetsTable();
  const pool = getDbPool();

  if (!pool) {
    const initLen = memoryBudgets.length;
    memoryBudgets = memoryBudgets.filter(b => !(b.id === id && (b.user_id === user_id || user_id === 'usr_mock_01')));
    return memoryBudgets.length < initLen;
  }

  try {
    const [res]: any = await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, user_id]);
    return res.affectedRows > 0;
  } catch (err) {
    console.error("❌ Error deleting budget:", err);
    markDbOffline();
    return deleteBudgetRecord(id, user_id);
  }
}
