import React from 'react';
import { VerificationRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { getRiskLevel, getConfidenceLevel } from '../../utils/formatters';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  SlidersHorizontal, 
  UserCheck, 
  ArrowRight,
  Info,
  Clock,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface AuthentiqDecisionPanelProps {
  record: VerificationRecord;
  onOpenFactors: () => void;
  onOpenReview: () => void;
}

export const AuthentiqDecisionPanel: React.FC<AuthentiqDecisionPanelProps> = ({
  record,
  onOpenFactors,
  onOpenReview,
}) => {
  const riskInfo = getRiskLevel(record.fraudRisk);
  const confInfo = getConfidenceLevel(record.evidenceConfidence);

  return (
    <div className="relative rounded-xl border border-cyan-900/50 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-5 md:p-6 shadow-2xl shadow-cyan-950/20 overflow-hidden">
      {/* Subtle background cyber grid accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />

      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 font-mono text-[10px] font-bold tracking-widest uppercase">
              <Cpu className="w-3 h-3" /> AUTHENTIQ DECISION
            </span>
            <span className="text-xs font-mono text-slate-400">•</span>
            <span className="text-xs font-mono text-slate-300 font-semibold">{record.id}</span>
            <span className="text-xs font-mono text-slate-400">•</span>
            <span className="text-[11px] font-mono text-slate-400">{record.timestamp}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase font-sans">
              {record.status === 'Targeted Verification' 
                ? 'TARGETED VERIFICATION RECOMMENDED' 
                : `${record.status.toUpperCase()} RECOMMENDED`}
            </h2>
            <StatusBadge status={record.status} size="md" />
          </div>
        </div>

        {/* Action Controls & Governance State */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenFactors}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-mono border border-slate-700 transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Why? / View Factors</span>
          </button>

          <button
            onClick={onOpenReview}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-cyan-900/40"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Officer Review</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* VISUAL FOCAL POINT: FRAUD RISK + EVIDENCE CONFIDENCE */}
      <div className="my-5 p-4 md:p-5 rounded-lg bg-slate-950/80 border border-slate-800 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FOCAL METER 1: FRAUD RISK */}
          <div className="space-y-3 pr-0 md:pr-4 md:border-r border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Fraud Risk
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Deterministic Discrepancy Score (0–100)
                  </span>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded border font-mono font-semibold ${riskInfo.badgeBg} ${riskInfo.badgeBorder} ${riskInfo.textColor}`}>
                {riskInfo.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black font-mono tracking-tight text-slate-100">
                {record.fraudRisk}
              </span>
              <span className="text-lg font-mono text-slate-400">/ 100</span>
            </div>

            {/* Segmented Risk Bar */}
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, Math.max(2, record.fraudRisk))}%`,
                    backgroundColor: riskInfo.color 
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>0 (Low)</span>
                <span>25 (Threshold)</span>
                <span>50 (High)</span>
                <span>100</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              No evidence of optical tampering or identity impersonation detected (+0 risk).
            </p>
          </div>

          {/* FOCAL METER 2: EVIDENCE CONFIDENCE */}
          <div className="space-y-3 pl-0 md:pl-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Evidence Confidence
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Corroboration Completeness (0–100)
                  </span>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded border font-mono font-semibold ${confInfo.badgeBg} ${confInfo.badgeBorder} ${confInfo.textColor}`}>
                {confInfo.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black font-mono tracking-tight text-slate-100">
                {record.evidenceConfidence}
              </span>
              <span className="text-lg font-mono text-slate-400">/ 100</span>
            </div>

            {/* Segmented Confidence Bar */}
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, Math.max(2, record.evidenceConfidence))}%`,
                    backgroundColor: confInfo.color 
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>0 (Inconclusive)</span>
                <span>50 (Min Threshold)</span>
                <span>85 (Baseline)</span>
                <span>100</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Reduced from 95% due to unavailable civil database check (-18% completeness).
            </p>
          </div>
        </div>

        {/* Explicit Decoupling Principle Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-cyan-300 font-mono bg-cyan-950/20 px-3 py-2 rounded border border-cyan-900/30">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong>Fundamental Axiom:</strong> Evidence Confidence ≠ Fraud Risk • Low completeness reflects an offline source, NOT deception.
          </span>
        </div>
      </div>

      {/* Rationale & Officer Status Sub-panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
        <div className="md:col-span-2 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Recommended Action &amp; Operational Path
          </span>
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-amber-300 font-semibold">Targeted Verification:</strong> {record.recommendationReason}
          </p>
        </div>

        <div className="space-y-1 md:border-l border-slate-800/80 md:pl-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Authorized Officer Determination
          </span>
          <div className="flex items-center gap-1.5 font-mono">
            {record.officerDecision === 'Pending' ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pending Officer Review
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {record.officerDecision}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

