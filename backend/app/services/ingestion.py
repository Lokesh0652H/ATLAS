import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import SessionLocal
from app.models.document import Document, IngestionJob
from app.models.chunk import Chunk
from app.services.extractors import DocumentExtractor
from app.services.chunker import chunker_service
from app.services.embeddings import embedding_service

logger = logging.getLogger("atlas.ingestion")

def process_document_pipeline(document_id: str):
    """
    Genuine asynchronous document ingestion pipeline:
    extracting -> chunking -> embedding -> indexing -> completed
    """
    db: Session = SessionLocal()
    try:
        doc = db.execute(select(Document).where(Document.id == document_id)).scalar_one_or_none()
        if not doc:
            logger.error(f"Document {document_id} not found for ingestion.")
            return

        job = db.execute(
            select(IngestionJob).where(IngestionJob.document_id == document_id).order_by(IngestionJob.created_at.desc())
        ).scalars().first()

        if not job:
            job = IngestionJob(document_id=doc.id, status="processing", stage="extracting", progress_percent=10)
            db.add(job)
        else:
            job.status = "processing"
            job.stage = "extracting"
            job.progress_percent = 15

        doc.processing_status = "extracting"
        db.commit()

        # Step 1: Text & Provenance Extraction
        ext = f".{doc.file_type}"
        sections, total_pages = DocumentExtractor.extract(doc.storage_path, ext)
        if total_pages:
            doc.page_count = total_pages

        job.stage = "chunking"
        job.progress_percent = 40
        doc.processing_status = "chunking"
        db.commit()

        # Step 2: Chunking
        all_chunks = []
        chunk_idx = 0
        for sec in sections:
            sec_chunks = chunker_service.chunk_section(
                text=sec.content,
                start_index=chunk_idx,
                page_number=sec.page_number,
                section_heading=sec.section_heading
            )
            all_chunks.extend(sec_chunks)
            chunk_idx += len(sec_chunks)

        job.stage = "embedding"
        job.progress_percent = 70
        doc.processing_status = "embedding"
        db.commit()

        # Step 3: Embeddings Generation
        chunk_records = []
        for c in all_chunks:
            embedding_vec = embedding_service.embed_text(c.content)
            chunk_rec = Chunk(
                document_id=doc.id,
                workspace_id=doc.workspace_id,
                chunk_index=c.chunk_index,
                content=c.content,
                token_count=c.token_count,
                page_number=c.page_number,
                section_heading=c.section_heading,
                embedding_json=json.dumps(embedding_vec)
            )
            chunk_records.append(chunk_rec)

        job.stage = "indexing"
        job.progress_percent = 90
        doc.processing_status = "indexing"
        db.commit()

        # Step 4: Indexing & Persistence
        db.add_all(chunk_records)

        # Step 5: Mark Completed
        doc.processing_status = "indexed"
        doc.error_message = None
        job.status = "completed"
        job.stage = "finished"
        job.progress_percent = 100
        db.commit()
        logger.info(f"Document {doc.id} ({doc.title}) successfully processed and indexed into {len(chunk_records)} chunks.")

    except Exception as exc:
        logger.exception(f"Error in document ingestion pipeline for {document_id}: {exc}")
        db.rollback()
        try:
            doc = db.execute(select(Document).where(Document.id == document_id)).scalar_one_or_none()
            if doc:
                doc.processing_status = "failed"
                doc.error_message = str(exc)
            job = db.execute(
                select(IngestionJob).where(IngestionJob.document_id == document_id)
            ).scalars().first()
            if job:
                job.status = "failed"
                job.stage = "failed"
                job.error_message = str(exc)
            db.commit()
        except Exception:
            pass
    finally:
        db.close()
