import { GraphNode, GraphEdge, RelationshipEvidence } from '../types';

export const MOCK_GRAPH_NODES: GraphNode[] = [
  {
    id: 'node-person',
    label: 'Person: Aarav S. Mehta',
    subLabel: 'Primary Physical Subject',
    type: 'person',
    x: 180,
    y: 220,
    properties: {
      'Subject Category': 'Applicant (Demo)',
      'Biometric Vector ID': 'BIO-VEC-9941-X',
      'Assurance Level': 'Substantial (IAL-2)',
      'Primary Residency': 'Pune, Maharashtra (Demo)'
    }
  },
  {
    id: 'node-identity-a',
    label: 'Identity A: Aarav Mehta',
    subLabel: 'Active Claimed Profile',
    type: 'identity',
    x: 400,
    y: 130,
    properties: {
      'Full Name': 'Aarav S. Mehta (Demo)',
      'DOB': '1994-08-14',
      'Phone Masked': '+91-98721-XXXXX',
      'Address Hash': 'a4f8...912e'
    }
  },
  {
    id: 'node-doc-a',
    label: 'Document A: National ID',
    subLabel: 'IND-DEMO-8942-XXXX',
    type: 'document',
    x: 640,
    y: 130,
    properties: {
      'Document Type': 'National Identity Card (Demo)',
      'Issuer': 'UID Authority (Demo Gateway)',
      'Issue Date': '2019-04-11',
      'Security Status': 'Tamper Check Passed'
    }
  },
  {
    id: 'node-identity-b',
    label: 'Identity B: A. S. Mehta',
    subLabel: 'Prior Historical Profile',
    type: 'identity',
    x: 400,
    y: 320,
    properties: {
      'Full Name': 'A. S. Mehta (Demo)',
      'DOB': '1994-08-14 (Exact Match)',
      'Phone Masked': '+91-98721-XXXXX (Shared)',
      'Address Ref': 'Sector 4, Pune (Demo)'
    }
  },
  {
    id: 'node-record-b',
    label: 'Related Record B: Utility Reg',
    subLabel: 'REC-DEMO-2022-771',
    type: 'related_record',
    x: 640,
    y: 320,
    properties: {
      'Record System': 'Municipal Utility Register (Demo)',
      'Registration Year': '2022',
      'Record Status': 'Archived / Active',
      'Association Basis': 'Secondary Utility Bill Corroboration'
    }
  },
  {
    id: 'node-verification',
    label: 'Verification: VER-2026-8942',
    subLabel: 'Active Session',
    type: 'verification',
    x: 180,
    y: 80,
    properties: {
      'Session State': 'Targeted Verification Recommended',
      'Fraud Risk': '18 / 100',
      'Evidence Confidence': '82 / 100',
      'Timestamp': '2026-09-17 10:42 UTC'
    }
  }
];

export const MOCK_GRAPH_EDGES: GraphEdge[] = [
  {
    id: 'edge-1',
    source: 'node-person',
    target: 'node-identity-a',
    label: 'associated with',
    confidence: 97
  },
  {
    id: 'edge-2',
    source: 'node-identity-a',
    target: 'node-doc-a',
    label: 'verified by',
    confidence: 94
  },
  {
    id: 'edge-3',
    source: 'node-identity-a',
    target: 'node-identity-b',
    label: 'potentially linked',
    confidence: 78,
    isPotentialLink: true
  },
  {
    id: 'edge-4',
    source: 'node-identity-b',
    target: 'node-record-b',
    label: 'appears in',
    confidence: 85
  },
  {
    id: 'edge-5',
    source: 'node-person',
    target: 'node-verification',
    label: 'verified by',
    confidence: 90
  }
];

export const MOCK_RELATIONSHIP_EVIDENCE: RelationshipEvidence = {
  id: 'REL-2026-881',
  title: 'Potential Identity Relationship Detected',
  detectedRelationship: 'Potential Identity Association: Identity A ↔ Identity B',
  confidence: 78,
  supportingSignals: [
    'Matching biographic attributes (Exact Date of Birth match: 1994-08-14)',
    'Related document metadata (Shared telecommunications contact prefix & municipal registry node)',
    'Historical association (Prior residential address match recorded in Municipal Utility Register 2022)'
  ],
  interpretation: 'Relationship requires authorized officer review. It does not by itself establish fraud.',
  requiresOfficerReview: true,
  primaryEntities: ['Identity A: Aarav S. Mehta', 'Identity B: A. S. Mehta (Historical)']
};

