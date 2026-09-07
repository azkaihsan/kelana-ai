from typing import Optional
from fastapi import Header, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User
from services.auth_service import verify_token


def get_db():
    """Dependency to get database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """
    FastAPI dependency that extracts and validates JWT token from Authorization header.
    
    Args:
        authorization: Authorization header value (format: "Bearer <token>")
        
    Returns:
        User: The authenticated user object
        
    Raises:
        HTTPException: 401 if token is missing, malformed, or invalid
    """
    # Check if Authorization header is present
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )
    
    # Validate header format: "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>"
        )
    
    token = parts[1]
    
    # Verify token and extract user_id
    user_id = verify_token(token)
    
    # Query database to fetch User object
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )
        
        return user
    finally:
        db.close()
