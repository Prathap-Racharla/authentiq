export type EvidenceCategory = 'document' | 'biometric' | 'database' | 'context_history';

export type EvidenceStatus = 
  | 'Positive' 
  | 'Negative' 
  | 'Uncertain' 
  | 'Unavailable' 
  | 'Informational';

export type EvidenceAvailability = 'Available' | 'Degraded' | 'Unavailable';

export interface EvidenceSignal {
  label: string;
  impact: 'positive' | 'risk' | 'lowers_confidence' | 'neutral';
  description: string;
}

export interface EvidenceItem {
  category: EvidenceCategory;
  title: string;
  status: EvidenceStatus;
  confidence: number; // 0 - 100
  availability: EvidenceAvailability;
  source: string;
  lastChecked: string;
  summary: string;
  signals: EvidenceSignal[];
}

export type EvidenceMap = Record<EvidenceCategory, EvidenceItem>;

