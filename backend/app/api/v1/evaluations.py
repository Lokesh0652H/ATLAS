import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.evaluation import EvaluationDataset, EvaluationExample, EvaluationRun
from app.schemas.evaluation import (
    EvaluationDatasetCreate,
    EvaluationDatasetOut,
    EvaluationRunRequest,
    EvaluationRunOut
)
from app.api.deps import get_current_user, require_workspace_access
from app.services.evaluation import evaluation_service

router = APIRouter(prefix="/api/v1/evaluations", tags=["Evaluation Lab"])

@router.get("/datasets", response_model=List[EvaluationDatasetOut])
def list_datasets(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all evaluation datasets in the authorized workspace."""
    require_workspace_access(workspace_id=workspace_id, current_user=current_user, db=db)

    datasets = db.execute(
        select(EvaluationDataset).where(EvaluationDataset.workspace_id == workspace_id).order_by(EvaluationDataset.created_at.desc())
    ).scalars().all()

    result = []
    for d in datasets:
        ex_count = len(d.examples)
        result.append(EvaluationDatasetOut(
            id=d.id,
            workspace_id=d.workspace_id,
            name=d.name,
            description=d.description,
            example_count=ex_count,
            created_at=d.created_at,
            updated_at=d.updated_at
        ))
    return result

@router.post("/datasets", response_model=EvaluationDatasetOut, status_code=status.HTTP_201_CREATED)
def create_dataset(
    payload: EvaluationDatasetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new evaluation dataset with test examples."""
    require_workspace_access(workspace_id=payload.workspace_id, current_user=current_user, db=db)

    dataset = EvaluationDataset(
        workspace_id=payload.workspace_id,
        name=payload.name,
        description=payload.description
    )
    db.add(dataset)
    db.flush()

    for ex in payload.examples:
        example_rec = EvaluationExample(
            dataset_id=dataset.id,
            query=ex.query,
            expected_answer=ex.expected_answer,
            relevant_chunk_ids=json.dumps(ex.relevant_chunk_ids)
        )
        db.add(example_rec)

    db.commit()
    db.refresh(dataset)

    return EvaluationDatasetOut(
        id=dataset.id,
        workspace_id=dataset.workspace_id,
        name=dataset.name,
        description=dataset.description,
        example_count=len(payload.examples),
        created_at=dataset.created_at,
        updated_at=dataset.updated_at
    )

@router.get("/runs", response_model=List[EvaluationRunOut])
def list_runs(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List historical evaluation runs and reproducible benchmark results."""
    require_workspace_access(workspace_id=workspace_id, current_user=current_user, db=db)

    runs = db.execute(
        select(EvaluationRun).where(EvaluationRun.workspace_id == workspace_id).order_by(EvaluationRun.created_at.desc())
    ).scalars().all()

    return runs

@router.post("/run", response_model=EvaluationRunOut, status_code=status.HTTP_201_CREATED)
def execute_evaluation(
    payload: EvaluationRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a reproducible evaluation run with genuine IR metrics."""
    require_workspace_access(workspace_id=payload.workspace_id, current_user=current_user, db=db)

    run = evaluation_service.execute_run(
        db=db,
        dataset_id=payload.dataset_id,
        workspace_id=payload.workspace_id,
        retrieval_mode=payload.retrieval_mode,
        k=payload.k
    )

    return run
