import json
import math
import re
import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.chunk import Chunk
from app.models.document import Document
from app.services.embeddings import embedding_service

class SearchPassage:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        document_title: str,
        content: str,
        score: float,
        keyword_score: Optional[float] = None,
        vector_score: Optional[float] = None,
        page_number: Optional[int] = None,
        section_heading: Optional[str] = None
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.document_title = document_title
        self.content = content
        self.score = round(score, 4)
        self.keyword_score = round(keyword_score, 4) if keyword_score is not None else None
        self.vector_score = round(vector_score, 4) if vector_score is not None else None
        self.page_number = page_number
        self.section_heading = section_heading

class SearchService:
    def __init__(self, k_rrf: int = 60):
        self.k_rrf = k_rrf

    STOP_WORDS = {
        "a", "an", "the", "in", "on", "at", "to", "for", "of", "with",
        "is", "are", "was", "were", "what", "which", "who", "whom",
        "this", "that", "these", "those", "and", "or", "but", "by", "as"
    }

    def _tokenize(self, text: str, remove_stopwords: bool = True) -> List[str]:
        clean = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = [w for w in clean.split() if w]
        if remove_stopwords:
            return [w for w in tokens if w not in self.STOP_WORDS]
        return tokens

    def _bm25_score(
        self,
        query_tokens: List[str],
        chunks: List[Chunk],
        k1: float = 1.5,
        b: float = 0.75
    ) -> Dict[str, float]:
        """Compute BM25 relevance score for each chunk."""
        if not chunks or not query_tokens:
            return {}

        total_chunks = len(chunks)
        chunk_tokenized = {c.id: self._tokenize(c.content) for c in chunks}
        avg_doc_len = sum(len(toks) for toks in chunk_tokenized.values()) / max(total_chunks, 1)

        # Calculate Document Frequency (DF)
        df: Dict[str, int] = {}
        for q in set(query_tokens):
            df[q] = sum(1 for toks in chunk_tokenized.values() if q in toks)

        scores: Dict[str, float] = {}
        for c in chunks:
            toks = chunk_tokenized[c.id]
            doc_len = len(toks)
            score = 0.0

            # Count term frequencies in this document
            tf: Dict[str, int] = {}
            for t in toks:
                tf[t] = tf.get(t, 0) + 1

            for q in query_tokens:
                if q in tf:
                    doc_freq = df.get(q, 0)
                    idf = math.log((total_chunks - doc_freq + 0.5) / (doc_freq + 0.5) + 1.0)
                    term_tf = tf[q]
                    numerator = term_tf * (k1 + 1.0)
                    denominator = term_tf + k1 * (1.0 - b + b * (doc_len / max(avg_doc_len, 1)))
                    score += idf * (numerator / max(denominator, 1e-6))

            scores[c.id] = max(score, 0.0)

        return scores

    def _vector_search(
        self,
        query: str,
        chunks: List[Chunk]
    ) -> Dict[str, float]:
        """Compute cosine similarity for each chunk against query vector."""
        if not chunks or not query.strip():
            return {}

        query_vec = embedding_service.embed_text(query)
        scores: Dict[str, float] = {}

        for c in chunks:
            if not c.embedding_json:
                continue
            try:
                c_vec = json.loads(c.embedding_json)
                sim = embedding_service.cosine_similarity(query_vec, c_vec)
                scores[c.id] = max(sim, 0.0)
            except Exception:
                scores[c.id] = 0.0

        return scores

    def search(
        self,
        db: Session,
        workspace_id: str,
        query: str,
        mode: str = "hybrid",
        limit: int = 10
    ) -> (List[SearchPassage], float):
        """
        Unified search engine supporting hybrid (RRF), semantic, and keyword search.
        Measures real query latency.
        """
        start_time = time.time()
        
        # Load all chunks for this workspace
        chunks = db.execute(
            select(Chunk).where(Chunk.workspace_id == workspace_id)
        ).scalars().all()

        if not chunks:
            return [], round((time.time() - start_time) * 1000, 2)

        # Map document titles
        doc_ids = list(set(c.document_id for c in chunks))
        docs = db.execute(select(Document).where(Document.id.in_(doc_ids))).scalars().all()
        doc_title_map = {d.id: d.title for d in docs}

        mode = mode.lower()
        query_tokens = self._tokenize(query)

        if mode == "keyword":
            bm25_scores = self._bm25_score(query_tokens, chunks)
            sorted_chunks = sorted(chunks, key=lambda c: bm25_scores.get(c.id, 0.0), reverse=True)
            results = [
                SearchPassage(
                    chunk_id=c.id,
                    document_id=c.document_id,
                    document_title=doc_title_map.get(c.document_id, "Unknown"),
                    content=c.content,
                    score=bm25_scores.get(c.id, 0.0),
                    keyword_score=bm25_scores.get(c.id, 0.0),
                    page_number=c.page_number,
                    section_heading=c.section_heading
                )
                for c in sorted_chunks[:limit] if bm25_scores.get(c.id, 0.0) > 0.0
            ]

        elif mode == "semantic":
            vector_scores = self._vector_search(query, chunks)
            sorted_chunks = sorted(chunks, key=lambda c: vector_scores.get(c.id, 0.0), reverse=True)
            results = [
                SearchPassage(
                    chunk_id=c.id,
                    document_id=c.document_id,
                    document_title=doc_title_map.get(c.document_id, "Unknown"),
                    content=c.content,
                    score=vector_scores.get(c.id, 0.0),
                    vector_score=vector_scores.get(c.id, 0.0),
                    page_number=c.page_number,
                    section_heading=c.section_heading
                )
                for c in sorted_chunks[:limit] if vector_scores.get(c.id, 0.0) > 0.05
            ]

        else: # Hybrid Reciprocal Rank Fusion (RRF)
            bm25_scores = self._bm25_score(query_tokens, chunks)
            vector_scores = self._vector_search(query, chunks)

            # Generate individual ranks
            sorted_by_bm25 = sorted(chunks, key=lambda c: bm25_scores.get(c.id, 0.0), reverse=True)
            sorted_by_vec = sorted(chunks, key=lambda c: vector_scores.get(c.id, 0.0), reverse=True)

            bm25_ranks = {c.id: rank + 1 for rank, c in enumerate(sorted_by_bm25)}
            vec_ranks = {c.id: rank + 1 for rank, c in enumerate(sorted_by_vec)}

            # RRF Fusion formula: Score = 1 / (60 + rank_bm25) + 1 / (60 + rank_vec)
            rrf_scores: Dict[str, float] = {}
            for c in chunks:
                r_bm25 = bm25_ranks.get(c.id, len(chunks))
                r_vec = vec_ranks.get(c.id, len(chunks))
                rrf_scores[c.id] = (1.0 / (self.k_rrf + r_bm25)) + (1.0 / (self.k_rrf + r_vec))

            sorted_chunks = sorted(chunks, key=lambda c: rrf_scores.get(c.id, 0.0), reverse=True)
            results = [
                SearchPassage(
                    chunk_id=c.id,
                    document_id=c.document_id,
                    document_title=doc_title_map.get(c.document_id, "Unknown"),
                    content=c.content,
                    score=rrf_scores.get(c.id, 0.0),
                    keyword_score=bm25_scores.get(c.id, 0.0),
                    vector_score=vector_scores.get(c.id, 0.0),
                    page_number=c.page_number,
                    section_heading=c.section_heading
                )
                for c in sorted_chunks[:limit]
            ]

        latency_ms = round((time.time() - start_time) * 1000, 2)
        return results, latency_ms

search_service = SearchService()
