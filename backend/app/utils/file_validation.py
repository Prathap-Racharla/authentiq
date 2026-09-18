import re
import os
from typing import Tuple

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_MIME_TYPES = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"],  # RIFF....WEBP
    "application/pdf": [b"%PDF-"]
}


class FileValidationError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


def sanitize_filename(filename: str) -> str:
    """Strip directory traversal and unsafe characters from filename."""
    base = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    return clean or "uploaded_document"


def validate_file_bytes(data: bytes, original_filename: str, content_type: str = "") -> Tuple[str, str]:
    """
    Validates uploaded document:
    1. Size within limit (10 MB)
    2. Non-empty
    3. Magic byte signature match
    Returns (safe_filename, detected_mime_type)
    """
    if not data or len(data) == 0:
        raise FileValidationError("Uploaded file is empty.", "EMPTY_FILE", 400)

    if len(data) > MAX_FILE_SIZE_BYTES:
        raise FileValidationError(
            f"File size ({len(data)} bytes) exceeds the maximum allowed 10 MB limit.",
            "DOCUMENT_TOO_LARGE",
            413
        )

    # Magic byte signature sniffing
    detected_mime = None
    if data.startswith(b"\xff\xd8\xff"):
        detected_mime = "image/jpeg"
    elif data.startswith(b"\x89PNG\r\n\x1a\n"):
        detected_mime = "image/png"
    elif data.startswith(b"%PDF-"):
        detected_mime = "application/pdf"
    elif len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        detected_mime = "image/webp"

    if not detected_mime:
        raise FileValidationError(
            "Unsupported file signature. Only JPG, PNG, WebP, and PDF documents are supported.",
            "DOCUMENT_TYPE_UNSUPPORTED",
            400
        )

    safe_name = sanitize_filename(original_filename)
    return safe_name, detected_mime

