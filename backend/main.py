import json
import os
from database import SessionLocal, init_db
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from models.trip import Trip
from models.user import User
from pydantic import BaseModel
from typing import Any, List, Optional
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_valid_trip_categories,
    get_recommended_places,
    get_transportations
)
from services.bedrock_service import generate_ai_recommendation, build_trip_prompt
from services.auth_service import verify_token

# Try to import auth router - it may not exist yet
try:
    from routers.auth import router as auth_router
    _auth_router_available = True
except ImportError:
    _auth_router_available = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# Auth routes
if _auth_router_available:
    app.include_router(auth_router)

# FastAPI dependency to get current authenticated user
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
    # verify_token raises HTTPException(401) if token is invalid/expired
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

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float

class TripUpdateRequest(BaseModel):
    destination: Optional[str] = None
    days: Optional[int] = None
    budget: Optional[float] = None

class TripRecommendationResponse(BaseModel):
    trip_id: int
    destination: str
    recommendation: List[Any]  # structured JSON: list of day objects

# GET endpoint at the root path
@app.get("/")
def home():
  return {
    "message" : "Welcome to KelanaAI"
  }

# GET Health check endpoint
@app.get("/health")
def health_check():
  return {"status": "OK"}

# GET endpoint for trip categories
@app.get("/api/v1/trip-categories")
def get_all_trip_categories():
    """Return all valid trip categories."""
    return get_valid_trip_categories()

# GET endpoint for recommended places
@app.get("/api/v1/recommendations")
def get_all_places():
    """Return list of recommended places."""
    return get_recommended_places()

# GET endpoint for valid transportations
@app.get("/api/v1/transportations")
def get_all_transportations():
    """Return all valid trip transportations."""
    return get_transportations()

@app.get("/api/v1/trips")
def list_trips(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    # Filter trips to only return those belonging to the authenticated user
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()
    # handling not found
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    # Verify ownership - user can only access their own trips
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You can only access your own trips")
    return trip

# POST endpoint — receives JSON, returns JSON
@app.post("/api/v1/trips")
def create_trip(request: TripRequest, current_user: User = Depends(get_current_user)):
    # reuse Session 2 business logic
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category     = get_trip_category(request.budget)

    # create a Trip ORM object
    trip = Trip(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        category     = category,
        daily_budget = daily_budget,
        user_id      = current_user.id,  # Associate trip with authenticated user
    )

    # save to PostgreSQL
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)   # get the auto-generated id
    db.close()
    return trip

# PUT endpoint — update trip by ID
@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripUpdateRequest, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    # Check if trip exists
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    
    # Verify ownership before updating
    if trip.user_id != current_user.id:
        db.close()
        raise HTTPException(status_code=403, detail="Access denied: You can only update your own trips")
    
    # Update fields if provided
    if request.destination is not None:
        trip.destination = request.destination
    if request.days is not None:
        trip.days = request.days
    if request.budget is not None:
        trip.budget = request.budget
    
    # Recalculate category and daily_budget based on updated budget
    # If budget was updated, recalculate both derived fields
    if request.budget is not None:
        trip.category = get_trip_category(trip.budget)
        trip.daily_budget = calculate_daily_budget(trip.budget, trip.days)
    # If only days were updated (but not budget), recalculate daily_budget only
    elif request.days is not None and request.budget is None:
        trip.daily_budget = calculate_daily_budget(trip.budget, trip.days)
    
    db.commit()
    db.refresh(trip)
    db.close()
    
    return trip

# DELETE endpoint — remove trip by ID
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    # Check if trip exists
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    
    # Verify ownership before deleting
    if trip.user_id != current_user.id:
        db.close()
        raise HTTPException(status_code=403, detail="Access denied: You can only delete your own trips")
    
    # Delete the trip
    result = db.query(Trip).filter(Trip.id == trip_id).delete()
    db.commit()
    db.close()
    
    return {"message": f"Trip with id {trip_id} deleted successfully"}


# POST endpoint — generate AI recommendation for an existing trip
@app.post("/api/v1/trips/{trip_id}/generate", response_model=TripRecommendationResponse)
def generate_trip_recommendation(trip_id: int, current_user: User = Depends(get_current_user)):
    """
    Generate AI recommendation for an existing trip.
    
    Flow:
    1. Retrieve trip based on ID
    2. Build prompt for AI recommendation
    3. Call Bedrock AI service
    4. Receive AI response
    5. Save response to ai_recommendation column
    6. Return formatted response
    """
    # Step 1: Retrieve trip based on ID
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    
    # Verify ownership before generating recommendation
    if trip.user_id != current_user.id:
        db.close()
        raise HTTPException(status_code=403, detail="Access denied: You can only generate recommendations for your own trips")
    
    # Step 2: Build prompt for AI recommendation
    prompt = build_trip_prompt(trip)
    
    # Step 3: Call Bedrock AI service
    try:
        ai_response = generate_ai_recommendation(prompt)
    except Exception as e:
        db.close()
        raise HTTPException(status_code=500, detail=f"Failed to generate AI recommendation: {str(e)}")
    
    # Step 4 & 5: Receive AI response & Save the response into ai_recommendation column
    # ai_response is a list; serialize to JSON string for DB storage
    trip.ai_recommendation = json.dumps(ai_response)
    db.commit()
    db.refresh(trip)
    db.close()
    
    # Step 6: Return the response body as formatted
    return {
        "trip_id": trip.id,
        "destination": trip.destination,
        "recommendation": ai_response
    }