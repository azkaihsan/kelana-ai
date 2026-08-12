from services.trip_service import calculate_daily_budget, get_trip_category, calculate_total_cost, is_budget_exceeded, get_recommended_places, get_recommended_transportation, get_travel_season

def print_trip_summary(destinations, days, budget, country, currency, travel_month, total_cost, daily, category, recommended_transportation, recommended_places):
    print("========================")
    print("KelanaAI")
    print("========================")
    print(f"Your Destinations:")
    for i, dest in enumerate(destinations, 1):
        print(f"  {i}. {dest}")
    print(f"Country      : {country}")
    print(f"Currency     : {currency}")
    print(f"Days         : {days}")
    print(f"Budget       : {budget}")
    print(f"Travel Month : {travel_month}")
    # Get travel season using service function
    travel_season = get_travel_season(travel_month)
    print(f"Travel Season: {travel_season}")
    # Display total estimated cost
    print(f"\nTotal Estimated Cost: {total_cost}")
    # Check if budget is exceeded using service function
    if is_budget_exceeded(total_cost, budget):
        print("⚠ Budget exceeded.")
    print(f"{category} · {daily} {currency}/day")
    print(f"Recommended Transportation: {recommended_transportation}")
    print(f"\nRecommended Places")
    for place in recommended_places:
        print(f" - {place}")

destinations = []
print("Enter your destinations (type 'done' when finished):")
while True:
    destination = input(f"Destination {len(destinations) + 1}: ")
    if destination.lower() == 'done':
        if len(destinations) == 0:
            print("Please enter at least one destination.")
            continue
        break
    destinations.append(destination)

country = input("Enter country: ")
days = int(input("Enter number of days: "))
budget = float(input("Enter budget: "))
currency = input("Enter currency: ")
travel_month = input("Enter travel month: ")
hotel_cost = float(input("Enter Hotel Cost: "))
transportation_cost = float(input("Enter Transportation Cost: "))
food_cost = float(input("Enter Food Cost: "))
miscellaneous_cost = float(input("Enter Miscellaneous Cost: "))

# Calculate total cost using service function
total_cost = calculate_total_cost(hotel_cost, transportation_cost, food_cost, miscellaneous_cost)

# Calculate and display trip category and daily budget using service functions
daily = calculate_daily_budget(budget, days)
category = get_trip_category(budget)

# Get and display recommended transportation
recommended_transportation = get_recommended_transportation(category)

# Get recommended places from service
recommended_places = get_recommended_places()

print_trip_summary(destinations, days, budget, country, currency, travel_month, total_cost, daily, category, recommended_transportation, recommended_places)
