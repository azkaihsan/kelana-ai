import os
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.user import User

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        bytes(password, encoding="utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        bytes(plain_password, encoding="utf-8"),
        bytes(hashed_password, encoding="utf-8"),
    )


def register(db: Session, name: str, email: str, password: str) -> User:
    """Register a new user. Raises 409 if email already exists."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # NEVER store plain text - hash the password
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, email: str, password: str) -> dict:
    """Authenticate a user and return a JWT access token."""
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password against stored hash
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Generate JWT
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode(
        {"sub": str(user.id), "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {"access_token": token, "token_type": "bearer"}


def verify_token(token: str) -> int:
    """
    Decode and validate a JWT token.
    
    Args:
        token: The JWT token string to verify
        
    Returns:
        int: The user_id extracted from the token payload
        
    Raises:
        HTTPException: 401 if token is expired, invalid, or malformed
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        
        if user_id_str is None:
            raise HTTPException(
                status_code=401, 
                detail="Invalid token: missing user identifier"
            )
        
        # Convert user_id from string to integer
        user_id = int(user_id_str)
        return user_id
        
    except JWTError as e:
        # Handles expired tokens, invalid signatures, and malformed tokens
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    except ValueError:
        # Handles case where user_id cannot be converted to int
        raise HTTPException(
            status_code=401,
            detail="Invalid token: malformed user identifier"
        )
