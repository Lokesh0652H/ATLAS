from app.models.telemetry import TelemetryEvent

def test_observability_endpoint(client, db_session):
    # Log a few dummy telemetry events directly to verify metric calculations
    ev1 = TelemetryEvent(endpoint="/api/v1/search", method="GET", status_code=200, duration_ms=25.0, tokens_used=0)
    ev2 = TelemetryEvent(endpoint="/api/v1/research", method="POST", status_code=201, duration_ms=120.0, tokens_used=150)
    ev3 = TelemetryEvent(endpoint="/api/v1/auth/login", method="POST", status_code=401, duration_ms=15.0, tokens_used=0)

    db_session.add_all([ev1, ev2, ev3])
    db_session.commit()

    res = client.get("/api/v1/observability")
    assert res.status_code == 200
    data = res.json()

    assert data["total_requests"] >= 3
    assert data["error_count"] >= 1
    assert data["error_rate_percent"] > 0
    assert data["p50_latency_ms"] > 0
    assert data["p95_latency_ms"] > 0
    assert len(data["recent_events"]) >= 3
