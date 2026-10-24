# ATLAS Testing Strategy & Execution

Atlas enforces high code quality through multi-tiered testing:

## Test Suites

1. **Unit Tests (`backend/tests/unit`)**:
   - Token-aware chunking and sentence boundary preservation.
   - Reciprocal Rank Fusion (RRF) math and rank scoring.
   - Inline citation extraction and regex parser correctness.
   - Information retrieval metric calculations (Recall@K, Precision@K, MRR, nDCG@K).
   - Password hashing and JWT generation.

2. **Integration Tests (`backend/tests/integration`)**:
   - SQLite / PostgreSQL database persistence.
   - Workspace isolation enforcement (tenant leaks prevented).
   - Document upload, MIME validation, and parsing.
   - Search pipeline execution (BM25 + Vector).

3. **Running the Tests**:
```bash
cd backend
pytest tests/ -v
```
