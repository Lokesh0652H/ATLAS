# ATLAS System Architecture

## 1. Overview & Core Philosophy

Atlas is an ultra-luxury, evidence-grounded AI Research & Knowledge Engine built on three non-negotiable principles:
1. **Zero fabricated production data**: No mocks or fake statistics leak into live application views. Empty states are honest and explicit.
2. **Truthful real-time information**: Metrics, queue depths, latencies, and citation spans reflect real measurements.
3. **Traceability & Grounding**: Every answer is directly mapped to verifiable source passages with character offsets, page numbers, and section titles.

```
+-----------------------------------------------------------------------------------+
|                           ATLAS CLIENT (Next.js 14+)                             |
|          Horizontal Luxury Top Navbar (Zero Sidebars) | Editorial Theme           |
+----------------------------------------+------------------------------------------+
                                         | REST / SSE
+----------------------------------------v------------------------------------------+
|                           FASTAPI APPLICATION SERVER                              |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  |   Auth & RBAC      |  |  Workspace Engine  |  |   Telemetry & Observability |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Ingestion Pipeline |  | Hybrid Search (RRF)|  | Research & Grounding Engine |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+---------+--------------------------+-----------------------------+----------------+
          |                          |                             |
+---------v----------+      +--------v---------+          +--------v--------+
|    PostgreSQL      |      |   Redis / Worker |          |   AI Providers  |
|   + pgvector       |      |   Queue & Cache  |          | (Local / APIs)  |
| Documents & Vectors|      +------------------+          +-----------------+
+--------------------+
```

## 2. Ingestion & Retrieval Pipeline

1. **Document Ingestion**:
   - Supported formats: PDF, DOCX, TXT, Markdown.
   - SHA-256 hash deduplication.
   - Text extraction preserving page numbers, section headers, and character boundaries.
   - Token-aware sliding chunking with configured overlap.

2. **Hybrid Search**:
   - **BM25 / Keyword Retrieval**: Lexical matching against tokenized document chunks.
   - **Vector Semantic Retrieval**: Cosine similarity against 384-d (or 1536-d) vector embeddings.
   - **Reciprocal Rank Fusion (RRF)**: Merging rankings with dynamic $k=60$ penalty smoothing.

3. **Grounding & Answering**:
   - Context construction containing chunk metadata and strict evidence fences.
   - LLM generation with JSON structured claim and citation output.
   - Post-generation citation verification against retrieved chunk IDs.
   - Contradiction detection across distinct source passages.
   - Insufficient evidence fallback if similarity or claim confidence is below threshold.
