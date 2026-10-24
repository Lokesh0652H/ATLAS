# ATLAS — AI Research & Knowledge Engine

> **Every answer traceable to evidence. Every metric measurable. Every limitation visible.**

Atlas is a production-grade, evidence-grounded AI Research & Knowledge Engine built with an ultra-luxury editorial aesthetic, zero fabricated production data, and robust document intelligence.

---

## Core Capabilities

- **Secure Workspace & Document Ingestion**: Asynchronous multi-format ingestion (PDF, DOCX, TXT, Markdown) with token-aware chunking and page/section provenance.
- **Unified Hybrid Search Engine**: Reciprocal Rank Fusion (RRF) combining BM25 keyword matching and vector semantic retrieval.
- **Evidence-Grounded AI Research**: Verifiable citations, source inspection, contradiction detection, and honest insufficient-evidence handling.
- **External Web Research**: Safe, SSRF-protected search integration with verifiable web citations.
- **Evaluation Lab**: Rigorous benchmarks including Recall@K, Precision@K, MRR, nDCG, citation validity, and faithfulness.
- **Real-Time Observability**: Authentic request telemetry, latency percentiles, queue monitoring, and dependency health checks.
- **Ultra-Luxury Editorial Design**: Tailored ivory, linen, ink, and champagne visual system with a horizontal top navbar and **absolutely no sidebars**.

---

## Architectural Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript Strict Mode, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0, Alembic.
- **Data & Vector Store**: PostgreSQL + pgvector, with standalone SQLite fallback for local development.
- **Cache & Telemetry**: Redis / in-memory cache, OpenTelemetry-compatible metrics.
- **Search & AI**: Reciprocal Rank Fusion, Sentence Transformers, Configurable LLM Providers (OpenAI, Gemini, Ollama, etc.).

---

## License

Proprietary — All rights reserved.
