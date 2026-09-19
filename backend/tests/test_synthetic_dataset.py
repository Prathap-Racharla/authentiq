import os
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.services.document.pipeline import DocumentIntelligencePipeline, detect_document_type
from app.schemas.document import DocumentAnalysisResponse

client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = REPO_ROOT / "dataset"
METADATA_PATH = DATASET_ROOT / "metadata" / "dataset.json"


def test_dataset_json_exists_and_valid():
    """Verify dataset.json exists and conforms to schema with 12 items."""
    assert METADATA_PATH.is_file(), f"Missing dataset.json at {METADATA_PATH}"
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "documents" in data
    assert len(data["documents"]) == 12
    assert data["total_documents"] == 12
    assert "safety_notice" in data

    categories = {d["category"] for d in data["documents"]}
    assert categories == {"passport", "aadhaar", "driving_licence", "voter_id"}

    for doc in data["documents"]:
        assert "id" in doc
        assert "title" in doc
        assert "file_path" in doc
        assert "synthetic_identity" in doc
        assert "expected_pipeline_behavior" in doc
        assert "tamper_type" in doc
        assert "demonstrates" in doc


def test_all_12_document_image_files_exist():
    """Verify each of the 12 documents in dataset.json has a corresponding file on disk."""
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for doc in data["documents"]:
        rel_path = doc["file_path"]
        abs_path = DATASET_ROOT / rel_path
        assert abs_path.is_file(), f"Missing synthetic document image: {abs_path}"
        assert abs_path.stat().st_size > 1000, f"File {abs_path} appears empty or truncated"


def test_api_list_dataset():
    """Test GET /api/v1/dataset returns full catalog."""
    resp = client.get("/api/v1/dataset")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_documents"] == 12
    assert len(data["documents"]) == 12


def test_api_get_document_metadata():
    """Test GET /api/v1/dataset/{id} for valid and invalid IDs."""
    resp = client.get("/api/v1/dataset/PASS-001")
    assert resp.status_code == 200
    doc = resp.json()
    assert doc["id"] == "PASS-001"
    assert doc["category"] == "passport"

    # Case insensitivity
    resp_lower = client.get("/api/v1/dataset/aad-001")
    assert resp_lower.status_code == 200
    assert resp_lower.json()["id"] == "AAD-001"

    # Not found
    resp_404 = client.get("/api/v1/dataset/NONEXISTENT-999")
    assert resp_404.status_code == 404


def test_api_get_document_file():
    """Test GET /api/v1/dataset/{id}/file returns image/png bytes."""
    resp = client.get("/api/v1/dataset/PASS-001/file")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert len(resp.content) > 1000


def test_detect_document_type_logic():
    """Verify document type detection function distinguishes credential types."""
    assert detect_document_type("PASSPORT OF UTOPIA P<UTO", "pass_001.png", True) == "PASSPORT"
    assert detect_document_type("GOVERNMENT OF INDIA AADHAAR 9182 3746 5019", "aad_001.png", False) == "AADHAAR_STYLE"
    assert detect_document_type("DRIVING LICENCE UNION OF INDIA MCWG LMV", "dl_001.png", False) == "DRIVING_LICENCE"
    assert detect_document_type("ELECTION COMMISSION OF INDIA ELECTOR IDENTITY CARD", "vot_001.png", False) == "VOTER_ID"


def test_pipeline_on_clean_passport():
    """Verify PASS-001 passes through real pipeline with MRZ valid and LOW_RISK profile."""
    pass_file = DATASET_ROOT / "documents" / "passport" / "pass_001.png"
    pipeline = DocumentIntelligencePipeline()
    with open(pass_file, "rb") as f:
        data = f.read()

    res = pipeline.analyze(data, "pass_001.png", "image/png")
    assert res.success is True
    assert res.document_type == "PASSPORT"
    assert res.mrz.applicable is True
    assert res.mrz.detected is True
    assert res.mrz.all_check_digits_valid is True
    assert res.evidence_object.status == "Positive"


def test_pipeline_on_mrz_mismatch_passport():
    """Verify PASS-002 check digit discrepancy is flagged as high anomaly."""
    pass_file = DATASET_ROOT / "documents" / "passport" / "pass_002.png"
    pipeline = DocumentIntelligencePipeline()
    with open(pass_file, "rb") as f:
        data = f.read()

    res = pipeline.analyze(data, "pass_002.png", "image/png")
    assert res.success is True
    assert res.document_type == "PASSPORT"
    assert res.mrz.applicable is True
    assert res.mrz.detected is True
    # Should flag check digit mismatch
    assert res.mrz.all_check_digits_valid is False
    assert any("SIG-MRZ-CHK" in a.signal_id for a in res.anomalies)


def test_pipeline_on_aadhaar_not_applicable_mrz():
    """Verify AAD-001 correctly sets MRZ: Not Applicable with zero penalty."""
    aad_file = DATASET_ROOT / "documents" / "aadhaar" / "aad_001.png"
    pipeline = DocumentIntelligencePipeline()
    with open(aad_file, "rb") as f:
        data = f.read()

    res = pipeline.analyze(data, "aad_001.png", "image/png")
    assert res.success is True
    assert res.document_type == "AADHAAR_STYLE"
    assert res.mrz.applicable is False
    assert res.mrz.mrz_type == "Not Applicable"
    # Consistency check should record NOT_APPLICABLE
    assert any(c.status == "NOT_APPLICABLE" for c in res.consistency)
    # Evidence object should not report failure
    assert res.evidence_object.status == "Positive"


def test_pipeline_on_expired_driving_licence():
    """Verify DL-002 detects expired validity date and flags validity anomaly."""
    dl_file = DATASET_ROOT / "documents" / "driving_licence" / "dl_002.png"
    pipeline = DocumentIntelligencePipeline()
    with open(dl_file, "rb") as f:
        data = f.read()

    res = pipeline.analyze(data, "dl_002.png", "image/png")
    assert res.success is True
    assert res.document_type == "DRIVING_LICENCE"
    assert res.mrz.applicable is False
    # Check expiry consistency item indicates expired
    exp_items = [c for c in res.consistency if c.comparison == "Expiry Date Validity"]
    assert len(exp_items) > 0
    assert exp_items[0].status == "MISMATCH"
    assert any(a.signal_id == "SIG-VAL-EXPIRED" for a in res.anomalies)


def test_pipeline_on_voter_id_clean():
    """Verify VOT-001 parses without MRZ requirement and succeeds."""
    vot_file = DATASET_ROOT / "documents" / "voter_id" / "vot_001.png"
    pipeline = DocumentIntelligencePipeline()
    with open(vot_file, "rb") as f:
        data = f.read()

    res = pipeline.analyze(data, "vot_001.png", "image/png")
    assert res.success is True
    assert res.document_type == "VOTER_ID"
    assert res.mrz.applicable is False
    assert res.mrz.mrz_type == "Not Applicable"

