"""
routers/auth.py — Register and Login endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth_utils import create_access_token, hash_password, verify_password
from database import get_db
from models import User
from schemas import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    username_cleaned = body.username.strip()
    email_cleaned = body.email.strip().lower()

    if not username_cleaned:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if len(username_cleaned) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 characters long")

    # Clean email if provided, otherwise generate one
    if body.email and body.email.strip():
        email_cleaned = body.email.strip().lower()
    else:
        email_cleaned = f"{username_cleaned.lower()}@example.com"

    # Check for duplicate username case-insensitively
    if db.query(User).filter(User.username.ilike(username_cleaned)).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        username=username_cleaned,
        email=email_cleaned,
        password_hash=hash_password(body.password),
        avatar=body.avatar or "warrior",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.username)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    username_cleaned = body.username.strip()
    # Check case-insensitively for user
    user = db.query(User).filter(User.username.ilike(username_cleaned)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(user.id, user.username)
    return TokenResponse(access_token=token)
