import io
from app.services.ingestion import process_document_pipeline

def test_search_modes(client, db_session):
    # 1. Register user
    reg = client.post("/api/v1/auth/register", json={
        "email": "search_tester@atlas.internal",
        "password": "Password12345!",
        "full_name": "Search Tester"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get workspace
    ws_res = client.get("/api/v1/workspaces", headers=headers)
    workspace_id = ws_res.json()[0]["id"]

    # 3. Upload document with known passages
    content = (
        "# Quantum Physics\n"
        "Quantum superposition allows particles to exist in multiple states simultaneously.\n"
        "# Classical Mechanics\n"
        "Isaac Newton formulated the three classical laws of motion and universal gravitation."
    )
    files = {"file": ("physics.md", io.BytesIO(content.encode("utf-8")), "text/markdown")}
    upload = client.post("/api/v1/documents/upload", headers=headers, data={"workspace_id": workspace_id}, files=files)
    assert upload.status_code == 201
    doc_id = upload.json()["id"]

    process_document_pipeline(doc_id)

    # 4. Keyword Search
    kw_res = client.get(
        f"/api/v1/search?workspace_id={workspace_id}&q=superposition&mode=keyword",
        headers=headers
    )
    assert kw_res.status_code == 200
    kw_data = kw_res.json()
    assert kw_data["total_results"] >= 1
    assert "superposition" in kw_data["results"][0]["content"].lower()

    # 5. Semantic Search
    sem_res = client.get(
        f"/api/v1/search?workspace_id={workspace_id}&q=gravity+and+motion&mode=semantic",
        headers=headers
    )
    assert sem_res.status_code == 200
    sem_data = sem_res.json()
    assert sem_data["total_results"] >= 1

    # 6. Hybrid Search (RRF)
    hyb_res = client.get(
        f"/api/v1/search?workspace_id={workspace_id}&q=quantum+mechanics&mode=hybrid",
        headers=headers
    )
    assert hyb_res.status_code == 200
    hyb_data = hyb_res.json()
    assert hyb_data["mode"] == "hybrid"
    assert hyb_data["latency_ms"] > 0
    assert len(hyb_data["results"]) >= 1
