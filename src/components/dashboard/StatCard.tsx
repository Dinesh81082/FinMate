import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix = '$',
  trend,
  subtitle,
  icon,
  iconBg = 'bg-indigo-50 text-indigo-600',
  accentColor = 'text-slate-900'
}) => {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-1 font-mono">
          {prefix && <span className="text-sm font-semibold text-slate-400">{prefix}</span>}
          <span className={`text-2xl font-bold tracking-tight ${accentColor}`}>{formattedValue}</span>
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs">
          {trend && (
            <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded text-[10px] ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-400 font-medium truncate text-[11px]">{subtitle}</span>
          )}
        </div>
      </div>

      {/* Subtle bottom decorative accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
