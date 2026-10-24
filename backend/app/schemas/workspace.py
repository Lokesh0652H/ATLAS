from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)

class WorkspaceOut(BaseModel):
    id: str
    name: str
    slug: str
    owner_id: str
    role: Optional[str] = "member"
    document_count: Optional[int] = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
