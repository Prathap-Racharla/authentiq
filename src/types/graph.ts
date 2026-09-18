export type GraphNodeType = 
  | 'person' 
  | 'identity' 
  | 'document' 
  | 'verification' 
  | 'related_record';

export type GraphEdgeType = 
  | 'associated with' 
  | 'verified by' 
  | 'appears in' 
  | 'potentially linked';

export interface GraphNode {
  id: string;
  label: string;
  subLabel: string;
  type: GraphNodeType;
  x?: number;
  y?: number;
  properties: Record<string, string>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: GraphEdgeType;
  confidence?: number;
  isPotentialLink?: boolean;
}

export interface RelationshipEvidence {
  id: string;
  title: string;
  detectedRelationship: string;
  confidence: number;
  supportingSignals: string[];
  interpretation: string;
  requiresOfficerReview: boolean;
  primaryEntities: string[];
}

