# AuthentiQ — Production Deployment Guide

This guide provides end-to-end instructions for deploying **AuthentiQ** across local staging, containerized environments (Docker), and production cloud platforms (Render, Railway, VPS).

---

## 1. Architecture Overview

AuthentiQ is designed with a **unified production architecture**:

```text
               CLIENT (Browser / Mobile / Judge)
                             │
                             ▼
                 HTTP:8000 / HTTPS:443
                             │
       ┌─────────────────────┴─────────────────────┐
       │                                           │
  /api/v1/*                                   /* (SPA Routes)
       │                                           │
       ▼                                           ▼
FastAPI Engine                             Compiled React Bundle
- Document Intelligence (OCR / MRZ)        - Dashboard & Intake Form
- OpenCV Biometrics                        - Scenario Benchmark Cards
- Evidence Fusion & Adaptive Logic         - Real-time Graph & Ledger
- SHA-256 Tamper-Evident Ledger            - Single-Page HTML Fallback
```

> **Key Benefit**: When the frontend is compiled (`npm run build`), the FastAPI server serves both the **API** and the **SPA UI** from a single port (`8000`). No reverse-proxy or CORS configuration is required.

---

## 2. Deployment Methods

Choose the deployment method that fits your scenario:

| Method | Best For | Prerequisites | Setup Time |
|---|---|---|---|
| **Method A: Unified Local / Demo** | SIH Presentation, Judge Demo | Python 3.10+, Node 18+ | 2 minutes |
| **Method B: Docker / Docker Compose** | Portable Staging, Cloud VMs | Docker & Docker Compose | 3 minutes |
| **Method C: 1-Click Cloud (Render / Railway)** | Public Showcase URL | GitHub Repository | 5 minutes |
| **Method D: Production Linux Server (VPS)** | Dedicated Cloud Instance | Ubuntu 22.04 / 24.04, Nginx | 10 minutes |

---

## Method A: Unified Local / Presentation Run (Fastest)

This method builds the frontend once and runs everything under a single Uvicorn process.

### Step 1: Install Dependencies
```powershell
# In e:\SIH (or project root)
npm install
pip install -r backend/requirements.txt
```

### Step 2: Build the Frontend
```powershell
npm run build
```
*(Produces optimized static assets in the `dist/` directory).*

### Step 3: Launch Unified Application
```powershell
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

### Access Points:
- **Web Application**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Verification**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## Method B: Docker & Docker Compose (Containerized)

The repository includes a multi-stage `Dockerfile` and `docker-compose.yml`.

### Single-Command Launch:
```bash
docker compose up --build -d
```

### To View Logs:
```bash
docker compose logs -f authentiq
```

### To Stop:
```bash
docker compose down
```

---

## Method C: Free Cloud PaaS (Render / Railway)

### Deploying to Render.com:
1. Push your repository to GitHub / GitLab.
2. Log in to [Render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Select your AuthentiQ repository.
4. Set the following settings:
   - **Environment**: `Docker` (Render will detect the `Dockerfile` automatically).
   - **Branch**: `main` (or your active branch).
   - **Instance Type**: `Free` or `Starter`.
   - **Health Check Path**: `/api/v1/health`.
5. Click **Create Web Service**.
6. Render builds the multi-stage image, runs the health check, and assigns a live public URL:  
   `https://authentiq-<your-name>.onrender.com`.

### Deploying to Railway.app:
1. Log in to [Railway.app](https://railway.app).
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Select the repository. Railway will detect `Dockerfile` automatically.
4. Add environment variable: `PORT=8000`.
5. Generate a public domain under service settings.

---

## Method D: Production Linux Server (Ubuntu VPS / AWS EC2)

For deploying on an Ubuntu server with Nginx and Systemd:

### 1. System Setup
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv nodejs npm nginx
git clone <YOUR_REPO_URL> /var/www/authentiq
cd /var/www/authentiq
```

### 2. Build Frontend & Python Virtual Environment
```bash
npm ci && npm run build
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Configure Systemd Service (`/etc/systemd/system/authentiq.service`)
```ini
[Unit]
Description=AuthentiQ Identity Assurance Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/authentiq
ExecStart=/var/www/authentiq/venv/bin/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now authentiq
```

### 4. Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/authentiq`)
```nginx
server {
    listen 80;
    server_name yourdomain.com; # Or server IP

    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/authentiq /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## 3. Post-Deployment Verification Checklist

Run these quick sanity checks after deployment:

```bash
# 1. Check subsystem health (should return status: HEALTHY with 10 subsystems)
curl -s http://<YOUR_HOST>:8000/api/v1/health

# 2. Check tamper-evident ledger integrity
curl -s http://<YOUR_HOST>:8000/api/v1/audit/verify

# 3. Check security status
curl -s http://<YOUR_HOST>:8000/api/v1/security/status
```

All endpoints should respond with `HTTP 200 OK`.
Navigate to `http://<YOUR_HOST>:8000/` to use the interactive application.

