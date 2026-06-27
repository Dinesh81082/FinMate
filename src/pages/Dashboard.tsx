import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext.tsx';

export const Dashboard: React.FC = () => {
  const { transactions, totalBalance, monthlyIncome, monthlyExpenses, savingsGoalProgress, createTransaction } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Business');

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount) return;
    const numAmt = Number(amount);
    await createTransaction({
      merchant,
      amount: Math.abs(numAmt),
      type: category === 'Income' || numAmt > 0 ? 'Income' : 'Expense',
      category,
      date: new Date().toISOString().split('T')[0]
    });
    setMerchant('');
    setAmount('');
    setShowModal(false);
  };

  const getBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Business': return 'bg-blue-50 text-blue-600';
      case 'Groceries': return 'bg-green-50 text-green-600';
      case 'Income': return 'bg-emerald-50 text-emerald-600';
      case 'Dining': return 'bg-orange-50 text-orange-600';
      default: return 'bg-indigo-50 text-indigo-600';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Stats Banner */}
      <div className="p-6 grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Balance</p>
          <p className="text-2xl font-bold mt-1 text-slate-900">${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-green-500 mt-1 font-medium">↑ 2.4% vs last month</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Income</p>
          <p className="text-2xl font-bold mt-1 text-slate-900">${monthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">On track</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expenses</p>
          <p className="text-2xl font-bold mt-1 text-rose-500">${monthlyExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-rose-400 mt-1">37% of budget used</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Savings Goal</p>
          <p className="text-2xl font-bold mt-1 text-slate-900">{savingsGoalProgress}%</p>
          <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: `${savingsGoalProgress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="px-6 flex gap-4 flex-1 overflow-hidden pb-6">
        <div className="flex-[2] bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 text-sm">Cash Flow Trends</h3>
              <button 
                onClick={() => setShowModal(true)}
                className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
              >
                + Quick Add
              </button>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-[10px] border border-slate-200 rounded bg-slate-50 cursor-pointer text-slate-600">Weekly</span>
              <span className="px-2 py-1 text-[10px] border rounded bg-indigo-50 text-indigo-600 border-indigo-200 font-semibold cursor-pointer">Monthly</span>
            </div>
          </div>
          
          <div className="h-36 relative p-4 shrink-0">
            <svg className="w-full h-full text-indigo-500" viewBox="0 0 400 150">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgb(99,102,241)', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: 'rgb(99,102,241)', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <path d="M0,120 Q50,110 80,130 T160,80 T240,100 T320,40 T400,60 L400,150 L0,150 Z" fill="url(#grad)" />
              <path d="M0,120 Q50,110 80,130 T160,80 T240,100 T320,40 T400,60" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="320" cy="40" r="4" fill="white" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div className="p-4 pt-0 flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 sticky top-0 bg-white">
                  <th className="text-left py-2 font-semibold uppercase tracking-tighter">Merchant</th>
                  <th className="text-left py-2 font-semibold uppercase tracking-tighter">Category</th>
                  <th className="text-right py-2 font-semibold uppercase tracking-tighter">Amount</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 font-medium text-slate-800">{tx.merchant}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getBadgeClass(tx.category)}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className={`py-2.5 text-right font-semibold font-mono ${tx.type === 'Income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'Income' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 shrink-0">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Expenses by Category</h3>
            <div className="flex items-center justify-center relative h-32">
              <svg viewBox="0 0 36 36" className="w-24 h-24 stroke-indigo-500 fill-none">
                <path className="stroke-slate-100" strokeWidth="4" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path strokeDasharray="60, 100" strokeWidth="4" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute text-center">
                <p className="text-xs font-bold text-slate-800">$3.1k</p>
                <p className="text-[8px] uppercase opacity-40 text-slate-500 font-bold">Total</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1 font-medium text-slate-600"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Housing</span>
                <span className="font-bold text-slate-800">45%</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1 font-medium text-slate-600"><span className="w-2 h-2 rounded-full bg-indigo-300"></span> Food</span>
                <span className="font-bold text-slate-800">22%</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1 font-medium text-slate-600"><span className="w-2 h-2 rounded-full bg-indigo-100"></span> Other</span>
                <span className="font-bold text-slate-800">33%</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-xl p-4 text-white flex-1 flex flex-col justify-between shrink-0 shadow-sm">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest opacity-60 mb-2 text-indigo-200">Investment Advice</h3>
              <p className="text-xs leading-relaxed opacity-90 text-indigo-100">
                Your savings rate is up 5% from last month. Consider moving $2,000 to your 401(k) to maximize tax benefits.
              </p>
            </div>
            <div className="mt-4 p-2.5 bg-indigo-800/80 rounded border border-indigo-700 flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-200">AI Analysis v2.4</span>
              <button className="text-[10px] underline text-indigo-300 hover:text-white cursor-pointer">Details</button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Tx Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">New Transaction Setup</h3>
            <form onSubmit={handleCreateTx} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Merchant Name</label>
                <input 
                  type="text" 
                  value={merchant} 
                  onChange={e => setMerchant(e.target.value)}
                  placeholder="e.g. Apple Store" 
                  className="w-full p-2 border rounded text-sm bg-slate-50 focus:outline-indigo-500"
                  required 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  placeholder="-12.50 or 500" 
                  className="w-full p-2 border rounded text-sm bg-slate-50 focus:outline-indigo-500"
                  required 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full p-2 border rounded text-sm bg-slate-50 focus:outline-indigo-500"
                >
                  <option value="Business">Business</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Dining">Dining</option>
                  <option value="Income">Income</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded cursor-pointer hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
