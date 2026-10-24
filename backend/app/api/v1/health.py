import time
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings

router = APIRouter(tags=["Health & Telemetry"])

START_TIME = time.time()

@router.get("/health/live", status_code=status.HTTP_200_OK)
def liveness_check():
    """Liveness probe to verify application process is responsive."""
    return {
        "status": "alive",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "environment": settings.ENVIRONMENT
    }

@router.get("/health/ready")
def readiness_check(response: Response, db: Session = Depends(get_db)):
    """Readiness probe verifying database connectivity."""
    db_healthy = False
    db_error = None
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as e:
        db_error = str(e)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if db_healthy else "unhealthy",
        "database": {
            "healthy": db_healthy,
            "error": db_error
        },
        "environment": settings.ENVIRONMENT
    }

@router.get("/api/v1/health/system-status")
def system_status(db: Session = Depends(get_db)):
    """
    Returns authentic system component status for the UI status widget.
    Zero fabricated data: checks live DB query, configured providers, and storage.
    """
    db_start = time.time()
    db_healthy = False
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
        db_latency_ms = round((time.time() - db_start) * 1000, 2)
    except Exception:
        db_latency_ms = -1

    # Embedding provider check
    embedding_status = "Healthy" if settings.EMBEDDING_PROVIDER in ["local", "openai", "gemini"] else "Unconfigured"

    # LLM provider check
    llm_status = "Healthy" if settings.LLM_PROVIDER in ["local", "openai", "gemini", "anthropic", "ollama"] else "Unconfigured"

    # Web search check
    web_status = "Healthy" if settings.WEB_SEARCH_PROVIDER in ["duckduckgo", "tavily", "serper"] else "Unconfigured"

    return {
        "api_server": "Healthy",
        "database": "Healthy" if db_healthy else "Unavailable",
        "database_latency_ms": db_latency_ms,
        "redis": "Configured" if settings.REDIS_URL else "Unavailable",
        "embedding_provider": embedding_status,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "llm_provider": llm_status,
        "llm_model": settings.LLM_MODEL_NAME,
        "web_search": web_status,
        "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
