import React from 'react';
import { getRiskLevel } from '../../utils/formatters';
import { ShieldAlert, AlertCircle } from 'lucide-react';

interface RiskIndicatorProps {
  score: number; // 0 - 100
  showDetails?: boolean;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ 
  score, 
  showDetails = true 
}) => {
  const risk = getRiskLevel(score);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-slate-300" />
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fraud Risk
            </h4>
            <span className="text-[11px] text-slate-400">
              Deterministic Risk Score (0–100)
            </span>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${risk.badgeBg} ${risk.badgeBorder} ${risk.textColor}`}>
          {risk.label}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl font-black font-mono tracking-tight text-slate-100">
          {score}
        </span>
        <span className="text-sm font-mono text-slate-400">/ 100</span>
      </div>

      {/* Segmented Risk Meter */}
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
          <div 
            className="h-full transition-all duration-500 rounded-full"
            style={{ 
              width: `${Math.min(100, Math.max(2, score))}%`,
              backgroundColor: risk.color 
            }}
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 (Low)</span>
          <span>25 (Threshold)</span>
          <span>50 (High)</span>
          <span>100</span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Derived from multi-factor discrepancy rules. <strong className="text-slate-300">Fraud Risk is decoupled from Evidence Confidence.</strong>
          </p>
        </div>
      )}
    </div>
  );
};

