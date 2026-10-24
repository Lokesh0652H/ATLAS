from app.config import settings
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.research import ResearchSession, ResearchMessage, Citation

def test_settings_loaded():
    assert settings.ENVIRONMENT in ["testing", "development"]
    assert settings.EMBEDDING_DIMENSION == 384
    assert settings.EMBEDDING_PROVIDER in ["local", "openai", "gemini"]

def test_health_live(client):
    res = client.get("/health/live")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "alive"
    assert "uptime_seconds" in data

def test_health_ready(client):
    res = client.get("/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["database"]["healthy"] is True

def test_system_status(client):
    res = client.get("/api/v1/health/system-status")
    assert res.status_code == 200
    data = res.json()
    assert data["api_server"] == "Healthy"
    assert data["database"] == "Healthy"
    assert "last_updated" in data

def test_model_creation(db_session):
    user = User(
        email="test_architect@atlas.internal",
        hashed_password="fake_hashed_secret",
        full_name="Test Architect"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.email == "test_architect@atlas.internal"

    workspace = Workspace(
        name="Primary Lab",
        slug="primary-lab-test",
        owner_id=user.id
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)

    assert workspace.id is not None
    assert workspace.slug == "primary-lab-test"
