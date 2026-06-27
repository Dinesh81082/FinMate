import { getDbPool, markDbOffline } from '../config/db.ts';

export interface TransactionRecord {
  id: string;
  user_id: string;
  merchant: string;
  category: string;
  type: 'Income' | 'Expense';
  amount: number; // Stored positive, type determines sign or math
  date: string; // YYYY-MM-DD
  notes?: string;
  created_at?: string;
}

export interface TransactionQueryParams {
  user_id: string;
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// In-memory mock ledger fallback for preview sandbox
export let memoryTransactions: TransactionRecord[] = [
  { id: 'tx_1', user_id: 'usr_mock_01', merchant: 'Amazon Web Services', category: 'Business', type: 'Expense', amount: 142.10, date: '2026-06-25', notes: 'Cloud hosting infrastructure' },
  { id: 'tx_2', user_id: 'usr_mock_01', merchant: 'Whole Foods Market', category: 'Groceries', type: 'Expense', amount: 84.22, date: '2026-06-24', notes: 'Weekly organic produce' },
  { id: 'tx_3', user_id: 'usr_mock_01', merchant: 'Stripe Payout', category: 'Income', type: 'Income', amount: 4200.00, date: '2026-06-23', notes: 'SaaS monthly revenue payout' },
  { id: 'tx_4', user_id: 'usr_mock_01', merchant: 'Starbucks Coffee', category: 'Dining', type: 'Expense', amount: 5.45, date: '2026-06-22', notes: 'Morning cold brew' },
  { id: 'tx_5', user_id: 'usr_mock_01', merchant: 'Apple Store', category: 'Business', type: 'Expense', amount: 1299.00, date: '2026-06-20', notes: 'MacBook external monitor setup' },
  { id: 'tx_6', user_id: 'usr_mock_01', merchant: 'Dividend Deposit', category: 'Income', type: 'Income', amount: 310.50, date: '2026-06-18', notes: 'Index fund quarterly dividend' },
  { id: 'tx_7', user_id: 'usr_mock_01', merchant: 'Pacific Gas & Electric', category: 'Utilities', type: 'Expense', amount: 185.20, date: '2026-06-15', notes: 'Monthly electricity bill' },
  { id: 'tx_8', user_id: 'usr_mock_01', merchant: 'Trader Joes', category: 'Groceries', type: 'Expense', amount: 112.40, date: '2026-06-12', notes: 'Pantry essentials' }
];

let tableInitialized = false;

export async function initTransactionsTable(): Promise<void> {
  if (tableInitialized) return;
  const pool = getDbPool();
  if (!pool) {
    tableInitialized = true;
    return;
  }

  const query = `
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      merchant VARCHAR(150) NOT NULL,
      category VARCHAR(64) NOT NULL,
      type ENUM('Income', 'Expense') NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_date (user_id, date),
      INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await pool.query(query);
    tableInitialized = true;
    console.log('✅ MySQL `transactions` table verified/created.');
  } catch (err) {
    markDbOffline();
    tableInitialized = true;
  }
}

export async function queryTransactions(params: TransactionQueryParams) {
  await initTransactionsTable();
  const pool = getDbPool();

  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 10));
  const offset = (page - 1) * limit;

  if (!pool) {
    let list = memoryTransactions.filter(tx => tx.user_id === params.user_id || params.user_id === 'usr_mock_01');

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(tx => tx.merchant.toLowerCase().includes(q) || (tx.notes && tx.notes.toLowerCase().includes(q)));
    }
    if (params.category && params.category !== 'All') {
      list = list.filter(tx => tx.category === params.category);
    }
    if (params.startDate) {
      list = list.filter(tx => tx.date >= params.startDate!);
    }
    if (params.endDate) {
      list = list.filter(tx => tx.date <= params.endDate!);
    }

    // Sort descending by date
    list.sort((a, b) => b.date.localeCompare(a.date));

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);

    return {
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  try {
    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    let countSql = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
    const values: any[] = [params.user_id];

    if (params.search) {
      sql += ' AND (merchant LIKE ? OR notes LIKE ?)';
      countSql += ' AND (merchant LIKE ? OR notes LIKE ?)';
      const searchVal = `%${params.search}%`;
      values.push(searchVal, searchVal);
    }
    if (params.category && params.category !== 'All') {
      sql += ' AND category = ?';
      countSql += ' AND category = ?';
      values.push(params.category);
    }
    if (params.startDate) {
      sql += ' AND date >= ?';
      countSql += ' AND date >= ?';
      values.push(params.startDate);
    }
    if (params.endDate) {
      sql += ' AND date <= ?';
      countSql += ' AND date <= ?';
      values.push(params.endDate);
    }

    const [countRows]: any = await pool.query(countSql, values);
    const total = countRows[0]?.total || 0;

    sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    const paginatedValues = [...values, limit, offset];
    const [rows]: any = await pool.query(sql, paginatedValues);

    return {
      data: rows as TransactionRecord[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (err) {
    markDbOffline();
    return queryTransactions(params);
  }
}

export async function createTransactionRecord(record: TransactionRecord): Promise<TransactionRecord> {
  await initTransactionsTable();
  const pool = getDbPool();

  if (!pool) {
    memoryTransactions.unshift(record);
    return record;
  }

  try {
    await pool.query(
      'INSERT INTO transactions (id, user_id, merchant, category, type, amount, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [record.id, record.user_id, record.merchant, record.category, record.type, record.amount, record.date, record.notes || null]
    );
    return record;
  } catch (err) {
    markDbOffline();
    memoryTransactions.unshift(record);
    return record;
  }
}

export async function updateTransactionRecord(id: string, user_id: string, updates: Partial<TransactionRecord>): Promise<TransactionRecord | null> {
  await initTransactionsTable();
  const pool = getDbPool();

  if (!pool) {
    const idx = memoryTransactions.findIndex(tx => tx.id === id && (tx.user_id === user_id || user_id === 'usr_mock_01'));
    if (idx === -1) return null;
    memoryTransactions[idx] = { ...memoryTransactions[idx], ...updates };
    return memoryTransactions[idx];
  }

  try {
    const [existing]: any = await pool.query('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [id, user_id]);
    if (!existing || existing.length === 0) return null;

    const current = existing[0] as TransactionRecord;
    const merged = { ...current, ...updates };

    await pool.query(
      'UPDATE transactions SET merchant = ?, category = ?, type = ?, amount = ?, date = ?, notes = ? WHERE id = ? AND user_id = ?',
      [merged.merchant, merged.category, merged.type, merged.amount, merged.date, merged.notes || null, id, user_id]
    );

    return merged;
  } catch (err) {
    markDbOffline();
    return updateTransactionRecord(id, user_id, updates);
  }
}

export async function deleteTransactionRecord(id: string, user_id: string): Promise<boolean> {
  await initTransactionsTable();
  const pool = getDbPool();

  if (!pool) {
    const initLen = memoryTransactions.length;
    memoryTransactions = memoryTransactions.filter(tx => !(tx.id === id && (tx.user_id === user_id || user_id === 'usr_mock_01')));
    return memoryTransactions.length < initLen;
  }

  try {
    const [result]: any = await pool.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, user_id]);
    return result.affectedRows > 0;
  } catch (err) {
    markDbOffline();
    return deleteTransactionRecord(id, user_id);
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  'Housing': '#6366f1',
  'Groceries': '#10b981',
  'Dining': '#f59e0b',
  'Utilities': '#06b6d4',
  'Business': '#3b82f6',
  'Shopping': '#ec4899',
  'Healthcare': '#ef4444',
  'Entertainment': '#8b5cf6',
  'Travel': '#14b8a6',
  'Investments': '#84cc16',
  'Salary': '#22c55e',
  'Income': '#10b981',
  'Other': '#64748b'
};

const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export async function fetchUserDashboardData(user_id: string) {
  await initTransactionsTable();
  const pool = getDbPool();

  // If memory fallback
  if (!pool) {
    const list = memoryTransactions.filter(tx => tx.user_id === user_id || user_id === 'usr_mock_01');
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    list.forEach(tx => {
      if (tx.type === 'Income') totalIncome += Number(tx.amount);
      else totalExpense += Number(tx.amount);
    });

    const currentBalance = totalIncome - totalExpense + 38500; // base starting checking balance

    // Recent 5
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    const recentTransactions = sorted.slice(0, 5);

    // Monthly expenses (Mock distributed or aggregated)
    const monthlyMap: Record<string, { exp: number; inc: number }> = {
      'Jan': { exp: 2150, inc: 6200 },
      'Feb': { exp: 2480, inc: 6200 },
      'Mar': { exp: 1940, inc: 6500 },
      'Apr': { exp: 2890, inc: 6800 },
      'May': { exp: 3120, inc: 7400 },
      'Jun': { exp: 0, inc: 0 }
    };

    list.forEach(tx => {
      const mNum = parseInt(tx.date.split('-')[1], 10);
      const mName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mNum - 1] || 'Jun';
      if (!monthlyMap[mName]) monthlyMap[mName] = { exp: 0, inc: 0 };
      if (tx.type === 'Expense') monthlyMap[mName].exp += Number(tx.amount);
      else monthlyMap[mName].inc += Number(tx.amount);
    });

    const monthlyExpenses = DEFAULT_MONTHS.map(m => ({
      name: m,
      amount: Math.round(monthlyMap[m]?.exp || 0),
      income: Math.round(monthlyMap[m]?.inc || 0)
    }));

    // Category expenses
    const catMap: Record<string, number> = {};
    list.filter(t => t.type === 'Expense').forEach(tx => {
      catMap[tx.category] = (catMap[tx.category] || 0) + Number(tx.amount);
    });

    const categoryExpenses = Object.entries(catMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[name] || '#64748b'
    })).sort((a, b) => b.value - a.value);

    // If no category expenses yet, add mock demo distribution
    if (categoryExpenses.length === 0) {
      categoryExpenses.push(
        { name: 'Business', value: 1441.10, color: CATEGORY_COLORS['Business'] },
        { name: 'Groceries', value: 196.62, color: CATEGORY_COLORS['Groceries'] },
        { name: 'Utilities', value: 185.20, color: CATEGORY_COLORS['Utilities'] },
        { name: 'Dining', value: 45.45, color: CATEGORY_COLORS['Dining'] }
      );
    }

    return {
      totalIncome,
      totalExpense,
      currentBalance,
      recentTransactions,
      monthlyExpenses,
      categoryExpenses
    };
  }

  try {
    // Total Income & Expense
    const [totalsRows]: any = await pool.query(`
      SELECT 
        SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as totalExpense
      FROM transactions WHERE user_id = ?
    `, [user_id]);

    const totalIncome = Number(totalsRows[0]?.totalIncome || 0);
    const totalExpense = Number(totalsRows[0]?.totalExpense || 0);
    const currentBalance = totalIncome - totalExpense + 38500;

    // Recent 5
    const [recentRows]: any = await pool.query(`
      SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 5
    `, [user_id]);

    // Monthly chart stats
    const [monthRows]: any = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%b') as month,
        DATE_FORMAT(date, '%Y-%m') as ym,
        SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as expAmount,
        SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) as incAmount
      FROM transactions 
      WHERE user_id = ? AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY ym, month ORDER BY ym ASC
    `, [user_id]);

    const monthlyExpenses = monthRows.map((r: any) => ({
      name: r.month,
      amount: Number(r.expAmount || 0),
      income: Number(r.incAmount || 0)
    }));

    if (monthlyExpenses.length === 0) {
      DEFAULT_MONTHS.forEach(m => monthlyExpenses.push({ name: m, amount: 0, income: 0 }));
    }

    // Category Pie chart stats
    const [catRows]: any = await pool.query(`
      SELECT category as name, SUM(amount) as value
      FROM transactions
      WHERE user_id = ? AND type = 'Expense'
      GROUP BY category ORDER BY value DESC
    `, [user_id]);

    const categoryExpenses = catRows.map((r: any) => ({
      name: r.name,
      value: Number(r.value || 0),
      color: CATEGORY_COLORS[r.name] || '#64748b'
    }));

    if (categoryExpenses.length === 0) {
      categoryExpenses.push(
        { name: 'Business', value: 1441.10, color: CATEGORY_COLORS['Business'] },
        { name: 'Groceries', value: 196.62, color: CATEGORY_COLORS['Groceries'] }
      );
    }

    return {
      totalIncome,
      totalExpense,
      currentBalance,
      recentTransactions: recentRows as TransactionRecord[],
      monthlyExpenses,
      categoryExpenses
    };
  } catch (err) {
    markDbOffline();
    return fetchUserDashboardData(user_id);
  }
}

