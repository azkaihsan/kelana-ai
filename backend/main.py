from database import SessionLocal, init_db
from fastapi import FastAPI, HTTPException
from models.trip import Trip
from pydantic import BaseModel
from typing import Optional
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_valid_trip_categories,
    get_recommended_transportation,
    get_recommended_places,
    get_transportations
)
from services.bedrock_service import generate_ai_recommendation, build_trip_prompt

app = FastAPI()

init_db()

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
    recommendation: str

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
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()
    # handling not found
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip

# POST endpoint — receives JSON, returns JSON
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
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
def update_trip(trip_id: int, request: TripUpdateRequest):
    db = SessionLocal()
    # Check if trip exists
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    
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
def delete_trip(trip_id: int):
    db = SessionLocal()
    # Check if trip exists
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    
    # Delete the trip
    result = db.query(Trip).filter(Trip.id == trip_id).delete()
    db.commit()
    db.close()
    
    return {"message": f"Trip with id {trip_id} deleted successfully"}


# POST endpoint — generate AI recommendation for an existing trip
@app.post("/api/v1/trips/{trip_id}/generate", response_model=TripRecommendationResponse)
def generate_trip_recommendation(trip_id: int):
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
    
    # Step 2: Build prompt for AI recommendation
    prompt = build_trip_prompt(trip)
    
    # Step 3: Call Bedrock AI service
    try:
        ai_response = generate_ai_recommendation(prompt)
    except Exception as e:
        db.close()
        raise HTTPException(status_code=500, detail=f"Failed to generate AI recommendation: {str(e)}")
    
    # Step 4 & 5: Receive AI response & Save the response into ai_recommendation column
    trip.ai_recommendation = ai_response
    db.commit()
    db.refresh(trip)
    db.close()
    
    # Step 6: Return the response body as formatted
    return {
        "trip_id": trip.id,
        "destination": trip.destination,
        "recommendation": ai_response
    }