from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from pathlib import Path
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document, IngestionJob
from app.models.chunk import Chunk
from app.schemas.document import DocumentOut, DocumentDetailOut
from app.api.deps import get_current_user, require_workspace_access
from app.services.storage import storage_service
from app.services.ingestion import process_document_pipeline

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentOut])
def list_documents(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all documents for an authorized workspace."""
    # Ensure user has access to workspace
    require_workspace_access(workspace_id=workspace_id, current_user=current_user, db=db)

    docs = db.execute(
        select(Document).where(Document.workspace_id == workspace_id).order_by(Document.created_at.desc())
    ).scalars().all()

    return docs

@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    workspace_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a research document and trigger asynchronous ingestion pipeline."""
    require_workspace_access(workspace_id=workspace_id, current_user=current_user, db=db)

    content = await file.read()
    filename = file.filename or "untitled_document"
    ext = storage_service.validate_file(filename, content)
    file_hash = storage_service.compute_sha256(content)

    # Check deduplication within the same workspace
    existing = db.execute(
        select(Document).where(
            Document.workspace_id == workspace_id,
            Document.file_hash == file_hash
        )
    ).scalar_one_or_none()

    if existing:
        return existing

    # Save to private storage
    saved_path = storage_service.save_file(workspace_id, file_hash, ext, content)
    clean_ext = ext.lstrip(".")

    doc = Document(
        workspace_id=workspace_id,
        title=Path(filename).stem.replace("_", " ").replace("-", " "),
        filename=filename,
        file_type=clean_ext,
        file_size_bytes=len(content),
        file_hash=file_hash,
        storage_path=saved_path,
        processing_status="uploaded"
    )
    db.add(doc)
    db.flush()

    job = IngestionJob(
        document_id=doc.id,
        status="queued",
        stage="queued",
        progress_percent=0
    )
    db.add(job)
    db.commit()
    db.refresh(doc)

    # Enqueue pipeline
    background_tasks.add_task(process_document_pipeline, doc.id)

    return doc

@router.get("/{document_id}", response_model=DocumentDetailOut)
def get_document_detail(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single document details and its extracted chunks."""
    doc = db.execute(select(Document).where(Document.id == document_id)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    require_workspace_access(workspace_id=doc.workspace_id, current_user=current_user, db=db)

    chunks = db.execute(
        select(Chunk).where(Chunk.document_id == doc.id).order_by(Chunk.chunk_index)
    ).scalars().all()

    return DocumentDetailOut(
        id=doc.id,
        workspace_id=doc.workspace_id,
        title=doc.title,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size_bytes=doc.file_size_bytes,
        processing_status=doc.processing_status,
        page_count=doc.page_count,
        error_message=doc.error_message,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunks=chunks
    )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete document, its associated chunks, and remove file from disk."""
    doc = db.execute(select(Document).where(Document.id == document_id)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    require_workspace_access(workspace_id=doc.workspace_id, current_user=current_user, db=db)

    # Remove file from disk
    storage_service.delete_file(doc.storage_path)

    db.delete(doc)
    db.commit()
    return None
