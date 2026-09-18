import { EvidenceMap, VerificationStatus, FactorContribution } from '../types';
import { evaluateEvidence as evaluateLocally } from './riskEngine';

const API_BASE_URL = '/api/v1';

export interface VerificationEvaluationResult {
  verification_id: string;
  fraud_risk: number;
  evidence_confidence: number;
  ai_recommendation: VerificationStatus;
  recommendation_reason: string;
  recommended_action: string;
  risk_factors: FactorContribution[];
  confidence_factors: FactorContribution[];
  findings: string[];
  adaptive_next_steps: string[];
  evidence_map: EvidenceMap;
  disclaimer: string;
}

export interface SecuritySubsystemStatus {
  status: string;
  [key: string]: any;
}

export interface SecurityStatusResponse {
  status: string;
  system_time_utc: string;
  protections: Record<string, string>;
  subsystems: Record<string, SecuritySubsystemStatus>;
  disclaimer: string;
}

export async function evaluateVerificationRemote(
  evidence: EvidenceMap,
  claim?: {
    verification_id?: string;
    full_name: string;
    document_type?: string;
    document_number: string;
    nationality?: string;
    dob?: string;
    mode?: string;
  },
  simulateDbOffline: boolean = false
): Promise<VerificationEvaluationResult> {
  try {
    const payload = {
      identity_claim: claim,
      evidence,
      simulate_db_offline: simulateDbOffline,
    };

    const response = await fetch(`${API_BASE_URL}/verification/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        verification_id: data.verification_id,
        fraud_risk: data.fraud_risk,
        evidence_confidence: data.evidence_confidence,
        ai_recommendation: data.ai_recommendation as VerificationStatus,
        recommendation_reason: data.recommendation_reason,
        recommended_action: data.recommended_action,
        risk_factors: data.risk_factors,
        confidence_factors: data.confidence_factors,
        findings: data.findings,
        adaptive_next_steps: data.adaptive_next_steps,
        evidence_map: data.evidence_map || evidence,
        disclaimer: data.disclaimer,
      };
    }
  } catch (err) {
    console.warn('Backend fusion unreachable, evaluating with local deterministic engine:', err);
  }

  // Graceful fallback to client-side risk engine
  const local = evaluateLocally(evidence);
  return {
    verification_id: claim?.verification_id || 'VER-LOCAL',
    fraud_risk: local.fraudRisk,
    evidence_confidence: local.evidenceConfidence,
    ai_recommendation: local.recommendation,
    recommendation_reason: local.recommendationReason,
    recommended_action: local.recommendedAction,
    risk_factors: local.riskFactors,
    confidence_factors: local.confidenceFactors,
    findings: local.findings,
    adaptive_next_steps: [local.recommendedAction],
    evidence_map: evidence,
    disclaimer: 'SYNTHETIC DEMO DATA — AI decision-support fallback evaluation.',
  };
}

export async function fetchSecurityStatus(): Promise<SecurityStatusResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/security/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline
  }
  return null;
}

export async function fetchScenarios(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/verification/scenarios`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline
  }
  return null;
}

