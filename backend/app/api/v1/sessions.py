from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.research import ResearchSession, ResearchMessage, Citation
from app.schemas.research import ResearchSessionOut
from app.api.deps import get_current_user, get_current_user_flexible, require_workspace_access

router = APIRouter(prefix="/api/v1/sessions", tags=["Research History"])

@router.get("", response_model=List[ResearchSessionOut])
def list_sessions(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all research sessions in the authorized workspace."""
    require_workspace_access(workspace_id=workspace_id, current_user=current_user, db=db)

    sessions = db.execute(
        select(ResearchSession).where(ResearchSession.workspace_id == workspace_id).order_by(ResearchSession.updated_at.desc())
    ).scalars().all()

    return sessions

@router.get("/{session_id}", response_model=ResearchSessionOut)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full research session with all messages and citations."""
    session = db.execute(select(ResearchSession).where(ResearchSession.id == session_id)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research session not found")

    require_workspace_access(workspace_id=session.workspace_id, current_user=current_user, db=db)
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a research session and its associated messages."""
    session = db.execute(select(ResearchSession).where(ResearchSession.id == session_id)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research session not found")

    require_workspace_access(workspace_id=session.workspace_id, current_user=current_user, db=db)
    db.delete(session)
    db.commit()
    return None

@router.get("/{session_id}/export")
def export_session_markdown(
    session_id: str,
    current_user: User = Depends(get_current_user_flexible),
    db: Session = Depends(get_db)
):
    """Export research report to authentic Markdown with citations and provenance."""
    session = db.execute(select(ResearchSession).where(ResearchSession.id == session_id)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    require_workspace_access(workspace_id=session.workspace_id, current_user=current_user, db=db)

    lines = [
        f"# ATLAS Research Report: {session.title}",
        f"**Generated:** {session.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"**Session ID:** `{session.id}`",
        "",
        "---",
        ""
    ]

    for msg in session.messages:
        if msg.role == "user":
            lines.append(f"### Research Inquiry\n{msg.content}\n")
        else:
            lines.append(f"### Evidence-Grounded Findings\n{msg.content}\n")
            if msg.citations:
                lines.append("#### Verifiable Citations & Sources")
                for c in msg.citations:
                    pg_str = f" (Page {c.page_number})" if c.page_number else ""
                    sec_str = f" — *{c.section_heading}*" if c.section_heading else ""
                    lines.append(f"- **[{c.citation_number}] {c.source_title}**{pg_str}{sec_str}")
                    lines.append(f"  > \"{c.excerpt}\"\n")
            lines.append(f"*Measured Latency: {msg.latency_ms} ms | Retrieval Mode: {msg.retrieval_mode}*\n")
            lines.append("---\n")

    report_content = "\n".join(lines)
    return Response(
        content=report_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=atlas_report_{session.id[:8]}.md"}
    )
