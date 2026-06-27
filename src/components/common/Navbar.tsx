import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

interface NavbarProps {
  title: string;
  onAddTransaction?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onAddTransaction }) => {
  const { logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer" title="Notifications">
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          <svg className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </div>
        
        {onAddTransaction && (
          <button
            onClick={onAddTransaction}
            className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            + ADD TRANSACTION
          </button>
        )}

        <button
          onClick={logout}
          className="text-xs font-semibold text-slate-400 hover:text-rose-500 uppercase tracking-wider ml-2 transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};
