import React, { useState } from 'react';
import { VerificationRecord, OfficerDecision } from '../../types';
import { 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  X, 
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
                Recommended Next Step
              </h3>
              <p className="text-xs text-slate-400">
                Suggested next action based on findings
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              AI Proposed Action
            </span>
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {record.recommendedAction}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Operational Rationale
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {record.recommendationReason}
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Officer Determination:</span>
            <span className="font-mono font-medium text-slate-200">
              {record.officerDecision === 'Pending' ? (
                <span className="text-amber-400 flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" /> Pending Review
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {record.officerDecision}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-400">
            Officer retains final decision authority.
          </span>
          <button
            onClick={() => setReviewOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md hover:shadow-cyan-900/30 font-mono cursor-pointer"
          >
            <span>Record Decision</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* OFFICER REVIEW MODAL */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Record Officer Decision
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Session: {record.id} • Subject: {record.subjectName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 block font-mono text-[10px] uppercase tracking-wider">
                  AI Recommendation
                </span>
                <p className="text-slate-200 font-medium">
                  {record.recommendedAction}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 block font-mono">
                  Decision
                </label>
                <select
                  value={selectedDecision}
                  onChange={(e) => setSelectedDecision(e.target.value as OfficerDecision)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="Approved Without Escalation">Approve Without Escalation</option>
                  <option value="Targeted Verification Ordered">Order Targeted Verification</option>
                  <option value="Manual Document Inspection Requested">Request Manual Inspection</option>
                  <option value="Escalated to Fraud Investigation">Escalate to Fraud Investigation</option>
                  <option value="Rejected">Reject</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 block font-mono">
                  Notes
                </label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Enter officer notes or operational justification..."
                  className="w-full h-24 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-mono text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-semibold text-white uppercase tracking-wider cursor-pointer"
                >
                  {isSubmitted ? 'Saved to Ledger!' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
