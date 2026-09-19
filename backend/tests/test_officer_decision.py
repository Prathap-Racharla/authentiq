import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_officer_decision_success():
    verification_id = "VER-2026-TEST-OFFICER-001"
    payload = {
        "decision": "ACCEPT_RECOMMENDATION",
        "notes": "Verified clean document optical features, valid MRZ, and no adverse civil flags."
    }
    response = client.post(f"/api/v1/verification/{verification_id}/officer-decision", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["verification_id"] == verification_id
    assert data["officer_decision"] == "ACCEPT_RECOMMENDATION"
    assert data["officer_notes"] == payload["notes"]
    assert "Authorized Officer" in data["actor"]
    assert data["status"] == "DECISION_RECORDED"
    assert "audit_event_id" in data
    assert "audit_current_hash" in data


def test_officer_decision_requires_notes():
    verification_id = "VER-2026-TEST-OFFICER-002"
    payload = {
        "decision": "REQUEST_ADDITIONAL_VERIFICATION",
        "notes": "   "  # Empty / whitespace notes
    }
    response = client.post(f"/api/v1/verification/{verification_id}/officer-decision", json=payload)
    assert response.status_code == 400 or response.status_code == 422
    assert "notes" in response.text.lower()


def test_officer_decision_immutability():
    verification_id = "VER-2026-TEST-OFFICER-003"
    payload1 = {
        "decision": "ESCALATE_FOR_REVIEW",
        "notes": "First authorized determination."
    }
    res1 = client.post(f"/api/v1/verification/{verification_id}/officer-decision", json=payload1)
    assert res1.status_code == 200

    # Second decision should be rejected with 409 Conflict
    payload2 = {
        "decision": "ACCEPT_RECOMMENDATION",
        "notes": "Attempting second overwrite."
    }
    res2 = client.post(f"/api/v1/verification/{verification_id}/officer-decision", json=payload2)
    assert res2.status_code == 409
    assert "already recorded" in res2.text.lower()


def test_officer_decision_creates_audit_event_without_pii():
    verification_id = "VER-2026-TEST-OFFICER-004"
    payload = {
        "decision": "MARK_INCONCLUSIVE",
        "notes": "Offline registry and image blur prevent conclusive confidence threshold."
    }
    res = client.post(f"/api/v1/verification/{verification_id}/officer-decision", json=payload)
    assert res.status_code == 200

    # Verify audit event in ledger
    audit_res = client.get(f"/api/v1/audit?verification_id={verification_id}")
    assert audit_res.status_code == 200
    events = audit_res.json()
    assert len(events) >= 1
    officer_events = [e for e in events if e["event_type"] == "OFFICER_DECISION"]
    assert len(officer_events) == 1
    event = officer_events[0]
    assert "MARK_INCONCLUSIVE" in event["payload_summary"]
    # Ensure no raw PII or base64 images
    assert "data:image" not in event["payload_summary"]
    assert "raw_lines" not in event["payload_summary"]

