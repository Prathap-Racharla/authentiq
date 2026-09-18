import { EvidenceMap } from './evidence';

export type VerificationStatus = 
  | 'Normal Processing' 
  | 'Targeted Verification' 
  | 'Officer Review' 
  | 'Inconclusive';

export type VerificationMode = 'Standard' | 'Enhanced' | 'Targeted';

export type OfficerDecision = 
  | 'Pending' 
  | 'Authorized' 
  | 'Targeted Verification Ordered' 
  | 'Secondary Check Ordered' 
  | 'In-Person Interview Requested';

export interface FactorContribution {
  factor: string;
  impact: string; // e.g. "+0 risk", "+40 risk", "lowers confidence"
  category: 'risk' | 'confidence';
  detail: string;
}

export interface VerificationRecord {
  id: string;
  subjectName: string;
  documentType: string;
  documentNumberMasked: string;
  nationality: string;
  dob: string;
  timestamp: string;
  mode: VerificationMode;
  status: VerificationStatus;
  fraudRisk: number; // 0 - 100 strictly Fraud Risk (NEVER Fraud Probability)
  evidenceConfidence: number; // 0 - 100 Evidence Confidence
  evidence: EvidenceMap;
  riskFactors: FactorContribution[];
  confidenceFactors: FactorContribution[];
  findings: string[];
  recommendedAction: string;
  recommendationReason: string;
  officerDecision: OfficerDecision;
  officerNotes?: string;
  officerActionTimestamp?: string;
}

