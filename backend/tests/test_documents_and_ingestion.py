import os
import io
import json
from app.services.extractors import DocumentExtractor
from app.services.chunker import chunker_service
from app.services.embeddings import embedding_service
from app.services.ingestion import process_document_pipeline
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.workspace import Workspace

def test_chunker_service():
    sample_text = (
        "Quantum computing harnesses the phenomena of quantum mechanics to solve complex problems. "
        "Unlike classical computers that use bits, quantum computers use quantum bits or qubits. "
        "Superposition and entanglement are fundamental quantum properties that provide exponential parallelism."
    )
    chunks = chunker_service.chunk_section(
        text=sample_text,
        start_index=0,
        page_number=1,
        section_heading="Quantum Principles"
    )
    assert len(chunks) >= 1
    assert chunks[0].page_number == 1
    assert chunks[0].section_heading == "Quantum Principles"
    assert chunks[0].token_count > 0

def test_embedding_service():
    text1 = "Neural network deep learning transformer models for artificial intelligence"
    text2 = "Neural network deep learning transformer architecture for AI"
    text3 = "Baking fresh artisan sourdough bread using whole wheat flour and yeast"

    vec1 = embedding_service.embed_text(text1)
    vec2 = embedding_service.embed_text(text2)
    vec3 = embedding_service.embed_text(text3)

    assert len(vec1) == 384
    assert len(vec2) == 384
    assert len(vec3) == 384

    # Identical texts produce similarity 1.0
    vec1_duplicate = embedding_service.embed_text(text1)
    assert abs(embedding_service.cosine_similarity(vec1, vec1_duplicate) - 1.0) < 1e-4

    # Semantic similarity: related AI texts must be significantly higher than sourdough bread
    sim_1_2 = embedding_service.cosine_similarity(vec1, vec2)
    sim_1_3 = embedding_service.cosine_similarity(vec1, vec3)

    assert sim_1_2 > 0.6
    assert sim_1_2 > sim_1_3

def test_document_upload_and_pipeline(client, db_session):
    # Register user
    reg = client.post("/api/v1/auth/register", json={
        "email": "ingestion_test@atlas.internal",
        "password": "Password12345!",
        "full_name": "Ingestion Tester"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get workspace
    ws_res = client.get("/api/v1/workspaces", headers=headers)
    workspace_id = ws_res.json()[0]["id"]

    # Upload Markdown file
    md_content = b"# Executive Summary\nAtlas is an ultra-luxury AI research platform.\n\n# Architecture\nBuilt on FastAPI and Next.js."
    files = {"file": ("test_doc.md", io.BytesIO(md_content), "text/markdown")}
    data = {"workspace_id": workspace_id}

    upload_res = client.post("/api/v1/documents/upload", headers=headers, data=data, files=files)
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # Run ingestion pipeline synchronously for test
    process_document_pipeline(doc_id)

    # Verify document status updated to indexed
    detail_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert detail_res.status_code == 200
    doc_data = detail_res.json()
    assert doc_data["processing_status"] == "indexed"
    assert len(doc_data["chunks"]) >= 1

    # Verify chunk properties
    chunk = doc_data["chunks"][0]
    assert "Atlas" in chunk["content"] or "Executive" in chunk["content"]

    # Delete document
    del_res = client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    check_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert check_res.status_code == 404
