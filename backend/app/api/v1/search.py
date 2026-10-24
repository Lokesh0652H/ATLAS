from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.search import SearchResponseOut, SearchResultOut
from app.api.deps import get_current_user, require_workspace_access
from app.services.search import search_service

router = APIRouter(prefix="/api/v1/search", tags=["Search"])

@router.get("", response_model=SearchResponseOut)
def execute_search(
    workspace_id: str = Query(..., description="Target workspace ID"),
    q: str = Query(..., min_length=1, description="Search query string"),
    mode: str = Query("hybrid", pattern="^(hybrid|semantic|keyword)$", description="Retrieval mode"),
    limit: int = Query(10, ge=1, le=50, description="Max passages to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Execute keyword, semantic, or hybrid (RRF) search across workspace documents.
    Enforces multi-tenant authorization and measures actual search latency.
    """
    require_workspace_access(workspace_id=workspace_id, current_user=current_user, db=db)

    passages, latency_ms = search_service.search(
        db=db,
        workspace_id=workspace_id,
        query=q,
        mode=mode,
        limit=limit
    )

    results_out = [
        SearchResultOut(
            chunk_id=p.chunk_id,
            document_id=p.document_id,
            document_title=p.document_title,
            content=p.content,
            score=p.score,
            keyword_score=p.keyword_score,
            vector_score=p.vector_score,
            page_number=p.page_number,
            section_heading=p.section_heading
        )
        for p in passages
    ]

    return SearchResponseOut(
        query=q,
        mode=mode,
        latency_ms=latency_ms,
        total_results=len(results_out),
        results=results_out
    )
