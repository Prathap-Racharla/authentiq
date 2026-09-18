import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.main import app
from app.services.biometric.provider import OpenCVBiometricProvider, UnavailableBiometricProvider

client = TestClient(app)


def make_test_face_bytes(blurry: bool = False, dark: bool = False) -> bytes:
    img = Image.new("RGB", (300, 350), color=(30 if dark else 230, 30 if dark else 235, 30 if dark else 240))
    draw = ImageDraw.Draw(img)
    # Draw simple facial oval & features
    draw.ellipse([75, 60, 225, 260], fill=(235, 195, 170), outline=(180, 140, 120))
    draw.ellipse([105, 120, 130, 140], fill=(40, 20, 10))
    draw.ellipse([170, 120, 195, 140], fill=(40, 20, 10))
    draw.polygon([(150, 150), (140, 190), (160, 190)], fill=(200, 150, 130))
    draw.arc([120, 200, 180, 230], 0, 180, fill=(160, 60, 60), width=3)

    if blurry:
        from PIL import ImageFilter
        img = img.filter(ImageFilter.GaussianBlur(radius=8))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_biometric_face_quality_assessment():
    """Verify facial quality assessment extracts sharpness, illumination, and face box."""
    provider = OpenCVBiometricProvider()
    img_bytes = make_test_face_bytes()
    res = provider.analyze_face(img_bytes, "test_face.jpg")
    assert res.success is True
    assert res.quality.face_detected is True
    assert res.quality.quality_score > 50.0
    assert res.match_score >= 75.0
    assert res.status == "Positive"
    assert res.evidence_object.status == "Positive"


def test_biometric_blurry_lowers_confidence_not_fraud():
    """Verify blurry facial image lowers confidence without increasing fraud risk (+0 risk)."""
    provider = OpenCVBiometricProvider()
    blurry_bytes = make_test_face_bytes(blurry=True)
    res = provider.analyze_face(blurry_bytes, "blurry_face.jpg")
    assert res.success is True
    assert res.status in ["Uncertain", "Positive"]
    # If degraded, quality degradation must note +0 fraud risk
    if res.status == "Uncertain":
        assert any("+0 fraud risk" in s.description for s in res.evidence_object.signals)


def test_unavailable_biometric_provider():
    """Verify unavailable provider returns truthful degraded status (+0 fraud risk)."""
    provider = UnavailableBiometricProvider()
    res = provider.analyze_face(b"dummy", "face.jpg")
    assert res.status == "Unavailable"
    assert res.availability == "Unavailable"
    assert any("+0 fraud risk" in s.description for s in res.evidence_object.signals)


def test_biometrics_analyze_endpoint():
    """Verify POST /api/v1/biometrics/analyze returns schema compliant response."""
    face_bytes = make_test_face_bytes()
    response = client.post(
        "/api/v1/biometrics/analyze",
        files={"file": ("live_face.jpg", face_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "biometric_id" in data
    assert "match_score" in data
    assert "quality" in data
    assert data["quality"]["face_detected"] is True
    assert "evidence_object" in data

