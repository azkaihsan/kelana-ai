"""Trip service module for KelanaAI business logic."""

def calculate_daily_budget(budget, days):
    """Calculate daily budget from total budget and number of days."""
    return budget / days


def get_trip_category(budget):
    """Categorize trip based on budget amount."""
    if budget < 1000:
        return "Backpacker"
    elif budget >= 1000 and budget <= 3000:
        return "Standard"
    elif budget > 3000:
        return "Luxury"


def calculate_total_cost(hotel_cost, transportation_cost, food_cost, miscellaneous_cost):
    """Calculate total estimated cost from all cost components."""
    return hotel_cost + transportation_cost + food_cost + miscellaneous_cost


def is_budget_exceeded(total_cost, budget):
    """Check if total cost exceeds budget."""
    return total_cost > budget


def get_recommended_places():
    """Return a list of recommended places."""
    return [
        "Tokyo Tower",
        "Mount Fuji",
        "Shibuya"
    ]

def get_valid_trip_categories():
    """Return a list of trip categories."""
    return [
        "Backpacker", 
        "Standard", 
        "Luxury"
    ]

def get_transportations():
    """Return a list of transportations."""
    return [
        "Bus", 
        "Train", 
        "Flight"
    ]

def get_recommended_transportation(category):
    """Map trip category to recommended transportation."""
    mapping = {
        "Backpacker": "Bus",
        "Standard": "Train", 
        "Luxury": "Flight"
    }
    return mapping.get(category, "Unknown")

    
def get_travel_season(month):
    """Determine travel season based on month."""
    if month == 12:
        return "Peak Season"
    elif month == 6:
        return "Holiday Season"
    else:
        return "Regular Season"


def build_trip_prompt(trip):
    """
    Build a prompt for AI trip recommendations based on trip details.
    
    Args:
        trip: Trip object containing destination, days, budget, category, etc.
        
    Returns:
        str: Formatted prompt for AI recommendation
    """
    prompt = f"""Create a detailed trip itinerary for a {trip.days}-day trip to {trip.destination}.
    
Trip Details:
- Destination: {trip.destination}
- Duration: {trip.days} days
- Total Budget: ${trip.budget:.2f}
- Daily Budget: ${trip.daily_budget:.2f}
- Trip Category: {trip.category}
    
Please provide a detailed day-by-day itinerary including:
1. Activities and attractions for each day
2. Recommended accommodations suitable for the budget
3. Transportation suggestions within the destination
4. Dining and local food recommendations
5. Estimated costs breakdown for each day
6. Tips for making the most of the trip within the given budget
    
Make the itinerary practical, enjoyable, and suitable for the {trip.category} travel style.

Format your response as Markdown with headers (##) and bullet lists (-)."""
    
    return prompt