import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f8fafc] p-12">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading FinMate Workspace...</p>
      </div>
    </div>
  );
};
