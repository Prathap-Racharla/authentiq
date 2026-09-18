import React, { useState } from 'react';
import { VerificationRecord, OfficerDecision } from '../../types';
import { 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Send,
  FileCheck2,
  Clock
} from 'lucide-react';

interface AdaptiveVerificationCardProps {
  record: VerificationRecord;
  onUpdateDecision: (decision: OfficerDecision, notes: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AdaptiveVerificationCard: React.FC<AdaptiveVerificationCardProps> = ({
  record,
  onUpdateDecision,
  isOpen: externalOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isReviewOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setReviewOpen = (open: boolean) => {
    if (onOpenChange) onOpenChange(open);
    setInternalOpen(open);
  };

  const [selectedDecision, setSelectedDecision] = useState<OfficerDecision>(
    record.officerDecision !== 'Pending' ? record.officerDecision : 'Targeted Verification Ordered'
  );
  const [officerNotes, setOfficerNotes] = useState(record.officerNotes || '');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDecision(selectedDecision, officerNotes);
    setIsSubmitted(true);
    setTimeout(() => {
      setReviewOpen(false);
      setIsSubmitted(false);
    }, 1200);
  };

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-800/60">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 tracking-wide">
                Adaptive Verification Routing
              </h3>
              <p className="text-xs text-slate-400">
                AI-Assisted Recommendation • Officer-in-the-Loop Decision Support
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Decision Protocol v1.0
          </span>
        </div>

        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              AI Recommendation
            </span>
            <div className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {record.recommendedAction}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Operational Rationale
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {record.recommendationReason}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Officer Status:</span>
            <span className="font-mono font-medium text-slate-200">
              {record.officerDecision === 'Pending' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Awaiting Authorized Officer Review
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {record.officerDecision}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">
            Final adjudication rests exclusively with the authorized security analyst.
          </span>
          <button
            onClick={() => setReviewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md hover:shadow-cyan-900/30"
          >
            <span>Open Officer Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* OFFICER REVIEW MODAL */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  Authorized Officer Final Adjudication
                </h3>
              </div>
              <button
                onClick={() => setReviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 block font-mono text-[11px]">
                  Subject: {record.subjectName} • Session: {record.id}
                </span>
                <span className="text-slate-200 block">
                  AI Recommendation: <strong className="text-amber-300">{record.recommendedAction}</strong>
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
                  Authorized Officer Final Decision
                </label>
                <div className="space-y-2">
                  {[
                    { 
                      val: 'Targeted Verification Ordered' as OfficerDecision, 
                      label: 'Order Targeted Verification',
                      desc: 'Trigger retry on secondary civil registry or request supplementary utility doc.'
                    },
                    { 
                      val: 'Authorized' as OfficerDecision, 
                      label: 'Authorize Credential',
                      desc: 'Manual override: Primary optical and biometric evidence verified sufficient.'
                    },
                    { 
                      val: 'Secondary Check Ordered' as OfficerDecision, 
                      label: 'Order Physical Enrollment Review',
                      desc: 'Require in-person physical identity verification at regional center.'
                    }
                  ].map(option => (
                    <label 
                      key={option.val}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedDecision === option.val 
                          ? 'border-cyan-500 bg-cyan-950/20' 
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="officerDecision" 
                        value={option.val}
                        checked={selectedDecision === option.val}
                        onChange={() => setSelectedDecision(option.val)}
                        className="mt-1 text-cyan-500 focus:ring-cyan-500"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-200 block">{option.label}</span>
                        <span className="text-slate-400 text-[11px] leading-relaxed">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
                  Officer Adjudication Rationale / Notes
                </label>
                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Enter authorized operational justification for audit ledger recording..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans resize-none"
                />
              </div>

              {isSubmitted && (
                <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Adjudication recorded into Tamper-Evident Prototype Audit Log.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitted}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Record Final Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
