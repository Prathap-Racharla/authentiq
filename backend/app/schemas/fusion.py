from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class EvidenceSignalSchema(BaseModel):
    label: str
    impact: str = Field(..., description="positive, risk, lowers_confidence, neutral")
    description: str


class EvidenceItemSchema(BaseModel):
    category: str = Field(..., description="document, biometric, database, context_history")
    title: str = "Evidence Stream"
    status: str = Field(..., description="Positive, Negative, Uncertain, Unavailable, Informational")
    confidence: int = Field(..., ge=0, le=100)
    availability: str = Field("Available", description="Available, Degraded, Unavailable, Offline")
    source: str
    last_checked: str = "Just now"
    summary: str
    signals: List[EvidenceSignalSchema] = []


class FactorContributionSchema(BaseModel):
    factor: str
    impact: str
    category: str = Field(..., description="risk or confidence")
    detail: str


class MultiModalEvidenceMapSchema(BaseModel):
    document: EvidenceItemSchema
    biometric: EvidenceItemSchema
    database: EvidenceItemSchema
    context_history: EvidenceItemSchema


class IdentityClaimInput(BaseModel):
    verification_id: Optional[str] = None
    full_name: str
    document_type: str = "International Passport"
    document_number: str
    nationality: str = "Republic of India"
    dob: str
    mode: str = "Standard"  # Standard, Enhanced, Targeted


class VerificationEvaluationRequest(BaseModel):
    identity_claim: Optional[IdentityClaimInput] = None
    evidence: MultiModalEvidenceMapSchema
    simulate_db_offline: bool = False


class VerificationEvaluationResponse(BaseModel):
    verification_id: str
    fraud_risk: int = Field(..., ge=0, le=100, description="Fraud Risk score (0-100, deterministic)")
    evidence_confidence: int = Field(..., ge=0, le=100, description="Evidence Confidence score (0-100)")
    ai_recommendation: str = Field(..., description="Normal Processing, Targeted Verification, Officer Review, Inconclusive")
    recommendation_reason: str
    recommended_action: str
    risk_factors: List[FactorContributionSchema]
    confidence_factors: List[FactorContributionSchema]
    findings: List[str]
    adaptive_next_steps: List[str]
    evidence_map: MultiModalEvidenceMapSchema
    disclaimer: str = "SYNTHETIC DEMO DATA — AI-assisted decision-support prototype. Final determinations require authorized officer review."


class CanonicalOfficerDecision(str, Enum):
    ACCEPT_RECOMMENDATION = "ACCEPT_RECOMMENDATION"
    REQUEST_ADDITIONAL_VERIFICATION = "REQUEST_ADDITIONAL_VERIFICATION"
    ESCALATE_FOR_REVIEW = "ESCALATE_FOR_REVIEW"
    MARK_INCONCLUSIVE = "MARK_INCONCLUSIVE"


class OfficerDecisionRequest(BaseModel):
    decision: CanonicalOfficerDecision
    notes: str = Field(..., min_length=1, description="Mandatory operational justification notes")


class OfficerDecisionResponse(BaseModel):
    verification_id: str
    officer_decision: CanonicalOfficerDecision
    officer_notes: str
    officer_action_timestamp: str
    actor: str
    audit_event_id: str
    audit_current_hash: str
    status: str
    message: str


