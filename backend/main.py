def print_trip_summary(destination, days, budget, travel_style, country, currency, travel_month):
    print("========================")
    print("KelanaAI")
    print("========================")
    print(f"Destination  : {destination}")
    print(f"Country      : {country}")
    print(f"Currency     : {currency}")
    print(f"Days         : {days}")
    print(f"Budget       : {budget}")
    print(f"Travel Month : {travel_month}")
    print(f"Travel Style : {travel_style}")

destination = input("Enter destination: ")
country = input("Enter country: ")
days = int(input("Enter number of days: "))
budget = float(input("Enter budget: "))
currency = input("Enter currency: ")
travel_month = input("Enter travel month: ")
travel_style = input("Enter travel style: ")

print_trip_summary(destination, days, budget, travel_style, country, currency, travel_month)

# Get cost inputs
hotel_cost = float(input("Enter Hotel Cost: "))
transportation_cost = float(input("Enter Transportation Cost: "))
food_cost = float(input("Enter Food Cost: "))
miscellaneous_cost = float(input("Enter Miscellaneous Cost: "))

# Calculate total cost
total_cost = hotel_cost + transportation_cost + food_cost + miscellaneous_cost

# Display total estimated cost
print(f"\nTotal Estimated Cost: {total_cost}")

# Check if budget is exceeded
if total_cost > budget:
    print("⚠ Budget exceeded.")