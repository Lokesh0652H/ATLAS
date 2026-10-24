from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional

class CitationOut(BaseModel):
    id: str
    citation_number: int
    source_type: str
    source_title: str
    source_url: Optional[str] = None
    page_number: Optional[int] = None
    section_heading: Optional[str] = None
    excerpt: str
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)

class ResearchMessageOut(BaseModel):
    id: str
    role: str
    content: str
    retrieval_mode: str
    has_insufficient_evidence: bool
    has_contradiction: bool
    latency_ms: int
    created_at: datetime
    citations: List[CitationOut] = []

    model_config = ConfigDict(from_attributes=True)

class ResearchSessionOut(BaseModel):
    id: str
    workspace_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ResearchMessageOut] = []

    model_config = ConfigDict(from_attributes=True)

class ResearchRequest(BaseModel):
    workspace_id: str
    question: str = Field(min_length=2, description="The research inquiry")
    retrieval_mode: str = Field(default="hybrid", pattern="^(hybrid|semantic|keyword)$")
    source_scope: str = Field(default="workspace")
    session_id: Optional[str] = None
