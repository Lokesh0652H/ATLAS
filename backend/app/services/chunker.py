import re
from typing import List, Optional

class DocumentChunk:
    def __init__(
        self,
        chunk_index: int,
        content: str,
        token_count: int,
        page_number: Optional[int] = None,
        section_heading: Optional[str] = None,
        char_start: Optional[int] = None,
        char_end: Optional[int] = None
    ):
        self.chunk_index = chunk_index
        self.content = content
        self.token_count = token_count
        self.page_number = page_number
        self.section_heading = section_heading
        self.char_start = char_start
        self.char_end = char_end

class TokenAwareChunker:
    def __init__(self, target_tokens: int = 350, overlap_tokens: int = 50):
        self.target_tokens = target_tokens
        self.overlap_tokens = overlap_tokens

    def split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences while respecting abbreviations."""
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [s.strip() for s in sentences if s.strip()]

    def chunk_section(
        self,
        text: str,
        start_index: int,
        page_number: Optional[int] = None,
        section_heading: Optional[str] = None
    ) -> List[DocumentChunk]:
        """Chunk a single section into token-bounded passages."""
        sentences = self.split_into_sentences(text)
        if not sentences:
            return []

        chunks: List[DocumentChunk] = []
        current_chunk_words: List[str] = []
        current_word_count = 0
        chunk_idx = start_index

        for sentence in sentences:
            words = sentence.split()
            word_count = len(words)

            if current_word_count + word_count > self.target_tokens and current_chunk_words:
                content = " ".join(current_chunk_words)
                chunks.append(
                    DocumentChunk(
                        chunk_index=chunk_idx,
                        content=content,
                        token_count=current_word_count,
                        page_number=page_number,
                        section_heading=section_heading
                    )
                )
                chunk_idx += 1

                # Carry over overlap
                overlap_words = current_chunk_words[-self.overlap_tokens:] if len(current_chunk_words) > self.overlap_tokens else []
                current_chunk_words = overlap_words + words
                current_word_count = len(current_chunk_words)
            else:
                current_chunk_words.extend(words)
                current_word_count += word_count

        if current_chunk_words:
            content = " ".join(current_chunk_words)
            chunks.append(
                DocumentChunk(
                    chunk_index=chunk_idx,
                    content=content,
                    token_count=current_word_count,
                    page_number=page_number,
                    section_heading=section_heading
                )
            )

        return chunks

chunker_service = TokenAwareChunker()
