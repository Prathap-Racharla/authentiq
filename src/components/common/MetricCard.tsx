import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'info';
  deltaText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  deltaText
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-800/80 hover:border-slate-700',
      iconBg: 'bg-slate-800/50 text-cyan-400 border border-slate-700/50',
      valueColor: 'text-slate-100',
    },
    danger: {
      border: 'border-rose-900/40 hover:border-rose-800/60',
      iconBg: 'bg-rose-950/30 text-rose-400 border border-rose-800/40',
      valueColor: 'text-rose-200',
    },
    warning: {
      border: 'border-amber-900/40 hover:border-amber-800/60',
      iconBg: 'bg-amber-950/30 text-amber-400 border border-amber-800/40',
      valueColor: 'text-amber-200',
    },
    info: {
      border: 'border-cyan-900/40 hover:border-cyan-800/60',
      iconBg: 'bg-cyan-950/30 text-cyan-400 border border-cyan-800/40',
      valueColor: 'text-cyan-200',
    }
  }[variant];

  return (
    <div className={`relative bg-slate-900/50 hover:bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border transition-all shadow-sm ${variantStyles.border}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block font-mono">
            {title}
          </span>
          <div className={`text-2xl md:text-3xl font-bold font-mono tracking-tight ${variantStyles.valueColor}`}>
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${variantStyles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="truncate">{subtitle || 'Live state'}</span>
        {deltaText && (
          <span className="text-slate-300 font-medium shrink-0 ml-2">
            {deltaText}
          </span>
        )}
      </div>
    </div>
  );
};
