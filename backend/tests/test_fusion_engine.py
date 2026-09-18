import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.fusion import (
    MultiModalEvidenceMapSchema,
    EvidenceItemSchema,
    EvidenceSignalSchema,
    IdentityClaimInput,
    VerificationEvaluationRequest,
)
from app.services.fusion.engine import get_fusion_engine

client = TestClient(app)


def build_test_evidence(
    doc_status="Positive",
    bio_status="Positive",
    db_status="Positive",
    ctx_status="Positive"
) -> MultiModalEvidenceMapSchema:
    return MultiModalEvidenceMapSchema(
        document=EvidenceItemSchema(
            category="document",
            title="Document Analysis",
            status=doc_status,
            confidence=95 if doc_status == "Positive" else 45,
            availability="Available" if doc_status != "Unavailable" else "Unavailable",
            source="Optical Subsystem",
            summary="Test document summary",
            signals=[]
        ),
        biometric=EvidenceItemSchema(
            category="biometric",
            title="Biometric Comparison",
            status=bio_status,
            confidence=95 if bio_status == "Positive" else 45,
            availability="Available" if bio_status != "Unavailable" else "Unavailable",
            source="Biometric Subsystem",
            summary="Test biometric summary",
            signals=[]
        ),
        database=EvidenceItemSchema(
            category="database",
            title="Database Verification",
            status=db_status,
            confidence=95 if db_status == "Positive" else 45,
            availability="Available" if db_status != "Unavailable" else "Unavailable",
            source="Civil Registry",
            summary="Test database summary",
            signals=[]
        ),
        context_history=EvidenceItemSchema(
            category="context_history",
            title="Context & History",
            status=ctx_status,
            confidence=90,
            availability="Available",
            source="Telemetry Subsystem",
            summary="Test context summary",
            signals=[]
        )
    )


def test_scenario_a_normal_processing():
    """Verify Scenario A (clean document, strong biometric, active database) -> Normal Processing."""
    engine = get_fusion_engine()
    ev = build_test_evidence("Positive", "Positive", "Positive", "Positive")
    claim = IdentityClaimInput(full_name="Ananya Sharma", document_number="IND-7819", dob="1998-11-23")
    res = engine.evaluate(ev, claim)
    assert res.fraud_risk <= 25
    assert res.evidence_confidence >= 85
    assert res.ai_recommendation == "Normal Processing"


def test_scenario_b_targeted_verification_offline_db():
    """Verify Scenario B (unavailable database does NOT increase fraud risk) -> Targeted Verification."""
    engine = get_fusion_engine()
    ev = build_test_evidence("Positive", "Positive", "Unavailable", "Positive")
    claim = IdentityClaimInput(full_name="Aarav Mehta", document_number="IND-8942", dob="1994-08-14")
    res = engine.evaluate(ev, claim)
    assert res.fraud_risk == 18
    assert res.evidence_confidence == 82
    assert res.ai_recommendation == "Targeted Verification"


def test_scenario_c_officer_review_biometric_mismatch():
    """Verify Scenario C (biometric non-match causes elevated risk > 50) -> Officer Review."""
    engine = get_fusion_engine()
    ev = build_test_evidence("Positive", "Negative", "Positive", "Positive")
    claim = IdentityClaimInput(full_name="Vikram Rao", document_number="IND-9031", dob="1987-03-05")
    res = engine.evaluate(ev, claim)
    assert res.fraud_risk > 50
    assert res.ai_recommendation == "Officer Review"


def test_scenario_d_inconclusive_low_confidence():
    """Verify Scenario D (multiple degraded/uncertain streams yield confidence < 50) -> Inconclusive."""
    engine = get_fusion_engine()
    ev = build_test_evidence("Uncertain", "Uncertain", "Unavailable", "Uncertain")
    claim = IdentityClaimInput(full_name="Devansh Iyer", document_number="IND-6412", dob="2001-05-19")
    res = engine.evaluate(ev, claim)
    assert res.evidence_confidence < 50
    assert res.ai_recommendation == "Inconclusive"


def test_strict_recommendation_priority():
    """Verify strict priority: Confidence < 50 overrides Risk > 50 -> Inconclusive."""
    engine = get_fusion_engine()
    # Construct an evidence set that has a high risk marker but overall degraded confidence (< 50)
    ev = MultiModalEvidenceMapSchema(
        document=EvidenceItemSchema(
            category="document",
            title="Document",
            status="Negative",  # +55 risk
            confidence=20,
            availability="Degraded",
            source="Doc",
            summary="Blurry tampering",
            signals=[]
        ),
        biometric=EvidenceItemSchema(
            category="biometric",
            title="Biometric",
            status="Unavailable",
            confidence=0,
            availability="Unavailable",
            source="Bio",
            summary="Offline",
            signals=[]
        ),
        database=EvidenceItemSchema(
            category="database",
            title="Database",
            status="Unavailable",
            confidence=0,
            availability="Unavailable",
            source="DB",
            summary="Offline",
            signals=[]
        ),
        context_history=EvidenceItemSchema(
            category="context_history",
            title="Context",
            status="Uncertain",
            confidence=10,
            availability="Degraded",
            source="Ctx",
            summary="Uncertain",
            signals=[]
        )
    )
    claim = IdentityClaimInput(full_name="Test Subject", document_number="TEST-001", dob="1990-01-01")
    res = engine.evaluate(ev, claim)
    assert res.evidence_confidence < 50
    assert res.fraud_risk > 50
    # Rule 1 (Confidence < 50) MUST win!
    assert res.ai_recommendation == "Inconclusive"


def test_verification_evaluate_api_endpoint():
    """Verify POST /api/v1/verification/evaluate responds properly."""
    ev = build_test_evidence("Positive", "Positive", "Positive", "Positive")
    req = VerificationEvaluationRequest(
        identity_claim=IdentityClaimInput(full_name="Test", document_number="DOC-123", dob="1995-01-01"),
        evidence=ev,
        simulate_db_offline=False
    )
    response = client.post("/api/v1/verification/evaluate", json=req.model_dump())
    assert response.status_code == 200
    data = response.json()
    assert "fraud_risk" in data
    assert "evidence_confidence" in data
    assert "ai_recommendation" in data
    assert "risk_factors" in data
    assert "confidence_factors" in data
    assert "adaptive_next_steps" in data


def test_get_scenarios_endpoint():
    """Verify GET /api/v1/verification/scenarios lists all 4 scenarios A, B, C, D."""
    response = client.get("/api/v1/verification/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "A" in data
    assert "B" in data
    assert "C" in data
    assert "D" in data
    assert data["A"]["expected_status"] == "Normal Processing"
    assert data["B"]["expected_status"] == "Targeted Verification"
    assert data["C"]["expected_status"] == "Officer Review"
    assert data["D"]["expected_status"] == "Inconclusive"

