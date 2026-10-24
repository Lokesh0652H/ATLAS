import time
import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.database import get_db
from app.models.telemetry import TelemetryEvent
from app.models.document import IngestionJob, Document
from app.config import settings

router = APIRouter(prefix="/api/v1/observability", tags=["Observability & Telemetry"])

@router.get("")
def get_observability_metrics(db: Session = Depends(get_db)):
    """
    Returns authentic measured application telemetry.
    Strictly zero fabricated data: calculations derived from actual DB logs.
    """
    # 1. Total Requests
    total_requests = db.execute(select(func.count(TelemetryEvent.id))).scalar() or 0

    # 2. Error Count & Error Rate
    error_count = db.execute(
        select(func.count(TelemetryEvent.id)).where(TelemetryEvent.status_code >= 400)
    ).scalar() or 0

    error_rate = round((error_count / total_requests * 100), 2) if total_requests > 0 else 0.0

    # 3. Latency Observations & Percentiles
    recent_durations = db.execute(
        select(TelemetryEvent.duration_ms).order_by(TelemetryEvent.created_at.desc()).limit(200)
    ).scalars().all()

    if recent_durations:
        durations_arr = np.array(recent_durations)
        p50_latency = round(float(np.percentile(durations_arr, 50)), 2)
        p95_latency = round(float(np.percentile(durations_arr, 95)), 2)
        avg_latency = round(float(np.mean(durations_arr)), 2)
    else:
        p50_latency = 0.0
        p95_latency = 0.0
        avg_latency = 0.0

    # 4. Ingestion Queue Depth
    queue_depth = db.execute(
        select(func.count(IngestionJob.id)).where(IngestionJob.status.in_(["queued", "processing"]))
    ).scalar() or 0

    total_indexed_docs = db.execute(
        select(func.count(Document.id)).where(Document.processing_status == "indexed")
    ).scalar() or 0

    # 5. Recent Request Events
    recent_events_records = db.execute(
        select(TelemetryEvent).order_by(TelemetryEvent.created_at.desc()).limit(15)
    ).scalars().all()

    events_out = [
        {
            "id": ev.id,
            "endpoint": ev.endpoint,
            "method": ev.method,
            "status_code": ev.status_code,
            "duration_ms": ev.duration_ms,
            "created_at": ev.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        for ev in recent_events_records
    ]

    return {
        "total_requests": total_requests,
        "error_count": error_count,
        "error_rate_percent": error_rate,
        "p50_latency_ms": p50_latency,
        "p95_latency_ms": p95_latency,
        "avg_latency_ms": avg_latency,
        "queue_depth": queue_depth,
        "indexed_documents": total_indexed_docs,
        "recent_events": events_out,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
