export type AuditEventType = 
  | 'Verification Initiated' 
  | 'Document Analysis Completed' 
  | 'Biometric Comparison Completed' 
  | 'Database Query Attempted' 
  | 'Risk Assessment Generated' 
  | 'Officer Review Requested' 
  | 'Officer Decision Recorded' 
  | 'Recommendation Recorded';

export interface AuditEvent {
  eventId: string;
  verificationId: string;
  eventType: AuditEventType;
  actor: string;
  timestamp: string;
  prevHash: string;
  currentHash: string;
  integrity: 'VERIFIED' | 'FLAGGED';
  payloadSummary: string;
}

