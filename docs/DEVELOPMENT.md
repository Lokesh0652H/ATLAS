# ATLAS Development Guide

## Quick Start (Local Development)

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ (Node 20+ or 24 recommended)
- `pnpm` (or `npm`)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running with Docker Compose
```bash
docker compose up --build
```
This boots PostgreSQL with pgvector, Redis, FastAPI backend, and Next.js frontend.
