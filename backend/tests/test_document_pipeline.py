import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import fitz

from app.main import app
from app.utils.file_validation import validate_file_bytes, FileValidationError, MAX_FILE_SIZE_BYTES
from app.services.document.mrz import calculate_check_digit, process_mrz
from app.services.document.preprocessing import assess_document_quality, prepare_image
from app.services.document.ocr import UnavailableOCRProvider, SyntheticTemplateOCRProvider
from app.services.document.pipeline import DocumentIntelligencePipeline
from app.services.document.consistency import check_consistency
from app.schemas.document import StructuredField, MRZResult, MRZCheckDigitResult

client = TestClient(app)


def make_test_jpeg_bytes() -> bytes:
    img = Image.new("RGB", (800, 600), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((50, 50), "AUTHENTIQ DEMO TEST PASSPORT", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ---------------------------------------------------------
# Test 1: Valid JPEG
# ---------------------------------------------------------
def test_valid_jpeg():
    """Verify acceptance and proper MIME signature detection for JPEG images."""
    jpeg_bytes = make_test_jpeg_bytes()
    filename, mime = validate_file_bytes(jpeg_bytes, "passport.jpg", "image/jpeg")
    assert mime == "image/jpeg"
    assert filename.endswith(".jpg")


# ---------------------------------------------------------
# Test 2: Invalid MIME/Signature
# ---------------------------------------------------------
def test_invalid_mime_signature():
    """Verify rejection of files with invalid/spoofed magic bytes."""
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00FakeWindowsExecutable"
    with pytest.raises(FileValidationError) as exc:
        validate_file_bytes(fake_exe, "identity_doc.png", "image/png")
    assert exc.value.code == "DOCUMENT_TYPE_UNSUPPORTED"
    assert exc.value.status_code == 400


# ---------------------------------------------------------
# Test 3: Oversized File
# ---------------------------------------------------------
def test_oversized_file():
    """Verify rejection of files exceeding the 10 MB payload limit."""
    oversized = b"\xff\xd8\xff" + b"X" * (MAX_FILE_SIZE_BYTES + 1024)
    with pytest.raises(FileValidationError) as exc:
        validate_file_bytes(oversized, "giant_document.jpg")
    assert exc.value.code == "DOCUMENT_TOO_LARGE"
    assert exc.value.status_code == 413


# ---------------------------------------------------------
# Test 4: Sharp Image Quality
# ---------------------------------------------------------
def test_sharp_image():
    """Verify sharp document has low blur level and high quality score."""
    with open("backend/demo_samples/clean_passport_demo.png", "rb") as f:
        clean_bytes = f.read()

    quality = assess_document_quality(clean_bytes)
    assert quality.blur_level == "Low"
    assert quality.image_quality_score >= 80.0
    assert quality.quality_score >= 80.0
    assert quality.status == "Positive"


# ---------------------------------------------------------
# Test 5: Blurry Image Quality
# ---------------------------------------------------------
def test_blurry_image():
    """Verify heavily blurred image lowers confidence without declaring fraud."""
    with open("backend/demo_samples/degraded_glare_demo.png", "rb") as f:
        degraded_bytes = f.read()

    quality = assess_document_quality(degraded_bytes)
    assert quality.blur_level in ["Medium", "High"]
    assert quality.status == "UNCERTAIN"

    # In pipeline, poor quality must yield Uncertain status + Degraded availability + +0 fraud risk
    pipeline = DocumentIntelligencePipeline()
    res = pipeline.analyze(degraded_bytes, "degraded_glare_demo.png", "image/png")
    assert res.evidence_object.status == "Uncertain"
    assert any("+0 fraud risk" in a.risk_contribution for a in res.anomalies if a.category == "quality")


# ---------------------------------------------------------
# Test 6: Glare Detection
# ---------------------------------------------------------
def test_glare_image():
    """Verify specular glare reflection detection."""
    # Construct an image with a specular glare hot-spot
    img = Image.new("RGB", (600, 400), color=(100, 100, 100))
    draw = ImageDraw.Draw(img)
    # Paint high-luminosity washed-out patch (> 15% area)
    draw.rectangle([100, 100, 400, 300], fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")

    quality = assess_document_quality(buf.getvalue())
    assert quality.glare_percentage > 5.0
    assert quality.glare_level in ["Medium", "High"]


# ---------------------------------------------------------
# Test 7: Valid MRZ Check Digit
# ---------------------------------------------------------
def test_valid_mrz_check_digit():
    """Verify ICAO 9303 7-3-1 check digit calculation for valid data."""
    # DOB: 960512 -> 9*7 + 6*3 + 0*1 + 5*7 + 1*3 + 2*1 = 63+18+0+35+3+2 = 121 % 10 = 1
    cd = calculate_check_digit("960512")
    assert cd == "1"

    # Verify standard valid TD3 line
    valid_td3_line2 = "98124019<8IND9605121M3002094<<<<<<<<<<<<<<<6"
    lines = ["P<INDNAIR<<SIDDHARTH<R<<<<<<<<<<<<<<<<<<<<<<", valid_td3_line2]
    res = process_mrz(lines)
    assert res.detected is True
    assert res.all_check_digits_valid is True


# ---------------------------------------------------------
# Test 8: Invalid MRZ Check Digit
# ---------------------------------------------------------
def test_invalid_mrz_check_digit():
    """Verify corrupt MRZ check digit results in an anomaly signal."""
    # Corrupt the DOB check digit from 1 to 9
    corrupted_td3_line2 = "98124019<8IND9605129M3002094<<<<<<<<<<<<<<<6"
    lines = ["P<INDNAIR<<SIDDHARTH<R<<<<<<<<<<<<<<<<<<<<<<", corrupted_td3_line2]
    res = process_mrz(lines)
    assert res.detected is True
    assert res.all_check_digits_valid is False
    # Identify the failing field
    failed_cd = next(cd for cd in res.check_digits if cd.field_name == "Date of Birth")
    assert failed_cd.is_valid is False
    assert failed_cd.expected_check_digit == "9"
    assert failed_cd.computed_check_digit == "1"


# ---------------------------------------------------------
# Test 9: OCR / MRZ Match
# ---------------------------------------------------------
def test_ocr_mrz_match():
    """Verify consistency engine flags matching visual zone and MRZ fields as MATCH."""
    fields = [
        StructuredField(field="full_name", label="Full Name", value="SIDDHARTH R NAIR", confidence=95.0, source="VIZ"),
        StructuredField(field="date_of_birth", label="Date of Birth", value="1996-05-12", confidence=95.0, source="VIZ"),
        StructuredField(field="document_number", label="Document Number", value="98124019", confidence=95.0, source="VIZ"),
        StructuredField(field="expiry_date", label="Expiry Date", value="2030-02-09", confidence=95.0, source="VIZ"),
    ]
    mrz = MRZResult(
        detected=True,
        mrz_type="TD3",
        raw_lines=["P<INDNAIR<<SIDDHARTH<R<<<<<<<<<<<<<<<<<<<<<<", "98124019<8IND9605121M3002094<<<<<<<<<<<<<<<6"],
        parsed_fields={
            "full_name": "SIDDHARTH R NAIR",
            "date_of_birth": "1996-05-12",
            "document_number": "98124019",
            "expiry_date": "2030-02-09"
        },
        check_digits=[],
        all_check_digits_valid=True
    )
    consistency = check_consistency(fields, mrz)
    assert all(c.status == "MATCH" for c in consistency)


# ---------------------------------------------------------
# Test 10: OCR / MRZ Mismatch
# ---------------------------------------------------------
def test_ocr_mrz_mismatch():
    """Verify consistency engine detects contradictory fields as MISMATCH."""
    fields = [
        StructuredField(field="full_name", label="Full Name", value="SIDDHARTH R NAIR", confidence=95.0, source="VIZ"),
        StructuredField(field="date_of_birth", label="Date of Birth", value="1996-05-12", confidence=95.0, source="VIZ"),
        StructuredField(field="document_number", label="Document Number", value="98124019", confidence=95.0, source="VIZ"),
    ]
    # MRZ encodes a different date of birth: 1994-08-14
    mrz = MRZResult(
        detected=True,
        mrz_type="TD3",
        raw_lines=["P<INDNAIR<<SIDDHARTH<R<<<<<<<<<<<<<<<<<<<<<<", "98124019<8IND9408149M3002094<<<<<<<<<<<<<<<2"],
        parsed_fields={
            "full_name": "SIDDHARTH R NAIR",
            "date_of_birth": "1994-08-14",
            "document_number": "98124019",
        },
        check_digits=[],
        all_check_digits_valid=False
    )
    consistency = check_consistency(fields, mrz)
    dob_check = next(c for c in consistency if "DOB" in c.comparison)
    assert dob_check.status == "MISMATCH"


# ---------------------------------------------------------
# Test 11: Unavailable OCR
# ---------------------------------------------------------
def test_unavailable_ocr():
    """
    Verify that when OCR is unavailable:
    - status = Uncertain
    - availability = Degraded
    - does not fabricate text
    - contributes +0 fraud risk
    """
    with open("backend/demo_samples/clean_passport_demo.png", "rb") as f:
        data = f.read()

    pipeline = DocumentIntelligencePipeline(ocr_provider=UnavailableOCRProvider())
    res = pipeline.analyze(data, "clean_passport_demo.png", "image/png")

    assert res.success is True
    assert res.ocr_raw_text == ""
    assert res.structured_fields == []
    assert res.mrz.detected is False
    assert res.evidence_object.status == "Uncertain"
    assert res.evidence_object.availability == "Degraded"
    # Contributes +0 fraud risk
    assert any("+0 fraud risk" in a.risk_contribution for a in res.anomalies)


# ---------------------------------------------------------
# Test 12: Complete Pipeline Response
# ---------------------------------------------------------
def test_complete_pipeline_response():
    """Verify full POST /api/v1/documents/analyze endpoint responds conforming to schema."""
    with open("backend/demo_samples/clean_passport_demo.png", "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/v1/documents/analyze",
        files={"file": ("clean_passport_demo.png", file_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "document_id" in data
    assert "processing_time_ms" in data
    assert data["quality"]["image_quality_score"] >= 80.0
    assert len(data["structured_fields"]) >= 4
    # Check all fields have value, confidence, source
    for sf in data["structured_fields"]:
        assert "value" in sf
        assert "confidence" in sf
        assert "source" in sf
    assert data["mrz"]["detected"] is True
    assert data["evidence_object"]["source"] == "Document Intelligence Pipeline"
    assert data["evidence_object"]["status"] in ["Positive", "Uncertain"]
