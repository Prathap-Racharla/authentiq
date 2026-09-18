from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form
from typing import Optional

from app.schemas.biometric import BiometricAnalysisResponse
from app.utils.file_validation import validate_file_bytes, FileValidationError
from app.services.biometric.provider import get_biometric_provider

router = APIRouter(prefix="/biometrics", tags=["Biometric Verification"])


@router.post(
    "/analyze",
    response_model=BiometricAnalysisResponse,
    summary="Analyze Biometric Face Capture",
    description=(
        "Accepts a live facial capture image (JPG, PNG, WebP) and evaluates optical sharpness, "
        "illumination level, face presence, and calculates Biometric Match Score (0-100). "
        "Strictly obeys AuthentiQ Decoupled Metric Principle: poor image quality lowers confidence "
        "without declaring fraud (+0 fraud risk). Raw images are never permanently stored."
    ),
    responses={
        200: {"description": "Biometric analysis successfully completed"},
        400: {"description": "Invalid file format or validation failure"},
        413: {"description": "Uploaded image exceeds 10 MB limit"}
    }
)
async def analyze_biometric(
    file: UploadFile = File(..., description="Live face image capture"),
    reference_file: Optional[UploadFile] = File(None, description="Optional reference portrait from document")
):
    try:
        data = await file.read()
        safe_filename, detected_mime = validate_file_bytes(
            data=data,
            original_filename=file.filename or "live_capture.jpg",
            content_type=file.content_type or ""
        )

        ref_data = None
        if reference_file:
            ref_raw = await reference_file.read()
            if len(ref_raw) > 0:
                _, _ = validate_file_bytes(
                    data=ref_raw,
                    original_filename=reference_file.filename or "reference.jpg",
                    content_type=reference_file.content_type or ""
                )
                ref_data = ref_raw

        provider = get_biometric_provider()
        response = provider.analyze_face(
            image_bytes=data,
            filename=safe_filename,
            reference_bytes=ref_data
        )
        return response

    except FileValidationError as fve:
        raise HTTPException(
            status_code=fve.status_code,
            detail={"error": fve.code, "message": fve.message}
        )
    except Exception:
        # Never leak internal exceptions or raw biometric buffers
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "BIOMETRIC_ANALYSIS_ERROR",
                "message": "Biometric analysis engine encountered a temporary execution error."
            }
        )

