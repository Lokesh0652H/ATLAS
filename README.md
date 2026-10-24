# ATLAS — AI Research & Knowledge Engine
### Ultra-Luxury AI Research & Knowledge Engine | Production-Grade Full-Stack Application

> **“Every answer should be traceable to its evidence, every metric should be measurable, and every limitation should be visible.”**

Atlas is a production-grade, evidence-grounded AI Research & Knowledge Engine. It combines verifiable document intelligence, hybrid vector-lexical retrieval, automated citation checking, contradiction detection, reproducible evaluation benchmarks, and live application observability into an ultra-luxury editorial interface.

---

## 🏛️ System Philosophy & Absolute Principles

1. **Zero Fabricated Production Data**:
   No mock documents, fake evaluation scores, synthetic users, or pretend latency metrics leak into production. Empty states are honest and explicit.
2. **Truthful Real-Time Information**:
   All metrics, queue depths, latencies, and token counts are calculated from authentic database logs and measurements.
3. **Traceability & Grounding**:
   Every answer is directly linked to verifiable source passages with exact page numbers, section headers, and character boundaries.
4. **Editorial Luxury Interface (Zero Sidebars)**:
   A tailored ivory (`#F8F5EF`), surface (`#FFFEFB`), dark ink (`#202522`), and champagne (`#B49A70`) design system with a slim horizontal top navbar and **absolutely no sidebars** anywhere.

---

## 🚀 Key Capabilities

- **Multi-Tenant Workspace Security**: JWT sessions, bcrypt password hashing, and strict workspace boundary isolation.
- **Multi-Format Ingestion Pipeline**: Asynchronous processing of PDF, DOCX, TXT, and Markdown with token-aware chunking and page provenance.
- **Unified Hybrid Search Engine**: Reciprocal Rank Fusion (RRF with $k=60$) combining BM25 lexical keyword matching and 384-dimensional dense semantic vectors.
- **Evidence-Grounded AI Research**: Verifiable citations, source inspection, contradiction detection, and honest insufficient-evidence handling.
- **Safe External Web Research**: Live DuckDuckGo provider integration protected by strict SSRF defense (blocking private subnets: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`).
- **Reproducible Evaluation Lab**: Ground-truth benchmark datasets computing Recall@K, Precision@K, Mean Reciprocal Rank (MRR), nDCG@K, Faithfulness, and Citation Validity.
- **Real-Time Observability**: Authentic request telemetry, latency percentiles ($p_{50}$, $p_{95}$), queue depth, and live dependency health checks (`/health/live`, `/health/ready`).
- **Session History & Markdown Export**: Preserved research threads with one-click export to formatted academic Markdown reports.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14+ (App Router), React 18, TypeScript (Strict Mode), Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic |
| **Data & Vector Store** | PostgreSQL 16 + pgvector (with standalone SQLite fallback for local development) |
| **Cache & Queue** | Redis 7, Celery / FastAPI Background Worker |
| **Document Parsers** | `pypdf`, `python-docx`, `markdown` |
| **AI Providers** | Local Dense Semantic Encoder (384-d), OpenAI, Gemini, Anthropic, Ollama |
| **Search Engine** | Reciprocal Rank Fusion (RRF), BM25, Cosine Similarity |
| **Containers** | Docker, Docker Compose |

---

## 📁 Repository Structure

```
atlas/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # Auth & workspace tenancy dependencies
│   │   │   ├── v1/
│   │   │   │   ├── auth.py         # Registration, login, profile
│   │   │   │   ├── workspaces.py   # Multi-tenant workspace management
│   │   │   │   ├── documents.py    # Document upload, listing, chunks
│   │   │   │   ├── search.py       # Hybrid (RRF), semantic & keyword search
│   │   │   │   ├── research.py     # Grounded research engine
│   │   │   │   ├── sessions.py     # Session history & report export
│   │   │   │   ├── evaluations.py  # Evaluation benchmarks & metrics
│   │   │   │   └── observability.py# Live request telemetry & percentiles
│   │   │   └── health.py           # /health/live, /health/ready, /system-status
│   │   ├── core/
│   │   │   └── security.py         # JWT tokens & bcrypt password hashing
│   │   ├── models/                 # SQLAlchemy 2.0 declarative database models
│   │   ├── schemas/                # Pydantic v2 validation contracts
│   │   ├── services/
│   │   │   ├── storage.py          # Private disk storage adapter
│   │   │   ├── extractors.py       # PDF, DOCX, TXT, MD parsers
│   │   │   ├── chunker.py          # Token-aware sentence-boundary chunker
│   │   │   ├── embeddings.py       # 384-d dense vector generator
│   │   │   ├── ingestion.py        # Asynchronous ingestion pipeline
│   │   │   ├── search.py           # BM25 + Vector + Reciprocal Rank Fusion
│   │   │   ├── llm.py              # Evidence-grounded synthesis & contradiction detector
│   │   │   ├── research.py         # Research orchestrator
│   │   │   ├── web_search.py       # SSRF-protected web search provider
│   │   │   └── evaluation.py       # Recall@K, Precision@K, MRR, nDCG calculator
│   │   ├── config.py               # Pydantic Settings environment configuration
│   │   ├── database.py             # Database engine & connection pooling
│   │   └── main.py                 # FastAPI application with telemetry middleware
│   ├── tests/                      # Pytest unit, integration & e2e test suite (18 tests)
│   ├── alembic/                    # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout (TopNav, AuthProvider, No sidebars)
│   │   │   ├── page.tsx            # Signature Editorial Home Page
│   │   │   ├── documents/page.tsx  # Document Vault & Chunk Inspector
│   │   │   ├── search/page.tsx     # Search Explorer with Latency Display
│   │   │   ├── research/page.tsx   # Grounded Research & Citation Drawer
│   │   │   ├── evaluation/page.tsx # Evaluation Lab & Benchmark Scorecards
│   │   │   ├── observability/page.tsx# Real-Time Telemetry & Request Stream
│   │   │   ├── history/page.tsx    # Saved Research Threads & Markdown Export
│   │   │   └── settings/page.tsx   # Workspace, Model Providers & API Keys
│   │   ├── components/             # Reusable editorial UI components
│   │   ├── lib/                    # API client, Auth Context, Types, Utilities
│   │   └── styles/globals.css      # Design tokens, typography & animations
│   ├── Dockerfile
│   └── package.json
├── docs/                           # Architecture, Security, Providers, Testing docs
├── docker-compose.yml              # PostgreSQL + pgvector, Redis, Backend, Frontend
└── .env.example
```

---

## 🚦 Getting Started

### 1. Local Development (Zero Docker Required)

#### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 2. Docker Compose Setup (Full Production Stack)

```bash
docker compose up --build
```
This boots:
- PostgreSQL 16 with `pgvector` extension on port `5432`
- Redis 7 cache on port `6379`
- FastAPI backend on `http://localhost:8000`
- Next.js luxury-light frontend on `http://localhost:3000`

---

## 🧪 Automated Testing

Atlas includes 18 automated unit, integration, and end-to-end vertical slice tests covering every subsystem.

Run the test suite:
```bash
cd backend
python -m pytest -v tests/
```

Test coverage results:
```
============================= test session starts =============================
tests/test_auth_and_workspaces.py::test_user_registration_and_login PASSED
tests/test_auth_and_workspaces.py::test_workspace_isolation PASSED
tests/test_database_and_health.py::test_settings_loaded PASSED
tests/test_database_and_health.py::test_health_live PASSED
tests/test_database_and_health.py::test_health_ready PASSED
tests/test_database_and_health.py::test_system_status PASSED
tests/test_database_and_health.py::test_model_creation PASSED
tests/test_documents_and_ingestion.py::test_chunker_service PASSED
tests/test_documents_and_ingestion.py::test_embedding_service PASSED
tests/test_documents_and_ingestion.py::test_document_upload_and_pipeline PASSED
tests/test_e2e_workflow.py::test_complete_vertical_slice PASSED
tests/test_evaluation.py::test_metrics_calculator PASSED
tests/test_evaluation.py::test_evaluation_run_endpoint PASSED
tests/test_observability.py::test_observability_endpoint PASSED
tests/test_research.py::test_research_pipeline_and_citations PASSED
tests/test_search.py::test_search_modes PASSED
tests/test_web_search.py::test_ssrf_protection PASSED
tests/test_web_search.py::test_web_search_structure PASSED

======================= 18 passed in 5.38s =======================
```

---

## 🛡️ Security & Privacy Architecture

- **Tenant Isolation**: Every database query is bounded to the authenticated user's authorized workspace.
- **SSRF Defense**: The external web research provider validates IP addresses and prevents requests to loopback (`127.0.0.1`), link-local (`169.254.0.0/16`), and private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- **Prompt Injection Defense**: Retrieved passages are isolated in explicit context fences to prevent prompt override attacks.
- **Credential Protection**: Model API keys are configured server-side and never exposed to the client bundle.

---

## 📜 Portfolio & Technical Interview Highlights

- **Reciprocal Rank Fusion**: Demonstrates mathematical understanding of information retrieval beyond basic keyword matching.
- **Measurable IR Metrics**: Implements genuine algorithms for $nDCG@K$, $MRR$, and $Recall@K$.
- **Truthful Telemetry**: Real operational middleware tracking $p_{50}$ and $p_{95}$ latency percentiles from measured request distributions.
- **Strict Visual Discipline**: Adheres to the luxury light editorial aesthetic with zero permanent sidebars and zero fabricated production mocks.
