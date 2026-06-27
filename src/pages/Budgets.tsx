import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface CategoryBudget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
}

export const Budgets: React.FC = () => {
  const { token } = useAuth();
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [summary, setSummary] = useState<any>({ totalBudget: 0, totalSpent: 0, totalRemaining: 0, overallPercentage: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [error, setError] = useState('');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/budgets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setBudgets(json.data || []);
        setSummary(json.summary || {});
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [token]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newCategory.trim() || !newAmount || Number(newAmount) <= 0) {
      setError('Please provide a valid category and positive amount.');
      return;
    }
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: newCategory, amount: Number(newAmount) })
      });
      if (res.ok) {
        setShowModal(false);
        setNewCategory('');
        setNewAmount('');
        fetchBudgets();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create budget');
      }
    } catch (err) {
      setError('Network error creating budget.');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchBudgets();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monthly Budget Planner</h1>
          <p className="text-sm text-slate-500 mt-1">Set monthly category caps and monitor your live spending targets.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Category Budget
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Monthly Budget</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">${summary.totalBudget?.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Spent</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">${summary.totalSpent?.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Remaining Cap</p>
          <p className={`text-2xl font-bold mt-2 ${summary.totalRemaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            ${summary.totalRemaining?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Overall Utilization</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-2xl font-bold text-slate-900">{summary.overallPercentage || 0}%</p>
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${summary.overallPercentage > 100 ? 'bg-red-500' : 'bg-indigo-600'}`}
                style={{ width: `${Math.min(100, summary.overallPercentage || 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading budget records...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800">No category budgets defined</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Click the button above to set spending limits for groceries, housing, entertainment, or custom categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{b.category}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-3">${b.amount.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo target</span></h3>
                </div>
                <button
                  onClick={() => handleDeleteBudget(b.id)}
                  className="text-slate-400 hover:text-red-500 transition p-1"
                  title="Remove budget"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium mb-1.5">
                  <span className="text-slate-600">${b.spent.toLocaleString()} spent</span>
                  <span className={b.isExceeded ? 'text-red-600 font-bold' : 'text-slate-400'}>
                    {b.isExceeded ? `+$${Math.abs(b.remaining).toLocaleString()} over` : `$${b.remaining.toLocaleString()} left`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${b.isExceeded ? 'bg-red-500' : b.percentage > 85 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span>Status: {b.isExceeded ? '⚠️ Exceeded cap' : '✅ Within limits'}</span>
                <span className="font-semibold text-slate-700">{b.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Category Cap</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries, Dining, Housing"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Monthly Limit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
