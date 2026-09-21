import json
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter(prefix="/dataset", tags=["Synthetic Dataset"])


def get_dataset_root() -> Path:
    """Find the root directory of the synthetic demonstration dataset."""
    env_dir = os.getenv("AUTHENTIQ_DATASET_DIR")
    if env_dir and os.path.isdir(env_dir):
        return Path(env_dir)

    candidates = [
        Path(__file__).resolve().parents[4] / "dataset",  # Repository root
        Path(__file__).resolve().parents[3] / "dataset",
        Path.cwd() / "dataset",
        Path.cwd().parent / "dataset",
        Path("/app/dataset"),
    ]
    for c in candidates:
        if c.is_dir():
            return c

    return candidates[0]


def load_dataset_metadata() -> Dict[str, Any]:
    """Load and parse dataset/metadata/dataset.json."""
    dataset_root = get_dataset_root()
    metadata_path = dataset_root / "metadata" / "dataset.json"
    if not metadata_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset metadata file not found at " + str(metadata_path)
        )
    with open(metadata_path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get(
    "",
    summary="List Synthetic Demonstration Documents",
    description="Returns the full catalog of 12 synthetic demonstration documents with metadata, ground truth, and expected behaviors."
)
def list_dataset():
    data = load_dataset_metadata()
    return data


@router.get(
    "/{doc_id}",
    summary="Get Synthetic Document Metadata",
    description="Returns metadata, ground truth, and expected behavior for a single synthetic document ID (e.g. PASS-001, AAD-001, DL-001, VOT-001)."
)
def get_document_metadata(doc_id: str):
    data = load_dataset_metadata()
    normalized_id = doc_id.upper().strip()
    for doc in data.get("documents", []):
        if doc.get("id", "").upper() == normalized_id:
            return doc
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Document '{doc_id}' not found in demonstration dataset."
    )


@router.get(
    "/{doc_id}/file",
    summary="Download Synthetic Document Image",
    description="Returns the synthetic document image PNG file for analysis by the AuthentiQ pipeline."
)
def get_document_file(doc_id: str):
    data = load_dataset_metadata()
    normalized_id = doc_id.upper().strip()
    matched_doc: Optional[Dict[str, Any]] = None
    for doc in data.get("documents", []):
        if doc.get("id", "").upper() == normalized_id:
            matched_doc = doc
            break

    if not matched_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{doc_id}' not found in demonstration dataset."
        )

    dataset_root = get_dataset_root()
    relative_file_path = matched_doc.get("file_path", "")
    full_path = dataset_root / relative_file_path

    if not full_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image file for '{doc_id}' not found at {full_path}"
        )

    return FileResponse(
        path=str(full_path),
        media_type="image/png",
        filename=f"{doc_id.lower()}.png"
    )

