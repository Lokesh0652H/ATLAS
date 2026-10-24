from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.research import ResearchRequest, ResearchSessionOut
from app.api.deps import get_current_user, require_workspace_access
from app.services.research import research_orchestrator

router = APIRouter(prefix="/api/v1/research", tags=["Research"])

@router.post("", response_model=ResearchSessionOut, status_code=status.HTTP_201_CREATED)
def start_research(
    payload: ResearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate evidence-grounded research.
    Retrieves authentic document evidence, generates citations, checks contradictions,
    and returns a structured response with verifiable source passages.
    """
    require_workspace_access(workspace_id=payload.workspace_id, current_user=current_user, db=db)

    session = research_orchestrator.execute_research(
        db=db,
        workspace_id=payload.workspace_id,
        user_id=current_user.id,
        question=payload.question,
        retrieval_mode=payload.retrieval_mode,
        source_scope=payload.source_scope,
        session_id=payload.session_id
    )

    return session
