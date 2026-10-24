import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.models.telemetry import TelemetryEvent
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.documents import router as documents_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield

app = FastAPI(
    title="ATLAS — Ultra-Luxury AI Research & Knowledge Engine",
    description="Evidence-grounded, verifiable AI research platform API.",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Operational Telemetry Middleware
@app.middleware("http")
async def telemetry_middleware(request: Request, call_next):
    start_time = time.time()
    response = None
    error_msg = None
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        error_msg = str(exc)
        raise exc
    finally:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        status_code = response.status_code if response else 500
        
        # Log to telemetry table for real observability (skip health check noise)
        path = request.url.path
        if not path.startswith("/health") and not path.endswith("/docs") and not path.endswith("/openapi.json"):
            try:
                db = SessionLocal()
                event = TelemetryEvent(
                    endpoint=path,
                    method=request.method,
                    status_code=status_code,
                    duration_ms=duration_ms,
                    tokens_used=0,
                    error_message=error_msg
                )
                db.add(event)
                db.commit()
                db.close()
            except Exception:
                pass



# Mount routes
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(workspaces_router)
app.include_router(documents_router)

@app.get("/")
def root():
    return {
        "product": "ATLAS",
        "tagline": "Turn your questions into verified answers",
        "version": "1.0.0",
        "status": "operational"
    }
