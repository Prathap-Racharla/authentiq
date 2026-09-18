import { AuditEvent } from '../types';

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    eventId: 'EVT-001089',
    verificationId: 'VER-2026-8942',
    eventType: 'Verification Initiated',
    actor: 'Intake Gateway / Officer V. Sharma',
    timestamp: '2026-09-17 10:40:02 UTC',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: '7f9c2d1b8e4a503698d249f3102ce85c07b4618e7d23f5a901ce4599b823e841',
    integrity: 'VERIFIED',
    payloadSummary: 'Intake payload received: Subject Aarav S. Mehta (Demo), Document National ID (Demo). Raw PII omitted.'
  },
  {
    eventId: 'EVT-001090',
    verificationId: 'VER-2026-8942',
    eventType: 'Document Analysis Completed',
    actor: 'Document Inspection Subsystem',
    timestamp: '2026-09-17 10:41:14 UTC',
    prevHash: '7f9c2d1b8e4a503698d249f3102ce85c07b4618e7d23f5a901ce4599b823e841',
    currentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    integrity: 'VERIFIED',
    payloadSummary: 'Optical check positive. Guilloche patterns intact; zero tampering indicators. Confidence: 94%.'
  },
  {
    eventId: 'EVT-001091',
    verificationId: 'VER-2026-8942',
    eventType: 'Biometric Comparison Completed',
    actor: 'Biometric Vector Pipeline',
    timestamp: '2026-09-17 10:41:40 UTC',
    prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    currentHash: 'a891d4e219fb093ec8027732d8471c08b8e014995bb6678241d6368d1849df92',
    integrity: 'VERIFIED',
    payloadSummary: 'Facial embedding distance 0.14 verified. Presentation attack detection: Clean. Confidence: 97%.'
  },
  {
    eventId: 'EVT-001092',
    verificationId: 'VER-2026-8942',
    eventType: 'Database Query Attempted',
    actor: 'Civil Registry Gateway Client',
    timestamp: '2026-09-17 10:42:01 UTC',
    prevHash: 'a891d4e219fb093ec8027732d8471c08b8e014995bb6678241d6368d1849df92',
    currentHash: '3941cb90ea651e223bf0d01248a31e8790cb7c6451e2890dbbb23145618b76a0',
    integrity: 'VERIFIED',
    payloadSummary: 'Registry connection timed out (HTTP 504). Logged as Unavailable; +0 fraud risk applied.'
  },
  {
    eventId: 'EVT-001093',
    verificationId: 'VER-2026-8942',
    eventType: 'Risk Assessment Generated',
    actor: 'Transparent Decision Engine v1.0',
    timestamp: '2026-09-17 10:42:10 UTC',
    prevHash: '3941cb90ea651e223bf0d01248a31e8790cb7c6451e2890dbbb23145618b76a0',
    currentHash: '42b9187ec09a562138ebfa890123cb65709124ddba9120658fe8412903b41e88',
    integrity: 'VERIFIED',
    payloadSummary: 'Calculated metrics: Fraud Risk = 18/100, Evidence Confidence = 82/100. AI-Assisted Recommendation generated.'
  },
  {
    eventId: 'EVT-001094',
    verificationId: 'VER-2026-8942',
    eventType: 'Recommendation Recorded',
    actor: 'AuthentiQ Policy Dispatcher',
    timestamp: '2026-09-17 10:42:15 UTC',
    prevHash: '42b9187ec09a562138ebfa890123cb65709124ddba9120658fe8412903b41e88',
    currentHash: '98d1a4e502c38841029ba7d102e9508bc178d2238411039daeb51203498b89cf',
    integrity: 'VERIFIED',
    payloadSummary: 'Policy outcome: Targeted Verification Recommended due to incomplete database stream.'
  },
  {
    eventId: 'EVT-001095',
    verificationId: 'VER-2026-9031',
    eventType: 'Officer Review Requested',
    actor: 'Transparent Decision Engine v1.0',
    timestamp: '2026-09-17 08:31:00 UTC',
    prevHash: '98d1a4e502c38841029ba7d102e9508bc178d2238411039daeb51203498b89cf',
    currentHash: 'b4a8e091124c6531980be78129048ab5079a41098cb21459810ef34091bc7721',
    integrity: 'VERIFIED',
    payloadSummary: 'Elevated Fraud Risk (68/100) triggered automatic Officer Review workflow routing.'
  },
  {
    eventId: 'EVT-001096',
    verificationId: 'VER-2026-9031',
    eventType: 'Officer Decision Recorded',
    actor: 'Officer V. Sharma (ID: OFF-441)',
    timestamp: '2026-09-17 08:45:00 UTC',
    prevHash: 'b4a8e091124c6531980be78129048ab5079a41098cb21459810ef34091bc7721',
    currentHash: 'c7198ba4201387d55981ae4230195ba60174dfb20894acbb901e4a7812bc6540',
    integrity: 'VERIFIED',
    payloadSummary: 'Authorized Officer Final Decision: Secondary Check Ordered. Mandated in-person facial enrollment.'
  }
];

