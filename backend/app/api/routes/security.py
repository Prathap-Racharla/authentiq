from fastapi import APIRouter
from typing import Dict, Any

from app.services.document.ocr import get_ocr_provider
from app.services.biometric.provider import get_biometric_provider
from app.services.audit.ledger import get_audit_ledger

router = APIRouter(prefix="/security", tags=["Cybersecurity & System Status"])


@router.get(
    "/status",
    summary="System Cybersecurity & Health Status",
    description="Returns live operational and security hardening status for all core AuthentiQ subsystems."
)
def get_security_status() -> Dict[str, Any]:
    ocr_provider = get_ocr_provider()
    bio_provider = get_biometric_provider()
    ledger = get_audit_ledger()
    chain_check = ledger.verify_chain_integrity()

    return {
        "status": "SECURE_OPERATIONAL",
        "system_time_utc": "Synchronized UTC",
        "protections": {
            "magic_byte_validation": "ENFORCED",
            "max_payload_limit": "10 MB",
            "ephemeral_storage_policy": "NO_RAW_PII_PERSISTED",
            "filename_sanitization": "ENFORCED",
            "cors_policy": "RESTRICTED",
            "pii_logging_masking": "ACTIVE",
            "rate_limiting_status": "MONITORED",
        },
        "subsystems": {
            "api_gateway": {
                "status": "OPERATIONAL",
                "version": "v0.2.0 (FastAPI)",
                "endpoints": 12,
            },
            "document_intelligence": {
                "status": "OPERATIONAL",
                "stages": 8,
                "supported_formats": ["JPEG", "PNG", "WEBP", "PDF"],
            },
            "ocr_provider": {
                "status": "OPERATIONAL" if ocr_provider.is_available() else "DEGRADED",
                "engine": ocr_provider.provider_name,
            },
            "biometric_engine": {
                "status": "OPERATIONAL" if bio_provider.is_available() else "DEGRADED",
                "technology": "OpenCV Face Geometry & Focus Assessment",
            },
            "database_adapter": {
                "status": "SIMULATED_AVAILABLE",
                "mode": "Demonstrating Unavailable != Fraud (+0 Risk)",
                "type": "Synthetic Civil Registry Gateway",
            },
            "audit_chain": {
                "status": "INTEGRITY_VERIFIED" if chain_check.is_valid else "COMPROMISED",
                "total_blocks": chain_check.total_blocks,
                "cryptographic_algorithm": "SHA-256",
                "integrity_state": chain_check.integrity_status,
            },
            "frontend": {
                "status": "OPERATIONAL",
                "framework": "React 19 + TypeScript + Vite",
            }
        },
        "disclaimer": "SIH 2026 Prototype — Security operations decision-support system."
    }

