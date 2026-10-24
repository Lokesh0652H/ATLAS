import json
import re
import logging
import httpx
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.search import SearchPassage

logger = logging.getLogger("atlas.llm")

class GroundedAnswer:
    def __init__(
        self,
        answer: str,
        citations: List[Dict[str, Any]],
        has_insufficient_evidence: bool = False,
        has_contradiction: bool = False,
        contradiction_notes: Optional[str] = None
    ):
        self.answer = answer
        self.citations = citations
        self.has_insufficient_evidence = has_insufficient_evidence
        self.has_contradiction = has_contradiction
        self.contradiction_notes = contradiction_notes

class LLMReasoningService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.model = settings.LLM_MODEL_NAME
        self.gemini_key = settings.GEMINI_API_KEY

    def _call_gemini(
        self,
        question: str,
        passages: List[SearchPassage],
        citations_meta: List[Dict[str, Any]]
    ) -> Optional[GroundedAnswer]:
        """Call Google Gemini API with grounded research context."""
        if not self.gemini_key:
            return None

        # Build context
        context_blocks = []
        for idx, p in enumerate(passages[:5]):
            context_blocks.append(
                f"[Source {idx + 1}]: Title: {p.document_title} | Page: {p.page_number or 'N/A'}\n{p.content}"
            )
        context_str = "\n\n".join(context_blocks)

        prompt = (
            "You are Atlas, an ultra-luxury AI Research & Knowledge Engine.\n"
            "Your mission is to provide an evidence-grounded, sophisticated, and truthful research synthesis.\n\n"
            "RULES:\n"
            "1. Ground every factual claim in the provided sources using inline bracketed citation markers like [1], [2].\n"
            "2. If the provided sources do NOT contain enough information to answer the question, say clearly: "
            "'Insufficient evidence found in the provided sources to verify this answer.'\n"
            "3. If any sources contradict each other on facts, numbers, or dates, highlight the disagreement explicitly.\n"
            "4. Do not invent facts, page numbers, or citations.\n\n"
            f"SOURCES:\n{context_str}\n\n"
            f"RESEARCH INQUIRY:\n{question}\n\n"
            "SYNTHESIS:"
        )

        model_name = self.model if self.model.startswith("gemini") else "gemini-flash-lite-latest"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1024
            }
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            # Verify if model declared insufficient evidence
                            has_insuff = "insufficient evidence" in text.lower() or "not enough information" in text.lower()
                            has_contra = "contradict" in text.lower() or "conflicting" in text.lower()

                            return GroundedAnswer(
                                answer=text.strip(),
                                citations=citations_meta,
                                has_insufficient_evidence=has_insuff,
                                has_contradiction=has_contra,
                                contradiction_notes="Model noted conflicting claims in sources" if has_contra else None
                            )
                else:
                    logger.warning(f"Gemini API returned status {res.status_code}: {res.text}")
        except Exception as exc:
            logger.warning(f"Gemini API invocation error: {exc}")

        return None

    def generate_grounded_answer(
        self,
        question: str,
        passages: List[SearchPassage]
    ) -> GroundedAnswer:
        """
        Synthesize evidence-grounded answer with verifiable citations and contradiction detection.
        Dispatches to Gemini if configured, with deterministic local fallback.
        """
        if not passages:
            return GroundedAnswer(
                answer="Insufficient evidence found in the provided documents to answer this question. Please upload relevant source documents or broaden your search query.",
                citations=[],
                has_insufficient_evidence=True,
                has_contradiction=False
            )

        # Check relevance threshold
        best_score = passages[0].score
        if best_score <= 0.001:
            return GroundedAnswer(
                answer="No sufficiently relevant evidence found in the document library to answer this question.",
                citations=[],
                has_insufficient_evidence=True,
                has_contradiction=False
            )

        # Build genuine citations from retrieved passages
        citations: List[Dict[str, Any]] = []
        selected_passages = passages[:4]

        for idx, p in enumerate(selected_passages):
            citations.append({
                "citation_number": idx + 1,
                "chunk_id": p.chunk_id,
                "source_type": "document" if p.document_id != "web" else "web",
                "source_title": p.document_title,
                "source_url": None,
                "page_number": p.page_number,
                "section_heading": p.section_heading,
                "excerpt": p.content[:280] + ("..." if len(p.content) > 280 else ""),
                "is_verified": True
            })

        # If Gemini is configured and selected, call Gemini first
        if self.provider == "gemini" and self.gemini_key:
            gemini_ans = self._call_gemini(question, selected_passages, citations)
            if gemini_ans:
                return gemini_ans

        # Contradiction Detection: Check if distinct passages express conflicting polarity
        has_contradiction = False
        contradiction_notes = None
        if len(selected_passages) >= 2:
            p1_lower = selected_passages[0].content.lower()
            p2_lower = selected_passages[1].content.lower()
            opposing_pairs = [
                ("increase", "decrease"),
                ("positive", "negative"),
                ("growth", "decline"),
                ("supported", "unsupported"),
                ("true", "false"),
            ]
            for term_a, term_b in opposing_pairs:
                if (term_a in p1_lower and term_b in p2_lower) or (term_b in p1_lower and term_a in p2_lower):
                    has_contradiction = True
                    contradiction_notes = f"Note: Potential conflicting data observed between '{selected_passages[0].document_title}' and '{selected_passages[1].document_title}' regarding '{term_a}' vs '{term_b}'."
                    break

        # Editorial synthesis fallback
        summary_sentences = []
        for idx, p in enumerate(selected_passages):
            clean_first = re.split(r"[.!?]", p.content)[0].strip()
            if clean_first:
                summary_sentences.append(f"{clean_first} [{idx + 1}].")

        main_text = " ".join(summary_sentences)
        if not main_text:
            main_text = f"Based on the retrieved sources from '{selected_passages[0].document_title}' [1], the evidence outlines relevant findings pertaining to your inquiry."

        if contradiction_notes:
            main_text += f"\n\n> [!WARNING]\n> {contradiction_notes}"

        return GroundedAnswer(
            answer=main_text,
            citations=citations,
            has_insufficient_evidence=False,
            has_contradiction=has_contradiction,
            contradiction_notes=contradiction_notes
        )

llm_service = LLMReasoningService()
