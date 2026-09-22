export function formatScore(score: number): string {
  return `${Math.round(score)} / 100`;
}

export function formatPercentage(score: number): string {
  return `${Math.round(score)}%`;
}

export function getRiskLevel(score: number): {
  label: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
} {
  if (score > 50) {
    return {
      label: 'High Risk',
      color: '#ef4444',
      badgeBg: 'bg-rose-500/10',
      badgeBorder: 'border-rose-500/30',
      textColor: 'text-rose-400'
    };
  }
  if (score >= 25) {
    return {
      label: 'Moderate Risk',
      color: '#f59e0b',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/30',
      textColor: 'text-amber-400'
    };
  }
  return {
    label: 'Low Risk',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    textColor: 'text-emerald-400'
  };
}

export function getConfidenceLevel(score: number): {
  label: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
} {
  if (score >= 85) {
    return {
      label: 'High Confidence',
      color: '#06b6d4',
      badgeBg: 'bg-cyan-500/10',
      badgeBorder: 'border-cyan-500/30',
      textColor: 'text-cyan-400'
    };
  }
  if (score >= 50) {
    return {
      label: 'Moderate Confidence',
      color: '#38bdf8',
      badgeBg: 'bg-sky-500/10',
      badgeBorder: 'border-sky-500/30',
      textColor: 'text-sky-400'
    };
  }
  return {
    label: 'Low Confidence',
    color: '#94a3b8',
    badgeBg: 'bg-slate-500/10',
    badgeBorder: 'border-slate-500/30',
    textColor: 'text-slate-400'
  };
}

export function formatDocumentType(
  rawType?: string,
  ocrText?: string,
  filename?: string,
  datasetDocId?: string
): string {
  const t = (rawType || '').toUpperCase();
  const text = (ocrText || '').toUpperCase();
  const fn = (filename || '').toLowerCase();
  const did = (datasetDocId || '').toUpperCase();

  if (
    t.includes('PASSPORT') ||
    text.includes('PASSPORT') ||
    fn.includes('pass_') ||
    fn.includes('pass-') ||
    fn.includes('passport') ||
    did.startsWith('PASS')
  ) {
    return 'International Passport';
  }
  if (
    t.includes('AADHAAR') ||
    text.includes('AADHAAR') ||
    text.includes('UIDAI') ||
    text.includes('UNIQUE IDENTIFICATION') ||
    fn.includes('aad_') ||
    fn.includes('aad-') ||
    fn.includes('aadhaar') ||
    did.startsWith('AAD')
  ) {
    return 'Aadhaar Card';
  }
  if (
    t.includes('DRIVING') ||
    t.includes('LICENCE') ||
    t.includes('LICENSE') ||
    text.includes('DRIVING') ||
    text.includes('LICENCE') ||
    text.includes('LICENSE') ||
    fn.includes('dl_') ||
    fn.includes('dl-') ||
    fn.includes('driving') ||
    did.startsWith('DL')
  ) {
    return 'Driving Licence';
  }
  if (
    t.includes('VOTER') ||
    t.includes('EPIC') ||
    text.includes('VOTER') ||
    text.includes('ELECTION') ||
    text.includes('EPIC') ||
    fn.includes('vot_') ||
    fn.includes('vot-') ||
    fn.includes('voter') ||
    did.startsWith('VOT')
  ) {
    return 'Voter ID';
  }
  if (
    t.includes('PAN') ||
    text.includes('PERMANENT ACCOUNT NUMBER') ||
    fn.includes('pan') ||
    did.startsWith('PAN')
  ) {
    return 'PAN Card';
  }
  return 'Identity Document';
}

