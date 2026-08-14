from fastapi import FastAPI
from pydantic import BaseModel
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_recommended_transportation,
    get_recommended_places
)

app = FastAPI()

class TripRequest(BaseModel):
	destination: 	str
	days: 		int
	budget:		float
	travel_style: str

# a GET endpoint at the root path
@app.get("/")
def home():
  return {
    "message" : "Welcome to KelanaAI"
  }

# Health check endpoint
@app.get("/health")
def health_check():
  return {"status": "OK"}

# GET endpoint for trip categories
@app.get("/api/v1/trip-categories")
def get_trip_categories():
    """Return all valid trip categories."""
    # Get categories from the mapping in get_recommended_transportation
    return ["Backpacker", "Standard", "Luxury"]

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
        "travel_style": request.travel_style,
        "recommended_transport": recommended_transport,
    }