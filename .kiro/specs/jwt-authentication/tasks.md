# Implementation Plan: JWT Authentication System

## Overview

This plan implements a complete JWT-based authentication system for the KelanaAI application. The backend will verify JWT tokens and protect trip endpoints, while the frontend will provide login UI and manage authenticated API requests. All trip operations will be scoped to the authenticated user.

## Tasks

- [x] 1. Implement backend JWT token verification
  - [x] 1.1 Add `verify_token` function to `backend/services/auth_service.py`
    - Decode and validate JWT tokens using jose library
    - Extract user_id from token payload
    - Handle expired tokens and invalid signatures
    - Return user_id on success, raise HTTPException on failure
    - _Requirements: Backend must validate JWT tokens from Authorization header_
  
  - [x] 1.2 Add `get_current_user` dependency in `backend/main.py`
    - Create FastAPI dependency function to extract token from Authorization header
    - Call `verify_token` to validate and extract user_id
    - Query database to fetch User object by user_id
    - Raise 401 Unauthorized if token is missing or invalid
    - Return authenticated User object
    - _Requirements: All protected endpoints need authenticated user context_

- [x] 2. Add authentication endpoints
  - [x] 2.1 Verify auth router exists and is properly mounted
    - Check that `routers/auth.py` contains register and login endpoints
    - Verify endpoints use `auth_service.register()` and `auth_service.login()`
    - Ensure router is included in `backend/main.py` with `app.include_router(auth_router)`
    - _Requirements: Users must be able to register and login via API_

- [x] 3. Protect trip endpoints with authentication
  - [x] 3.1 Add authentication to all trip endpoints in `backend/main.py`
    - Add `current_user: User = Depends(get_current_user)` parameter to these endpoints:
      - `GET /api/v1/trips`
      - `GET /api/v1/trips/{trip_id}`
      - `POST /api/v1/trips`
      - `PUT /api/v1/trips/{trip_id}`
      - `DELETE /api/v1/trips/{trip_id}`
      - `POST /api/v1/trips/{trip_id}/generate`
    - _Requirements: Only authenticated users can access trip resources_
  
  - [x] 3.2 Filter trips by authenticated user
    - Update `GET /api/v1/trips` to filter by `user_id == current_user.id`
    - Update `GET /api/v1/trips/{trip_id}` to verify `trip.user_id == current_user.id` (403 if mismatch)
    - Update `PUT /api/v1/trips/{trip_id}` to verify ownership before updating
    - Update `DELETE /api/v1/trips/{trip_id}` to verify ownership before deleting
    - Update `POST /api/v1/trips/{trip_id}/generate` to verify ownership
    - _Requirements: Users can only access their own trips_
  
  - [x] 3.3 Populate user_id on trip creation
    - Update `POST /api/v1/trips` to set `trip.user_id = current_user.id` before saving
    - _Requirements: New trips must be associated with the authenticated user_

- [x] 4. Checkpoint - Test backend authentication
  - Run backend server and test authentication flow
  - Verify token validation works correctly
  - Verify all trip endpoints require authentication
  - Verify user can only access their own trips
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create frontend login page
  - [x] 5.1 Create login page component at `frontend/app/login/page.tsx`
    - Create form with email and password fields
    - Add submit handler that calls auth API
    - Store JWT token in localStorage on successful login
    - Redirect to home page after login
    - Display error messages for failed authentication
    - Use consistent styling with existing pages
    - _Requirements: Users need UI to authenticate_
  
  - [ ]* 5.2 Add link to login page in navigation
    - Add "Login" link in header navigation
    - Show "Logout" button when user is authenticated
    - _Requirements: Easy access to authentication_

- [x] 6. Create authenticated API client
  - [x] 6.1 Create `frontend/services/authService.ts`
    - Add `login(email, password)` function that calls `POST /api/v1/auth/login`
    - Add `register(name, email, password)` function that calls `POST /api/v1/auth/register`
    - Add `logout()` function that clears token from localStorage
    - Add `getToken()` helper to retrieve token from localStorage
    - Add `isAuthenticated()` helper to check if valid token exists
    - _Requirements: Frontend needs auth API integration_
  
  - [x] 6.2 Create HTTP interceptor utility in `frontend/lib/apiClient.ts`
    - Create wrapper function that adds Authorization header to all requests
    - Read JWT token from localStorage
    - Format as `Bearer {token}` in Authorization header
    - Handle 401 responses by redirecting to login page
    - _Requirements: All API requests need authentication header_

- [x] 7. Update trip service to use authenticated client
  - [x] 7.1 Refactor `frontend/services/tripService.ts` to use apiClient
    - Import and use the authenticated fetch wrapper from `apiClient.ts`
    - Update all trip API calls: `getTrips()`, `getTripById()`, `createTrip()`, `generateTrip()`
    - Ensure Authorization header is included in all requests
    - _Requirements: Trip API calls must include JWT token_

- [ ] 8. Add logout functionality
  - [-] 8.1 Implement logout button in navigation
    - Add logout button that calls `authService.logout()`
    - Clear token from localStorage
    - Redirect to login page after logout
    - Show logout button only when user is authenticated
    - _Requirements: Users need ability to log out_

- [~] 9. Final checkpoint - End-to-end authentication flow
  - Test complete flow: register → login → create trip → logout
  - Verify unauthorized access is blocked
  - Verify token persistence across page refreshes
  - Verify trips are user-scoped
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The backend auth_service.py already has `register()` and `login()` functions implemented
- The Trip model already has a `user_id` foreign key column
- Frontend uses Next.js App Router with TypeScript
- JWT tokens use HS256 algorithm with 24-hour expiration
- Token storage uses localStorage (consider httpOnly cookies for production)
- All trip endpoints must verify user ownership to prevent unauthorized access

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "6.2"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["8.1"] }
  ]
}
```
