from app.services.evaluation import EvaluationMetricsCalculator, evaluation_service
from app.models.evaluation import EvaluationDataset, EvaluationExample

def test_metrics_calculator():
    retrieved = ["chunk_1", "chunk_2", "chunk_3", "chunk_4", "chunk_5"]
    ground_truth = ["chunk_3", "chunk_5"]

    recall = EvaluationMetricsCalculator.recall_at_k(retrieved, ground_truth, k=5)
    assert recall == 1.0  # both found

    precision = EvaluationMetricsCalculator.precision_at_k(retrieved, ground_truth, k=5)
    assert precision == 0.4  # 2 hits out of 5

    mrr = EvaluationMetricsCalculator.mrr(retrieved, ground_truth)
    assert mrr == round(1.0 / 3, 4)  # chunk_3 is at rank 3

    ndcg = EvaluationMetricsCalculator.ndcg_at_k(retrieved, ground_truth, k=5)
    assert ndcg > 0.0

    validity = EvaluationMetricsCalculator.citation_validity(
        [{"chunk_id": "chunk_1", "source_type": "document"}, {"chunk_id": "chunk_3", "source_type": "document"}],
        retrieved
    )
    assert validity == 1.0

def test_evaluation_run_endpoint(client, db_session):
    # 1. Register user
    reg = client.post("/api/v1/auth/register", json={
        "email": "eval_tester@atlas.internal",
        "password": "Password12345!",
        "full_name": "Evaluation Engineer"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get workspace
    ws_res = client.get("/api/v1/workspaces", headers=headers)
    workspace_id = ws_res.json()[0]["id"]

    # 3. Create dataset
    ds_payload = {
        "workspace_id": workspace_id,
        "name": "Integration Test Benchmark",
        "examples": [
            {"query": "Quantum physics basics", "relevant_chunk_ids": []},
            {"query": "CRISPR gene editing", "relevant_chunk_ids": []}
        ]
    }
    ds_res = client.post("/api/v1/evaluations/datasets", json=ds_payload, headers=headers)
    assert ds_res.status_code == 201
    dataset_id = ds_res.json()["id"]

    # 4. Execute evaluation run
    run_res = client.post("/api/v1/evaluations/run", json={
        "workspace_id": workspace_id,
        "dataset_id": dataset_id,
        "retrieval_mode": "hybrid",
        "k": 5
    }, headers=headers)
    assert run_res.status_code == 201
    run_data = run_res.json()
    assert run_data["total_examples"] == 2
    assert run_data["status"] == "completed"
    assert run_data["duration_ms"] >= 0
