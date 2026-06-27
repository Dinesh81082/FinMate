import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

export const ErrorPage: React.FC = () => {
  const error: any = useRouteError();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0f172a] text-white font-sans p-6 text-center">
      <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6">
        !
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
        {error?.statusText || error?.message || 'We encountered an unexpected error while rendering this page.'}
      </p>
      <Link
        to="/"
        className="bg-indigo-600 text-white text-xs font-bold px-6 py-3 rounded-lg shadow-sm hover:bg-indigo-700 uppercase tracking-wider transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};
