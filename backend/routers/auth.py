from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from database import SessionLocal
from services import auth_service
from models.user import User
from models.trip import Trip

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str


class MeResponse(BaseModel):
    id: int
    name: str
    email: str
    trip_count: int


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    Returns JWT access token on successful registration.
    Raises 409 if email already exists.
    """
    # Register user using auth_service
    user = auth_service.register(
        db=db,
        name=request.name,
        email=request.email,
        password=request.password
    )
    
    # Generate JWT token for the newly registered user
    token_data = auth_service.login(db=db, email=request.email, password=request.password)
    
    return token_data


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user and return JWT access token.
    
    Raises 401 if email or password is invalid.
    """
    # Authenticate using auth_service
    token_data = auth_service.login(
        db=db,
        email=request.email,
        password=request.password
    )
    
    return token_data


@router.get("/me", response_model=MeResponse)
def get_current_user_profile(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """
    Return the authenticated user's profile and trip count.

    Extracts identity strictly from the JWT in the Authorization header.
    Does not accept a user_id parameter in the URL or payload.
    Raises 401 if the token is missing or invalid.
    """
    # Validate Authorization header presence
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing",
        )

    # Validate header format: "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>",
        )

    token = parts[1]

    # Decode JWT — raises 401 on invalid/expired token
    user_id = auth_service.verify_token(token)

    # Fetch user record
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    # Count trips belonging to this user
    trip_count = db.query(Trip).filter(Trip.user_id == user_id).count()

    return MeResponse(id=user.id, name=user.name, email=user.email, trip_count=trip_count)
