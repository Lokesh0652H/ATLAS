import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMembership
from app.models.document import Document
from app.schemas.workspace import WorkspaceCreate, WorkspaceOut
from app.api.deps import get_current_user, require_workspace_access

router = APIRouter(prefix="/api/v1/workspaces", tags=["Workspaces"])

def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", slug)

@router.get("", response_model=List[WorkspaceOut])
def list_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all workspaces the authenticated user has access to."""
    # Find memberships
    memberships = db.execute(
        select(WorkspaceMembership).where(WorkspaceMembership.user_id == current_user.id)
    ).scalars().all()

    workspace_ids = [m.workspace_id for m in memberships]
    
    # Also include any workspaces owned directly
    owned_workspaces = db.execute(
        select(Workspace).where(Workspace.owner_id == current_user.id)
    ).scalars().all()
    
    all_workspace_ids = list(set(workspace_ids + [w.id for w in owned_workspaces]))
    
    workspaces = db.execute(
        select(Workspace).where(Workspace.id.in_(all_workspace_ids))
    ).scalars().all()

    result = []
    for w in workspaces:
        # Count documents genuinely
        doc_count = db.execute(
            select(func.count(Document.id)).where(Document.workspace_id == w.id)
        ).scalar() or 0

        role = "owner" if w.owner_id == current_user.id else "member"
        for m in memberships:
            if m.workspace_id == w.id:
                role = m.role
                break

        out = WorkspaceOut(
            id=w.id,
            name=w.name,
            slug=w.slug,
            owner_id=w.owner_id,
            role=role,
            document_count=doc_count,
            created_at=w.created_at
        )
        result.append(out)

    return result

@router.post("", response_model=WorkspaceOut, status_code=status.HTTP_201_CREATED)
def create_workspace(
    payload: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new research workspace."""
    base_slug = slugify(payload.name)
    slug = base_slug
    counter = 1
    while db.execute(select(Workspace).where(Workspace.slug == slug)).scalar_one_or_none():
        slug = f"{base_slug}-{counter}"
        counter += 1

    workspace = Workspace(
        name=payload.name,
        slug=slug,
        owner_id=current_user.id
    )
    db.add(workspace)
    db.flush()

    membership = WorkspaceMembership(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(membership)
    db.commit()
    db.refresh(workspace)

    return WorkspaceOut(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        owner_id=workspace.owner_id,
        role="owner",
        document_count=0,
        created_at=workspace.created_at
    )

@router.get("/{workspace_id}", response_model=WorkspaceOut)
def get_workspace_detail(
    workspace: Workspace = Depends(require_workspace_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single workspace details, isolated by authorization."""
    doc_count = db.execute(
        select(func.count(Document.id)).where(Document.workspace_id == workspace.id)
    ).scalar() or 0

    role = "owner" if workspace.owner_id == current_user.id else "member"
    return WorkspaceOut(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        owner_id=workspace.owner_id,
        role=role,
        document_count=doc_count,
        created_at=workspace.created_at
    )
