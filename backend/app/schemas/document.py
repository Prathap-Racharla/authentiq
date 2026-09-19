from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class QualityAssessment(BaseModel):
    image_quality_score: float = Field(..., description="Overall image quality score 0-100")
    quality_score: float = Field(..., description="Overall image quality score 0-100 (alias for image_quality_score)")
    dimensions: str = Field(..., description="Actual pixel dimensions e.g. 1280 × 800")
    width: int
    height: int
    blur_level: str = Field(..., description="'Low', 'Medium', or 'High'")
    blur_score: float
    glare_level: str = Field(..., description="'Low', 'Medium', or 'High'")
    glare_percentage: float
    contrast_text_visibility: str = Field(..., description="'Good', 'Fair', or 'Poor'")
    document_boundaries_detected: bool
    status: str = Field(..., description="'Positive' or 'UNCERTAIN'")
    signals: List[str] = Field(default_factory=list)


class StructuredField(BaseModel):
    field: str
    label: str
    value: str
    confidence: float
    source: str = "Visual Inspection Zone (VIZ)"
    source_region: Optional[Dict[str, Any]] = None


class MRZCheckDigitResult(BaseModel):
    field_name: str
    value: str
    expected_check_digit: str
    computed_check_digit: str
    is_valid: bool


class MRZResult(BaseModel):
    detected: bool
    applicable: bool = True
    mrz_type: Optional[str] = None  # 'TD1', 'TD2', 'TD3', or 'Not Applicable'
    raw_lines: List[str] = Field(default_factory=list)
    parsed_fields: Dict[str, str] = Field(default_factory=dict)
    check_digits: List[MRZCheckDigitResult] = Field(default_factory=list)
    all_check_digits_valid: bool = False


class CrossFieldConsistencyItem(BaseModel):
    comparison: str
    ocr_value: Optional[str] = None
    mrz_value: Optional[str] = None
    status: str  # 'MATCH', 'MISMATCH', 'UNAVAILABLE'
    explanation: str


class DocumentAnomalySignal(BaseModel):
    signal_id: str
    category: str  # 'integrity', 'quality', 'consistency', 'security'
    severity: str  # 'informational', 'low', 'medium', 'high'
    confidence: float
    description: str
    risk_contribution: str = "+0 fraud risk"


class EvidenceSignal(BaseModel):
    label: str
    impact: str  # 'positive', 'risk', 'lowers_confidence', 'neutral'
    description: str


class DocumentEvidenceObject(BaseModel):
    category: str = "document"
    status: str  # 'Positive', 'Uncertain', 'Unavailable', 'Negative'
    confidence: int  # 0 - 100
    availability: str  # 'Available', 'Degraded', 'Offline'
    source: str
    last_checked: str
    summary: str
    signals: List[EvidenceSignal] = Field(default_factory=list)


class DocumentAnalysisResponse(BaseModel):
    success: bool
    document_id: str
    document_type: str = "UNKNOWN"
    filename: str
    mime_type: str
    processing_time_ms: float
    quality: QualityAssessment
    ocr_raw_text: str
    structured_fields: List[StructuredField]
    mrz: MRZResult
    consistency: List[CrossFieldConsistencyItem]
    anomalies: List[DocumentAnomalySignal]
    evidence_object: DocumentEvidenceObject
    warnings: List[str] = Field(default_factory=list)
    dataset_match: bool = False
    dataset_id: Optional[str] = None

