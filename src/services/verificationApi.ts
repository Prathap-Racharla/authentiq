import { CanonicalOfficerDecision } from '../types';

export interface OfficerDecisionResponse {
  verification_id: string;
  officer_decision: CanonicalOfficerDecision;
  officer_notes: string;
  officer_action_timestamp: string;
  actor: string;
  audit_event_id: string;
  audit_current_hash: string;
  status: string;
  message: string;
}

export async function submitOfficerDecision(
  verificationId: string,
  decision: CanonicalOfficerDecision,
  notes: string
): Promise<OfficerDecisionResponse> {
  const trimmedNotes = notes.trim();
  if (!trimmedNotes) {
    throw new Error('Officer notes/reason are mandatory for recording an authorized adjudication.');
  }

  const res = await fetch(`/api/v1/verification/${encodeURIComponent(verificationId)}/officer-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision,
      notes: trimmedNotes,
    }),
  });

  if (!res.ok) {
    let errorDetail = 'Failed to record officer decision';
    try {
      const err = await res.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}
