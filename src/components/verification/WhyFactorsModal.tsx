import React from 'react';
import { VerificationRecord } from '../../types';
import { 
  X, 
  HelpCircle, 
  ShieldAlert, 
  Layers, 
  Cpu
} from 'lucide-react';

interface WhyFactorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: VerificationRecord;
}

export const WhyFactorsModal: React.FC<WhyFactorsModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/50">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100">
                  Transparent Decision Engine Analysis
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {record.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deterministic factor breakdown and decoupled metric derivation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Principle Banner */}
          <div className="bg-slate-950/80 border border-cyan-900/40 rounded-lg p-4 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-cyan-300 uppercase tracking-wider text-[11px]">
                Core Architecture Distinction: Evidence Confidence ≠ Fraud Risk
              </p>
              <p className="text-slate-300">
                A missing or unavailable evidence stream reduces the overall <strong>Evidence Confidence</strong> (completeness). 
                However, unavailability alone does <em>not</em> prove deception and adds <strong>+0 to Fraud Risk</strong>.
              </p>
            </div>
          </div>

          {/* Two Column Factor Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Fraud Risk Factors */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-slate-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Fraud Risk: {record.fraudRisk} / 100
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Low Risk Band
                </span>
              </div>

              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Contributing Risk Factors:
              </span>

              <div className="space-y-2">
                {record.riskFactors.map((factor, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded bg-slate-900 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">
                        {factor.factor}
                      </span>
                      <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                        factor.impact.includes('+0') 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {factor.impact}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {factor.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Evidence Confidence Factors */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Evidence Confidence: {record.evidenceConfidence} / 100
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Substantial
                </span>
              </div>

              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Confidence & Completeness Factors:
              </span>

              <div className="space-y-2">
                {record.confidenceFactors.map((factor, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded bg-slate-900 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">
                        {factor.factor}
                      </span>
                      <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                        factor.impact.includes('Unavailable') || factor.impact.includes('Incomplete')
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        {factor.impact}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {factor.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transparent Engine Deterministic Rules Explained */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Deterministic Decision Rule Triggered
            </h4>
            <div className="p-3 bg-slate-900 rounded font-mono text-xs text-slate-300 border border-slate-800 leading-relaxed">
              <span className="text-amber-400 font-semibold">IF</span> Fraud Risk &lt; 25 <span className="text-slate-500">AND</span> Evidence Confidence &lt; 85 <br />
              <span className="text-cyan-400 font-semibold">→ TARGETED VERIFICATION</span> (Selected) <br />
              <span className="text-slate-400 text-[11px] mt-1 block">
                Reason: Low fraud risk does not warrant rejection or intensive officer review, but incomplete database corroboration requires a targeted secondary check.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            AuthentiQ Transparent Decision Engine • Explainable AI Layer
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Factors
          </button>
        </div>
      </div>
    </div>
  );
};
