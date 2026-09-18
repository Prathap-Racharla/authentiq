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

