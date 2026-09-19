export interface SyntheticIdentity {
  name: string;
  document_number: string;
  dob: string;
  expiry_date?: string | null;
  gender: string;
  nationality: string;
  address?: string | null;
}

export interface ExpectedPipelineBehavior {
  ocr_expected: string;
  mrz_expected: string;
  mrz_applicable: boolean;
  expected_risk_profile: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  expected_signals: string[];
}

export interface DatasetDocument {
  id: string;
  category: 'passport' | 'aadhaar' | 'driving_licence' | 'voter_id';
  title: string;
  description: string;
  file_path: string;
  synthetic_identity: SyntheticIdentity;
  expected_pipeline_behavior: ExpectedPipelineBehavior;
  tamper_type: string;
  demonstrates: string;
}

export interface DatasetResponse {
  dataset_version: string;
  generated_at: string;
  total_documents: number;
  safety_notice: string;
  documents: DatasetDocument[];
}

export async function fetchDatasetCatalog(): Promise<DatasetResponse> {
  const res = await fetch('/api/v1/dataset');
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset catalog: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDatasetDocumentFile(docId: string): Promise<File> {
  const res = await fetch(`/api/v1/dataset/${encodeURIComponent(docId)}/file`);
  if (!res.ok) {
    throw new Error(`Failed to download synthetic document ${docId}: ${res.statusText}`);
  }
  const blob = await res.blob();
  return new File([blob], `${docId.toLowerCase()}.png`, { type: 'image/png' });
}

