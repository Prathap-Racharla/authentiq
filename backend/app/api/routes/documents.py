from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

from app.schemas.document import DocumentAnalysisResponse
from app.utils.file_validation import validate_file_bytes, FileValidationError
from app.services.document.pipeline import DocumentIntelligencePipeline

router = APIRouter(prefix="/documents", tags=["Document Intelligence"])
pipeline = DocumentIntelligencePipeline()


@router.post(
    "/analyze",
    response_model=DocumentAnalysisResponse,
    summary="Analyze Identity Document",
    description=(
        "Accepts a synthetic identity document image (JPG, PNG, WebP) or PDF (up to 10 MB). "
        "Executes file validation, image quality inspection, OCR text extraction, structured field parsing, "
        "MRZ check digit validation, cross-field consistency checks, anomaly signal generation, and produces "
        "a standardized AuthentiQ Document Evidence Object."
    ),
    responses={
        200: {"description": "Document analysis successfully completed"},
        400: {"description": "Invalid file format or validation failure"},
        413: {"description": "Uploaded file exceeds 10 MB limit"},
        500: {"description": "Document processing pipeline failure"}
    }
)
async def analyze_document(
    file: UploadFile = File(..., description="Identity document image or PDF file")
):
    try:
        data = await file.read()
        safe_filename, detected_mime = validate_file_bytes(
            data=data,
            original_filename=file.filename or "uploaded_document",
            content_type=file.content_type or ""
        )

        response = pipeline.analyze(
            data=data,
            filename=safe_filename,
            mime_type=detected_mime
        )
        return response

    except FileValidationError as fve:
        raise HTTPException(
            status_code=fve.status_code,
            detail={"error": fve.code, "message": fve.message}
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "DOCUMENT_PARSING_ERROR", "message": str(ve)}
        )
    except Exception as exc:
        # Never log raw document contents or real PII
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "DOCUMENT_ANALYSIS_UNAVAILABLE",
                "message": "Document intelligence pipeline encountered an internal execution error."
            }
        )


@router.post(
    "/analyze-dataset/{doc_id}",
    response_model=DocumentAnalysisResponse,
    summary="Directly Analyze Synthetic Dataset Document",
    description="Loads a synthetic dataset document directly on the server by ID and executes verification with in-memory caching for sub-100ms response."
)
async def analyze_dataset_document(doc_id: str):
    try:
        return pipeline.analyze_dataset_id(doc_id)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "DATASET_DOC_NOT_FOUND", "message": str(ve)}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "DOCUMENT_ANALYSIS_UNAVAILABLE",
                "message": f"Dataset document analysis failed: {str(exc)}"
            }
        )


