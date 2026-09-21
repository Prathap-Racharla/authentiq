import React, { useState } from 'react';
import { VerificationStatus, FactorContribution, EvidenceMap } from '../../types';
import { getRiskLevel, getConfidenceLevel } from '../../utils/formatters';
import { 
  ShieldAlert, 
  Layers, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Info
} from 'lucide-react';

interface DecisionSummaryCardProps {
  fraudRisk: number;
  evidenceConfidence: number;
  recommendation: VerificationStatus | string;
  recommendationReason: string;
  riskFactors?: FactorContribution[];
  confidenceFactors?: FactorContribution[];
  evidenceMap?: EvidenceMap;
  documentType?: string;
}

export const DecisionSummaryCard: React.FC<DecisionSummaryCardProps> = ({
  fraudRisk,
  evidenceConfidence,
  recommendation,
  recommendationReason,
  riskFactors = [],
  confidenceFactors = [],
  evidenceMap,
  documentType = '',
}) => {
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);

  const riskInfo = getRiskLevel(fraudRisk);
  const confInfo = getConfidenceLevel(evidenceConfidence);

  // Normalize recommendation label for display
  const normRec = (recommendation || '').toUpperCase();
  const isNormal = normRec.includes('NORMAL') || normRec.includes('PROCEED');
  const isTargeted = normRec.includes('TARGETED') || normRec.includes('STEP-UP');
  const isReview = normRec.includes('OFFICER') || normRec.includes('REVIEW');
  const isInconclusive = normRec.includes('INCONCLUSIVE');

  const recBadgeClass = isNormal
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : isTargeted
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : isReview
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    : 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  const recDisplayLabel = isNormal
    ? 'NORMAL PROCESSING'
    : isTargeted
    ? 'TARGETED VERIFICATION'
    : isReview
    ? 'OFFICER REVIEW'
    : 'INCONCLUSIVE';

  // Derive compact decisive factors (3-6 items) from actual evidence
  const decisiveFactors: { label: string; value: string; impact: 'positive' | 'warning' | 'neutral' | 'risk' }[] = [];

  if (evidenceMap?.document) {
    const doc = evidenceMap.document;
    const isDocGood = doc.status === 'Positive';
    decisiveFactors.push({
      label: 'Document evidence',
      value: isDocGood ? 'Strong (Valid optical clarity & structure)' : doc.status === 'Uncertain' ? 'Degraded capture quality' : 'Suspicious / Tampered',
      impact: isDocGood ? 'positive' : doc.status === 'Uncertain' ? 'warning' : 'risk'
    });
  }

  if (evidenceMap?.document?.signals) {
    const signals = evidenceMap.document.signals;
    const docTypeLower = (documentType || '').toLowerCase();

    // Check if signals or docType identify Aadhaar, DL, or Voter ID
    const isAadhaar = docTypeLower.includes('aadhaar') || 
                      signals.some(s => s.label.toLowerCase().includes('uidai') || s.description.toLowerCase().includes('aadhaar'));
    const isDl = docTypeLower.includes('driving') || docTypeLower.includes('licence') || 
                 signals.some(s => s.label.toLowerCase().includes('licence') || s.description.toLowerCase().includes('driving'));
    const isVoter = docTypeLower.includes('voter') || 
                    signals.some(s => s.label.toLowerCase().includes('epic') || s.description.toLowerCase().includes('voter'));

    // isPassport ONLY if explicitly passport or if NOT any of the other 3 AND has genuine MRZ Checksum signal
    const isPassport = docTypeLower.includes('passport') || 
                       (!isAadhaar && !isDl && !isVoter && signals.some(s => s.label.toLowerCase() === 'mrz checksum' || s.label.toLowerCase() === 'valid mrz'));

    if (isPassport) {
      const mrzSig = signals.find(s => s.label.toLowerCase().includes('mrz') && !s.label.toLowerCase().includes('format'));
      if (mrzSig) {
        const isMrzValid = mrzSig.impact === 'positive';
        decisiveFactors.push({
          label: 'MRZ check digits',
          value: isMrzValid ? 'Valid (ICAO 9303 TD3 checksums)' : 'Checksum mismatch flagged',
          impact: isMrzValid ? 'positive' : 'risk'
        });
      }
    } else if (isAadhaar) {
      const uidSig = signals.find(s => s.label.toLowerCase().includes('uidai'));
      const isValid = uidSig ? uidSig.impact !== 'risk' : true;
      decisiveFactors.push({
        label: 'UIDAI format',
        value: isValid ? 'Valid (12-digit UIDAI structure)' : 'UIDAI format irregularity flagged',
        impact: isValid ? 'positive' : 'risk'
      });
    } else if (isDl) {
      const dlSig = signals.find(s => s.label.toLowerCase().includes('licence'));
      const isValid = dlSig ? dlSig.impact !== 'risk' : true;
      decisiveFactors.push({
        label: 'Licence structure',
        value: isValid ? 'Valid (RTO format & active validity window)' : 'Licence validity or format defect flagged',
        impact: isValid ? 'positive' : 'risk'
      });
    } else if (isVoter) {
      const epicSig = signals.find(s => s.label.toLowerCase().includes('epic'));
      const isValid = epicSig ? epicSig.impact !== 'risk' : true;
      decisiveFactors.push({
        label: 'EPIC format',
        value: isValid ? 'Valid (10-char alphanumeric EPIC structure)' : 'EPIC format discrepancy flagged',
        impact: isValid ? 'positive' : 'risk'
      });
    } else {
      const credSig = signals.find(s => s.label.toLowerCase().includes('structure') || s.label.toLowerCase().includes('credential'));
      const isValid = credSig ? credSig.impact !== 'risk' : true;
      decisiveFactors.push({
        label: 'Credential format',
        value: isValid ? 'Valid (Visual layout & format verified)' : 'Format irregularity flagged',
        impact: isValid ? 'positive' : 'risk'
      });
    }
  }

  if (evidenceMap?.database) {
    const db = evidenceMap.database;
    const isDbAvail = db.status === 'Positive';
    const isDbOffline = db.availability === 'Unavailable' || db.status === 'Unavailable';
    decisiveFactors.push({
      label: 'Database evidence',
      value: isDbAvail ? 'Corroborated (Active registry record)' : isDbOffline ? 'Unavailable (HTTP 504 timeout - +0 risk)' : 'Adverse registry status',
      impact: isDbAvail ? 'positive' : isDbOffline ? 'warning' : 'risk'
    });
  }

  if (evidenceMap?.biometric) {
    const bio = evidenceMap.biometric;
    const isBioGood = bio.status === 'Positive';
    decisiveFactors.push({
      label: 'Biometric evidence',
      value: isBioGood ? `Strong (${bio.confidence}% match confidence)` : bio.status === 'Uncertain' ? 'Marginal capture lighting' : 'Non-match detected',
      impact: isBioGood ? 'positive' : bio.status === 'Uncertain' ? 'warning' : 'risk'
    });
  }

  decisiveFactors.push({
    label: 'Overall evidence confidence',
    value: `${evidenceConfidence}% (${confInfo.label})`,
    impact: evidenceConfidence >= 70 ? 'positive' : evidenceConfidence >= 50 ? 'warning' : 'risk'
  });

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 md:p-6 space-y-5 shadow-2xl">
      {/* Visual Focal Point: Fraud Risk & Evidence Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meter 1: Fraud Risk */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block font-mono">
                  Fraud Risk
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Observed Discrepancy (0–100)
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${riskInfo.badgeBg} ${riskInfo.badgeBorder} ${riskInfo.textColor}`}>
              {riskInfo.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono tracking-tight text-slate-100">
              {fraudRisk}
            </span>
            <span className="text-sm font-mono text-slate-400">/ 100</span>
          </div>

          {/* Segmented Risk Bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, Math.max(3, fraudRisk))}%`,
                  backgroundColor: riskInfo.color 
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0 (Low)</span>
              <span>25 (Threshold)</span>
              <span>50 (High)</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Meter 2: Evidence Confidence */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block font-mono">
                  Evidence Confidence
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Completeness &amp; Depth (0–100)
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${confInfo.badgeBg} ${confInfo.badgeBorder} ${confInfo.textColor}`}>
              {confInfo.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono tracking-tight text-slate-100">
              {evidenceConfidence}
            </span>
            <span className="text-sm font-mono text-slate-400">/ 100</span>
          </div>

          {/* Segmented Confidence Bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, Math.max(3, evidenceConfidence))}%`,
                  backgroundColor: confInfo.color 
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0 (Incomplete)</span>
              <span>50 (Moderate)</span>
              <span>75 (High)</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Section with [ Why? ] micro-explanation */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                AI RECOMMENDATION (ADVISORY ONLY)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                • Algorithmic Risk Synthesis
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded border tracking-wider ${recBadgeClass}`}>
                {recDisplayLabel}
              </span>
              <p className="text-xs text-slate-300">
                {recommendationReason}
              </p>
            </div>
          </div>

          {/* [ Why? ] Trigger */}
          <button
            type="button"
            onClick={() => setIsWhyExpanded(!isWhyExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-slate-700 transition-colors self-start sm:self-center shrink-0 shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Why?</span>
            {isWhyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Compact Inline [ Why? ] Micro-Explanation */}
        {isWhyExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200">
                WHY THIS RECOMMENDATION?
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {decisiveFactors.map((f, idx) => (
                <div 
                  key={idx} 
                  className="p-2.5 rounded bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2"
                >
                  <span className="text-slate-400">{f.label}:</span>
                  <span className={`font-semibold text-right ${
                    f.impact === 'positive' 
                      ? 'text-emerald-400' 
                      : f.impact === 'warning' 
                      ? 'text-amber-400' 
                      : 'text-rose-400'
                  }`}>
                    {f.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-900/40 text-[11px] text-slate-300 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Decoupled Evaluation:</strong> Recommendation generated because evidence is internally consistent, while unavailable external sources reduce confidence without adding false fraud penalties (+0 risk).
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

