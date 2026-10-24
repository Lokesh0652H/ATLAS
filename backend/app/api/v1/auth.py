import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMembership
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", slug)

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user and initialize their default workspace."""
    # Check if user already exists
    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create user
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Automatically create default workspace
    base_slug = slugify(f"{payload.full_name}-workspace")
    slug = base_slug
    counter = 1
    while db.execute(select(Workspace).where(Workspace.slug == slug)).scalar_one_or_none():
        slug = f"{base_slug}-{counter}"
        counter += 1

    workspace = Workspace(
        name=f"{payload.full_name}'s Research Lab",
        slug=slug,
        owner_id=user.id
    )
    db.add(workspace)
    db.flush()

    # Add owner membership
    membership = WorkspaceMembership(
        workspace_id=workspace.id,
        user_id=user.id,
        role="owner"
    )
    db.add(membership)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password."""
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user profile."""
    return UserOut.model_validate(current_user)
