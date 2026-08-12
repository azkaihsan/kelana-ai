from services.trip_service import calculate_daily_budget, get_trip_category, calculate_total_cost, is_budget_exceeded, get_recommended_places, get_recommended_transportation

def print_trip_summary(destinations, days, budget, travel_style, country, currency, travel_month):
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
    print(f"Travel Style : {travel_style}")

# Collect multiple destinations using a while loop
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
travel_style = input("Enter travel style: ")

# Get cost inputs
hotel_cost = float(input("Enter Hotel Cost: "))
transportation_cost = float(input("Enter Transportation Cost: "))
food_cost = float(input("Enter Food Cost: "))
miscellaneous_cost = float(input("Enter Miscellaneous Cost: "))

# Calculate total cost using service function
total_cost = calculate_total_cost(hotel_cost, transportation_cost, food_cost, miscellaneous_cost)

print_trip_summary(destinations, days, budget, travel_style, country, currency, travel_month)

# Display total estimated cost
print(f"\nTotal Estimated Cost: {total_cost}")

# Check if budget is exceeded using service function
if is_budget_exceeded(total_cost, budget):
    print("⚠ Budget exceeded.")

# Calculate and display trip category and daily budget using service functions
daily = calculate_daily_budget(budget, days)
category = get_trip_category(budget)
print(f"{category} · {daily} {currency}/day")

# Get and display recommended transportation
recommended_transportation = get_recommended_transportation(category)
print(f"Display Recommended Transportation: {recommended_transportation}")

# Get recommended places from service
recommended_places = get_recommended_places()

print(f"\nRecommended Places")
for place in recommended_places:
    print(f" - {place}")

