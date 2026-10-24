from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class SearchResultOut(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    content: str
    score: float
    keyword_score: Optional[float] = None
    vector_score: Optional[float] = None
    page_number: Optional[int] = None
    section_heading: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class SearchResponseOut(BaseModel):
    query: str
    mode: str
    latency_ms: float
    total_results: int
    results: List[SearchResultOut]
