import React from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';

const MetricsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  badge,
  badgeType = 'info', // 'success', 'warning', 'danger', 'info'
  trend,
  className = '' 
}) => {
  const getBadgeClass = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'danger':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-brand-500/15 text-brand-400 border-brand-500/30';
    }
  };

  return (
    <div className={`glass-panel rounded-xl p-5 border border-slate-800 relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          {value !== undefined && value !== null ? value : '--'}
        </span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeClass()}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default MetricsCard;
