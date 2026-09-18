import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.audit.ledger import TamperEvidentAuditLedger, get_audit_ledger

client = TestClient(app)


def test_audit_ledger_genesis_and_chaining():
    """Verify ledger initializes with Genesis block and previous hash chaining."""
    ledger = TamperEvidentAuditLedger()
    events = ledger.get_events(limit=10)
    assert len(events) >= 4
    genesis = [e for e in events if e.event_id == "EVT-0000"][0]
    assert genesis.previous_hash == TamperEvidentAuditLedger.GENESIS_HASH
    assert len(genesis.current_hash) == 64  # SHA-256 hex length


def test_audit_ledger_integrity_verification():
    """Verify verify_chain_integrity confirms valid uncompromised state."""
    ledger = TamperEvidentAuditLedger()
    res = ledger.verify_chain_integrity()
    assert res.is_valid is True
    assert res.integrity_status == "VERIFIED"
    assert res.total_blocks >= 4


def test_audit_ledger_tamper_detection():
    """Verify tampering with any block payload immediately causes verification failure."""
    ledger = TamperEvidentAuditLedger()
    # Maliciously mutate block 1 payload
    ledger._chain[1].payload_summary = "TAMPERED FRAUD RECORD"
    res = ledger.verify_chain_integrity()
    assert res.is_valid is False
    assert res.integrity_status == "COMPROMISED"


def test_audit_api_endpoints():
    """Verify audit endpoints GET /api/v1/audit, POST /event, and GET /verify."""
    # 1. GET /api/v1/audit
    get_res = client.get("/api/v1/audit?limit=10")
    assert get_res.status_code == 200
    events = get_res.json()
    assert isinstance(events, list)
    assert len(events) > 0

    # 2. POST /api/v1/audit/event
    post_res = client.post(
        "/api/v1/audit/event",
        json={
            "verification_id": "VER-TEST-1234",
            "actor": "Officer Test",
            "event_type": "OFFICER_DECISION",
            "payload_summary": "Authorized officer accepted recommendation."
        }
    )
    assert post_res.status_code == 200
    created = post_res.json()
    assert "event_id" in created
    assert created["verification_id"] == "VER-TEST-1234"
    assert len(created["current_hash"]) == 64

    # 3. GET /api/v1/audit/verify
    verify_res = client.get("/api/v1/audit/verify")
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["is_valid"] is True
    assert v_data["integrity_status"] == "VERIFIED"


def test_security_status_endpoint():
    """Verify GET /api/v1/security/status returns comprehensive cybersecurity hardening status."""
    res = client.get("/api/v1/security/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SECURE_OPERATIONAL"
    assert "protections" in data
    assert data["protections"]["magic_byte_validation"] == "ENFORCED"
    assert data["protections"]["max_payload_limit"] == "10 MB"
    assert "subsystems" in data
    assert "audit_chain" in data["subsystems"]
    assert "document_intelligence" in data["subsystems"]

