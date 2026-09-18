import { VerificationRecord } from '../types';

export const MOCK_VERIFICATIONS: VerificationRecord[] = [
  {
    id: 'VER-2026-8942',
    subjectName: 'Aarav S. Mehta (Demo)',
    documentType: 'National ID Card (Demo)',
    documentNumberMasked: 'IND-DEMO-8942-XXXX',
    nationality: 'Republic of India (Demo)',
    dob: '1994-08-14',
    timestamp: '2026-09-17 10:42:15 UTC',
    mode: 'Standard',
    status: 'Targeted Verification',
    fraudRisk: 18,
    evidenceConfidence: 82,
    evidence: {
      document: {
        category: 'document',
        title: 'Document Analysis',
        status: 'Positive',
        confidence: 94,
        availability: 'Available',
        source: 'Optical & Security Feature Inspection Subsystem',
        lastChecked: '2 mins ago',
        summary: 'Microprint layout, ultraviolet luminescence response, and security fonts match the standard national registry specification.',
        signals: [
          { label: 'Security Pattern', impact: 'positive', description: 'Guilloche lines continuous and intact' },
          { label: 'MRZ Checksum', impact: 'positive', description: 'Internal checksum matches encoded fields' },
          { label: 'Photo Substitution', impact: 'positive', description: 'No edge tampering or laminate lifting detected' }
        ]
      },
      biometric: {
        category: 'biometric',
        title: 'Biometric Comparison',
        status: 'Positive',
        confidence: 97,
        availability: 'Available',
        source: 'Facial Geometry & Passive Liveness Pipeline',
        lastChecked: '2 mins ago',
        summary: 'Facial embedding matches document portrait photo with strong biometric correlation. Passive liveness validated with zero presentation attack signals.',
        signals: [
          { label: 'Facial Vector Distance', impact: 'positive', description: 'Embedding distance 0.14 (threshold < 0.38)' },
          { label: 'Passive Liveness', impact: 'positive', description: 'Genuine human subject depth profile verified' },
          { label: 'Illumination Quality', impact: 'neutral', description: 'Balanced ambient lighting (92/100 quality)' }
        ]
      },
      database: {
        category: 'database',
        title: 'Database Verification',
        status: 'Unavailable',
        confidence: 48,
        availability: 'Unavailable',
        source: 'Civil Identity Registry Gateway (External Endpoint)',
        lastChecked: '1 min ago (Timed out)',
        summary: 'Primary civil identity registry endpoint timed out after 3 retries (504 Gateway Timeout). External service maintenance window in progress.',
        signals: [
          { label: 'Registry Connection', impact: 'lowers_confidence', description: 'HTTP 504 gateway timeout on official civil gateway' },
          { label: 'Fraud Assessment', impact: 'neutral', description: 'Database unavailability does NOT indicate fraud (+0 fraud risk)' },
          { label: 'Completeness Impact', impact: 'lowers_confidence', description: 'Reduces overall evidence confidence score from 95% to 82%' }
        ]
      },
      context_history: {
        category: 'context_history',
        title: 'Context & History',
        status: 'Informational',
        confidence: 91,
        availability: 'Available',
        source: 'Historical Telemetry & Device Intelligence',
        lastChecked: '3 mins ago',
        summary: 'Submission originated from a trusted domestic IP subnet. Device browser fingerprint aligns with regular historical patterns with no rapid multi-identity attempts.',
        signals: [
          { label: 'Geolocation Consistency', impact: 'positive', description: 'IP subnet matches declared regional residence' },
          { label: 'Submission Velocity', impact: 'positive', description: 'Single submission within 24-hour observation window' },
          { label: 'Potential Link', impact: 'neutral', description: 'Shared residential postal code with Record DEMO-REC-1042' }
        ]
      }
    },
    riskFactors: [
      { factor: 'Document Consistency', impact: '+0 risk', category: 'risk', detail: 'Optical security features and MRZ checksums fully consistent.' },
      { factor: 'Strong Biometric Match', impact: '+0 risk', category: 'risk', detail: 'High correlation with document portrait; liveness confirmed.' },
      { factor: 'Database Unavailable', impact: '+0 fraud risk', category: 'risk', detail: 'Source connectivity failure does not constitute adverse fraud evidence.' },
      { factor: 'No Contradictions', impact: '+0 risk', category: 'risk', detail: 'No conflicting biographic or identity markers identified.' }
    ],
    confidenceFactors: [
      { factor: 'Document Evidence Quality', impact: 'Strong (+28%)', category: 'confidence', detail: 'High-resolution scan with confirmed security markers.' },
      { factor: 'Biometric Evidence Quality', impact: 'Strong (+29%)', category: 'confidence', detail: 'Live liveness capture validated against high-assurance reference portrait.' },
      { factor: 'Database Evidence Quality', impact: 'Unavailable (-18% completeness)', category: 'confidence', detail: 'Authoritative registry endpoint offline; missing external confirmation.' },
      { factor: 'Context Evidence Quality', impact: 'Available (+14%)', category: 'confidence', detail: 'Telemetry signals and device fingerprint consistent.' }
    ],
    findings: [
      'Document evidence is internally consistent.',
      'Biometric comparison produced a strong match.',
      'Database verification could not be completed.',
      'Overall evidence confidence is therefore reduced.',
      'Targeted verification is recommended rather than treating the subject as fraudulent.'
    ],
    recommendedAction: 'Targeted Verification',
    recommendationReason: 'Complete the unavailable database check or perform an authorized secondary verification.',
    officerDecision: 'Pending'
  },
  {
    id: 'VER-2026-7819',
    subjectName: 'Ananya K. Sharma (Demo)',
    documentType: 'International Passport (Demo)',
    documentNumberMasked: 'IND-DEMO-7819-XXXX',
    nationality: 'Republic of India (Demo)',
    dob: '1998-11-23',
    timestamp: '2026-09-17 09:14:02 UTC',
    mode: 'Standard',
    status: 'Normal Processing',
    fraudRisk: 8,
    evidenceConfidence: 96,
    evidence: {
      document: {
        category: 'document',
        title: 'Document Analysis',
        status: 'Positive',
        confidence: 98,
        availability: 'Available',
        source: 'Optical & Security Feature Inspection Subsystem',
        lastChecked: '45 mins ago',
        summary: 'All electronic biometric chip data signatures and physical security features verified.',
        signals: [
          { label: 'ICAO Chip Signature', impact: 'positive', description: 'Country signing CA certificates valid' },
          { label: 'Security Overlay', impact: 'positive', description: 'Holographic laminate verified' }
        ]
      },
      biometric: {
        category: 'biometric',
        title: 'Biometric Comparison',
        status: 'Positive',
        confidence: 96,
        availability: 'Available',
        source: 'Facial Geometry & Passive Liveness Pipeline',
        lastChecked: '45 mins ago',
        summary: 'Biometric facial match passed with 96% match score against e-Passport chip photo.',
        signals: [
          { label: 'Chip Photo Match', impact: 'positive', description: 'Vector similarity 96%' }
        ]
      },
      database: {
        category: 'database',
        title: 'Database Verification',
        status: 'Positive',
        confidence: 95,
        availability: 'Available',
        source: 'Civil Identity Registry Gateway',
        lastChecked: '44 mins ago',
        summary: 'Direct government passport database match confirmed valid and unrevoked.',
        signals: [
          { label: 'Registry Match', impact: 'positive', description: 'Document status ACTIVE' }
        ]
      },
      context_history: {
        category: 'context_history',
        title: 'Context & History',
        status: 'Positive',
        confidence: 95,
        availability: 'Available',
        source: 'Historical Telemetry & Device Intelligence',
        lastChecked: '46 mins ago',
        summary: 'Standard submission velocity from domestic IP address.',
        signals: [
          { label: 'Device Integrity', impact: 'positive', description: 'No suspicious device emulator detected' }
        ]
      }
    },
    riskFactors: [
      { factor: 'Cryptographic Chip Validity', impact: '+0 risk', category: 'risk', detail: 'Genuine government root certificate.' },
      { factor: 'Database Valid Record', impact: '+0 risk', category: 'risk', detail: 'Direct passport database confirmation.' }
    ],
    confidenceFactors: [
      { factor: 'Full Evidence Completeness', impact: 'Complete (96%)', category: 'confidence', detail: 'All 4 primary evidence streams successfully corroborated.' }
    ],
    findings: [
      'Document evidence verified via cryptographic chip signature.',
      'Biometric comparison validated against digital chip photo.',
      'Civil database corroboration complete and active.',
      'Standard administrative processing path recommended.'
    ],
    recommendedAction: 'Normal Processing',
    recommendationReason: 'All evidence streams verified with high confidence and low fraud risk.',
    officerDecision: 'Authorized',
    officerNotes: 'Standard automated workflow completed successfully.',
    officerActionTimestamp: '2026-09-17 09:20:11 UTC'
  },
  {
    id: 'VER-2026-9031',
    subjectName: 'Vikram P. Rao (Demo)',
    documentType: 'Driving Licence (Demo)',
    documentNumberMasked: 'IND-DEMO-9031-XXXX',
    nationality: 'Republic of India (Demo)',
    dob: '1987-03-05',
    timestamp: '2026-09-17 08:30:45 UTC',
    mode: 'Enhanced',
    status: 'Officer Review',
    fraudRisk: 68,
    evidenceConfidence: 88,
    evidence: {
      document: {
        category: 'document',
        title: 'Document Analysis',
        status: 'Uncertain',
        confidence: 72,
        availability: 'Available',
        source: 'Optical & Security Feature Inspection Subsystem',
        lastChecked: '1 hour ago',
        summary: 'Font kerning discrepancy observed in issued date text block.',
        signals: [
          { label: 'Typography Analysis', impact: 'risk', description: 'Secondary font kerning variance (+15 risk)' }
        ]
      },
      biometric: {
        category: 'biometric',
        title: 'Biometric Comparison',
        status: 'Negative',
        confidence: 89,
        availability: 'Available',
        source: 'Facial Geometry & Passive Liveness Pipeline',
        lastChecked: '1 hour ago',
        summary: 'Facial embedding divergence indicates potential impersonation or outdated license photo.',
        signals: [
          { label: 'Vector Similarity', impact: 'risk', description: 'Facial vector distance 0.52 (threshold < 0.38) (+50 risk)' }
        ]
      },
      database: {
        category: 'database',
        title: 'Database Verification',
        status: 'Positive',
        confidence: 92,
        availability: 'Available',
        source: 'Civil Identity Registry Gateway',
        lastChecked: '1 hour ago',
        summary: 'Licence number exists in transport registry under declared name.',
        signals: [
          { label: 'Transport Registry', impact: 'positive', description: 'Record exists and valid' }
        ]
      },
      context_history: {
        category: 'context_history',
        title: 'Context & History',
        status: 'Informational',
        confidence: 85,
        availability: 'Available',
        source: 'Historical Telemetry & Device Intelligence',
        lastChecked: '1 hour ago',
        summary: 'First-time submission for this subject record.',
        signals: [
          { label: 'Historical Record', impact: 'neutral', description: 'No prior submission history' }
        ]
      }
    },
    riskFactors: [
      { factor: 'Biometric Non-Match', impact: '+50 risk', category: 'risk', detail: 'Significant vector divergence between live capture and document photo.' },
      { factor: 'Typography Irregularity', impact: '+15 risk', category: 'risk', detail: 'Font kerning discrepancy in date field.' }
    ],
    confidenceFactors: [
      { factor: 'Image Quality Clear', impact: 'High (+28%)', category: 'confidence', detail: 'High image quality confirmed non-match.' },
      { factor: 'Database Confirmation', impact: 'Complete (+25%)', category: 'confidence', detail: 'Registry record confirmed.' }
    ],
    findings: [
      'Document typography exhibits minor kerning anomaly.',
      'Biometric comparison produced significant facial divergence.',
      'Transport registry confirms document number exists.',
      'High fraud risk (68/100) requires manual officer inspection and live verification.'
    ],
    recommendedAction: 'Officer Review',
    recommendationReason: 'Elevated fraud risk due to biometric mismatch. Investigation by an authorized officer required.',
    officerDecision: 'Secondary Check Ordered',
    officerNotes: 'Flagged for secondary biometric enrollment check at local verification center.',
    officerActionTimestamp: '2026-09-17 08:45:00 UTC'
  },
  {
    id: 'VER-2026-6412',
    subjectName: 'Devansh M. Iyer (Demo)',
    documentType: 'National ID Card (Demo)',
    documentNumberMasked: 'IND-DEMO-6412-XXXX',
    nationality: 'Republic of India (Demo)',
    dob: '2001-05-19',
    timestamp: '2026-09-17 07:18:22 UTC',
    mode: 'Standard',
    status: 'Inconclusive',
    fraudRisk: 32,
    evidenceConfidence: 42,
    evidence: {
      document: {
        category: 'document',
        title: 'Document Analysis',
        status: 'Uncertain',
        confidence: 45,
        availability: 'Degraded',
        source: 'Optical & Security Feature Inspection Subsystem',
        lastChecked: '3 hours ago',
        summary: 'Severe specular reflection and low resolution in uploaded capture prevent feature verification.',
        signals: [
          { label: 'Capture Quality', impact: 'lowers_confidence', description: 'Resolution below 200 DPI' }
        ]
      },
      biometric: {
        category: 'biometric',
        title: 'Biometric Comparison',
        status: 'Uncertain',
        confidence: 40,
        availability: 'Degraded',
        source: 'Facial Geometry & Passive Liveness Pipeline',
        lastChecked: '3 hours ago',
        summary: 'Subject motion blur and low lighting prevent definitive feature mapping.',
        signals: [
          { label: 'Illumination Failure', impact: 'lowers_confidence', description: 'Dark environment, motion blur' }
        ]
      },
      database: {
        category: 'database',
        title: 'Database Verification',
        status: 'Unavailable',
        confidence: 30,
        availability: 'Unavailable',
        source: 'Civil Identity Registry Gateway',
        lastChecked: '3 hours ago',
        summary: 'Query timed out; database connection unresponsive.',
        signals: [
          { label: 'Connection Status', impact: 'lowers_confidence', description: 'Unavailable service' }
        ]
      },
      context_history: {
        category: 'context_history',
        title: 'Context & History',
        status: 'Informational',
        confidence: 55,
        availability: 'Available',
        source: 'Historical Telemetry & Device Intelligence',
        lastChecked: '3 hours ago',
        summary: 'Standard mobile browser submission.',
        signals: [
          { label: 'Device Check', impact: 'neutral', description: 'Standard mobile profile' }
        ]
      }
    },
    riskFactors: [
      { factor: 'Uncertain Features', impact: '+15 risk', category: 'risk', detail: 'Could not inspect anti-forgery patterns.' },
      { factor: 'Biometric Ambiguity', impact: '+15 risk', category: 'risk', detail: 'Face partially obscured by motion blur.' }
    ],
    confidenceFactors: [
      { factor: 'Low Quality Across Streams', impact: 'Incomplete (< 50%)', category: 'confidence', detail: 'Evidence confidence is 42/100, which is below the 50/100 minimum decision threshold.' }
    ],
    findings: [
      'Document resolution degraded by heavy specular reflection.',
      'Biometric image exhibits motion blur and dark lighting.',
      'Civil database lookup timed out.',
      'Evidence confidence (42/100) is below decision threshold (< 50/100).',
      'Status is classified as Inconclusive rather than penalizing the subject.'
    ],
    recommendedAction: 'Inconclusive',
    recommendationReason: 'Total evidence confidence is too weak (< 50/100) to support a reliable risk assessment. Resubmission required.',
    officerDecision: 'Pending'
  },
  {
    id: 'VER-2026-5120',
    subjectName: 'Pooja R. Deshmukh (Demo)',
    documentType: 'Voter ID (Demo)',
    documentNumberMasked: 'IND-DEMO-5120-XXXX',
    nationality: 'Republic of India (Demo)',
    dob: '1992-07-30',
    timestamp: '2026-09-17 06:45:10 UTC',
    mode: 'Standard',
    status: 'Normal Processing',
    fraudRisk: 12,
    evidenceConfidence: 92,
    evidence: {
      document: {
        category: 'document',
        title: 'Document Analysis',
        status: 'Positive',
        confidence: 93,
        availability: 'Available',
        source: 'Optical & Security Feature Inspection Subsystem',
        lastChecked: '4 hours ago',
        summary: 'Electoral card security features, serial numbering, and watermark confirmed.',
        signals: [
          { label: 'Watermark Inspection', impact: 'positive', description: 'Intact optical watermark' }
        ]
      },
      biometric: {
        category: 'biometric',
        title: 'Biometric Comparison',
        status: 'Positive',
        confidence: 91,
        availability: 'Available',
        source: 'Facial Geometry & Passive Liveness Pipeline',
        lastChecked: '4 hours ago',
        summary: 'High biometric match confidence.',
        signals: [
          { label: 'Vector Distance', impact: 'positive', description: 'Match score 91%' }
        ]
      },
      database: {
        category: 'database',
        title: 'Database Verification',
        status: 'Positive',
        confidence: 94,
        availability: 'Available',
        source: 'Civil Identity Registry Gateway',
        lastChecked: '4 hours ago',
        summary: 'Electoral database query verified EPIC serial.',
        signals: [
          { label: 'EPIC Match', impact: 'positive', description: 'Constituency & EPIC valid' }
        ]
      },
      context_history: {
        category: 'context_history',
        title: 'Context & History',
        status: 'Positive',
        confidence: 90,
        availability: 'Available',
        source: 'Historical Telemetry & Device Intelligence',
        lastChecked: '4 hours ago',
        summary: 'Consistent domestic submission telemetry.',
        signals: [
          { label: 'IP Reputation', impact: 'positive', description: 'Clean residential ISP' }
        ]
      }
    },
    riskFactors: [
      { factor: 'Electoral Record Validated', impact: '+0 risk', category: 'risk', detail: 'All security checks passed.' }
    ],
    confidenceFactors: [
      { factor: 'Multi-Stream Confirmation', impact: 'Strong (92%)', category: 'confidence', detail: 'All 4 streams available and verified.' }
    ],
    findings: [
      'Document security features verified.',
      'Biometric comparison validated.',
      'Electoral registry corroboration successful.'
    ],
    recommendedAction: 'Normal Processing',
    recommendationReason: 'Low fraud risk and high evidence confidence.',
    officerDecision: 'Authorized',
    officerNotes: 'Standard verification passed without exception.',
    officerActionTimestamp: '2026-09-17 07:00:00 UTC'
  }
];

