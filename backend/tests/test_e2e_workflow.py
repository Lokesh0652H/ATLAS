import io
from app.services.ingestion import process_document_pipeline

def test_complete_vertical_slice(client, db_session):
    """
    Complete end-to-end vertical slice test:
    1. Register user & authenticate
    2. Retrieve auto-initialized personal workspace
    3. Upload authentic research paper
    4. Execute asynchronous ingestion pipeline (extract -> chunk -> embed -> index)
    5. Execute hybrid search
    6. Execute evidence-grounded research with citation verification
    7. Execute evaluation benchmark
    8. Check observability telemetry
    9. Export research report to Markdown
    """
    # Step 1: Register
    reg = client.post("/api/v1/auth/register", json={
        "email": "portfolio_evaluator@atlas.internal",
        "password": "ProductionQualityPassword2026!",
        "full_name": "Chief Architect"
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Workspace check
    ws_res = client.get("/api/v1/workspaces", headers=headers)
    assert ws_res.status_code == 200
    workspaces = ws_res.json()
    assert len(workspaces) >= 1
    workspace_id = workspaces[0]["id"]

    # Step 3: Upload research document
    doc_content = (
        "# Advancements in High-Temperature Superconductivity\n"
        "Cuprate superconductors demonstrate superconducting transition temperatures above liquid nitrogen boiling point (77 K). "
        "The mechanisms underlying d-wave pairing symmetry involve strong electron correlations and antiferromagnetic spin fluctuations."
    )
    files = {"file": ("superconductivity.md", io.BytesIO(doc_content.encode("utf-8")), "text/markdown")}
    upload_res = client.post(
        "/api/v1/documents/upload",
        headers=headers,
        data={"workspace_id": workspace_id},
        files=files
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # Step 4: Process pipeline
    process_document_pipeline(doc_id)

    # Verify indexed
    doc_detail = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert doc_detail.status_code == 200
    assert doc_detail.json()["processing_status"] == "indexed"
    assert len(doc_detail.json()["chunks"]) >= 1

    # Step 5: Hybrid Search
    search_res = client.get(
        f"/api/v1/search?workspace_id={workspace_id}&q=cuprate+superconductors+nitrogen&mode=hybrid",
        headers=headers
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total_results"] >= 1
    assert search_data["latency_ms"] >= 0

    # Step 6: Evidence-Grounded Research
    research_res = client.post("/api/v1/research", headers=headers, json={
        "workspace_id": workspace_id,
        "question": "What is the transition temperature mechanism of cuprate superconductors?",
        "retrieval_mode": "hybrid"
    })
    assert research_res.status_code == 201
    research_data = research_res.json()
    session_id = research_data["id"]
    assistant_msg = research_data["messages"][1]
    assert assistant_msg["has_insufficient_evidence"] is False
    assert len(assistant_msg["citations"]) >= 1
    assert assistant_msg["citations"][0]["is_verified"] is True

    # Step 7: Evaluation benchmark run
    dataset_res = client.post("/api/v1/evaluations/datasets", headers=headers, json={
        "workspace_id": workspace_id,
        "name": "Superconductivity Evaluation Set",
        "examples": [{"query": "What are cuprate superconductors?", "relevant_chunk_ids": []}]
    })
    assert dataset_res.status_code == 201
    ds_id = dataset_res.json()["id"]

    eval_run_res = client.post("/api/v1/evaluations/run", headers=headers, json={
        "workspace_id": workspace_id,
        "dataset_id": ds_id,
        "retrieval_mode": "hybrid",
        "k": 5
    })
    assert eval_run_res.status_code == 201
    assert eval_run_res.json()["status"] == "completed"

    # Step 8: Observability
    obs_res = client.get("/api/v1/observability")
    assert obs_res.status_code == 200
    assert obs_res.json()["total_requests"] > 0

    # Step 9: Export Markdown Report
    export_res = client.get(f"/api/v1/sessions/{session_id}/export", headers=headers)
    assert export_res.status_code == 200
    assert "Cuprate" in export_res.text or "superconductors" in export_res.text
