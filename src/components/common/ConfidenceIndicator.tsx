import React from 'react';
import { getConfidenceLevel } from '../../utils/formatters';
import { Layers, CheckCheck } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number; // 0 - 100
  showDetails?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ 
  score, 
  showDetails = true 
}) => {
  const conf = getConfidenceLevel(score);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Evidence Confidence
            </h4>
            <span className="text-[11px] text-slate-400">
              Corroboration Completeness (0–100)
            </span>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${conf.badgeBg} ${conf.badgeBorder} ${conf.textColor}`}>
          {conf.label}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl font-black font-mono tracking-tight text-slate-100">
          {score}
        </span>
        <span className="text-sm font-mono text-slate-400">/ 100</span>
      </div>

      {/* Segmented Confidence Meter */}
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
          <div 
            className="h-full transition-all duration-500 rounded-full"
            style={{ 
              width: `${Math.min(100, Math.max(2, score))}%`,
              backgroundColor: conf.color 
            }}
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 (Inconclusive)</span>
          <span>50 (Min Threshold)</span>
          <span>85 (Baseline)</span>
          <span>100</span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-400">
          <CheckCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Measures evidence stream availability & clarity. <strong className="text-slate-300">Low confidence does NOT imply high fraud.</strong>
          </p>
        </div>
      )}
    </div>
  );
};

