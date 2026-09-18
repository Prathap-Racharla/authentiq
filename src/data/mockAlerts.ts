export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'info' | 'critical';
  timestamp: string;
  relatedVerificationId?: string;
}

export const MOCK_ALERTS: SecurityAlert[] = [
  {
    id: 'ALT-101',
    title: 'Database source temporarily unavailable',
    description: 'External Civil Registry gateway endpoint timed out. Decision engine gracefully degraded to Targeted Verification recommendation with +0 fraud risk.',
    severity: 'warning',
    timestamp: '2 mins ago',
    relatedVerificationId: 'VER-2026-8942'
  },
  {
    id: 'ALT-102',
    title: 'Potential identity relationship detected',
    description: 'Graph link identified between active claim (Identity A) and historical municipal record (Identity B) sharing DOB and contact prefix.',
    severity: 'info',
    timestamp: '14 mins ago',
    relatedVerificationId: 'VER-2026-8942'
  },
  {
    id: 'ALT-103',
    title: 'Verification requires officer review',
    description: 'Session VER-2026-9031 generated Fraud Risk 68/100 due to facial embedding discrepancy. Awaiting authorized officer determination.',
    severity: 'critical',
    timestamp: '1 hour ago',
    relatedVerificationId: 'VER-2026-9031'
  },
  {
    id: 'ALT-104',
    title: 'Biometric image quality below threshold',
    description: 'Session VER-2026-6412 capture resolution degraded by specular glare (< 200 DPI). Outcome classified as Inconclusive rather than fraud.',
    severity: 'warning',
    timestamp: '3 hours ago',
    relatedVerificationId: 'VER-2026-6412'
  }
];

