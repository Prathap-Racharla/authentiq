import json
import urllib.request

BASE_BACKEND = "http://127.0.0.1:8000"

req = urllib.request.urlopen(f"{BASE_BACKEND}/api/v1/verification/scenarios")
scenarios = json.loads(req.read().decode('utf-8'))

for key in ["A", "B", "C", "D"]:
    sc = scenarios[key]
    eval_payload = {
        "evidence": sc["evidence"],
        "identity_claim": {
            "full_name": sc["subject"]["full_name"],
            "document_number": sc["subject"]["document_number"],
            "dob": sc["subject"]["dob"],
            "verification_id": sc["id"]
        },
        "simulate_db_offline": False
    }
    eval_req = urllib.request.Request(
        f"{BASE_BACKEND}/api/v1/verification/evaluate",
        data=json.dumps(eval_payload).encode('utf-8'),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    eval_res = json.loads(urllib.request.urlopen(eval_req).read().decode('utf-8'))
    print(f"Scenario {key} ({sc['name'][:30]}...):")
    print(f"  Risk: {eval_res['fraud_risk']}, Conf: {eval_res['evidence_confidence']}")
    print(f"  AI Recommendation: {eval_res['ai_recommendation']}")
    print(f"  Action: {eval_res['recommended_action'][:60]}...")
    print(f"  Risk Factors: {len(eval_res['risk_factors'])}, Conf Factors: {len(eval_res['confidence_factors'])}, Findings: {len(eval_res['findings'])}")

