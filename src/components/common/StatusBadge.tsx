import React from 'react';
import { EvidenceStatus, VerificationStatus, OfficerDecision } from '../../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Info, 
  Clock, 
  Eye, 
  ShieldCheck, 
  Slash 
} from 'lucide-react';

interface StatusBadgeProps {
  status: EvidenceStatus | VerificationStatus | OfficerDecision | string;
  type?: 'evidence' | 'verification' | 'decision';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  // EVIDENCE STATUSES (Ensure Unavailable is NOT visually negative)
  if (status === 'Positive') {
    return (
      <span className={`inline-flex items-center rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono tracking-wide ${sizeClasses}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        POSITIVE
      </span>
    );
  }

  if (status === 'Negative') {
    return (
      <span className={`inline-flex items-center rounded border bg-rose-500/10 border-rose-500/30 text-rose-400 font-mono tracking-wide ${sizeClasses}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        NEGATIVE
      </span>
    );
  }

  if (status === 'Uncertain') {
    return (
      <span className={`inline-flex items-center rounded border bg-amber-500/10 border-amber-500/30 text-amber-400 font-mono tracking-wide ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        UNCERTAIN
      </span>
    );
  }

  if (status === 'Unavailable') {
    // CRITICAL: Unavailable MUST NOT visually mean negative!
    // Using a technical neutral slate/cool cyan treatment with Slash icon
    return (
      <span 
        title="Source endpoint offline or not provided. Does NOT indicate fraud."
        className={`inline-flex items-center rounded border bg-slate-800/80 border-slate-600 text-slate-300 font-mono tracking-wide ${sizeClasses}`}
      >
        <Slash className="w-3.5 h-3.5 text-slate-400" />
        UNAVAILABLE
      </span>
    );
  }

  if (status === 'Informational') {
    return (
      <span className={`inline-flex items-center rounded border bg-sky-500/10 border-sky-500/30 text-sky-400 font-mono tracking-wide ${sizeClasses}`}>
        <Info className="w-3.5 h-3.5 text-sky-400" />
        INFORMATIONAL
      </span>
    );
  }

  // VERIFICATION RECOMMENDATIONS
  if (status === 'Normal Processing') {
    return (
      <span className={`inline-flex items-center rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium ${sizeClasses}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Normal Processing
      </span>
    );
  }

  if (status === 'Targeted Verification') {
    return (
      <span className={`inline-flex items-center rounded border bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium ${sizeClasses}`}>
        <Eye className="w-3.5 h-3.5 text-amber-400" />
        Targeted Verification
      </span>
    );
  }

  if (status === 'Officer Review') {
    return (
      <span className={`inline-flex items-center rounded border bg-rose-500/15 border-rose-500/40 text-rose-300 font-medium ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        Officer Review
      </span>
    );
  }

  if (status === 'Inconclusive') {
    return (
      <span className={`inline-flex items-center rounded border bg-slate-700/50 border-slate-600 text-slate-300 font-medium ${sizeClasses}`}>
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        Inconclusive
      </span>
    );
  }

  // OFFICER DECISION STATUSES
  if (status === 'Authorized') {
    return (
      <span className={`inline-flex items-center rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium ${sizeClasses}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Authorized by Officer
      </span>
    );
  }

  if (status === 'Pending') {
    return (
      <span className={`inline-flex items-center rounded border bg-slate-800 border-slate-600 text-slate-300 font-medium ${sizeClasses}`}>
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        Pending Review
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded border bg-slate-800 border-slate-700 text-slate-300 ${sizeClasses}`}>
      {status}
    </span>
  );
};
