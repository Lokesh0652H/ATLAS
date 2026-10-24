import pytest
import os

# Use a test database
os.environ["DATABASE_URL"] = "sqlite:///./test_atlas.db"
os.environ["ENVIRONMENT"] = "testing"

from app.database import Base, engine, SessionLocal
from app.main import app
from fastapi.testclient import TestClient

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_atlas.db"):
        try:
            os.remove("./test_atlas.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client():
    return TestClient(app)
