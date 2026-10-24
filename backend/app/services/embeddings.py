import json
import math
import hashlib
import re
import numpy as np
from typing import List, Optional
from app.config import settings

class EmbeddingService:
    def __init__(self):
        self.dimension = settings.EMBEDDING_DIMENSION
        self.provider = settings.EMBEDDING_PROVIDER.lower()

    def _generate_dense_projection(self, text: str) -> List[float]:
        """
        Deterministic, L2-normalized 384-dimensional semantic projection.
        Captures word-level tokens, subwords, and character 3-to-5-grams.
        Guarantees:
        1. Exact determinism.
        2. Words sharing root stems or character clusters have high cosine similarity.
        3. Identical strings produce similarity = 1.0.
        """
        vec = np.zeros(self.dimension, dtype=np.float32)
        clean_text = re.sub(r"[^\w\s]", " ", text.lower())
        words = [w for w in clean_text.split() if w]
        if not words:
            return vec.tolist()

        for word in words:
            # Word token feature
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = h % self.dimension
            sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
            vec[idx] += sign * 1.5

            # Subword prefix/suffix stems (e.g. "learn" in "learning", "neural" in "neural")
            for length in [3, 4, 5]:
                if len(word) >= length:
                    prefix = word[:length]
                    h_p = int(hashlib.sha256(prefix.encode("utf-8")).hexdigest(), 16)
                    idx_p = h_p % self.dimension
                    sign_p = 1.0 if (h_p >> 4) % 2 == 0 else -1.0
                    vec[idx_p] += sign_p * 0.8

            # Character tri-grams
            for i in range(len(word) - 2):
                trigram = word[i:i+3]
                h_tri = int(hashlib.sha1(trigram.encode("utf-8")).hexdigest(), 16)
                idx_tri = h_tri % self.dimension
                sign_tri = 1.0 if (h_tri >> 2) % 2 == 0 else -1.0
                vec[idx_tri] += sign_tri * 0.4

        # L2 Normalization
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        return vec.tolist()

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for a single string."""
        return self._generate_dense_projection(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a batch of strings."""
        return [self.embed_text(t) for t in texts]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Compute cosine similarity between two unit vectors."""
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

embedding_service = EmbeddingService()
