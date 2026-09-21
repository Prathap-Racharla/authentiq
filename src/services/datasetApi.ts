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

export async function fetchDatasetDocumentFile(docId: string, filePath?: string): Promise<File> {
  // 1. Try backend API endpoint first
  try {
    const res = await fetch(`/api/v1/dataset/${encodeURIComponent(docId)}/file`);
    if (res.ok) {
      const blob = await res.blob();
      return new File([blob], `${docId.toLowerCase()}.png`, { type: 'image/png' });
    }
  } catch {
    // Fallback to static assets
  }

  // 2. Try static asset fallbacks in public folder
  const candidateUrls: string[] = [
    filePath ? `/dataset/${filePath}` : '',
    filePath ? `/${filePath}` : '',
    `/demo_samples/${docId.toLowerCase().replace('-', '_')}.png`,
    `/demo_samples/${docId.toLowerCase()}.png`
  ].filter(Boolean);

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        return new File([blob], `${docId.toLowerCase()}.png`, { type: 'image/png' });
      }
    } catch {
      // Continue to next candidate
    }
  }

  // 3. Ultra-resilient Canvas-based synthetic document generator if all network/static fetches fail
  return generateCanvasFallbackDocument(docId);
}

function generateCanvasFallbackDocument(docId: string): File {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 760, 460);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`SYNTHETIC ID DEMO: ${docId}`, 50, 70);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText('GOVERNMENT IDENTITY ASSURANCE PROTOTYPE', 50, 100);

    // Document Body
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`DOC ID: ${docId}`, 50, 160);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '16px monospace';
    ctx.fillText('NAME: DEMO APPLICANT', 50, 210);
    ctx.fillText('DOB: 1994-08-14', 50, 250);
    ctx.fillText('NATIONALITY: IND', 50, 290);
    ctx.fillText('STATUS: SYNTHETIC BENCHMARK RECORD', 50, 330);

    // Simulated Security Seal
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(650, 250, 70, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUTHENTIQ', 650, 245);
    ctx.fillText('VERIFIED', 650, 265);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const binStr = atob(dataUrl.split(',')[1]);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  const blob = new Blob([arr], { type: 'image/png' });
  return new File([blob], `${docId.toLowerCase()}.png`, { type: 'image/png' });
}

