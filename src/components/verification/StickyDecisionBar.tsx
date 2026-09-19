import React from 'react';
import { VerificationStatus } from '../../types';
import { ShieldAlert, Layers, UserCheck, ArrowUp } from 'lucide-react';

interface StickyDecisionBarProps {
  fraudRisk: number;
  evidenceConfidence: number;
  recommendation: VerificationStatus | string;
  onScrollToDecision: () => void;
}

export const StickyDecisionBar: React.FC<StickyDecisionBarProps> = ({
  fraudRisk,
  evidenceConfidence,
  recommendation,
  onScrollToDecision,
}) => {
  const normRec = (recommendation || '').toUpperCase();
  const isNormal = normRec.includes('NORMAL') || normRec.includes('PROCEED');
  const isTargeted = normRec.includes('TARGETED') || normRec.includes('STEP-UP');
  const isReview = normRec.includes('OFFICER') || normRec.includes('REVIEW');

  const recBadgeClass = isNormal
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : isTargeted
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : isReview
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    : 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  return (
    <div className="sticky top-2 z-40 bg-slate-900/95 border border-cyan-800/60 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 font-mono text-xs animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Risk:</span>
          <span className={`font-bold ${fraudRisk <= 25 ? 'text-emerald-400' : fraudRisk <= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
            {fraudRisk}/100
          </span>
        </div>

        <span className="text-slate-700 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Confidence:</span>
          <span className="font-bold text-cyan-300">
            {evidenceConfidence}/100
          </span>
        </div>

        <span className="text-slate-700 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">AI Recommendation:</span>
          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${recBadgeClass}`}>
            {recommendation}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onScrollToDecision}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-md shrink-0"
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>Officer Decision</span>
        <ArrowUp className="w-3 h-3" />
      </button>
    </div>
  );
};

