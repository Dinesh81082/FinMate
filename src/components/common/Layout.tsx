import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Navbar } from './Navbar.tsx';

export const Layout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview';
      case '/transactions':
        return 'Transactions';
      case '/accounts':
        return 'Accounts';
      case '/analytics':
        return 'Analytics';
      default:
        return 'FinMate';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar title={getPageTitle()} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
