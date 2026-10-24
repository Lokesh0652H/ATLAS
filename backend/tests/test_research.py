import io
from app.services.ingestion import process_document_pipeline

def test_research_pipeline_and_citations(client, db_session):
    # 1. Register user
    reg = client.post("/api/v1/auth/register", json={
        "email": "research_scientist@atlas.internal",
        "password": "Password12345!",
        "full_name": "Dr. Sarah Chen"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Workspace
    ws_res = client.get("/api/v1/workspaces", headers=headers)
    workspace_id = ws_res.json()[0]["id"]

    # 3. Upload document with clear evidence
    doc_content = (
        "# Genomic Medicine\n"
        "CRISPR-Cas9 enables targeted modification of genomic sequences with high specificity. "
        "Clinical trials demonstrated significant positive results in treating sickle cell disease."
    )
    files = {"file": ("crispr_study.md", io.BytesIO(doc_content.encode("utf-8")), "text/markdown")}
    upload = client.post("/api/v1/documents/upload", headers=headers, data={"workspace_id": workspace_id}, files=files)
    doc_id = upload.json()["id"]
    process_document_pipeline(doc_id)

    # 4. Ask grounded question
    res = client.post("/api/v1/research", headers=headers, json={
        "workspace_id": workspace_id,
        "question": "How does CRISPR Cas9 treat sickle cell disease?",
        "retrieval_mode": "hybrid"
    })
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert len(data["messages"]) == 2

    # User message
    user_msg = data["messages"][0]
    assert user_msg["role"] == "user"
    assert "CRISPR" in user_msg["content"]

    # Assistant message
    ast_msg = data["messages"][1]
    assert ast_msg["role"] == "assistant"
    assert ast_msg["has_insufficient_evidence"] is False
    assert len(ast_msg["citations"]) >= 1
    assert ast_msg["citations"][0]["citation_number"] == 1
    assert "crispr" in ast_msg["citations"][0]["source_title"].lower()

    # 5. Ask question with ZERO evidence (insufficient evidence check)
    no_ev_res = client.post("/api/v1/research", headers=headers, json={
        "workspace_id": workspace_id,
        "question": "What is the capital of Mars in the year 3000?",
        "retrieval_mode": "keyword"
    })
    assert no_ev_res.status_code == 201
    no_ev_data = no_ev_res.json()
    no_ev_ast = no_ev_data["messages"][1]
    assert no_ev_ast["has_insufficient_evidence"] is True

    # 6. Session export to Markdown
    session_id = data["id"]
    exp_res = client.get(f"/api/v1/sessions/{session_id}/export", headers=headers)
    assert exp_res.status_code == 200
    assert "text/markdown" in exp_res.headers["content-type"]
    assert "ATLAS Research Report" in exp_res.text
