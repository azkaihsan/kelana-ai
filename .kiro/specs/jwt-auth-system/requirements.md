# Requirements Document

## Introduction

This document specifies requirements for a JWT-based authentication system for the KelanaAI trip planning application. The system will secure existing trip management endpoints by requiring valid JWT tokens stored in the browser's localStorage. The authentication infrastructure (user registration, login, and JWT generation) already exists in auth_service.py and will be exposed through new endpoints in main.py. All trip endpoints will enforce authentication immediately upon implementation.

## Glossary

- **Auth_System**: The authentication module responsible for user registration, login, JWT generation, and token validation
- **JWT**: JSON Web Token, a signed token containing user identity (user_id) with 24-hour expiration
- **Trip_Endpoint**: Any HTTP endpoint under /api/v1/trips that manages trip resources (list, get, create, update, delete, generate)
- **User**: A registered account with unique email, password hash, and user_id stored in the users table
- **Protected_Resource**: Any trip resource that requires authentication to access or modify
- **Access_Token**: The JWT token returned by the Auth_System after successful login
- **User_Context**: The authenticated user's identity (user_id) extracted from a valid JWT

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to register an account with my name, email, and password, so that I can authenticate and manage my trips.

#### Acceptance Criteria

1. THE Auth_System SHALL expose a POST endpoint at /api/v1/register accepting name, email, and password fields
2. WHEN a registration request is received with a unique email, THE Auth_System SHALL hash the password using bcrypt and store the user record in the users table
3. WHEN a registration request is received with a unique email, THE Auth_System SHALL return HTTP status code 201 with the created user object (excluding password_hash)
4. IF a registration request contains an email that already exists in the users table, THEN THE Auth_System SHALL return HTTP status code 409 with error message "Email already registered"
5. THE Auth_System SHALL validate that name, email, and password fields are present and non-empty before processing registration

### Requirement 2: User Login and Token Generation

**User Story:** As a registered user, I want to login with my email and password and receive a JWT token, so that I can authenticate subsequent requests to protected endpoints.

#### Acceptance Criteria

1. THE Auth_System SHALL expose a POST endpoint at /api/v1/login accepting email and password fields
2. WHEN a login request is received with valid credentials, THE Auth_System SHALL generate a JWT containing the user_id in the "sub" claim and expiration timestamp 24 hours in the future
3. WHEN a login request is received with valid credentials, THE Auth_System SHALL return HTTP status code 200 with access_token and token_type fields
4. IF a login request contains an email that does not exist in the users table, THEN THE Auth_System SHALL return HTTP status code 401 with error message "Invalid email or password"
5. IF a login request contains a password that does not match the stored password_hash, THEN THE Auth_System SHALL return HTTP status code 401 with error message "Invalid email or password"
6. THE Auth_System SHALL use HS256 algorithm for JWT signing with the SECRET_KEY from environment variables

### Requirement 3: Token Storage in Frontend

**User Story:** As a frontend application, I want to store the JWT token in localStorage after successful login, so that it can be included in subsequent authenticated requests.

#### Acceptance Criteria

1. WHEN the frontend receives a successful login response with access_token, THE Frontend_Application SHALL store the access_token value in localStorage with key "access_token"
2. THE Frontend_Application SHALL retrieve the access_token from localStorage and include it in the Authorization header as "Bearer {token}" for all requests to Trip_Endpoints
3. WHEN the user logs out, THE Frontend_Application SHALL remove the access_token from localStorage
4. IF the access_token is expired or invalid, THE Frontend_Application SHALL remove it from localStorage and redirect the user to the login page

### Requirement 4: JWT Token Validation

**User Story:** As a protected endpoint, I want to validate incoming JWT tokens and extract the authenticated user's identity, so that I can enforce access control and associate resources with the correct user.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a token validation function that accepts a JWT token string and returns the User_Context containing user_id
2. WHEN a JWT token is validated, THE Auth_System SHALL verify the token signature using the SECRET_KEY and HS256 algorithm
3. WHEN a JWT token is validated, THE Auth_System SHALL verify that the expiration timestamp (exp claim) is in the future
4. IF a JWT token signature is invalid, THEN THE Auth_System SHALL raise HTTPException with status code 401 and detail "Invalid authentication credentials"
5. IF a JWT token is expired, THEN THE Auth_System SHALL raise HTTPException with status code 401 and detail "Token has expired"
6. IF a JWT token is missing required claims (sub or exp), THEN THE Auth_System SHALL raise HTTPException with status code 401 and detail "Invalid token format"
7. WHEN a valid JWT token is decoded, THE Auth_System SHALL extract the user_id from the "sub" claim and return it as part of User_Context

### Requirement 5: Authentication Dependency for Protected Endpoints

**User Story:** As an API developer, I want a reusable authentication dependency that validates JWT tokens, so that I can easily protect endpoints by adding it to route signatures.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a FastAPI dependency function named get_current_user that extracts and validates the JWT token from the Authorization header
2. WHEN get_current_user is invoked, THE Auth_System SHALL extract the token from the "Authorization" header expecting format "Bearer {token}"
3. IF the Authorization header is missing, THEN THE Auth_System SHALL raise HTTPException with status code 401 and detail "Authorization header missing"
4. IF the Authorization header format is invalid, THEN THE Auth_System SHALL raise HTTPException with status code 401 and detail "Invalid authorization header format"
5. WHEN the token is successfully validated, THE get_current_user dependency SHALL return the User_Context containing the authenticated user_id
6. THE get_current_user dependency SHALL be usable in FastAPI route signatures to automatically protect endpoints

### Requirement 6: Trip Endpoint Protection

**User Story:** As a system administrator, I want all trip management endpoints to require valid authentication, so that only authenticated users can create, view, update, or delete trips.

#### Acceptance Criteria

1. THE Trip_Endpoint at GET /api/v1/trips SHALL require authentication by including the get_current_user dependency
2. THE Trip_Endpoint at GET /api/v1/trips/{trip_id} SHALL require authentication by including the get_current_user dependency
3. THE Trip_Endpoint at POST /api/v1/trips SHALL require authentication by including the get_current_user dependency
4. THE Trip_Endpoint at PUT /api/v1/trips/{trip_id} SHALL require authentication by including the get_current_user dependency
5. THE Trip_Endpoint at DELETE /api/v1/trips/{trip_id} SHALL require authentication by including the get_current_user dependency
6. THE Trip_Endpoint at POST /api/v1/trips/{trip_id}/generate SHALL require authentication by including the get_current_user dependency
7. IF any Trip_Endpoint receives a request without valid authentication, THEN THE Trip_Endpoint SHALL return HTTP status code 401 with an authentication error message

### Requirement 7: User Association with Trips

**User Story:** As a trip management system, I want to automatically associate each trip with the authenticated user who created it, so that trips can be filtered and managed per user in the future.

#### Acceptance Criteria

1. WHEN a POST /api/v1/trips request is received with valid authentication, THE Trip_Endpoint SHALL extract the user_id from User_Context
2. WHEN creating a new trip record, THE Trip_Endpoint SHALL populate the user_id field with the authenticated user's user_id
3. THE Trip model SHALL maintain the user_id field as a foreign key reference to the users table
4. WHEN a trip is created, THE Trip_Endpoint SHALL store the user_id in the database along with other trip attributes
5. THE user_id field SHALL remain nullable to support existing trip records that were created before authentication was implemented

### Requirement 8: Error Response Consistency

**User Story:** As a frontend developer, I want consistent error response formats for authentication failures, so that I can handle errors uniformly across the application.

#### Acceptance Criteria

1. WHEN an authentication error occurs (401 status), THE Auth_System SHALL return a JSON response with a "detail" field containing a human-readable error message
2. WHEN a registration conflict occurs (409 status), THE Auth_System SHALL return a JSON response with a "detail" field containing the error message
3. THE Auth_System SHALL use standard HTTP status codes for authentication and authorization errors: 401 for authentication failures, 403 for authorization failures, 409 for registration conflicts
4. THE error response format SHALL be compatible with FastAPI's default HTTPException structure

### Requirement 9: CORS Configuration for Authentication

**User Story:** As a frontend application running on a different origin, I want the backend to accept authentication headers in CORS requests, so that JWT tokens can be sent from the browser.

#### Acceptance Criteria

1. THE Backend_Application SHALL include "Authorization" in the allowed CORS headers
2. THE Backend_Application SHALL set allow_credentials to true to support authenticated requests with cookies or authorization headers
3. THE Backend_Application SHALL continue to allow requests from the FRONTEND_URL environment variable origin
4. THE CORS configuration SHALL support preflight OPTIONS requests for authenticated endpoints

### Requirement 10: Token Expiration Configuration

**User Story:** As a system administrator, I want JWT tokens to expire after 24 hours, so that there is a balance between user convenience and security.

#### Acceptance Criteria

1. THE Auth_System SHALL set the JWT expiration time (exp claim) to 24 hours (1440 minutes) from the token generation timestamp
2. THE Auth_System SHALL use the ACCESS_TOKEN_EXPIRE_MINUTES constant with value 1440 to configure token lifetime
3. WHEN generating a JWT, THE Auth_System SHALL calculate the expiration timestamp as current UTC time plus ACCESS_TOKEN_EXPIRE_MINUTES
4. THE Auth_System SHALL use timezone-aware datetime objects with UTC timezone for token expiration calculations
