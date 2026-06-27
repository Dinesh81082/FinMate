import React from 'react';
import { useFinance } from '../context/FinanceContext.tsx';

export const Accounts: React.FC = () => {
  const { accounts, totalBalance } = useFinance();

  return (
    <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
      <div className="grid grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-36">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 text-sm">{acc.name}</h4>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[10px] font-bold">
                  {acc.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{acc.number}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available Balance</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        ))}

        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between h-36">
          <div>
            <h4 className="font-bold text-slate-200 text-sm">Combined Liquidity</h4>
            <p className="text-xs text-slate-400 mt-1">Across all synced accounts</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Net Worth Estimation</p>
            <p className="text-2xl font-bold text-white mt-0.5">${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
