import { EvidenceItem } from '../types';

const API_BASE_URL = '/api/v1';

export interface BiometricQualityAssessment {
  sharpness_score: number;
  brightness: number;
  contrast_score: number;
  illumination_level: string;
  face_detected: boolean;
  face_box?: { x: number; y: number; w: number; h: number };
  quality_score: number;
}

export interface BiometricAnalysisResponse {
  success: boolean;
  biometric_id: string;
  filename: string;
  match_score: number;
  quality: BiometricQualityAssessment;
  status: 'Positive' | 'Negative' | 'Uncertain' | 'Unavailable';
  availability: 'Available' | 'Degraded' | 'Unavailable';
  evidence_object: EvidenceItem;
  processing_time_ms: number;
  disclaimer: string;
}

export async function analyzeBiometric(
  file: File,
  referenceFile?: File
): Promise<BiometricAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (referenceFile) {
    formData.append('reference_file', referenceFile);
  }

  const response = await fetch(`${API_BASE_URL}/biometrics/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = 'Biometric analysis failed';
    try {
      const err = await response.json();
      errorDetail = err.detail?.message || err.detail?.error || errorDetail;
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

