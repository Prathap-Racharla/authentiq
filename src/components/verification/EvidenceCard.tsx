import React, { useState } from 'react';
import { EvidenceItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  FileText, 
  Fingerprint, 
  Database, 
  History, 
  Clock, 
  Server, 
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  Scan,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface EvidenceCardProps {
  evidence: EvidenceItem;
  onInspect?: () => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, onInspect }) => {
  const [showAllSignals, setShowAllSignals] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
      case 'biometric':
        return <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />;
      case 'database':
        return <Database className="w-3.5 h-3.5 text-sky-400" />;
      case 'context_history':
        return <History className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Server className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const isUnavailable = evidence.status === 'Unavailable';
  const visibleSignals = showAllSignals ? evidence.signals : evidence.signals.slice(0, 2);
  const remainingCount = Math.max(0, evidence.signals.length - 2);

  return (
    <div className={`rounded-xl border p-4 flex flex-col justify-between transition-all shadow-sm ${
      isUnavailable 
        ? 'border-slate-800/80 bg-slate-900/30' 
        : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
    }`}>
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 shrink-0">
              {getCategoryIcon(evidence.category)}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-slate-100 truncate">
                {evidence.title}
              </h3>
              <span className="text-[10px] font-mono text-slate-400 truncate block">
                {evidence.source.split('(')[0].trim()}
              </span>
            </div>
          </div>
          <StatusBadge status={evidence.status} size="sm" />
        </div>

        {/* Confidence & Availability Bar */}
        <div className="my-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Stream Confidence</span>
            <span className="font-mono font-semibold text-slate-200">
              {evidence.confidence}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isUnavailable 
                  ? 'bg-slate-500' 
                  : evidence.confidence >= 80 
                    ? 'bg-cyan-400' 
                    : evidence.confidence >= 50 
                      ? 'bg-amber-400' 
                      : 'bg-rose-400'
              }`}
              style={{ width: `${evidence.confidence}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
            <span className="flex items-center gap-1.5 truncate">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                evidence.availability === 'Available' 
                  ? 'bg-emerald-400' 
                  : evidence.availability === 'Degraded' 
                    ? 'bg-amber-400' 
                    : 'bg-slate-400'
              }`} />
              {evidence.availability}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-2.5 h-2.5 text-slate-500" />
              {evidence.lastChecked}
            </span>
          </div>
        </div>

        {/* Summary Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-2 font-sans">
          {evidence.summary}
        </p>

        {/* Progressive Disclosure Signals */}
        <div className="space-y-1.5">
          {visibleSignals.map((sig, idx) => (
            <div 
              key={idx} 
              className="text-[10px] flex items-center gap-2 text-slate-300 bg-slate-950/40 px-2.5 py-1 rounded-md border border-slate-800/40 truncate"
            >
              {sig.impact === 'positive' && (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              )}
              {sig.impact === 'risk' && (
                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
              )}
              {sig.impact === 'lowers_confidence' && (
                <MinusCircle className="w-3 h-3 text-slate-400 shrink-0" />
              )}
              {sig.impact === 'neutral' && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0 mx-0.5" />
              )}
              <span className="truncate font-sans">
                <strong className="text-slate-200 font-medium">{sig.label}:</strong> {sig.description}
              </span>
            </div>
          ))}
        </div>

        {remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllSignals(!showAllSignals)}
            className="mt-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            {showAllSignals ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>+ {remainingCount} more signals <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}

        {onInspect && (
          <button
            type="button"
            onClick={onInspect}
            className="mt-2.5 w-full py-1.5 px-2 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 hover:text-white text-[10px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Scan className="w-3 h-3 text-cyan-400" />
            <span>INSPECT DOCUMENT PIPELINE</span>
          </button>
        )}
      </div>

      {/* Neutral notification for Unavailable state */}
      {isUnavailable && (
        <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-950/30 px-2 py-1 rounded">
          <AlertCircle className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">Offline stream = +0 fraud risk penalty.</span>
        </div>
      )}
    </div>
  );
};
