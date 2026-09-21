import io
import cv2
import numpy as np
from PIL import Image
import fitz  # PyMuPDF
from typing import Tuple, List

from app.schemas.document import QualityAssessment
from app.models.document import ProcessedImage


def render_pdf_first_page(pdf_bytes: bytes) -> bytes:
    """Render the first page of a PDF document to a high-resolution PNG image."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if len(doc) == 0:
        raise ValueError("PDF contains no pages.")
    page = doc.load_page(0)
    # 200 DPI gives clean optical resolution for OCR
    pix = page.get_pixmap(dpi=200)
    img_bytes = pix.tobytes("png")
    doc.close()
    return img_bytes


def prepare_image(data: bytes, mime_type: str) -> ProcessedImage:
    """Validate and convert input (PDF or Image) into a ProcessedImage."""
    is_pdf = mime_type == "application/pdf"
    if is_pdf:
        img_bytes = render_pdf_first_page(data)
    else:
        img_bytes = data

    # Read dimensions and verify integrity
    try:
        pil_img = Image.open(io.BytesIO(img_bytes))
        pil_img.load()
        width, height = pil_img.size

        # Auto-clamp oversized mobile camera photos (e.g. 4032x3024) to max 1920px
        # to ensure fast OpenCV quality checks and sub-second OCR inference
        MAX_DIM = 1920
        if max(width, height) > MAX_DIM:
            scale = MAX_DIM / max(width, height)
            new_w = int(round(width * scale))
            new_h = int(round(height * scale))
            pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            width, height = new_w, new_h

            # Re-encode image bytes
            buf = io.BytesIO()
            if pil_img.mode in ("RGBA", "LA", "P"):
                pil_img.save(buf, format="PNG")
            else:
                if pil_img.mode != "RGB":
                    pil_img = pil_img.convert("RGB")
                pil_img.save(buf, format="JPEG", quality=90)
            img_bytes = buf.getvalue()

    except Exception as e:
        raise ValueError(f"Corrupted or unreadable image stream: {e}")

    return ProcessedImage(
        image_bytes=img_bytes,
        width=width,
        height=height,
        format=pil_img.format or "PNG",
        source_was_pdf=is_pdf
    )


def assess_document_quality(image_bytes: bytes) -> QualityAssessment:
    """
    Perform local image quality inspection:
    - Actual pixel dimensions (e.g. 1280 × 800)
    - Blur via Laplacian variance
    - Glare via over-saturated pixel ratio
    - Contrast and text visibility via intensity distribution
    - Document boundary detection via contour analysis
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            pil_img.load()
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            raise ValueError(f"Cannot decode image binary: {e}")

    height, width = img.shape[:2]
    dimensions_str = f"{width} × {height}"

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Blur Detection (Laplacian variance)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if blur_score >= 110.0:
        blur_level = "Low"
    elif blur_score >= 45.0:
        blur_level = "Medium"
    else:
        blur_level = "High"

    # 2. Glare Detection (True specular washout: pixels >= 254 with bleached local gradient)
    lap = np.abs(cv2.Laplacian(gray, cv2.CV_64F))
    # Specular glare is saturated white with bleached details
    specular_glare = (gray >= 253) & (lap < 5.0)
    glare_percentage = float(np.sum(specular_glare) / gray.size) * 100.0
    if glare_percentage < 3.0:
        glare_level = "Low"
    elif glare_percentage < 8.0:
        glare_level = "Medium"
    else:
        glare_level = "High"

    # 3. Contrast / Text Visibility
    contrast_std = float(np.std(gray))
    if contrast_std >= 48.0:
        contrast_text_visibility = "Good"
    elif contrast_std >= 25.0:
        contrast_text_visibility = "Fair"
    else:
        contrast_text_visibility = "Poor"

    # 4. Document Boundary Detection
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 40, 140)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    total_area = float(width * height)
    boundaries_detected = False
    if contours:
        largest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        if area >= (0.15 * total_area):
            boundaries_detected = True

    # Compute overall quality score (0 - 100)
    score = 100.0

    # Resolution penalty
    if width < 800 or height < 500:
        score -= 20.0
    elif width < 1000 or height < 600:
        score -= 8.0

    # Blur penalty
    if blur_level == "High":
        score -= 30.0
    elif blur_level == "Medium":
        score -= 12.0

    # Glare penalty
    if glare_level == "High":
        score -= 25.0
    elif glare_level == "Medium":
        score -= 10.0

    # Contrast penalty
    if contrast_text_visibility == "Poor":
        score -= 20.0
    elif contrast_text_visibility == "Fair":
        score -= 8.0

    if not boundaries_detected:
        score -= 5.0

    score = max(10.0, min(99.0, round(score, 1)))

    signals: List[str] = []
    if score >= 80.0:
        signals.append(f"Resolution: Sufficient ({dimensions_str})")
        signals.append(f"Blur: {blur_level} (variance: {round(blur_score, 1)})")
        signals.append(f"Glare: {glare_level}")
        signals.append(f"Text Visibility: {contrast_text_visibility}")
        if boundaries_detected:
            signals.append("Document Boundaries: Detected")
        status = "Positive"
    else:
        # Quality issue detected -> status UNCERTAIN (never 'Fraud')
        status = "UNCERTAIN"
        if blur_level == "High":
            signals.append("Significant motion blur detected in document capture")
        elif blur_level == "Medium":
            signals.append("Moderate optical blur detected")
        
        if glare_level == "High":
            signals.append(f"High surface glare reflection detected ({round(glare_percentage, 1)}% area)")
        elif glare_level == "Medium":
            signals.append("Mild surface glare reflection detected")
            
        if contrast_text_visibility == "Poor":
            signals.append("Low contrast between text and document background")
            
        signals.append(f"Resolution: {dimensions_str}")

    return QualityAssessment(
        image_quality_score=score,
        quality_score=score,
        dimensions=dimensions_str,
        width=width,
        height=height,
        blur_level=blur_level,
        blur_score=round(blur_score, 2),
        glare_level=glare_level,
        glare_percentage=round(glare_percentage, 2),
        contrast_text_visibility=contrast_text_visibility,
        document_boundaries_detected=boundaries_detected,
        status=status,
        signals=signals
    )
