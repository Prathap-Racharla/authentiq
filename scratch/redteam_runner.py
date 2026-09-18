"""
AuthentiQ Autonomous Red-Team & QA Test Runner
Phases 1 - 13
"""
import os
import sys
import io
import json
import time
import urllib.request
import urllib.error
import cv2
import numpy as np

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5173"

report = {
    "phases": {},
    "summary": {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "fixed": 0,
        "remaining": 0
    },
    "details": []
}

def record_test(phase_id, phase_name, test_id, description, passed, method, result_detail, error=None):
    if phase_id not in report["phases"]:
        report["phases"][phase_id] = {
            "name": phase_name,
            "total": 0,
            "passed": 0,
            "failed": 0,
            "tests": []
        }
    
    report["summary"]["total"] += 1
    report["phases"][phase_id]["total"] += 1
    
    if passed:
        report["summary"]["passed"] += 1
        report["phases"][phase_id]["passed"] += 1
        status = "PASS"
    else:
        report["summary"]["failed"] += 1
        report["phases"][phase_id]["failed"] += 1
        status = "FAIL"
        
    test_entry = {
        "phase": phase_id,
        "test_id": test_id,
        "description": description,
        "status": status,
        "method": method,
        "result": result_detail,
        "error": error
    }
    report["phases"][phase_id]["tests"].append(test_entry)
    report["details"].append(test_entry)
    
    prefix = f"[{status}] Phase {phase_id} | {test_id}: {description}"
    print(f"{prefix} -> {result_detail}")
    if error:
        print(f"       ERROR: {error}")

def http_get(url, timeout=10):
    req = urllib.request.Request(url, headers={"User-Agent": "AuthentiQ-RedTeam/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.read().decode('utf-8')

def http_post_json(url, payload, timeout=10):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "AuthentiQ-RedTeam/1.0"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def upload_multipart(url, file_bytes, filename, field_name="file", content_type="image/jpeg", extra_fields=None, timeout=15):
    boundary = "----WebKitFormBoundaryAuthentiQRedTeam999"
    body = bytearray()
    
    # Extra fields
    if extra_fields:
        for k, v in extra_fields.items():
            body.extend(f"--{boundary}\r\n".encode('utf-8'))
            body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode('utf-8'))
            body.extend(str(v).encode('utf-8'))
            body.extend(b"\r\n")
            
    # File field
    body.extend(f"--{boundary}\r\n".encode('utf-8'))
    body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode('utf-8'))
    body.extend(f'Content-Type: {content_type}\r\n\r\n'.encode('utf-8'))
    body.extend(file_bytes)
    body.extend(f"\r\n--{boundary}--\r\n".encode('utf-8'))
    
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
        "User-Agent": "AuthentiQ-RedTeam/1.0"
    }
    req = urllib.request.Request(url, data=bytes(body), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

# ==============================================================================
# PHASE 1 — ENVIRONMENT
# ==============================================================================
print("\n--- RUNNING PHASE 1: ENVIRONMENT ---")
# 1.1 Backend Health
try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/health")
    data = json.loads(body)
    subsystems = data.get("subsystems", {})
    passed = (status == 200 and data.get("status") == "HEALTHY" and len(subsystems) >= 10)
    record_test("P1", "Environment", "P1-01", "FastAPI /api/v1/health operational with 10 subsystems",
                passed, f"GET {BACKEND_URL}/api/v1/health",
                f"HTTP {status}, status={data.get('status')}, subsystems count={len(subsystems)}")
except Exception as e:
    record_test("P1", "Environment", "P1-01", "FastAPI /api/v1/health operational", False, "GET /api/v1/health", "Exception occurred", str(e))

# 1.2 Security Status
try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/security/status")
    data = json.loads(body)
    passed = (status == 200 and data.get("status") == "SECURE_OPERATIONAL" and "protections" in data)
    record_test("P1", "Environment", "P1-02", "Security Status reporting active cybersecurity guards",
                passed, f"GET {BACKEND_URL}/api/v1/security/status",
                f"HTTP {status}, status={data.get('status')}, protections={len(data.get('protections', []))}")
except Exception as e:
    record_test("P1", "Environment", "P1-02", "Security Status reporting active cybersecurity guards", False, "GET /api/v1/security/status", "Exception occurred", str(e))

# 1.3 Swagger Docs
try:
    status, body = http_get(f"{BACKEND_URL}/docs")
    passed = (status == 200 and "swagger-ui" in body.lower())
    record_test("P1", "Environment", "P1-03", "FastAPI Swagger Documentation reachable at /docs",
                passed, f"GET {BACKEND_URL}/docs",
                f"HTTP {status}, Swagger UI HTML present")
except Exception as e:
    record_test("P1", "Environment", "P1-03", "FastAPI Swagger Documentation reachable at /docs", False, "GET /docs", "Exception occurred", str(e))

# 1.4 Frontend Reachability
try:
    status, body = http_get(FRONTEND_URL)
    passed = (status == 200 and ("AuthentiQ" in body or "root" in body))
    record_test("P1", "Environment", "P1-04", "Vite Frontend reachable on localhost:5173",
                passed, f"GET {FRONTEND_URL}",
                f"HTTP {status}, SPA HTML shell delivered")
except Exception as e:
    record_test("P1", "Environment", "P1-04", "Vite Frontend reachable on localhost:5173", False, "GET /", "Exception occurred", str(e))

# ==============================================================================
# PHASE 2 — API CONTRACT TESTING
# ==============================================================================
print("\n--- RUNNING PHASE 2: API CONTRACT TESTING ---")

# 2.1 GET /api/v1/verification/scenarios contract
try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/verification/scenarios")
    data = json.loads(body)
    all_keys = all(k in data for k in ["A", "B", "C", "D"])
    scenario_schema_valid = all("evidence" in data[k] and "subject" in data[k] for k in ["A", "B", "C", "D"])
    passed = (status == 200 and all_keys and scenario_schema_valid)
    record_test("P2", "API Contract", "P2-01", "GET /api/v1/verification/scenarios schema contract",
                passed, "GET /api/v1/verification/scenarios",
                f"HTTP {status}, scenarios keys={list(data.keys())}, schema valid={scenario_schema_valid}")
except Exception as e:
    record_test("P2", "API Contract", "P2-01", "GET /api/v1/verification/scenarios schema contract", False, "GET /api/v1/verification/scenarios", "Exception occurred", str(e))

# 2.2 GET /api/v1/audit contract
try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/audit?limit=5")
    data = json.loads(body)
    is_list = isinstance(data, list)
    passed = (status == 200 and is_list and len(data) > 0 and "event_id" in data[0] and "current_hash" in data[0])
    record_test("P2", "API Contract", "P2-02", "GET /api/v1/audit returns valid event list",
                passed, "GET /api/v1/audit?limit=5",
                f"HTTP {status}, items={len(data)}, sample event_id={data[0].get('event_id') if data else 'None'}")
except Exception as e:
    record_test("P2", "API Contract", "P2-02", "GET /api/v1/audit returns valid event list", False, "GET /api/v1/audit", "Exception occurred", str(e))

# 2.3 GET /api/v1/audit/verify contract
try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/audit/verify")
    data = json.loads(body)
    has_keys = all(k in data for k in ["is_valid", "total_blocks", "genesis_hash", "latest_hash", "integrity_status"])
    passed = (status == 200 and has_keys and data["integrity_status"] == "VERIFIED")
    record_test("P2", "API Contract", "P2-03", "GET /api/v1/audit/verify returns cryptographic integrity proof",
                passed, "GET /api/v1/audit/verify",
                f"HTTP {status}, integrity={data.get('integrity_status')}, blocks={data.get('total_blocks')}")
except Exception as e:
    record_test("P2", "API Contract", "P2-03", "GET /api/v1/audit/verify returns cryptographic integrity proof", False, "GET /api/v1/audit/verify", "Exception occurred", str(e))

# 2.4 POST /api/v1/audit/event contract & boundary checks
try:
    # Valid event
    evt_payload = {
        "verification_id": "VER-CONTRACT-TEST",
        "actor": "CONTRACT_TESTER",
        "event_type": "Document Analysis Completed",
        "payload_summary": "Testing API contract boundary for audit events"
    }
    status, data = http_post_json(f"{BACKEND_URL}/api/v1/audit/event", evt_payload)
    passed_valid = (status == 200 and "event_id" in data and "current_hash" in data)
    
    # Missing required field
    bad_req = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/audit/event",
        data=json.dumps({"actor": "MissingFields"}).encode('utf-8'),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        urllib.request.urlopen(bad_req, timeout=5)
        passed_invalid = False
    except urllib.error.HTTPError as he:
        passed_invalid = (he.code == 422) # FastAPI validation error
        
    passed = passed_valid and passed_invalid
    record_test("P2", "API Contract", "P2-04", "POST /api/v1/audit/event validates schema and rejects missing fields (422)",
                passed, "POST /api/v1/audit/event with valid and invalid payloads",
                f"Valid status={status}, Invalid correctly rejected with 422={passed_invalid}")
except Exception as e:
    record_test("P2", "API Contract", "P2-04", "POST /api/v1/audit/event validates schema", False, "POST /api/v1/audit/event", "Exception occurred", str(e))

# 2.5 POST /api/v1/verification/evaluate boundary check
try:
    # Empty payload
    empty_req = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/verification/evaluate",
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        urllib.request.urlopen(empty_req, timeout=5)
        eval_rejected = False
    except urllib.error.HTTPError as he:
        eval_rejected = (he.code == 422)
        
    record_test("P2", "API Contract", "P2-05", "POST /api/v1/verification/evaluate rejects empty body (422)",
                eval_rejected, "POST /api/v1/verification/evaluate with {}",
                f"Empty payload rejected with 422={eval_rejected}")
except Exception as e:
    record_test("P2", "API Contract", "P2-05", "POST /api/v1/verification/evaluate rejects empty body", False, "POST /api/v1/verification/evaluate", "Exception occurred", str(e))

# Save progress
with open("scratch/redteam_progress.json", "w") as f:
    json.dump(report, f, indent=2)

print("\nPhase 1 & Phase 2 Complete. Moving to Phase 3 & Phase 4...")

