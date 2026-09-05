# Design Document: JWT Authentication System

## Overview

This document describes the design of a JWT-based authentication system for the KelanaAI trip planning application. The system leverages existing authentication logic in `auth_service.py` and exposes it through new API endpoints in `main.py`. All trip management endpoints will be protected, requiring valid JWT tokens for access.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Login Page   │  │ HTTP         │  │ localStorage    │  │
│  │              │→ │ Interceptor  │← │ (access_token)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP + Authorization: Bearer <token>
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     main.py                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Auth Routes  │  │ get_current  │  │ Trip Routes │ │ │
│  │  │ /register    │  │ _user        │→ │ (protected) │ │ │
│  │  │ /login       │  │ (dependency) │  └─────────────┘ │ │
│  │  └──────────────┘  └──────────────┘                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ↓                    ↓               │
│  ┌──────────────────────────┐  ┌──────────────────────┐    │
│  │   auth_service.py        │  │   trip_service.py    │    │
│  │  - register()            │  │  - business logic    │    │
│  │  - login()               │  └──────────────────────┘    │
│  │  - hash_password()       │                               │
│  │  - verify_password()     │                               │
│  │  - verify_token()        │                               │
│  └──────────────────────────┘                               │
│                         ↓                    ↓               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Database (PostgreSQL)                    │  │
│  │   ┌──────────────┐          ┌──────────────┐        │  │
│  │   │ users        │          │ trips        │        │  │
│  │   │ - id (PK)    │←────────┤│ - user_id(FK)│        │  │
│  │   │ - name       │          │ - destination│        │  │
│  │   │ - email      │          │ - budget     │        │  │
│  │   │ - password_  │          │ - ...        │        │  │
│  │   │   hash       │          └──────────────┘        │  │
│  │   └──────────────┘                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Backend Authentication Layer

#### 1.1 Authentication Service (`auth_service.py`)

**Existing Functions (Reused):**
- `hash_password(password: str) -> str`: Hash passwords using bcrypt
- `verify_password(plain_password: str, hashed_password: str) -> bool`: Verify password against hash
- `register(db: Session, name: str, email: str, password: str) -> User`: Register new user
- `login(db: Session, email: str, password: str) -> dict`: Authenticate and return JWT

**New Functions (To Be Added):**

```python
def verify_token(token: str) -> dict:
    """
    Validate JWT token and extract user information.
    
    Args:
        token: JWT token string
        
    Returns:
        dict with 'user_id' key containing the authenticated user's ID
        
    Raises:
        HTTPException(401): If token is invalid, expired, or malformed
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        exp = payload.get("exp")
        
        if user_id is None or exp is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token format"
            )
        
        # JWT library already validates expiration, but we can add explicit check
        if datetime.now(timezone.utc).timestamp() > exp:
            raise HTTPException(
                status_code=401,
                detail="Token has expired"
            )
        
        return {"user_id": int(user_id)}
        
    except jwt.JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )
```

**Constants:**
- `SECRET_KEY`: From environment variable (already exists)
- `ALGORITHM = "HS256"`: JWT signing algorithm (already exists)
- `ACCESS_TOKEN_EXPIRE_MINUTES = 1440`: 24-hour token lifetime (already exists)

#### 1.2 Authentication Dependency (`main.py`)

```python
from fastapi import Depends, HTTPException, Header
from typing import Optional

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency to extract and validate JWT from Authorization header.
    
    Args:
        authorization: Authorization header value (format: "Bearer <token>")
        
    Returns:
        dict: User context with 'user_id' key
        
    Raises:
        HTTPException(401): If authorization fails
    """
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )
    
    # Expected format: "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format"
        )
    
    token = parts[1]
    return verify_token(token)
```

#### 1.3 Authentication Endpoints (`main.py`)

**POST /api/v1/register**

```python
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@app.post("/api/v1/register", response_model=UserResponse, status_code=201)
def register_user(request: RegisterRequest):
    """
    Register a new user account.
    
    Request Body:
        - name: User's full name
        - email: Unique email address
        - password: Plain text password (will be hashed)
        
    Returns:
        201: User object (without password_hash)
        409: Email already registered
        422: Validation error (missing/empty fields)
    """
    db = SessionLocal()
    try:
        user = register(db, request.name, request.email, request.password)
        return UserResponse(id=user.id, name=user.name, email=user.email)
    finally:
        db.close()
```

**POST /api/v1/login**

```python
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

@app.post("/api/v1/login", response_model=TokenResponse)
def login_user(request: LoginRequest):
    """
    Authenticate user and return JWT token.
    
    Request Body:
        - email: User's email
        - password: User's password
        
    Returns:
        200: JWT token with 24-hour expiration
        401: Invalid credentials
    """
    db = SessionLocal()
    try:
        result = login(db, request.email, request.password)
        return TokenResponse(
            access_token=result["access_token"],
            token_type=result["token_type"]
        )
    finally:
        db.close()
```

#### 1.4 Protected Trip Endpoints

All trip endpoints will be modified to include the `get_current_user` dependency:

```python
# Example: List trips (filtered by authenticated user)
@app.get("/api/v1/trips")
def list_trips(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    # Future enhancement: filter by user_id
    # trips = db.query(Trip).filter(Trip.user_id == current_user["user_id"]).all()
    trips = db.query(Trip).all()
    db.close()
    return trips

# Example: Create trip (with user_id association)
@app.post("/api/v1/trips")
def create_trip(
    request: TripRequest,
    current_user: dict = Depends(get_current_user)
):
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category = get_trip_category(request.budget)
    
    trip = Trip(
        destination=request.destination,
        days=request.days,
        budget=request.budget,
        category=category,
        daily_budget=daily_budget,
        user_id=current_user["user_id"]  # Associate with authenticated user
    )
    
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)
    db.close()
    return trip
```

**All Protected Endpoints:**
- `GET /api/v1/trips`: List trips
- `GET /api/v1/trips/{trip_id}`: Get trip details
- `POST /api/v1/trips`: Create trip (with user_id)
- `PUT /api/v1/trips/{trip_id}`: Update trip
- `DELETE /api/v1/trips/{trip_id}`: Delete trip
- `POST /api/v1/trips/{trip_id}/generate`: Generate AI recommendation

### 2. Frontend Authentication Layer

#### 2.1 Login Page Component

**Location:** `frontend/app/login/page.tsx`

**Responsibilities:**
- Display login form (email, password)
- Submit credentials to `/api/v1/login`
- Store JWT token in localStorage on success
- Redirect to home page after successful login
- Display error messages on failure

**Key Logic:**
```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    router.push('/');
    
  } catch (error) {
    setError(error.message);
  }
};
```

#### 2.2 HTTP Interceptor

**Location:** `frontend/lib/api.ts` or similar

**Responsibilities:**
- Retrieve JWT token from localStorage
- Add `Authorization: Bearer <token>` header to all API requests
- Handle 401 responses by clearing token and redirecting to login

**Key Logic:**
```typescript
export const apiClient = {
  async request(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    return response;
  }
};
```

#### 2.3 Logout Functionality

**Implementation:**
- Add logout button in navigation/header
- Clear token from localStorage
- Redirect to login page

```typescript
const handleLogout = () => {
  localStorage.removeItem('access_token');
  router.push('/login');
};
```

### 3. CORS Configuration

The CORS middleware in `main.py` must be updated to support authentication:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,  # Required for Authorization headers
    allow_methods=["*"],
    allow_headers=["*"],  # Includes Authorization header
)
```

### 4. Database Schema

**Users Table (Already Exists):**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL
);
```

**Trips Table (Updated):**
```sql
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    destination VARCHAR NOT NULL,
    days INTEGER NOT NULL,
    budget FLOAT NOT NULL,
    category VARCHAR NOT NULL,
    daily_budget FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ai_recommendation TEXT,
    user_id INTEGER REFERENCES users(id)  -- Nullable for backward compatibility
);
```

## Data Flow

### Registration Flow

```
1. User submits registration form (name, email, password)
   ↓
2. Frontend POST → /api/v1/register
   ↓
3. Backend validates input (non-empty fields, unique email)
   ↓
4. auth_service.register() hashes password with bcrypt
   ↓
5. User record saved to database
   ↓
6. Backend returns 201 with user object (no password_hash)
   ↓
7. Frontend redirects to login page
```

### Login Flow

```
1. User submits login form (email, password)
   ↓
2. Frontend POST → /api/v1/login
   ↓
3. Backend queries user by email
   ↓
4. auth_service.verify_password() validates password
   ↓
5. auth_service.login() generates JWT with:
   - sub: user_id
   - exp: current_time + 24 hours
   - signed with SECRET_KEY using HS256
   ↓
6. Backend returns 200 with access_token and token_type
   ↓
7. Frontend stores token in localStorage
   ↓
8. Frontend redirects to home page
```

### Authenticated Request Flow

```
1. Frontend makes request to protected endpoint
   ↓
2. HTTP interceptor adds: Authorization: Bearer <token>
   ↓
3. Backend endpoint has Depends(get_current_user)
   ↓
4. get_current_user() extracts token from header
   ↓
5. auth_service.verify_token() validates:
   - Signature (using SECRET_KEY + HS256)
   - Expiration (exp claim > current_time)
   - Required claims (sub, exp present)
   ↓
6. Returns user_id extracted from sub claim
   ↓
7. Endpoint logic executes with user_id
   ↓
8. Response returned to frontend
```

### Token Expiration Handling

```
1. Frontend makes request with expired token
   ↓
2. Backend verify_token() detects exp < current_time
   ↓
3. Backend raises HTTPException(401, "Token has expired")
   ↓
4. Frontend receives 401 response
   ↓
5. HTTP interceptor clears localStorage
   ↓
6. Frontend redirects to /login
```

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful login
- **201 Created**: Successful registration
- **401 Unauthorized**: Authentication failures
  - Invalid credentials
  - Missing Authorization header
  - Invalid token format
  - Expired token
  - Invalid signature
  - Malformed token claims
- **409 Conflict**: Email already registered
- **422 Unprocessable Entity**: Validation errors (missing/empty fields)

### Error Response Format

All errors follow FastAPI's HTTPException structure:

```json
{
  "detail": "Human-readable error message"
}
```

**Example Error Responses:**

```json
// Invalid credentials
{
  "detail": "Invalid email or password"
}

// Expired token
{
  "detail": "Token has expired"
}

// Missing header
{
  "detail": "Authorization header missing"
}

// Email conflict
{
  "detail": "Email already registered"
}
```

## Security Considerations

### Password Security
- **Never store plaintext passwords**: All passwords hashed with bcrypt
- **Bcrypt salt rounds**: Uses bcrypt.gensalt() for unique salts per password
- **Password verification**: Uses constant-time comparison via bcrypt.checkpw()

### JWT Security
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret key**: Stored in environment variable, never in code
- **Expiration**: 24-hour token lifetime to limit exposure window
- **Claims validation**: Verify signature, expiration, and required claims

### CORS Security
- **Origin restriction**: Only configured FRONTEND_URL allowed
- **Credentials**: Allow credentials for Authorization header
- **No wildcard origins**: Specific origin prevents CSRF attacks

### Error Messages
- **Generic authentication errors**: Don't reveal whether email exists or password is wrong
- **Consistent timing**: bcrypt's constant-time comparison prevents timing attacks

## Implementation Checklist

### Backend Changes

**auth_service.py:**
- [ ] Add `verify_token()` function

**main.py:**
- [ ] Import necessary types and dependencies
- [ ] Add `get_current_user()` dependency function
- [ ] Create `RegisterRequest`, `LoginRequest`, `UserResponse`, `TokenResponse` models
- [ ] Add POST `/api/v1/register` endpoint
- [ ] Add POST `/api/v1/login` endpoint
- [ ] Update all 6 trip endpoints to include `Depends(get_current_user)`
- [ ] Modify `create_trip()` to populate `user_id` field
- [ ] Verify CORS configuration includes Authorization header

### Frontend Changes

**New Files:**
- [ ] Create `app/login/page.tsx` - Login page component
- [ ] Create `lib/api.ts` - HTTP client with interceptor

**Modified Files:**
- [ ] Update navigation to include logout button
- [ ] Update all trip API calls to use `apiClient`

### Environment Variables

- [ ] Ensure `SECRET_KEY` is set in backend `.env`
- [ ] Ensure `FRONTEND_URL` is set in backend `.env`

### Database Migration

- [ ] Verify `user_id` column exists in `trips` table (nullable)
- [ ] Verify foreign key constraint: `trips.user_id → users.id`

## Testing Strategy

### Unit Tests (Example-based)
- Verify endpoint signatures include authentication dependencies
- Verify constants are defined with correct values
- Verify database schema has correct foreign keys and nullability
- Verify error responses match FastAPI HTTPException format
- Verify CORS configuration

### Property-Based Tests

See **Correctness Properties** section for full property specifications. Key properties include:

- Registration hashes passwords and stores users correctly
- Login generates valid JWTs with correct claims and expiration
- Token validation correctly accepts valid tokens and rejects invalid ones
- Authentication dependency extracts user context from valid tokens
- Protected endpoints enforce authentication and return 401 for invalid/missing tokens
- Trip creation associates trips with authenticated users
- Error responses have consistent format with detail field

### Integration Tests
- Frontend stores token in localStorage after login
- Frontend includes Authorization header in requests
- Frontend handles 401 by clearing token and redirecting
- CORS preflight requests work for authenticated endpoints

## Future Enhancements

### Phase 2 Features (Not in Current Scope)
- **User-specific trip filtering**: `GET /api/v1/trips` returns only user's trips
- **Authorization checks**: Verify user owns trip before update/delete
- **Refresh tokens**: Long-lived tokens to reissue access tokens
- **Password reset**: Email-based password recovery
- **Email verification**: Confirm email before account activation
- **Role-based access control**: Admin vs. regular user permissions

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following potential redundancies:

1. **Registration properties (1.2, 1.3)**: Property 1.2 tests that registration hashes password and stores user, while 1.3 tests response format. These are complementary - one tests backend logic, one tests API contract. Both should be kept.

2. **Login properties (2.2, 2.3)**: Property 2.2 tests JWT generation logic (claims and expiration), while 2.3 tests response format. These are complementary and should both be kept.

3. **Token validation properties (4.2, 4.4, 4.5, 4.6, 4.7)**: These test different aspects of validation:
   - 4.2: Signature verification (valid and invalid)
   - 4.4: Invalid signature error message
   - 4.5: Expired token error message
   - 4.6: Missing claims error message
   - 4.7: Successful extraction of user_id
   
   Properties 4.2 and 4.7 can be combined into a comprehensive validation property that covers both rejection of invalid tokens and successful extraction from valid ones. Properties 4.4, 4.5, 4.6 test specific error messages which should remain separate.

4. **Trip association properties (7.1, 7.2, 7.4)**: These test different aspects of user-trip association:
   - 7.1: Extract user_id from context
   - 7.2: Populate user_id field when creating trip
   - 7.4: Persist user_id to database
   
   These can be combined into one comprehensive property: "For any authenticated trip creation, the trip record should be associated with the authenticated user's ID in the database."

5. **Error format properties (8.1, 8.2, 8.3)**: Property 8.3 (status codes) is about using correct codes, while 8.1 and 8.2 test response format. These can be combined into one property about consistent error responses with correct status codes and detail field.

After reflection, I will consolidate redundant properties to eliminate overlap while maintaining comprehensive coverage.

### Property 1: Registration Password Hashing and Storage

*For any* valid registration request with unique email, name, and password, the system SHALL hash the password using bcrypt and store a user record in the database with the hashed password (never storing plaintext).

**Validates: Requirements 1.2**

### Property 2: Registration Response Format

*For any* successful registration with unique email, the system SHALL return HTTP 201 status with a user object containing id, name, and email fields, explicitly excluding the password_hash field.

**Validates: Requirements 1.3**

### Property 3: Duplicate Email Rejection

*For any* registration request where the email already exists in the users table, the system SHALL return HTTP 409 status with error message "Email already registered".

**Validates: Requirements 1.4**

### Property 4: Registration Field Validation

*For any* registration request with missing or empty name, email, or password fields, the system SHALL reject the request with appropriate validation error before attempting to create a user record.

**Validates: Requirements 1.5**

### Property 5: JWT Generation with Correct Claims

*For any* login request with valid credentials, the system SHALL generate a JWT containing the user's ID in the "sub" claim and an expiration timestamp exactly 24 hours (1440 minutes) in the future from the generation time.

**Validates: Requirements 2.2, 10.1, 10.3**

### Property 6: Login Response Format

*For any* successful login with valid credentials, the system SHALL return HTTP 200 status with access_token and token_type fields.

**Validates: Requirements 2.3**

### Property 7: Invalid Email Rejection

*For any* login request with an email that does not exist in the users table, the system SHALL return HTTP 401 status with error message "Invalid email or password".

**Validates: Requirements 2.4**

### Property 8: Invalid Password Rejection

*For any* login request with a password that does not match the stored password_hash, the system SHALL return HTTP 401 status with error message "Invalid email or password".

**Validates: Requirements 2.5**

### Property 9: JWT Token Validation

*For any* JWT token, the token validation function SHALL verify the signature using SECRET_KEY and HS256 algorithm, verify expiration is in the future, verify required claims (sub, exp) are present, and either return the user_id from the sub claim (for valid tokens) or raise appropriate 401 HTTPException (for invalid, expired, or malformed tokens).

**Validates: Requirements 4.2, 4.3, 4.7**

### Property 10: Invalid Signature Error

*For any* JWT token with an invalid or tampered signature, the token validation SHALL raise HTTPException with status code 401 and detail "Invalid authentication credentials".

**Validates: Requirements 4.4**

### Property 11: Expired Token Error

*For any* JWT token where the exp claim is in the past, the token validation SHALL raise HTTPException with status code 401 and detail "Token has expired".

**Validates: Requirements 4.5**

### Property 12: Malformed Token Error

*For any* JWT token missing required claims (sub or exp), the token validation SHALL raise HTTPException with status code 401 and detail "Invalid token format".

**Validates: Requirements 4.6**

### Property 13: Authorization Header Extraction

*For any* request with Authorization header in format "Bearer {token}", the get_current_user dependency SHALL extract the token and validate it, returning the user context with user_id.

**Validates: Requirements 5.2, 5.5**

### Property 14: Invalid Header Format Error

*For any* Authorization header that does not follow the "Bearer {token}" format, the get_current_user dependency SHALL raise HTTPException with status code 401 and detail "Invalid authorization header format".

**Validates: Requirements 5.4**

### Property 15: Protected Endpoint Authentication Enforcement

*For any* protected trip endpoint (GET, POST, PUT, DELETE, /generate) called without valid authentication token, the system SHALL return HTTP 401 status with an authentication error message.

**Validates: Requirements 6.7**

### Property 16: Trip User Association

*For any* authenticated trip creation request, the system SHALL extract the user_id from the authenticated user context, populate the trip's user_id field, and persist it to the database.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 17: Error Response Consistency

*For any* authentication error (401), registration conflict (409), or authorization error (403), the system SHALL return a JSON response with a "detail" field containing a human-readable error message and the appropriate HTTP status code.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 18: Token Expiration Time

*For any* generated JWT token, the expiration claim (exp) SHALL be set to exactly 24 hours (1440 minutes) from the current UTC time, using timezone-aware datetime objects.

**Validates: Requirements 10.1, 10.3, 10.4**

## Appendix: Code Examples

### Complete get_current_user Implementation

```python
from fastapi import Depends, HTTPException, Header
from typing import Optional
from services.auth_service import verify_token

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency for JWT authentication.
    
    Extracts JWT token from Authorization header, validates it,
    and returns user context.
    
    Args:
        authorization: Value from Authorization header
        
    Returns:
        dict: {"user_id": int} - authenticated user context
        
    Raises:
        HTTPException(401): Authorization header missing
        HTTPException(401): Invalid header format
        HTTPException(401): Token validation failure
    """
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format"
        )
    
    token = parts[1]
    return verify_token(token)  # Raises HTTPException on failure
```

### Complete verify_token Implementation

```python
from datetime import datetime, timezone
from jose import jwt, JWTError
from fastapi import HTTPException

def verify_token(token: str) -> dict:
    """
    Validate JWT token and extract user ID.
    
    Validates:
    - Token signature (using SECRET_KEY and HS256)
    - Token expiration (exp claim must be in future)
    - Required claims (sub and exp must be present)
    
    Args:
        token: JWT token string
        
    Returns:
        dict: {"user_id": int}
        
    Raises:
        HTTPException(401): Token is invalid, expired, or malformed
    """
    try:
        # Decode and verify signature
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract required claims
        user_id = payload.get("sub")
        exp = payload.get("exp")
        
        # Validate required claims exist
        if user_id is None or exp is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token format"
            )
        
        # Validate expiration
        if datetime.now(timezone.utc).timestamp() > exp:
            raise HTTPException(
                status_code=401,
                detail="Token has expired"
            )
        
        return {"user_id": int(user_id)}
        
    except JWTError:
        # Covers signature validation failures
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )
```

### Example Protected Endpoint

```python
@app.post("/api/v1/trips")
def create_trip(
    request: TripRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new trip associated with the authenticated user.
    
    Requires valid JWT token in Authorization header.
    """
    # Business logic
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category = get_trip_category(request.budget)
    
    # Create trip with user association
    trip = Trip(
        destination=request.destination,
        days=request.days,
        budget=request.budget,
        category=category,
        daily_budget=daily_budget,
        user_id=current_user["user_id"]  # Auto-populated from JWT
    )
    
    # Save to database
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)
    db.close()
    
    return trip
```

### Frontend API Client Example

```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIClient {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('access_token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const data = await this.request('/api/v1/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('access_token', data.access_token);
    return data;
  }

  async register(name: string, email: string, password: string) {
    return this.request('/api/v1/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  }

  async createTrip(tripData: TripRequest) {
    return this.request('/api/v1/trips', {
      method: 'POST',
      body: JSON.stringify(tripData)
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
}

export const apiClient = new APIClient();
```
