import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'];

export const Reports: React.FC = () => {
  const { token } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [activeTab, setActiveTab] = useState<'monthly' | 'category'>('monthly');

  const availableMonths = [
    { label: 'All Time Activity', value: 'all' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'May 2026', value: '2026-05' },
    { label: 'April 2026', value: '2026-04' }
  ];

  const fetchReports = async (monthVal: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?month=${monthVal}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setReportData(json.data);
      }
    } catch (err) {
      console.error('Failed to load financial reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedMonth);
  }, [selectedMonth, token]);

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`/api/reports/export?month=${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finmate_report_${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  const summary = reportData?.summary || { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0, transactionCount: 0 };
  const monthlyTrend = reportData?.monthlyReport || [];
  const categoryBreakdown = reportData?.categoryReport || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Generate comprehensive monthly executive summaries and category audits.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            {availableMonths.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <button
            onClick={handleExportCsv}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">${summary.totalIncome?.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Inflow for period</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-600 mt-2">${summary.totalExpense?.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Outflow for period</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Net Savings</p>
          <p className={`text-2xl font-bold mt-2 ${summary.netSavings < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
            ${summary.netSavings?.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Surplus retained</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Savings Efficiency Rate</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.savingsRate || 0}%</p>
          <p className="text-xs text-slate-400 mt-1">{summary.transactionCount} records audited</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`pb-4 px-1 border-b-2 font-bold text-sm transition ${
              activeTab === 'monthly' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            📈 Monthly Report Comparison
          </button>

          <button
            onClick={() => setActiveTab('category')}
            className={`pb-4 px-1 border-b-2 font-bold text-sm transition ${
              activeTab === 'category' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            🏷️ Category Spending Breakdown
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Generating report visualizations...</div>
      ) : activeTab === 'monthly' ? (
        /* Monthly Report View */
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Income vs. Expense Historical Trend</h3>
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={val => `$${val}`} />
                  <Tooltip formatter={(val: any) => [`$${val}`, '']} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="savings" name="Net Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Monthly Ledger Audit Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                    <th className="py-3 px-6">Month</th>
                    <th className="py-3 px-6 text-right">Total Income</th>
                    <th className="py-3 px-6 text-right">Total Expense</th>
                    <th className="py-3 px-6 text-right">Net Savings</th>
                    <th className="py-3 px-6 text-right">Retained Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {monthlyTrend.map(row => {
                    const rate = row.income > 0 ? Math.round((row.savings / row.income) * 100) : 0;
                    return (
                      <tr key={row.month} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 text-slate-900 font-bold">{row.month}</td>
                        <td className="py-4 px-6 text-right text-emerald-600">${row.income.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-rose-600">${row.expense.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-indigo-600 font-bold">${row.savings.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs ${rate >= 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Category Report View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1 flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-900 mb-4">Expense Allocation Share</h3>
            <div className="h-72 w-full flex items-center justify-center">
              {categoryBreakdown.length === 0 ? (
                <p className="text-slate-400 text-sm">No expenses recorded for period.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={4}
                    >
                      {categoryBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`$${val}`, 'Spent']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 text-xs">
              {categoryBreakdown.slice(0, 6).map((c: any, i: number) => (
                <div key={c.category} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 font-medium">{c.category}: {c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Category Expenditure Audit</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6 text-center">Transactions</th>
                    <th className="py-3 px-6 text-right">Total Outflow</th>
                    <th className="py-3 px-6 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {categoryBreakdown.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">No category transactions found.</td></tr>
                  ) : categoryBreakdown.map((row: any, idx: number) => (
                    <tr key={row.category} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-slate-900 font-bold">{row.category}</span>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600">{row.count}</td>
                      <td className="py-4 px-6 text-right text-rose-600 font-bold">${row.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-slate-700 font-semibold">{row.percentage}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                            <div className="h-full rounded-full" style={{ width: `${row.percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
