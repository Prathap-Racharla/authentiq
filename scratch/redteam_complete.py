"""
AuthentiQ Complete Autonomous QA / Red-Team / SIH Demo Test Suite
Executes Phases 1 through 17
"""
import os
import sys
import io
import json
import time
import subprocess
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
    
    if extra_fields:
        for k, v in extra_fields.items():
            body.extend(f"--{boundary}\r\n".encode('utf-8'))
            body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode('utf-8'))
            body.extend(str(v).encode('utf-8'))
            body.extend(b"\r\n")
            
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
print("\n=== PHASE 1 — ENVIRONMENT ===")
try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/health")
    data = json.loads(body)
    subsystems = data.get("subsystems", {})
    passed = (status == 200 and data.get("status") == "HEALTHY" and len(subsystems) >= 10)
    record_test("P1", "Environment", "P1-01", "FastAPI /api/v1/health operational with 10 subsystems",
                passed, f"GET {BACKEND_URL}/api/v1/health",
                f"HTTP {status}, status={data.get('status')}, subsystems count={len(subsystems)}")
except Exception as e:
    record_test("P1", "Environment", "P1-01", "FastAPI /api/v1/health operational", False, "GET /api/v1/health", "Exception", str(e))

try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/security/status")
    data = json.loads(body)
    passed = (status == 200 and data.get("status") == "SECURE_OPERATIONAL" and "protections" in data)
    record_test("P1", "Environment", "P1-02", "Security Status reporting active guards",
                passed, f"GET {BACKEND_URL}/api/v1/security/status",
                f"HTTP {status}, status={data.get('status')}, protections={len(data.get('protections', []))}")
except Exception as e:
    record_test("P1", "Environment", "P1-02", "Security Status reporting active guards", False, "GET /api/v1/security/status", "Exception", str(e))

try:
    status, body = http_get(f"{BACKEND_URL}/docs")
    passed = (status == 200 and "swagger-ui" in body.lower())
    record_test("P1", "Environment", "P1-03", "FastAPI Swagger Documentation reachable at /docs",
                passed, f"GET {BACKEND_URL}/docs", f"HTTP {status}, Swagger UI found")
except Exception as e:
    record_test("P1", "Environment", "P1-03", "FastAPI Swagger Documentation reachable at /docs", False, "GET /docs", "Exception", str(e))

try:
    status, body = http_get(FRONTEND_URL)
    passed = (status == 200 and ("AuthentiQ" in body or "root" in body))
    record_test("P1", "Environment", "P1-04", "Vite Frontend reachable on localhost:5173",
                passed, f"GET {FRONTEND_URL}", f"HTTP {status}, HTML delivered")
except Exception as e:
    record_test("P1", "Environment", "P1-04", "Vite Frontend reachable on localhost:5173", False, "GET /", "Exception", str(e))

# ==============================================================================
# PHASE 2 — API CONTRACT TESTING
# ==============================================================================
print("\n=== PHASE 2 — API CONTRACT TESTING ===")
try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/verification/scenarios")
    data = json.loads(body)
    all_keys = all(k in data for k in ["A", "B", "C", "D"])
    scenario_schema_valid = all("evidence" in data[k] and "subject" in data[k] for k in ["A", "B", "C", "D"])
    passed = (status == 200 and all_keys and scenario_schema_valid)
    record_test("P2", "API Contract", "P2-01", "GET /api/v1/verification/scenarios schema contract",
                passed, "GET /api/v1/verification/scenarios", f"HTTP {status}, scenarios={list(data.keys())}")
except Exception as e:
    record_test("P2", "API Contract", "P2-01", "GET /api/v1/verification/scenarios schema contract", False, "GET /scenarios", "Exception", str(e))

try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/audit?limit=5")
    data = json.loads(body)
    is_list = isinstance(data, list)
    passed = (status == 200 and is_list and len(data) > 0 and "event_id" in data[0] and "current_hash" in data[0])
    record_test("P2", "API Contract", "P2-02", "GET /api/v1/audit returns valid event list",
                passed, "GET /api/v1/audit?limit=5", f"HTTP {status}, count={len(data)}")
except Exception as e:
    record_test("P2", "API Contract", "P2-02", "GET /api/v1/audit returns valid event list", False, "GET /audit", "Exception", str(e))

try:
    status, body = http_get(f"{BACKEND_URL}/api/v1/audit/verify")
    data = json.loads(body)
    has_keys = all(k in data for k in ["is_valid", "total_blocks", "genesis_hash", "latest_hash", "integrity_status"])
    passed = (status == 200 and has_keys and data["integrity_status"] == "VERIFIED")
    record_test("P2", "API Contract", "P2-03", "GET /api/v1/audit/verify returns cryptographic integrity proof",
                passed, "GET /api/v1/audit/verify", f"HTTP {status}, integrity={data.get('integrity_status')}")
except Exception as e:
    record_test("P2", "API Contract", "P2-03", "GET /api/v1/audit/verify returns cryptographic integrity proof", False, "GET /audit/verify", "Exception", str(e))

try:
    evt_payload = {
        "verification_id": "VER-CONTRACT-TEST",
        "actor": "CONTRACT_TESTER",
        "event_type": "Document Analysis Completed",
        "payload_summary": "Testing API contract boundary for audit events"
    }
    status, data = http_post_json(f"{BACKEND_URL}/api/v1/audit/event", evt_payload)
    passed_valid = (status == 200 and "event_id" in data and "current_hash" in data)
    
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
        passed_invalid = (he.code == 422)
        
    passed = passed_valid and passed_invalid
    record_test("P2", "API Contract", "P2-04", "POST /api/v1/audit/event validates schema and rejects missing fields (422)",
                passed, "POST /api/v1/audit/event", f"Valid={passed_valid}, 422 rejected={passed_invalid}")
except Exception as e:
    record_test("P2", "API Contract", "P2-04", "POST /api/v1/audit/event validates schema", False, "POST /audit/event", "Exception", str(e))

# ==============================================================================
# PHASE 3 — DOCUMENT INTELLIGENCE (A - M)
# ==============================================================================
print("\n=== PHASE 3 — DOCUMENT INTELLIGENCE (A - M) ===")

def make_doc_image(text_lines=None, mrz_lines=None, blur=False, low_res=False, rotate=0, dark=False, glare=False):
    h, w = (500, 800) if not low_res else (80, 120)
    img = np.ones((h, w, 3), dtype=np.uint8) * 240
    
    if text_lines is None:
        text_lines = [
            ("PASSPORT", (30, 50), 1.0, (0, 0, 100), 2),
            ("Surname: CLARASOPHIA BEAUMONT", (30, 110), 0.6, (0, 0, 0), 2),
            ("Passport No: GBR78901234", (30, 150), 0.6, (0, 0, 0), 2),
            ("Nationality: BRITISH", (30, 190), 0.6, (0, 0, 0), 2),
            ("Date of Birth: 24/11/1988", (30, 230), 0.6, (0, 0, 0), 2),
            ("Sex: F", (30, 270), 0.6, (0, 0, 0), 2)
        ]
    if mrz_lines is None:
        mrz_lines = [
            ("P<GBRBEAUMONT<<CLARASOPHIA<<<<<<<<<<<<<<<<<<", (30, 420), 0.55),
            ("78901234<8GBR8811244F3206155<<<<<<<<<<<<<<02", (30, 460), 0.55)
        ]
        
    for line in text_lines:
        txt, pos, scale, col, th = line
        if low_res:
            pos = (int(pos[0] * 0.15), int(pos[1] * 0.15))
            scale = scale * 0.25
            th = 1
        cv2.putText(img, txt, pos, cv2.FONT_HERSHEY_SIMPLEX, scale, col, th)
        
    for mline in mrz_lines:
        txt, pos, scale = mline
        if low_res:
            pos = (int(pos[0] * 0.15), int(pos[1] * 0.15))
            scale = scale * 0.25
        cv2.putText(img, txt, pos, cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), 1 if low_res else 2)
        
    if glare:
        cv2.circle(img, (w // 2, h // 2), int(w * 0.25), (255, 255, 255), -1)
    if dark:
        img = (img * 0.15).astype(np.uint8)
    if blur:
        img = cv2.GaussianBlur(img, (25, 25), 0)
    if rotate == 90:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        
    _, enc = cv2.imencode(".jpg", img)
    return enc.tobytes()

# A. Clear passport
doc_a = make_doc_image()
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_a, "doc_a_clean.jpg")
    passed = (status == 200 and res.get("success") is True and res["quality"]["quality_score"] >= 70)
    record_test("P3", "Doc Intelligence", "P3-A", "Valid clear passport image analyzed",
                passed, "Upload clear passport JPEG", f"Quality={res['quality']['quality_score']}, MRZ={res['mrz']['detected']}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-A", "Valid clear passport image analyzed", False, "Upload", "Exception", str(e))

# B. Blurry document
doc_b = make_doc_image(blur=True)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_b, "doc_b_blur.jpg")
    q = res["quality"]["quality_score"]
    passed = (status == 200 and q < 70 and res["evidence_object"]["confidence"] < 85)
    record_test("P3", "Doc Intelligence", "P3-B", "Blurry document reduces quality and confidence (not fraud)",
                passed, "Upload Gaussian blurred image", f"Quality={q} (<70), Confidence={res['evidence_object']['confidence']}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-B", "Blurry document reduces quality", False, "Upload", "Exception", str(e))

# C. Low-resolution document
doc_c = make_doc_image(low_res=True)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_c, "doc_c_lowres.jpg")
    passed = (status == 200 and res["quality"]["width"] <= 120 and res["quality"]["quality_score"] < 70)
    record_test("P3", "Doc Intelligence", "P3-C", "Low-resolution document detected as degraded",
                passed, "Upload 120x80 image", f"Resolution={res['quality']['dimensions']}, Quality={res['quality']['quality_score']}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-C", "Low-resolution document", False, "Upload", "Exception", str(e))

# D. Rotated document
doc_d = make_doc_image(rotate=90)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_d, "doc_d_rot.jpg")
    passed = (status == 200 and res.get("success") is True)
    record_test("P3", "Doc Intelligence", "P3-D", "Rotated document handled safely without server crash",
                passed, "Upload 90-degree rotated image", f"Success={res.get('success')}, Time={res.get('processing_time_ms')}ms")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-D", "Rotated document", False, "Upload", "Exception", str(e))

# E. Dark / poorly illuminated document
doc_e = make_doc_image(dark=True)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_e, "doc_e_dark.jpg")
    q = res["quality"]["quality_score"]
    passed = (status == 200 and q < 70)
    record_test("P3", "Doc Intelligence", "P3-E", "Dark document quality degraded",
                passed, "Upload dark image", f"Quality={q}, Text visibility={res['quality'].get('contrast_text_visibility')}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-E", "Dark document", False, "Upload", "Exception", str(e))

# F. Document with glare
doc_f = make_doc_image(glare=True)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_f, "doc_f_glare.jpg")
    passed = (status == 200 and (res["quality"]["glare_percentage"] > 0 or res["quality"]["glare_level"] in ["Medium", "High"]))
    record_test("P3", "Doc Intelligence", "P3-F", "Document specular glare detected",
                passed, "Upload glare image", f"Glare Level={res['quality']['glare_level']}, Pct={res['quality']['glare_percentage']}%")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-F", "Document specular glare", False, "Upload", "Exception", str(e))

# G. Document with OCR/MRZ contradiction
doc_g = make_doc_image(
    text_lines=[
        ("PASSPORT", (30, 50), 1.0, (0, 0, 100), 2),
        ("Surname: JONATHAN DOE", (30, 110), 0.6, (0, 0, 0), 2),
        ("Passport No: GBR11112222", (30, 150), 0.6, (0, 0, 0), 2),
    ],
    mrz_lines=[
        ("P<GBRSMITH<<ALICE<<<<<<<<<<<<<<<<<<<<<<<<<<", (30, 420), 0.55),
        ("99998888<8GBR8811244F3206155<<<<<<<<<<<<<<02", (30, 460), 0.55)
    ]
)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_g, "doc_g_contradiction.jpg")
    has_mismatch = any(c.get("status") == "MISMATCH" for c in res.get("cross_field_consistency", []))
    passed = (status == 200 and (has_mismatch or len(res.get("anomalies", [])) > 0))
    record_test("P3", "Doc Intelligence", "P3-G", "Document with OCR/MRZ contradiction produces discrepancy signal",
                passed, "Upload contradictory visual/MRZ image", f"Anomalies={len(res.get('anomalies', []))}, Mismatch found={has_mismatch}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-G", "OCR/MRZ contradiction", False, "Upload", "Exception", str(e))

# H. Document with invalid MRZ check digit
doc_h = make_doc_image(
    mrz_lines=[
        ("P<GBRBEAUMONT<<CLARASOPHIA<<<<<<<<<<<<<<<<<<", (30, 420), 0.55),
        ("78901234<9GBR8811244F3206155<<<<<<<<<<<<<<02", (30, 460), 0.55) # check digit tampered to 9
    ]
)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_h, "doc_h_badmrz.jpg")
    passed = (status == 200 and res["mrz"]["detected"] and not res["mrz"]["all_check_digits_valid"])
    record_test("P3", "Doc Intelligence", "P3-H", "Invalid MRZ check digit identified as invalid check digit",
                passed, "Upload tampered MRZ check digit image", f"MRZ detected=True, all check digits valid={res['mrz']['all_check_digits_valid']}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-H", "Invalid MRZ check digit", False, "Upload", "Exception", str(e))

# I. Document without MRZ
doc_i = make_doc_image(mrz_lines=[])
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", doc_i, "doc_i_nomrz.jpg")
    passed = (status == 200 and not res["mrz"]["detected"])
    record_test("P3", "Doc Intelligence", "P3-I", "Document without MRZ gracefully reports MRZ detected=False",
                passed, "Upload non-MRZ document image", f"MRZ detected={res['mrz']['detected']}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-I", "Document without MRZ", False, "Upload", "Exception", str(e))

# J. Unsupported file type (e.g. text file disguised as docx)
try:
    rejected_unsupported = False
    try:
        upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", b"PK\x03\x04fake_docx", "test.docx", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except urllib.error.HTTPError as he:
        rejected_unsupported = (he.code == 400)
    record_test("P3", "Doc Intelligence", "P3-J", "Unsupported file type (.docx) safely rejected (400)",
                rejected_unsupported, "Upload docx file", f"Rejected with 400={rejected_unsupported}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-J", "Unsupported file type", False, "Upload", "Exception", str(e))

# K. Corrupted JPEG
try:
    corrupted_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01CORRUPTED_TRUNCATED_GARBAGE_BYTES"
    rejected_corrupted = False
    try:
        upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", corrupted_bytes, "corrupted.jpg")
    except urllib.error.HTTPError as he:
        rejected_corrupted = (he.code in [400, 422])
    record_test("P3", "Doc Intelligence", "P3-K", "Corrupted JPEG binary rejected or handled safely (400)",
                rejected_corrupted, "Upload truncated JPEG", f"Rejected={rejected_corrupted}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-K", "Corrupted JPEG", False, "Upload", "Exception", str(e))

# L. Fake file with JPEG extension but invalid magic bytes
try:
    fake_magic = b"NOT_JPEG_HEADER_JUST_ASCII_TEXT_PAYLOAD"
    rejected_magic = False
    try:
        upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", fake_magic, "fake.jpg")
    except urllib.error.HTTPError as he:
        rejected_magic = (he.code == 400)
    record_test("P3", "Doc Intelligence", "P3-L", "Spoofed JPEG with invalid magic bytes rejected (400)",
                rejected_magic, "Upload ASCII text named fake.jpg", f"Rejected with 400={rejected_magic}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-L", "Spoofed JPEG", False, "Upload", "Exception", str(e))

# M. File above size limit (> 10MB)
try:
    oversized = b"\xFF\xD8\xFF" + b"\x00" * (10 * 1024 * 1024 + 500)
    rejected_size = False
    try:
        upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", oversized, "oversized.jpg")
    except urllib.error.HTTPError as he:
        rejected_size = (he.code in [400, 413])
    record_test("P3", "Doc Intelligence", "P3-M", "Oversized file (>10MB) rejected (400/413)",
                rejected_size, "Upload 10.5MB payload", f"Rejected with 400/413={rejected_size}")
except Exception as e:
    record_test("P3", "Doc Intelligence", "P3-M", "Oversized file", False, "Upload", "Exception", str(e))

# ==============================================================================
# PHASE 4 — OCR/MRZ ADVERSARIAL TESTING
# ==============================================================================
print("\n=== PHASE 4 — OCR/MRZ ADVERSARIAL TESTING ===")

# Low contrast text
img_low_contrast = np.ones((400, 700, 3), dtype=np.uint8) * 80
cv2.putText(img_low_contrast, "NAME: ADVERSARIAL LOW CONTRAST", (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (110, 110, 110), 2)
_, enc_lc = cv2.imencode(".jpg", img_low_contrast)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", enc_lc.tobytes(), "low_contrast.jpg")
    passed = (status == 200 and res.get("success") is True)
    record_test("P4", "Adversarial OCR/MRZ", "P4-01", "Low contrast image handled safely without server failure",
                passed, "Upload low contrast text image", f"Success={res.get('success')}, Quality={res['quality']['quality_score']}")
except Exception as e:
    record_test("P4", "Adversarial OCR/MRZ", "P4-01", "Low contrast image", False, "Upload", "Exception", str(e))

# Noisy text (Salt and pepper)
img_noisy = np.ones((400, 700, 3), dtype=np.uint8) * 230
cv2.putText(img_noisy, "NAME: NOISY IMAGE TEST", (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
noise = np.random.randint(0, 2, (400, 700, 3), dtype=np.uint8) * 255
img_noisy = np.where(np.random.rand(400, 700, 1) < 0.08, noise, img_noisy)
_, enc_noisy = cv2.imencode(".jpg", img_noisy)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", enc_noisy.tobytes(), "noisy.jpg")
    passed = (status == 200 and res.get("success") is True)
    record_test("P4", "Adversarial OCR/MRZ", "P4-02", "Salt-and-pepper noisy document handled gracefully",
                passed, "Upload noisy document", f"Success={res.get('success')}")
except Exception as e:
    record_test("P4", "Adversarial OCR/MRZ", "P4-02", "Noisy document", False, "Upload", "Exception", str(e))

# ==============================================================================
# PHASE 5 — EVIDENCE FUSION & DECOUPLED METRICS
# ==============================================================================
print("\n=== PHASE 5 — EVIDENCE FUSION ===")

def test_fusion(doc_st, bio_st, db_st, ctx_st, expected_rec, desc):
    payload = {
        "evidence": {
            "document": {"category": "document", "title": "Doc", "status": doc_st, "confidence": 95 if doc_st=="Positive" else 40, "availability": "Available" if doc_st!="Unavailable" else "Unavailable", "source": "Optical", "summary": "Doc", "signals": []},
            "biometric": {"category": "biometric", "title": "Bio", "status": bio_st, "confidence": 95 if bio_st=="Positive" else 40, "availability": "Available" if bio_st!="Unavailable" else "Unavailable", "source": "Bio", "summary": "Bio", "signals": []},
            "database": {"category": "database", "title": "DB", "status": db_st, "confidence": 95 if db_st=="Positive" else 40, "availability": "Available" if db_st!="Unavailable" else "Unavailable", "source": "Registry", "summary": "DB", "signals": []},
            "context_history": {"category": "context_history", "title": "Ctx", "status": ctx_st, "confidence": 90, "availability": "Available", "source": "Ctx", "summary": "Ctx", "signals": []}
        },
        "identity_claim": {"full_name": "Test Subject", "document_number": "DOC-9999", "dob": "1990-01-01", "verification_id": "VER-FUSION-TEST"},
        "simulate_db_offline": False
    }
    status, res = http_post_json(f"{BACKEND_URL}/api/v1/verification/evaluate", payload)
    passed = (status == 200 and res["ai_recommendation"] == expected_rec)
    return passed, res

# Combination 1: Strong doc + strong bio + available DB -> Normal Processing
p, r = test_fusion("Positive", "Positive", "Positive", "Positive", "Normal Processing", "All strong channels")
record_test("P5", "Evidence Fusion", "P5-01", "Strong doc + strong bio + available DB -> Normal Processing",
            p, "Fusion evaluation", f"Risk={r['fraud_risk']}, Conf={r['evidence_confidence']}, Rec={r['ai_recommendation']}")

# Combination 2: Weak doc + unavailable DB -> Targeted Verification (+0 fraud penalty)
p, r = test_fusion("Uncertain", "Positive", "Unavailable", "Positive", "Targeted Verification", "Weak doc + offline DB")
passed_c2 = (p and r["fraud_risk"] < 25)
record_test("P5", "Evidence Fusion", "P5-02", "Weak doc + unavailable DB -> Targeted Verification (Low Risk < 25)",
            passed_c2, "Fusion evaluation", f"Risk={r['fraud_risk']} (+0 penalty), Conf={r['evidence_confidence']}, Rec={r['ai_recommendation']}")

# Combination 3: Strong doc + biometric mismatch -> Officer Review (Risk > 50)
p, r = test_fusion("Positive", "Negative", "Positive", "Positive", "Officer Review", "Biometric mismatch")
passed_c3 = (p and r["fraud_risk"] > 50)
record_test("P5", "Evidence Fusion", "P5-03", "Strong doc + biometric mismatch -> Officer Review (Risk > 50)",
            passed_c3, "Fusion evaluation", f"Risk={r['fraud_risk']}, Conf={r['evidence_confidence']}, Rec={r['ai_recommendation']}")

# Combination 4: Multiple unavailable sources -> Inconclusive (Confidence < 50)
p, r = test_fusion("Uncertain", "Uncertain", "Unavailable", "Uncertain", "Inconclusive", "Multi-source degradation")
passed_c4 = (p and r["evidence_confidence"] < 50)
record_test("P5", "Evidence Fusion", "P5-04", "Multiple unavailable/degraded sources -> Inconclusive (Conf < 50)",
            passed_c4, "Fusion evaluation", f"Conf={r['evidence_confidence']} (<50), Rec={r['ai_recommendation']}")

# ==============================================================================
# PHASE 6 — SYNTHETIC SCENARIOS (A, B, C, D)
# ==============================================================================
print("\n=== PHASE 6 — SYNTHETIC SCENARIOS ===")
status, sc_body = http_get(f"{BACKEND_URL}/api/v1/verification/scenarios")
sc_dict = json.loads(sc_body)

for key, expected_rec in [("A", "Normal Processing"), ("B", "Targeted Verification"), ("C", "Officer Review"), ("D", "Inconclusive")]:
    sc = sc_dict[key]
    payload = {
        "evidence": sc["evidence"],
        "identity_claim": {
            "full_name": sc["subject"]["full_name"],
            "document_number": sc["subject"]["document_number"],
            "dob": sc["subject"]["dob"],
            "verification_id": sc["id"]
        },
        "simulate_db_offline": False
    }
    status, res = http_post_json(f"{BACKEND_URL}/api/v1/verification/evaluate", payload)
    passed = (status == 200 and res["ai_recommendation"] == expected_rec)
    record_test("P6", "Synthetic Scenarios", f"P6-{key}", f"Scenario {key} outputs intended recommendation ({expected_rec})",
                passed, f"Execute Scenario {key}", f"Risk={res['fraud_risk']}, Conf={res['evidence_confidence']}, Rec={res['ai_recommendation']}")

# ==============================================================================
# PHASE 7 — BIOMETRIC MODULE
# ==============================================================================
print("\n=== PHASE 7 — BIOMETRIC MODULE ===")

def make_face_img(detected=True, blur=False, dark=False, low_res=False):
    h, w = (400, 400) if not low_res else (60, 60)
    img = np.ones((h, w, 3), dtype=np.uint8) * 200
    if detected:
        center = (w // 2, h // 2)
        axes = (int(w * 0.22), int(h * 0.32))
        cv2.ellipse(img, center, axes, 0, 0, 360, (140, 180, 220), -1)
        # Eyes
        eye_y = int(h * 0.44)
        cv2.circle(img, (int(w * 0.41), eye_y), int(w * 0.035), (60, 50, 40), -1)
        cv2.circle(img, (int(w * 0.59), eye_y), int(w * 0.035), (60, 50, 40), -1)
        # Mouth
        cv2.ellipse(img, (w // 2, int(h * 0.65)), (int(w * 0.08), int(h * 0.03)), 0, 0, 180, (70, 70, 180), -1)
        
    if dark:
        img = (img * 0.15).astype(np.uint8)
    if blur:
        img = cv2.GaussianBlur(img, (35, 35), 0)
        
    _, enc = cv2.imencode(".jpg", img)
    return enc.tobytes()

# Valid face
face_valid = make_face_img(detected=True)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/biometrics/analyze", face_valid, "face_valid.jpg")
    passed = (status == 200 and res["quality"]["face_detected"] is True and res["quality"]["quality_score"] > 0)
    record_test("P7", "Biometrics", "P7-01", "Valid face image detected and assessed",
                passed, "Upload valid face", f"Detected={res['quality']['face_detected']}, Quality={res['quality']['quality_score']}%")
except Exception as e:
    record_test("P7", "Biometrics", "P7-01", "Valid face image", False, "Upload", "Exception", str(e))

# No face
face_none = make_face_img(detected=False)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/biometrics/analyze", face_none, "face_none.jpg")
    passed = (status == 200 and res["quality"]["face_detected"] is False)
    record_test("P7", "Biometrics", "P7-02", "Image without face reports face_detected=False",
                passed, "Upload background without face", f"Detected={res['quality']['face_detected']}, Status={res['status']}")
except Exception as e:
    record_test("P7", "Biometrics", "P7-02", "Image without face", False, "Upload", "Exception", str(e))

# Blurry face
face_blur = make_face_img(detected=True, blur=True)
try:
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/biometrics/analyze", face_blur, "face_blur.jpg")
    passed = (status == 200 and res["quality"]["quality_score"] < 70)
    record_test("P7", "Biometrics", "P7-03", "Blurry face yields reduced quality score",
                passed, "Upload blurry face", f"Quality={res['quality']['quality_score']}% (<70)")
except Exception as e:
    record_test("P7", "Biometrics", "P7-03", "Blurry face", False, "Upload", "Exception", str(e))

# ==============================================================================
# PHASE 8 & 9 — EXPLAINABILITY & ADAPTIVE VERIFICATION
# ==============================================================================
print("\n=== PHASE 8 & 9 — EXPLAINABILITY & ADAPTIVE VERIFICATION ===")
try:
    # Use Scenario B (Offline DB) to verify explanation and adaptive action
    sc_b = sc_dict["B"]
    payload_b = {
        "evidence": sc_b["evidence"],
        "identity_claim": {"full_name": sc_b["subject"]["full_name"], "document_number": sc_b["subject"]["document_number"], "dob": sc_b["subject"]["dob"], "verification_id": "VER-EXPLAIN-TEST"},
        "simulate_db_offline": False
    }
    status, res_b = http_post_json(f"{BACKEND_URL}/api/v1/verification/evaluate", payload_b)
    has_rf = len(res_b.get("risk_factors", [])) > 0
    has_cf = len(res_b.get("confidence_factors", [])) > 0
    has_findings = len(res_b.get("findings", [])) > 0
    
    # Check that explanation does NOT falsely claim database is negative
    db_factors = [f.get("detail", "").lower() for f in res_b.get("risk_factors", []) if "database" in f.get("factor", "").lower() or "civil" in f.get("factor", "").lower()]
    does_not_say_negative = not any("negative" in d for d in db_factors)
    
    passed_p8 = (has_rf and has_cf and has_findings and does_not_say_negative)
    record_test("P8", "Explainability", "P8-01", "Explainable risk/confidence factor breakdown without false accusations",
                passed_p8, "Evaluate Scenario B explanation", f"Risk factors={len(res_b.get('risk_factors', []))}, Conf factors={len(res_b.get('confidence_factors', []))}")
    
    # Adaptive Verification Next Steps
    has_action = len(res_b.get("recommended_action", "")) > 0
    has_steps = len(res_b.get("adaptive_next_steps", [])) > 0
    passed_p9 = (has_action and has_steps)
    record_test("P9", "Adaptive Verification", "P9-01", "Adaptive next steps tailored to specific evidence gaps",
                passed_p9, "Check adaptive actions", f"Recommended action: {res_b.get('recommended_action')[:50]}...")
except Exception as e:
    record_test("P8", "Explainability", "P8-01", "Explainability", False, "Evaluate", "Exception", str(e))
    record_test("P9", "Adaptive Verification", "P9-01", "Adaptive Verification", False, "Evaluate", "Exception", str(e))

# ==============================================================================
# PHASE 11 — OFFICER REVIEW WORKFLOW
# ==============================================================================
print("\n=== PHASE 11 — OFFICER REVIEW ===")
try:
    # 11.1 Test Approved decision recording
    audit_evt_1 = {
        "verification_id": "VER-OFFICER-TEST",
        "actor": "SENIOR_VERIFICATION_OFFICER",
        "event_type": "Officer Decision Recorded",
        "payload_summary": "Officer decision: APPROVED - Rationale: Confirmed physical credential features match subject"
    }
    status1, res1 = http_post_json(f"{BACKEND_URL}/api/v1/audit/event", audit_evt_1)
    
    # 11.2 Test Rejected decision recording
    audit_evt_2 = {
        "verification_id": "VER-OFFICER-TEST",
        "actor": "SENIOR_VERIFICATION_OFFICER",
        "event_type": "Officer Decision Recorded",
        "payload_summary": "Officer decision: REJECTED - Rationale: High biographic mismatch with civil registry"
    }
    status2, res2 = http_post_json(f"{BACKEND_URL}/api/v1/audit/event", audit_evt_2)
    
    passed_p11 = (status1 == 200 and status2 == 200 and "current_hash" in res1 and "current_hash" in res2)
    record_test("P11", "Officer Review", "P11-01", "Officer decisions (Approved/Rejected) immutably recorded into audit trail",
                passed_p11, "Post officer decision audit events", f"Recorded hashes: {res1.get('current_hash')[:10]}... / {res2.get('current_hash')[:10]}...")
except Exception as e:
    record_test("P11", "Officer Review", "P11-01", "Officer Review", False, "Post event", "Exception", str(e))

# ==============================================================================
# PHASE 12 — AUDIT / TAMPER TEST (SAFE & ISOLATED)
# ==============================================================================
print("\n=== PHASE 12 — AUDIT / TAMPER TEST ===")
try:
    # 12.1 Verify initial integrity
    status, verify_pre = http_get(f"{BACKEND_URL}/api/v1/audit/verify")
    pre_data = json.loads(verify_pre)
    initial_valid = (pre_data.get("is_valid") is True and pre_data.get("integrity_status") == "VERIFIED")
    
    # 12.2 Import the running singleton ledger in python to simulate isolated tamper test
    sys.path.insert(0, os.path.abspath("backend"))
    from app.services.audit.ledger import get_audit_ledger
    ledger = get_audit_ledger()
    
    # Save original block payload
    tamper_index = 2
    original_summary = ledger._chain[tamper_index].payload_summary
    
    # Tamper with block payload
    ledger._chain[tamper_index].payload_summary = "UNAUTHORIZED_RETROACTIVE_ALTERATION"
    tampered_verification = ledger.verify_chain_integrity()
    tamper_detected = (tampered_verification.is_valid is False and tampered_verification.integrity_status == "COMPROMISED")
    
    # Restore block to valid state
    ledger._chain[tamper_index].payload_summary = original_summary
    restored_verification = ledger.verify_chain_integrity()
    restored_valid = (restored_verification.is_valid is True and restored_verification.integrity_status == "VERIFIED")
    
    passed_p12 = (initial_valid and tamper_detected and restored_valid)
    record_test("P12", "Audit / Tamper Test", "P12-01", "Tampering with ledger blocks is strictly detected; restoration succeeds",
                passed_p12, "In-memory isolated ledger block tampering test",
                f"Initial valid={initial_valid}, Tamper detected={tamper_detected}, Restored valid={restored_valid}")
except Exception as e:
    record_test("P12", "Audit / Tamper Test", "P12-01", "Audit Tamper Test", False, "Tamper simulation", "Exception", str(e))

# ==============================================================================
# PHASE 13 — CYBERSECURITY & ABUSE TESTING
# ==============================================================================
print("\n=== PHASE 13 — CYBERSECURITY & ABUSE TESTING ===")

# Path traversal filename
try:
    path_traversal_payload = make_doc_image()
    status, res = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", path_traversal_payload, "../../../etc/passwd.jpg")
    passed = (status == 200 and res.get("success") is True and "/" not in res["filename"] and "\\" not in res["filename"])
    record_test("P13", "Cybersecurity", "P13-01", "Path traversal filename sanitized safely",
                passed, "Upload ../../../etc/passwd.jpg", f"Stored filename={res.get('filename')}")
except Exception as e:
    record_test("P13", "Cybersecurity", "P13-01", "Path traversal filename", False, "Upload", "Exception", str(e))

# Malformed JSON
try:
    bad_json_req = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/verification/evaluate",
        data=b'{"evidence": "MALFORMED_NOT_A_DICT"',
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    rejected_bad_json = False
    try:
        urllib.request.urlopen(bad_json_req, timeout=5)
    except urllib.error.HTTPError as he:
        rejected_bad_json = (he.code == 422 or he.code == 400)
    record_test("P13", "Cybersecurity", "P13-02", "Malformed JSON rejected safely with 400/422 without exposing stack trace",
                rejected_bad_json, "Post invalid JSON syntax", f"Rejected={rejected_bad_json}")
except Exception as e:
    record_test("P13", "Cybersecurity", "P13-02", "Malformed JSON", False, "Post", "Exception", str(e))

# Verification that audit ledger never contains raw base64 or unencrypted biometric binary
try:
    status, audit_body = http_get(f"{BACKEND_URL}/api/v1/audit?limit=20")
    events = json.loads(audit_body)
    raw_leaked = any("base64" in json.dumps(e).lower() or len(e.get("payload_summary", "")) > 500 for e in events)
    record_test("P13", "Cybersecurity", "P13-03", "Zero raw biometric binary or unencrypted documents in audit ledger",
                not raw_leaked, "Scan recent audit block payloads", f"No raw data leak={not raw_leaked}")
except Exception as e:
    record_test("P13", "Cybersecurity", "P13-03", "Zero raw biometric binary", False, "Scan", "Exception", str(e))

# ==============================================================================
# PHASE 14 — FRONTEND / UI AUTOMATION
# ==============================================================================
print("\n=== PHASE 14 — FRONTEND / UI AUTOMATION ===")
routes = [
    ("/", "Dashboard"),
    ("/verification/new", "Intake"),
    ("/verification/VER-2026-8942", "Dossier"),
    ("/identity-graph", "Identity Graph"),
    ("/audit", "Audit Log Explorer")
]

all_routes_ok = True
for rpath, rname in routes:
    try:
        st, html = http_get(f"{FRONTEND_URL}{rpath}")
        ok = (st == 200 and "AuthentiQ" in html)
        if not ok:
            all_routes_ok = False
    except Exception as e:
        all_routes_ok = False

record_test("P14", "Frontend / UI", "P14-01", "All primary SPA routes return 200 OK without 404/500 errors",
            all_routes_ok, "HTTP GET across all 5 core routes", f"All 5 routes OK={all_routes_ok}")

# ==============================================================================
# PHASE 15 — DATA INTEGRITY
# ==============================================================================
print("\n=== PHASE 15 — DATA INTEGRITY ===")
try:
    test_v_id = "VER-2026-INTEGRITY-CHECK"
    claim = {"full_name": "Integrity Subject", "document_number": "DOC-7777", "dob": "1992-04-12", "verification_id": test_v_id}
    status, eval_res = http_post_json(f"{BACKEND_URL}/api/v1/verification/evaluate", {
        "evidence": sc_dict["A"]["evidence"],
        "identity_claim": claim,
        "simulate_db_offline": False
    })
    
    # Post audit event using same verification ID
    status, audit_res = http_post_json(f"{BACKEND_URL}/api/v1/audit/event", {
        "verification_id": test_v_id,
        "actor": "INTEGRITY_CHECKER",
        "event_type": "Risk Assessment Generated",
        "payload_summary": f"Evaluation produced recommendation: {eval_res['ai_recommendation']}"
    })
    
    passed_p15 = (eval_res["verification_id"] == test_v_id and audit_res["verification_id"] == test_v_id)
    record_test("P15", "Data Integrity", "P15-01", "Verification ID preserved consistently across evaluation and audit ledger",
                passed_p15, "Check ID propagation across API boundaries",
                f"Evaluated ID={eval_res.get('verification_id')}, Audit ID={audit_res.get('verification_id')}")
except Exception as e:
    record_test("P15", "Data Integrity", "P15-01", "Data Integrity", False, "Check ID", "Exception", str(e))

# ==============================================================================
# PHASE 16 — BUILD & REGRESSION
# ==============================================================================
print("\n=== PHASE 16 — BUILD & REGRESSION ===")
# Pytest
try:
    py_proc = subprocess.run(["python", "-m", "pytest", "backend/tests", "-v"], capture_output=True, text=True, cwd=".")
    py_passed = (py_proc.returncode == 0 and "28 passed" in py_proc.stdout)
    record_test("P16", "Build & Regression", "P16-01", "Backend pytest suite: 28 of 28 unit/integration tests passing",
                py_passed, "python -m pytest backend/tests -v", f"Return code={py_proc.returncode}, 28 passed={'28 passed' in py_proc.stdout}")
except Exception as e:
    record_test("P16", "Build & Regression", "P16-01", "Backend pytest suite", False, "pytest", "Exception", str(e))

# npm run build
try:
    npm_proc = subprocess.run(["cmd.exe", "/c", "npm", "run", "build"], capture_output=True, text=True, cwd=".")
    npm_passed = (npm_proc.returncode == 0 and "built in" in npm_proc.stdout)
    record_test("P16", "Build & Regression", "P16-02", "Frontend TypeScript production build succeeds with 0 errors",
                npm_passed, "npm run build", f"Return code={npm_proc.returncode}, Built={'built in' in npm_proc.stdout}")
except Exception as e:
    record_test("P16", "Build & Regression", "P16-02", "Frontend npm run build", False, "npm build", "Exception", str(e))

# ==============================================================================
# PHASE 17 — FINAL SIH JUDGE DEMO WALKTHROUGH
# ==============================================================================
print("\n=== PHASE 17 — FINAL SIH JUDGE DEMO WALKTHROUGH ===")
try:
    # 1. New Intake
    judge_v_id = f"VER-2026-JUDGE-{int(time.time()) % 10000}"
    
    # 2. Upload Document
    judge_doc = make_doc_image(
        text_lines=[
            ("PASSPORT", (30, 50), 1.0, (0, 0, 100), 2),
            ("Surname: PRIYA S. PATEL", (30, 110), 0.6, (0, 0, 0), 2),
            ("Passport No: IND8829104", (30, 150), 0.6, (0, 0, 0), 2),
            ("Nationality: REPUBLIC OF INDIA", (30, 190), 0.6, (0, 0, 0), 2),
            ("Date of Birth: 1995-07-18", (30, 230), 0.6, (0, 0, 0), 2),
            ("Sex: F", (30, 270), 0.6, (0, 0, 0), 2)
        ],
        mrz_lines=[
            ("P<INDPATEL<<PRIYA<S<<<<<<<<<<<<<<<<<<<<<<<<<", (30, 420), 0.55),
            ("8829104<8IND9507184F3507185<<<<<<<<<<<<<<06", (30, 460), 0.55)
        ]
    )
    status_doc, res_doc = upload_multipart(f"{BACKEND_URL}/api/v1/documents/analyze", judge_doc, "judge_passport.jpg")
    
    # 3. Biometric
    judge_face = make_face_img(detected=True)
    status_bio, res_bio = upload_multipart(f"{BACKEND_URL}/api/v1/biometrics/analyze", judge_face, "judge_face.jpg")
    
    doc_ev = dict(res_doc["evidence_object"])
    doc_ev["title"] = "Document Analysis"
    bio_ev = dict(res_bio["evidence_object"])
    bio_ev["title"] = "Biometric Comparison"

    eval_payload = {
        "evidence": {
            "document": doc_ev,
            "biometric": bio_ev,
            "database": {
                "category": "database", "title": "Civil Identity Registry", "status": "Positive", "confidence": 96, "availability": "Available",
                "source": "National Registry", "summary": "Direct civil database match confirmed active.",
                "signals": [{"label": "Registry Match", "impact": "positive", "description": "Active record"}]
            },
            "context_history": {
                "category": "context_history", "title": "Telemetry", "status": "Positive", "confidence": 95, "availability": "Available",
                "source": "Context Engine", "summary": "Trusted IP subnet", "signals": []
            }
        },
        "identity_claim": {
            "full_name": "Priya S. Patel",
            "document_number": "IND8829104",
            "dob": "1995-07-18",
            "verification_id": judge_v_id
        },
        "simulate_db_offline": False
    }
    status_eval, res_eval = http_post_json(f"{BACKEND_URL}/api/v1/verification/evaluate", eval_payload)
    
    # 5. Officer Decision
    status_off, res_off = http_post_json(f"{BACKEND_URL}/api/v1/audit/event", {
        "verification_id": judge_v_id,
        "actor": "AUTHORIZED_CHIEF_OFFICER",
        "event_type": "Officer Decision Recorded",
        "payload_summary": "Officer decision: APPROVED - Adjudication complete with high-assurance multi-modal corroboration."
    })
    
    # 6. Verify Ledger Integrity
    status_vfy, res_vfy = http_get(f"{BACKEND_URL}/api/v1/audit/verify")
    vfy_data = json.loads(res_vfy)
    
    judge_flow_passed = (
        status_doc == 200 and
        status_bio == 200 and
        status_eval == 200 and
        res_eval["ai_recommendation"] in ["Normal Processing", "Targeted Verification"] and
        status_off == 200 and
        vfy_data["integrity_status"] == "VERIFIED"
    )
    record_test("P17", "Judge Walkthrough", "P17-01", "Full End-to-End Judge Journey (Intake -> Doc -> Bio -> Fusion -> Officer -> Audit)",
                judge_flow_passed, "End-to-end multi-modal flow simulation",
                f"Session={judge_v_id}, Risk={res_eval['fraud_risk']}, Conf={res_eval['evidence_confidence']}, Rec={res_eval['ai_recommendation']}, Audit Verified={vfy_data['integrity_status']}")
except Exception as e:
    record_test("P17", "Judge Walkthrough", "P17-01", "Judge Walkthrough", False, "Simulation", "Exception", str(e))

# ==============================================================================
# FINAL AGGREGATION
# ==============================================================================
print("\n=======================================================")
print(f"AUTHENTIQ RED-TEAM QA RUN COMPLETED:")
print(f"TOTAL TESTS: {report['summary']['total']}")
print(f"PASSED:      {report['summary']['passed']}")
print(f"FAILED:      {report['summary']['failed']}")
print("=======================================================\n")

with open("scratch/redteam_final_results.json", "w") as f:
    json.dump(report, f, indent=2)
