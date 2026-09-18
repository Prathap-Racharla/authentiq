import urllib.request
import urllib.parse
import json
import numpy as np
import cv2

BASE_URL = "http://127.0.0.1:8000"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}", headers={"User-Agent": "AuthentiQ-Test/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, resp.read().decode('utf-8')

def post_json(path, data):
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "AuthentiQ-Test/1.0"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def upload_multipart(path, file_bytes, filename, field_name="file", content_type="image/jpeg"):
    boundary = "----WebKitFormBoundaryAuthentiQRelCheck123"
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode('utf-8'))
    body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode('utf-8'))
    body.extend(f'Content-Type: {content_type}\r\n\r\n'.encode('utf-8'))
    body.extend(file_bytes)
    body.extend(f"\r\n--{boundary}--\r\n".encode('utf-8'))
    
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
        "User-Agent": "AuthentiQ-Test/1.0"
    }
    req = urllib.request.Request(f"{BASE_URL}{path}", data=bytes(body), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

results = {}

# 3. Verify frontend-to-backend communication
print("--- 3. Frontend-to-Backend & Static Serving ---")
s_root, b_root = get("/")
s_health, b_health = get("/api/v1/health")
health_data = json.loads(b_health)
root_ok = (s_root == 200 and '<div id="root">' in b_root and "AuthentiQ" in b_root)
health_ok = (s_health == 200 and health_data.get("status") == "HEALTHY")
results["frontend_spa_root"] = root_ok
results["backend_health"] = health_ok
print(f"  Root SPA: HTTP {s_root} (SPA HTML delivered: {root_ok})")
print(f"  API Health: HTTP {s_health} (Status: {health_data.get('status')})")

# 4. Test Biometric API
print("\n--- 4. Biometric API (/api/v1/biometrics/analyze) ---")
# Create synthetic face
img = np.ones((300, 300, 3), dtype=np.uint8) * 190
cv2.ellipse(img, (150, 150), (60, 90), 0, 0, 360, (140, 170, 210), -1)
cv2.circle(img, (125, 130), 10, (40, 40, 40), -1)
cv2.circle(img, (175, 130), 10, (40, 40, 40), -1)
cv2.ellipse(img, (150, 200), (25, 10), 0, 0, 180, (60, 60, 170), -1)
_, face_bytes = cv2.imencode(".jpg", img)

s_bio, res_bio = upload_multipart("/api/v1/biometrics/analyze", face_bytes.tobytes(), "test_face.jpg")
bio_ok = (s_bio == 200 and "quality" in res_bio and res_bio.get("success") is True)
results["biometric_api"] = bio_ok
print(f"  Biometric Analyze: HTTP {s_bio} (Quality: {res_bio['quality']['quality_score']}%, Detected: {res_bio['quality']['face_detected']})")

# 5. Test Fusion / Evaluation API
print("\n--- 5. Fusion / Evaluation API (/api/v1/verification/evaluate) ---")
s_scen, res_scen = get("/api/v1/verification/scenarios")
scen_data = json.loads(res_scen)
scen_a = scen_data["A"]

eval_payload = {
    "evidence": scen_a["evidence"],
    "identity_claim": {
        "full_name": scen_a["subject"]["full_name"],
        "document_number": scen_a["subject"]["document_number"],
        "dob": scen_a["subject"]["dob"],
        "verification_id": "VER-RELPATH-TEST"
    },
    "simulate_db_offline": False
}
s_eval, res_eval = post_json("/api/v1/verification/evaluate", eval_payload)
eval_ok = (s_eval == 200 and res_eval.get("ai_recommendation") == "Normal Processing" and res_eval.get("fraud_risk") == 5)
results["fusion_api"] = eval_ok
print(f"  Evaluation: HTTP {s_eval} (Risk: {res_eval.get('fraud_risk')}, Confidence: {res_eval.get('evidence_confidence')}, Recommendation: {res_eval.get('ai_recommendation')})")

# 6. Test Audit API
print("\n--- 6. Audit API (/api/v1/audit) ---")
s_audit_list, res_audit_list = get("/api/v1/audit")
audit_list_data = json.loads(res_audit_list)

s_event, res_event = post_json("/api/v1/audit/event", {
    "verification_id": "VER-RELPATH-TEST",
    "actor": "TEST_OFFICER",
    "event_type": "Adjudication Decision",
    "payload_summary": "Officer approved identity verification via relative API route."
})

s_verify, res_verify = get("/api/v1/audit/verify")
verify_data = json.loads(res_verify)
audit_ok = (s_audit_list == 200 and s_event == 200 and s_verify == 200 and verify_data.get("integrity_status") == "VERIFIED")
results["audit_api"] = audit_ok
print(f"  Audit List: HTTP {s_audit_list} (Count: {len(audit_list_data)})")
print(f"  Audit Append: HTTP {s_event} (Hash: {res_event.get('block', {}).get('block_hash', '')[:16]}...)")
print(f"  Audit Verify: HTTP {s_verify} (Integrity: {verify_data.get('integrity_status')})")

# 7. Verify Document API Still Works
print("\n--- 7. Document API (/api/v1/documents/analyze) ---")
# Create synthetic document
doc_img = np.ones((500, 700, 3), dtype=np.uint8) * 240
cv2.putText(doc_img, "PASSPORT", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 100), 2)
cv2.putText(doc_img, "Surname: SHARMA", (40, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
cv2.putText(doc_img, "Given Names: AARAV", (40, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
cv2.putText(doc_img, "Passport No: Z9182301", (40, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
cv2.putText(doc_img, "P<INDSHARMA<<AARAV<<<<<<<<<<<<<<<<<<<<<<<<<<<", (40, 420), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
cv2.putText(doc_img, "Z9182301<8IND9201015M3001018<<<<<<<<<<<<<<02", (40, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
_, doc_bytes = cv2.imencode(".jpg", doc_img)

s_doc, res_doc = upload_multipart("/api/v1/documents/analyze", doc_bytes.tobytes(), "test_passport.jpg")
doc_ok = (s_doc == 200 and res_doc.get("success") is True and "quality" in res_doc and res_doc["mrz"]["detected"] is True)
results["document_api"] = doc_ok
print(f"  Document Analyze: HTTP {s_doc} (Quality: {res_doc['quality']['quality_score']}, MRZ Detected: {res_doc['mrz']['detected']}, Status: {res_doc['evidence_object']['status']})")

# 8. Verify All Primary Routes
print("\n--- 8. Verify Primary Routes ---")
routes = [
    ("/", "Operations Dashboard"),
    ("/verification/new", "New Verification"),
    ("/verification/scenarios", "Benchmark Scenarios"),
    ("/verification/VER-2026-DEMO", "Dossier Detail"),
    ("/audit", "Audit Trail Explorer")
]
routes_ok = True
for r_path, r_name in routes:
    st, body = get(r_path)
    ok = (st == 200 and '<div id="root">' in body)
    print(f"  Route {r_path:30s} -> HTTP {st} (SPA delivered: {ok})")
    if not ok:
        routes_ok = False
results["primary_routes"] = routes_ok

print("\n--- SUMMARY OF RELATIVE API CHECKS ---")
all_passed = all(results.values())
print(f"ALL TESTS PASSED: {all_passed}")
for k, v in results.items():
    print(f"  {k:25s}: {'PASS' if v else 'FAIL'}")
