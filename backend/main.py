from fastapi import FastAPI
from pydantic import BaseModel
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_valid_trip_categories,
    get_recommended_transportation,
    get_recommended_places,
    get_transportations
)

app = FastAPI()

class TripRequest(BaseModel):
	destination: 	str
	days: 		    int
	budget:		    float

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

# POST endpoint — receives JSON, returns JSON
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    recommended_transport = get_recommended_transportation(
        category
    )
    return {
        "destination" : request.destination,
        "days" : request.days,
        "budget" : request.budget,
        "daily_budget" : daily_budget,
        "category" : category,
        "recommended_transport": recommended_transport,
    }