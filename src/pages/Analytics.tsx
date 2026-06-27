import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useFinance } from '../context/FinanceContext.tsx';

const data = [
  { month: 'Jan', income: 8200, expenses: 3100 },
  { month: 'Feb', income: 8400, expenses: 2950 },
  { month: 'Mar', income: 8100, expenses: 3400 },
  { month: 'Apr', income: 8800, expenses: 3200 },
  { month: 'May', income: 8400, expenses: 2800 },
  { month: 'Jun', income: 8400, expenses: 3120 }
];

export const Analytics: React.FC = () => {
  const { monthlyIncome, monthlyExpenses } = useFinance();

  return (
    <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-96 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Income vs Expense Projection</h3>
            <p className="text-xs text-slate-400 mt-0.5">Historical monthly comparisons</p>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-indigo-600"><span className="w-3 h-3 rounded bg-indigo-500"></span> Income</span>
            <span className="flex items-center gap-1.5 text-rose-500"><span className="w-3 h-3 rounded bg-rose-400"></span> Expenses</span>
          </div>
        </div>

        <div className="flex-1 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                formatter={(val: any) => [`$${val}`, '']}
              />
              <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Savings Rate Efficiency</h4>
          <p className="text-2xl font-bold text-slate-900">
            {((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Exceeding standard financial benchmark (20%)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Average Daily Spend</h4>
          <p className="text-2xl font-bold text-slate-900">${(monthlyExpenses / 30).toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Based on trailing 30-day window</p>
        </div>
      </div>
    </div>
  );
};
