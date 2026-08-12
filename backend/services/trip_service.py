"""Trip service module for KelanaAI business logic."""

def calculate_daily_budget(budget, days):
    """Calculate daily budget from total budget and number of days."""
    return budget / days


def get_trip_category(budget):
    """Categorize trip based on budget amount."""
    if budget < 1000:
        return "Backpacker"
    elif budget < 3000:
        return "Standard"
    else:
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
        "Shibuya", 
        "Mount Fuji"
    ]


def get_recommended_transportation(category):
    """Map trip category to recommended transportation."""
    mapping = {
        "Backpacker": "Bus",
        "Standard": "Train", 
        "Luxury": "Flight"
    }
    return mapping.get(category, "Unknown")