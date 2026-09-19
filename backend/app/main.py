from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import documents, biometrics, verification, audit, security, dataset

app = FastAPI(
    title="AuthentiQ — AI-Based Identity Assurance Platform API",
    description=(
        "FastAPI Backend, Document Intelligence Pipeline, Biometric Verification, Evidence Fusion, "
        "and Tamper-Evident Audit Ledger for Smart India Hackathon 2026 (Blockchain & Cybersecurity Track). "
        "Strictly enforces Decoupled Metric Law (Fraud Risk 0-100 vs Evidence Confidence 0-100) and AI Decision-Support."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local development with Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(documents.router, prefix="/api/v1")
app.include_router(biometrics.router, prefix="/api/v1")
app.include_router(verification.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(security.router, prefix="/api/v1")
app.include_router(dataset.router, prefix="/api/v1")


import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

@app.get("/api/v1/info", tags=["System"])
def system_info():
    return {
        "platform": "AuthentiQ AI-Based Identity Assurance Platform",
        "release": "Complete SIH 2026 Prototype v1.0",
        "hackathon": "Smart India Hackathon 2026",
        "track": "Blockchain & Cybersecurity",
        "status": "SYSTEM OPERATIONAL",
        "documentation": "/docs"
    }


@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "subsystems": {
            "document_intelligence": "OPERATIONAL",
            "ocr_engine": "OPERATIONAL",
            "mrz_engine": "OPERATIONAL",
            "quality_engine": "OPERATIONAL",
            "biometric_verification": "OPERATIONAL",
            "evidence_fusion": "OPERATIONAL",
            "database_simulation": "OPERATIONAL",
            "context_telemetry": "OPERATIONAL",
            "audit_ledger": "OPERATIONAL",
            "cybersecurity_guards": "ACTIVE"
        }
    }


DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dist"))

if os.path.isdir(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json"]:
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        target = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse({"detail": "Not Found"}, status_code=404)
else:
    @app.get("/", tags=["System"])
    def root():
        return system_info()


