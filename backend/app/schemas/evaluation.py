from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional

class EvaluationExampleCreate(BaseModel):
    query: str
    expected_answer: Optional[str] = None
    relevant_chunk_ids: List[str] = []

class EvaluationDatasetCreate(BaseModel):
    workspace_id: str
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None
    examples: List[EvaluationExampleCreate] = []

class EvaluationExampleOut(BaseModel):
    id: str
    query: str
    expected_answer: Optional[str] = None
    relevant_chunk_ids: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EvaluationDatasetOut(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    example_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EvaluationRunRequest(BaseModel):
    dataset_id: str
    workspace_id: str
    retrieval_mode: str = Field(default="hybrid", pattern="^(hybrid|semantic|keyword)$")
    k: int = Field(default=5, ge=1, le=20)

class EvaluationRunOut(BaseModel):
    id: str
    dataset_id: str
    workspace_id: str
    retrieval_mode: str
    total_examples: int
    completed_examples: int
    precision_at_k: Optional[float] = None
    recall_at_k: Optional[float] = None
    mrr: Optional[float] = None
    ndcg_at_k: Optional[float] = None
    faithfulness_score: Optional[float] = None
    citation_validity_score: Optional[float] = None
    results_json: Optional[str] = None
    status: str
    duration_ms: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
