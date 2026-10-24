from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class ChunkOut(BaseModel):
    id: str
    chunk_index: int
    content: str
    token_count: int
    page_number: Optional[int] = None
    section_heading: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentOut(BaseModel):
    id: str
    workspace_id: str
    title: str
    filename: str
    file_type: str
    file_size_bytes: int
    processing_status: str
    page_count: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailOut(DocumentOut):
    chunks: List[ChunkOut] = []
