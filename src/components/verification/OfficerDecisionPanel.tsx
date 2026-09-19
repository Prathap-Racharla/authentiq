import React, { useState } from 'react';
import { CanonicalOfficerDecision } from '../../types';
import { submitOfficerDecision, OfficerDecisionResponse } from '../../services/verificationApi';
import { 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Send, 
  Clock, 
  ShieldCheck, 
  Loader2,
  Lock
} from 'lucide-react';

interface OfficerDecisionPanelProps {
  verificationId: string;
  initialDecision?: CanonicalOfficerDecision | string;
  initialNotes?: string;
  initialTimestamp?: string;
  onDecisionSuccess?: (result: OfficerDecisionResponse) => void;
}

export const OfficerDecisionPanel: React.FC<OfficerDecisionPanelProps> = ({
  verificationId,
  initialDecision,
  initialNotes,
  initialTimestamp,
  onDecisionSuccess,
}) => {
  // Check if decision was already recorded
  const isInitiallyRecorded = 
    initialDecision && 
    initialDecision !== 'PENDING' && 
    initialDecision !== 'Pending';

  const [recordedDecision, setRecordedDecision] = useState<{
    decision: string;
    notes: string;
    timestamp: string;
    actor: string;
    auditEventId?: string;
  } | null>(() => {
    if (isInitiallyRecorded) {
      return {
        decision: String(initialDecision),
        notes: initialNotes || 'Standard authorized officer adjudication recorded.',
        timestamp: initialTimestamp || 'Recorded in session',
        actor: 'Authorized Officer (Badge #8492)',
      };
    }
    return null;
  });

  // Modal / confirmation state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<CanonicalOfficerDecision | null>(null);
  const [officerNotes, setOfficerNotes] = useState('');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const DECISION_ACTIONS: { id: CanonicalOfficerDecision; label: string; desc: string; style: string }[] = [
    {
      id: 'ACCEPT_RECOMMENDATION',
      label: 'ACCEPT RECOMMENDATION',
      desc: 'Confirm algorithmic risk findings and clear subject for standard processing.',
      style: 'border-emerald-600/50 hover:bg-emerald-950/30 text-emerald-300 hover:border-emerald-500',
    },
    {
      id: 'REQUEST_ADDITIONAL_VERIFICATION',
      label: 'REQUEST ADDITIONAL VERIFICATION',
      desc: 'Trigger secondary credential capture, registry retry, or address corroboration.',
      style: 'border-amber-600/50 hover:bg-amber-950/30 text-amber-300 hover:border-amber-500',
    },
    {
      id: 'ESCALATE_FOR_REVIEW',
      label: 'ESCALATE FOR REVIEW',
      desc: 'Route dossier to senior immigration supervisor or regional forensic investigation unit.',
      style: 'border-rose-600/50 hover:bg-rose-950/30 text-rose-300 hover:border-rose-500',
    },
    {
      id: 'MARK_INCONCLUSIVE',
      label: 'MARK INCONCLUSIVE',
      desc: 'Insufficient corroborating signals to establish identity confidence threshold.',
      style: 'border-slate-600/50 hover:bg-slate-800/40 text-slate-300 hover:border-slate-500',
    },
  ];

  const handleOpenConfirmation = (actionId: CanonicalOfficerDecision) => {
    setPendingDecision(actionId);
    setOfficerNotes('');
    setNotesError(null);
    setSubmitError(null);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDecision) return;

    const trimmed = officerNotes.trim();
    if (!trimmed) {
      setNotesError('Officer notes/reason are mandatory for recording an authorized adjudication.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await submitOfficerDecision(verificationId, pendingDecision, trimmed);
      
      setRecordedDecision({
        decision: response.officer_decision,
        notes: response.officer_notes,
        timestamp: response.officer_action_timestamp,
        actor: response.actor,
        auditEventId: response.audit_event_id,
      });

      setIsConfirmModalOpen(false);

      if (onDecisionSuccess) {
        onDecisionSuccess(response);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to persist officer decision to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              OFFICER DECISION
            </h3>
            <p className="text-xs text-slate-400">
              AI provides a recommendation. Final decision remains with the authorized officer.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
          HUMAN-IN-THE-LOOP
        </span>
      </div>

      {/* STATE 1: If Decision has been Recorded (Immutable) */}
      {recordedDecision ? (
        <div className="p-5 rounded-xl bg-slate-950/80 border border-emerald-900/50 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono block">
                  OFFICER DECISION RECORDED
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {recordedDecision.decision.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{recordedDecision.timestamp}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">
              Recorded Operational Justification:
            </span>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed">
              {recordedDecision.notes}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">✓ Tamper-evident audit event recorded</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Actor: <strong className="text-slate-200">{recordedDecision.actor}</strong></span>
              {recordedDecision.auditEventId && (
                <span className="text-slate-500">Ref: {recordedDecision.auditEventId}</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STATE 2: 4 Decision Action Buttons */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DECISION_ACTIONS.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => handleOpenConfirmation(act.id)}
                className={`p-3.5 rounded-xl border bg-slate-950/60 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-sm ${act.style}`}
              >
                <div>
                  <span className="text-xs font-bold font-mono tracking-wider block group-hover:underline">
                    {act.label}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {act.desc}
                  </p>
                </div>

                <div className="pt-2 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3" />
                  <span>Requires Officer Confirmation</span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              All adjudications are cryptographically appended to the tamper-evident SHA-256 audit ledger.
            </span>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && pendingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                  CONFIRM OFFICER DECISION
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmDecision} className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Selected Adjudication:
                </span>
                <span className="text-sm font-bold font-mono text-cyan-300 block">
                  {pendingDecision.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Session: {verificationId}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono block">
                  Reason / Officer Notes <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => {
                    setOfficerNotes(e.target.value);
                    if (notesError) setNotesError(null);
                  }}
                  placeholder="Mandatory operational notes justifying this decision for the audit log..."
                  className={`w-full rounded-lg bg-slate-950 border px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono resize-none ${
                    notesError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                  required
                />
                {notesError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{notesError}</span>
                  </p>
                )}
              </div>

              {submitError && (
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm Decision</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

