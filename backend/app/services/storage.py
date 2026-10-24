import hashlib
import os
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB

class StorageService:
    def __init__(self, base_path: str = settings.STORAGE_LOCAL_PATH):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def validate_file(self, filename: str, content: bytes) -> str:
        """Validate file size and extension."""
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the 50MB limit."
            )
        return ext

    def compute_sha256(self, content: bytes) -> str:
        """Compute SHA-256 hash of file contents for deduplication."""
        hasher = hashlib.sha256()
        hasher.update(content)
        return hasher.hexdigest()

    def save_file(self, workspace_id: str, file_hash: str, ext: str, content: bytes) -> str:
        """Save file securely outside web root under workspace directory."""
        ws_dir = self.base_path / workspace_id
        ws_dir.mkdir(parents=True, exist_ok=True)
        file_path = ws_dir / f"{file_hash}{ext}"
        
        with open(file_path, "wb") as f:
            f.write(content)
        return str(file_path)

    def delete_file(self, file_path: str) -> None:
        """Safely delete file from disk if it exists."""
        p = Path(file_path)
        if p.exists() and p.is_file():
            try:
                p.unlink()
            except Exception:
                pass

storage_service = StorageService()
