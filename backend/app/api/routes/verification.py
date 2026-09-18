from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any

from app.schemas.fusion import (
    VerificationEvaluationRequest,
    VerificationEvaluationResponse,
    IdentityClaimInput,
    MultiModalEvidenceMapSchema,
    EvidenceItemSchema,
    EvidenceSignalSchema,
)
from app.services.fusion.engine import get_fusion_engine
from app.services.database.adapter import get_database_adapter
from app.services.context.telemetry import get_context_service

router = APIRouter(prefix="/verification", tags=["Evidence Fusion & Risk Engine"])


# In-memory scenarios conforming directly to Section 25 requirements
SCENARIOS_DATA: Dict[str, Dict[str, Any]] = {
    "A": {
        "id": "VER-2026-7819",
        "scenario": "A",
        "name": "Scenario A: Clean Document + Strong Biometric + Active Database",
        "expected_status": "Normal Processing",
        "subject": {
            "full_name": "Ananya K. Sharma (Demo)",
            "document_type": "International Passport",
            "document_number": "IND-DEMO-7819-4012",
            "nationality": "Republic of India",
            "dob": "1998-11-23",
        },
        "evidence": {
            "document": {
                "category": "document",
                "title": "Document Analysis",
                "status": "Positive",
                "confidence": 98,
                "availability": "Available",
                "source": "Optical & Security Feature Inspection Subsystem",
                "last_checked": "Just now",
                "summary": "Electronic biometric chip signatures and physical guilloche lines fully verified.",
                "signals": [
                    {"label": "Chip Signature", "impact": "positive", "description": "ICAO Public Key Directory (PKD) certificate valid"},
                    {"label": "MRZ Checksum", "impact": "positive", "description": "ICAO 9303 check digits verified valid"}
                ]
            },
            "biometric": {
                "category": "biometric",
                "title": "Biometric Comparison",
                "status": "Positive",
                "confidence": 96,
                "availability": "Available",
                "source": "Facial Geometry & Passive Liveness Pipeline",
                "last_checked": "Just now",
                "summary": "Biometric match passed with 96% score against e-Passport chip photo.",
                "signals": [
                    {"label": "Facial Vector Distance", "impact": "positive", "description": "Embedding similarity 96% (threshold > 75%)"},
                    {"label": "Passive Liveness", "impact": "positive", "description": "Zero presentation attack detected"}
                ]
            },
            "database": {
                "category": "database",
                "title": "Database Verification",
                "status": "Positive",
                "confidence": 95,
                "availability": "Available",
                "source": "Civil Identity Registry Gateway (Simulated)",
                "last_checked": "Just now",
                "summary": "Direct passport database match confirmed valid, active, and unrevoked.",
                "signals": [
                    {"label": "Registry Match", "impact": "positive", "description": "Credential status confirmed ACTIVE"}
                ]
            },
            "context_history": {
                "category": "context_history",
                "title": "Context & History",
                "status": "Positive",
                "confidence": 95,
                "availability": "Available",
                "source": "Historical Telemetry & Device Intelligence",
                "last_checked": "Just now",
                "summary": "Single submission velocity from trusted domestic IP subnet.",
                "signals": [
                    {"label": "Device Integrity", "impact": "positive", "description": "Genuine browser fingerprint"}
                ]
            }
        }
    },
    "B": {
        "id": "VER-2026-8942",
        "scenario": "B",
        "name": "Scenario B: Optical Blur / Offline Database (+0 Fraud Risk)",
        "expected_status": "Targeted Verification",
        "subject": {
            "full_name": "Aarav S. Mehta (Demo)",
            "document_type": "National ID Card",
            "document_number": "IND-DEMO-8942-8819",
            "nationality": "Republic of India",
            "dob": "1994-08-14",
        },
        "evidence": {
            "document": {
                "category": "document",
                "title": "Document Analysis",
                "status": "Positive",
                "confidence": 94,
                "availability": "Available",
                "source": "Optical & Security Feature Inspection Subsystem",
                "last_checked": "Just now",
                "summary": "Microprint layout, guilloche lines, and security fonts match national registry specification.",
                "signals": [
                    {"label": "Security Pattern", "impact": "positive", "description": "Guilloche lines continuous and intact"},
                    {"label": "MRZ Checksum", "impact": "positive", "description": "Internal checksum matches encoded fields"}
                ]
            },
            "biometric": {
                "category": "biometric",
                "title": "Biometric Comparison",
                "status": "Positive",
                "confidence": 97,
                "availability": "Available",
                "source": "Facial Geometry & Passive Liveness Pipeline",
                "last_checked": "Just now",
                "summary": "Facial embedding matches document portrait photo with strong correlation. Passive liveness validated.",
                "signals": [
                    {"label": "Facial Vector Distance", "impact": "positive", "description": "Embedding distance 0.14 (threshold < 0.38)"},
                    {"label": "Passive Liveness", "impact": "positive", "description": "Genuine human subject depth profile verified"}
                ]
            },
            "database": {
                "category": "database",
                "title": "Database Verification",
                "status": "Unavailable",
                "confidence": 48,
                "availability": "Unavailable",
                "source": "Civil Identity Registry Gateway (Simulated)",
                "last_checked": "1 min ago (Timed out)",
                "summary": "Primary civil registry endpoint timed out (HTTP 504 Gateway Timeout). Maintenance window in progress.",
                "signals": [
                    {"label": "Registry Connection", "impact": "lowers_confidence", "description": "HTTP 504 gateway timeout on official civil gateway"},
                    {"label": "Fraud Assessment", "impact": "neutral", "description": "Database unavailability does NOT indicate fraud (+0 fraud risk)"}
                ]
            },
            "context_history": {
                "category": "context_history",
                "title": "Context & History",
                "status": "Informational",
                "confidence": 91,
                "availability": "Available",
                "source": "Historical Telemetry & Device Intelligence",
                "last_checked": "Just now",
                "summary": "Submission originated from trusted domestic IP subnet.",
                "signals": [
                    {"label": "Geolocation Consistency", "impact": "positive", "description": "IP subnet matches declared regional residence"}
                ]
            }
        }
    },
    "C": {
        "id": "VER-2026-9031",
        "scenario": "C",
        "name": "Scenario C: Document MRZ Contradiction / Biometric Mismatch",
        "expected_status": "Officer Review",
        "subject": {
            "full_name": "Vikram P. Rao (Demo)",
            "document_type": "Driving Licence",
            "document_number": "IND-DEMO-9031-1049",
            "nationality": "Republic of India",
            "dob": "1987-03-05",
        },
        "evidence": {
            "document": {
                "category": "document",
                "title": "Document Analysis",
                "status": "Uncertain",
                "confidence": 72,
                "availability": "Available",
                "source": "Optical & Security Feature Inspection Subsystem",
                "last_checked": "Just now",
                "summary": "Font kerning discrepancy observed in issued date block.",
                "signals": [
                    {"label": "Typography Analysis", "impact": "risk", "description": "Secondary font kerning variance (+15 risk)"}
                ]
            },
            "biometric": {
                "category": "biometric",
                "title": "Biometric Comparison",
                "status": "Negative",
                "confidence": 89,
                "availability": "Available",
                "source": "Facial Geometry & Passive Liveness Pipeline",
                "last_checked": "Just now",
                "summary": "Facial embedding divergence indicates potential impersonation or mismatched subject.",
                "signals": [
                    {"label": "Biometric Non-Match", "impact": "risk", "description": "Facial vector distance 0.52 (threshold < 0.38) (+50 risk)"}
                ]
            },
            "database": {
                "category": "database",
                "title": "Database Verification",
                "status": "Positive",
                "confidence": 92,
                "availability": "Available",
                "source": "Civil Identity Registry Gateway (Simulated)",
                "last_checked": "Just now",
                "summary": "Licence number exists in transport registry under declared name.",
                "signals": [
                    {"label": "Transport Registry", "impact": "positive", "description": "Record exists and valid"}
                ]
            },
            "context_history": {
                "category": "context_history",
                "title": "Context & History",
                "status": "Informational",
                "confidence": 85,
                "availability": "Available",
                "source": "Historical Telemetry & Device Intelligence",
                "last_checked": "Just now",
                "summary": "First-time submission for this subject record.",
                "signals": [
                    {"label": "Historical Record", "impact": "neutral", "description": "No prior submission history"}
                ]
            }
        }
    },
    "D": {
        "id": "VER-2026-6412",
        "scenario": "D",
        "name": "Scenario D: Multi-Source Degradation & Offline Gateway",
        "expected_status": "Inconclusive",
        "subject": {
            "full_name": "Devansh M. Iyer (Demo)",
            "document_type": "National ID Card",
            "document_number": "IND-DEMO-6412-5501",
            "nationality": "Republic of India",
            "dob": "2001-05-19",
        },
        "evidence": {
            "document": {
                "category": "document",
                "title": "Document Analysis",
                "status": "Uncertain",
                "confidence": 45,
                "availability": "Degraded",
                "source": "Optical & Security Feature Inspection Subsystem",
                "last_checked": "Just now",
                "summary": "Severe specular reflection and low resolution in uploaded capture prevent feature verification.",
                "signals": [
                    {"label": "Capture Quality", "impact": "lowers_confidence", "description": "Resolution below 200 DPI (+0 fraud risk)"}
                ]
            },
            "biometric": {
                "category": "biometric",
                "title": "Biometric Comparison",
                "status": "Uncertain",
                "confidence": 40,
                "availability": "Degraded",
                "source": "Facial Geometry & Passive Liveness Pipeline",
                "last_checked": "Just now",
                "summary": "Subject motion blur and low lighting prevent definitive feature mapping.",
                "signals": [
                    {"label": "Illumination Failure", "impact": "lowers_confidence", "description": "Dark environment, motion blur"}
                ]
            },
            "database": {
                "category": "database",
                "title": "Database Verification",
                "status": "Unavailable",
                "confidence": 30,
                "availability": "Unavailable",
                "source": "Civil Identity Registry Gateway (Simulated)",
                "last_checked": "Just now",
                "summary": "Civil registry connection unresponsive (HTTP 504).",
                "signals": [
                    {"label": "Connection Status", "impact": "lowers_confidence", "description": "Unavailable service (+0 fraud risk)"}
                ]
            },
            "context_history": {
                "category": "context_history",
                "title": "Context & History",
                "status": "Uncertain",
                "confidence": 40,
                "availability": "Degraded",
                "source": "Historical Telemetry & Device Intelligence",
                "last_checked": "Just now",
                "summary": "Inconsistent device telemetry and sparse browser fingerprint.",
                "signals": [
                    {"label": "Device Telemetry", "impact": "lowers_confidence", "description": "Sparse submission history (+0 fraud risk)"}
                ]
            }
        }
    }
}


@router.post(
    "/evaluate",
    response_model=VerificationEvaluationResponse,
    summary="Evaluate Multi-Modal Evidence Fusion",
    description=(
        "Fuses Document, Biometric, Database, and Context streams into deterministic Fraud Risk (0-100) "
        "and Evidence Confidence (0-100). Generates explainable AI recommendation with factor contributions "
        "and adaptive next steps."
    )
)
def evaluate_verification(payload: VerificationEvaluationRequest):
    evidence = payload.evidence
    # If simulated database offline toggle is on, update database evidence stream accordingly
    if payload.simulate_db_offline:
        db_adapter = get_database_adapter()
        doc_num = payload.identity_claim.document_number if payload.identity_claim else "UNKNOWN"
        name = payload.identity_claim.full_name if payload.identity_claim else "UNKNOWN"
        evidence.database = db_adapter.query_registry(doc_num, name, simulate_offline=True)

    engine = get_fusion_engine()
    claim = payload.identity_claim or IdentityClaimInput(
        full_name="Subject",
        document_number="DOC-000",
        dob="1990-01-01"
    )
    v_id = claim.verification_id or f"VER-{claim.document_number[-4:] if len(claim.document_number) >= 4 else 'DEMO'}"

    result = engine.evaluate(
        evidence=evidence,
        identity_claim=claim,
        verification_id=v_id
    )
    return result


@router.get(
    "/scenarios",
    summary="List Synthetic Demo Scenarios (A, B, C, D)",
    description="Returns pre-calibrated multi-modal demonstration scenarios for SIH 2026 jury presentations."
)
def get_scenarios():
    return SCENARIOS_DATA


@router.get(
    "/{verification_id}",
    summary="Retrieve Verification Dossier by ID",
    description="Returns stored or benchmark verification dossier."
)
def get_verification_dossier(verification_id: str):
    # Match against scenarios first
    for key, sc in SCENARIOS_DATA.items():
        if sc["id"] == verification_id:
            # Run live fusion to ensure fresh evaluation
            engine = get_fusion_engine()
            req_ev = MultiModalEvidenceMapSchema(**sc["evidence"])
            claim = IdentityClaimInput(
                verification_id=sc["id"],
                full_name=sc["subject"]["full_name"],
                document_type=sc["subject"]["document_type"],
                document_number=sc["subject"]["document_number"],
                nationality=sc["subject"]["nationality"],
                dob=sc["subject"]["dob"],
            )
            eval_res = engine.evaluate(req_ev, claim, verification_id=sc["id"])
            return {
                "id": sc["id"],
                "subject": sc["subject"],
                "evaluation": eval_res,
                "officer_decision": "Pending",
                "officer_notes": None,
                "disclaimer": "SYNTHETIC DEMO DATA — NOT FOR OPERATIONAL USE"
            }

    # Return standard template for new dynamic verification IDs
    return {
        "id": verification_id,
        "message": f"Verification record {verification_id} is active in session memory.",
        "status": "ACTIVE_SESSION"
    }

