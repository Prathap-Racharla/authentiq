from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class BoundingBox:
    x: int
    y: int
    w: int
    h: int


@dataclass
class OCRToken:
    text: str
    confidence: float
    bbox: Optional[BoundingBox] = None


@dataclass
class RawOCRResult:
    text: str
    tokens: List[OCRToken] = field(default_factory=list)
    confidence: float = 0.0
    detected_lines: List[str] = field(default_factory=list)
    engine_name: str = "BaseOCR"


@dataclass
class ProcessedImage:
    image_bytes: bytes
    width: int
    height: int
    format: str
    source_was_pdf: bool = False

