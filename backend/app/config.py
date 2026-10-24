from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional
from pathlib import Path

class Settings(BaseSettings):
    # Application Mode
    ENVIRONMENT: str = Field(default="development", description="Application runtime environment")
    DEBUG: bool = Field(default=True, description="Enable debug mode")
    ATLAS_SECRET_KEY: str = Field(default="atlas_secure_dev_key_do_not_use_in_prod_replace_me_32char", description="Secret key for JWT and signing")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend application URL")
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./atlas_dev.db", description="Database connection URL")
    
    # Cache & Broker
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    
    # Document Storage
    STORAGE_LOCAL_PATH: str = Field(default="./storage/uploads", description="Local disk storage path")
    
    # Embeddings
    EMBEDDING_PROVIDER: str = Field(default="local", description="Provider for vector embeddings: local, openai, gemini")
    EMBEDDING_MODEL_NAME: str = Field(default="all-MiniLM-L6-v2", description="Embedding model name")
    EMBEDDING_DIMENSION: int = Field(default=384, description="Vector dimension")
    
    # LLM / Reasoning Provider
    LLM_PROVIDER: str = Field(default="local", description="LLM provider: local, openai, gemini, anthropic, ollama")
    LLM_MODEL_NAME: str = Field(default="atlas-local-reasoner", description="LLM model identifier")
    
    # Optional Provider Keys
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    GEMINI_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    
    # Web Search
    WEB_SEARCH_PROVIDER: str = Field(default="duckduckgo")
    WEB_SEARCH_API_KEY: Optional[str] = Field(default=None)
    TAVILY_API_KEY: Optional[str] = Field(default=None)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure storage path exists
Path(settings.STORAGE_LOCAL_PATH).mkdir(parents=True, exist_ok=True)
