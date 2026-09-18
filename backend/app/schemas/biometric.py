from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BiometricQualityAssessment(BaseModel):
    sharpness_score: float = Field(..., ge=0.0, le=100.0, description="Laplacian focus score (0-100)")
    brightness: float = Field(..., ge=0.0, le=255.0, description="Average pixel luminance")
    contrast_score: float = Field(..., ge=0.0, le=100.0, description="Dynamic range spread score")
    illumination_level: str = Field(..., description="Lighting categorization: Optimal, Low, Overexposed")
    face_detected: bool = Field(..., description="Whether a valid facial region was identified")
    face_box: Optional[Dict[str, int]] = Field(None, description="Bounding coordinates x, y, w, h")
    quality_score: float = Field(..., ge=0.0, le=100.0, description="Composite biometric image quality score (0-100)")


class BiometricSignal(BaseModel):
    label: str
    impact: str = Field(..., description="positive, risk, lowers_confidence, neutral")
    description: str


class BiometricEvidenceItem(BaseModel):
    category: str = "biometric"
    title: str = "Biometric Comparison"
    status: str = Field(..., description="Positive, Negative, Uncertain, Unavailable")
    confidence: int = Field(..., ge=0, le=100)
    availability: str = Field(..., description="Available, Degraded, Unavailable")
    source: str = "Facial Geometry & Passive Liveness Pipeline"
    last_checked: str = "Just now"
    summary: str
    signals: List[BiometricSignal] = []


class BiometricAnalysisResponse(BaseModel):
    success: bool
    biometric_id: str
    filename: str
    match_score: float = Field(..., ge=0.0, le=100.0, description="Biometric Match Score (0-100)")
    quality: BiometricQualityAssessment
    status: str = Field(..., description="Positive, Negative, Uncertain, Unavailable")
    availability: str
    evidence_object: BiometricEvidenceItem
    processing_time_ms: float
    disclaimer: str = "Synthetic biometric verification prototype — not for operational civil identification."

