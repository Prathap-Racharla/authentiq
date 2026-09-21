import { EvidenceItem } from '../types/evidence';

export interface QualityAssessment {
  quality_score: number;
  dimensions: string;
  width: number;
  height: number;
  blur_level: 'Low' | 'Medium' | 'High';
  blur_score: number;
  glare_level: 'Low' | 'Medium' | 'High';
  glare_percentage: number;
  contrast_text_visibility: 'Good' | 'Fair' | 'Poor';
  document_boundaries_detected: boolean;
  status: 'Positive' | 'UNCERTAIN';
  signals: string[];
}

export interface StructuredField {
  field: string;
  label: string;
  value: string;
  confidence: number;
  source_region?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    normalized?: boolean;
  };
}

export interface MRZCheckDigitResult {
  field_name: string;
  value: string;
  expected_check_digit: string;
  computed_check_digit: string;
  is_valid: boolean;
}

export interface MRZResult {
  detected: boolean;
  applicable?: boolean;
  mrz_type?: 'TD1' | 'TD2' | 'TD3' | 'Not Applicable' | string;
  raw_lines: string[];
  parsed_fields: Record<string, string>;
  check_digits: MRZCheckDigitResult[];
  all_check_digits_valid: boolean;
}

export interface CrossFieldConsistencyItem {
  comparison: string;
  ocr_value?: string;
  mrz_value?: string;
  status: 'MATCH' | 'MISMATCH' | 'UNAVAILABLE' | 'NOT_APPLICABLE';
  explanation: string;
}

export interface DocumentAnomalySignal {
  signal_id: string;
  category: 'integrity' | 'quality' | 'consistency' | 'security' | 'validity';
  severity: 'informational' | 'low' | 'medium' | 'high';
  confidence: number;
  description: string;
  risk_contribution: string;
}

export interface DocumentEvidenceObject {
  category: string;
  status: 'Positive' | 'Uncertain' | 'Unavailable' | 'Negative';
  confidence: number;
  availability: 'Available' | 'Degraded' | 'Offline';
  source: string;
  last_checked: string;
  summary: string;
  signals: {
    label: string;
    impact: 'positive' | 'risk' | 'lowers_confidence' | 'neutral';
    description: string;
  }[];
}

export interface DocumentAnalysisResponse {
  success: boolean;
  document_id: string;
  document_type?: string;
  filename: string;
  mime_type: string;
  processing_time_ms: number;
  quality: QualityAssessment;
  ocr_raw_text: string;
  structured_fields: StructuredField[];
  mrz: MRZResult;
  consistency: CrossFieldConsistencyItem[];
  anomalies: DocumentAnomalySignal[];
  evidence_object: DocumentEvidenceObject;
  warnings: string[];
  dataset_match?: boolean;
  dataset_id?: string | null;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/health');
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'HEALTHY';
  } catch {
    return false;
  }
}

import { compressAndDownscaleImage } from '../utils/imageCompressor';

export async function analyzeDocument(file: File): Promise<DocumentAnalysisResponse> {
  // Automatically downscale and compress oversized mobile camera photos before upload
  const optimizedFile = await compressAndDownscaleImage(file);
  const formData = new FormData();
  formData.append('file', optimizedFile);

  const res = await fetch('/api/v1/documents/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = 'Failed to analyze document';
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

export async function analyzeDatasetDocument(docId: string): Promise<DocumentAnalysisResponse> {
  const res = await fetch(`/api/v1/documents/analyze-dataset/${encodeURIComponent(docId)}`, {
    method: 'POST',
  });

  if (!res.ok) {
    let errorDetail = 'Failed to analyze dataset document';
    try {
      const err = await res.json();
      errorDetail = err.detail?.message || err.detail || errorDetail;
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function fetchSampleFile(sampleKey: 'clean' | 'degraded' | 'inconsistent'): Promise<File> {
  const filenames = {
    clean: 'clean_passport_demo.png',
    degraded: 'degraded_glare_demo.png',
    inconsistent: 'inconsistent_mrz_mismatch_demo.png',
  };

  const filename = filenames[sampleKey];
  const url = `/demo_samples/${filename}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load synthetic sample: ${filename}`);
  }
  const blob = await response.blob();
  return new File([blob], filename, { type: 'image/png' });
}

export function toAuthentiqEvidenceItem(docResponse: DocumentAnalysisResponse): EvidenceItem {
  const obj = docResponse.evidence_object;
  return {
    category: 'document',
    title: 'Identity Document Intelligence',
    status: obj.status as any,
    confidence: obj.confidence,
    availability: (obj.availability === 'Degraded' ? 'Degraded' : 'Available') as any,
    source: obj.source,
    lastChecked: obj.last_checked,
    summary: obj.summary,
    signals: obj.signals.map(s => ({
      label: s.label,
      impact: s.impact,
      description: s.description,
    })),
  };
}

