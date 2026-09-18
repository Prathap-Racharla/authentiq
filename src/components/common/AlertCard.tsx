import React from 'react';
import { SecurityAlert } from '../../data/mockAlerts';
import { AlertTriangle, Info, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertCardProps {
  alert: SecurityAlert;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const config = {
    warning: {
      border: 'border-amber-900/40 bg-amber-950/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
    },
    critical: {
      border: 'border-rose-900/40 bg-rose-950/20',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30'
    },
    info: {
      border: 'border-sky-900/40 bg-sky-950/20',
      icon: Info,
      iconColor: 'text-sky-400',
      badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30'
    }
  }[alert.severity];

  const IconComponent = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.border} flex items-start gap-3 transition-colors`}>
      <div className="mt-0.5 shrink-0">
        <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-200 truncate">
            {alert.title}
          </h4>
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            {alert.timestamp}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {alert.description}
        </p>
        {alert.relatedVerificationId && (
          <div className="pt-1.5">
            <Link 
              to={`/verification/${alert.relatedVerificationId}`}
              className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Session {alert.relatedVerificationId}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

