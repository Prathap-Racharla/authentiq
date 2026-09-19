# ==============================================================================
# AuthentiQ — Multi-Stage Production Dockerfile
# Stage 1: Build Frontend SPA
# Stage 2: Unified Python FastAPI Runtime with Static File Serving
# ==============================================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Production Python Backend ---
FROM python:3.11-slim AS production

# Install system utilities needed for image processing & networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend ./backend

# Copy built frontend assets from Stage 1 into /app/dist
COPY --from=frontend-builder /app/dist ./dist

# Security: non-root user
RUN useradd -m -u 1001 authentiq && chown -R authentiq:authentiq /app
USER authentiq

# Expose single unified port
EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Start Uvicorn serving both Backend API (/api/v1) and Frontend SPA (/)
CMD ["python", "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]

