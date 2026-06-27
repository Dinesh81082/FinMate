import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { memoryTransactions, queryTransactions } from '../models/transactionModel.ts';

/**
 * GET /api/reports?month=YYYY-MM
 */
export const getReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const { month } = req.query; // e.g. "2026-06" or "all"

    let allTxs: any[] = [];
    try {
      const txRes = await queryTransactions({ user_id, limit: 1000 });
      allTxs = txRes?.data || [];
    } catch {
      allTxs = memoryTransactions.filter(tx => tx.user_id === user_id || user_id === 'usr_mock_01');
    }

    // Filter by month if specified
    const filteredTxs = (month && typeof month === 'string' && month !== 'all')
      ? allTxs.filter(tx => tx.date.startsWith(month))
      : allTxs;

    // Calculate Summary
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTxs.forEach(tx => {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'Income') totalIncome += amt;
      else if (tx.type === 'Expense') totalExpense += amt;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // Category Report
    const catMap: Record<string, { amount: number; count: number; type: string }> = {};
    filteredTxs.forEach(tx => {
      if (tx.type === 'Expense') {
        if (!catMap[tx.category]) catMap[tx.category] = { amount: 0, count: 0, type: 'Expense' };
        catMap[tx.category].amount += Number(tx.amount || 0);
        catMap[tx.category].count += 1;
      }
    });

    const categoryReport = Object.entries(catMap).map(([category, data]) => ({
      category,
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
      percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    // Monthly Report (Trend across all months)
    const monthMap: Record<string, { income: number; expense: number }> = {};
    allTxs.forEach(tx => {
      const m = tx.date.substring(0, 7);
      if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 };
      const amt = Number(tx.amount || 0);
      if (tx.type === 'Income') monthMap[m].income += amt;
      else if (tx.type === 'Expense') monthMap[m].expense += amt;
    });

    const monthlyReport = Object.entries(monthMap).map(([m, data]) => ({
      month: m,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
      savings: Math.round((data.income - data.expense) * 100) / 100
    })).sort((a, b) => a.month.localeCompare(b.month));

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpense: Math.round(totalExpense * 100) / 100,
          netSavings: Math.round(netSavings * 100) / 100,
          savingsRate,
          transactionCount: filteredTxs.length
        },
        categoryReport,
        monthlyReport,
        transactions: filteredTxs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/export?month=YYYY-MM
 */
export const exportReportsCsv = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const { month } = req.query;

    let allTxs: any[] = [];
    try {
      const txRes = await queryTransactions({ user_id, limit: 1000 });
      allTxs = txRes?.data || [];
    } catch {
      allTxs = memoryTransactions.filter(tx => tx.user_id === user_id || user_id === 'usr_mock_01');
    }

    const filteredTxs = (month && typeof month === 'string' && month !== 'all')
      ? allTxs.filter(tx => tx.date.startsWith(month))
      : allTxs;

    const headers = ['ID', 'Date', 'Merchant', 'Category', 'Type', 'Amount', 'Notes'];
    const csvRows = [headers.join(',')];

    filteredTxs.forEach(tx => {
      const row = [
        `"${tx.id}"`,
        `"${tx.date}"`,
        `"${(tx.merchant || '').replace(/"/g, '""')}"`,
        `"${tx.category || ''}"`,
        `"${tx.type || ''}"`,
        `${tx.amount}`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="financial_report_${month || 'all'}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
