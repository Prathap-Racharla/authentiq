import React from 'react';
import { Lightbulb, Info, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface ExplainableFindingsProps {
  findings: string[];
  onOpenFactors: () => void;
}

export const ExplainableFindings: React.FC<ExplainableFindingsProps> = ({
  findings,
  onOpenFactors,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 tracking-wide">
              Explainable Findings
            </h3>
            <p className="text-xs text-slate-400">
              Why was this recommendation generated?
            </p>
          </div>
        </div>

        <button
          onClick={onOpenFactors}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-mono border border-slate-700 transition-colors shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Why? / View Factors</span>
        </button>
      </div>

      {/* Bulleted Explainable Findings */}
      <div className="space-y-2 pt-1">
        {findings.map((finding, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded border border-slate-800/80"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-normal">{finding}</span>
          </div>
        ))}
      </div>

      {/* Critical Core Distinction Callout */}
      <div className="p-3.5 rounded bg-slate-950/80 border border-cyan-900/50 flex items-start gap-2.5 text-xs">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-cyan-300">
            Critical Decision-Support Principle:
          </span>
          <p className="text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Low evidence confidence does not automatically mean high fraud risk.</strong>{' '}
            Because no malicious alterations were found, the subject is routed for targeted secondary check instead of being penalized.
          </p>
        </div>
      </div>
    </div>
  );
};

