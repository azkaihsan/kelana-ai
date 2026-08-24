from dotenv import load_dotenv
import boto3
import os

# Load environment variables from .env
load_dotenv()

def build_trip_prompt(trip):
    """
    Build a prompt for AI trip recommendations based on trip details.
    
    Args:
        trip: Trip object containing destination, days, budget, category, etc.
        
    Returns:
        str: Formatted prompt for AI recommendation
    """
    prompt = f"""Create a detailed {trip.days}-day trip itinerary for {trip.destination} suitable for a {trip.category} traveler with a total budget of ${trip.budget:.2f} (daily budget: ${trip.daily_budget:.2f}).

Generate a structured daily plan for each day that MUST include the following sections:

### Morning Activities (required):
Provide 2-3 specific morning activities per day. Include practical timing tips and breakfast/dining options.

### Afternoon Activities (required):
Include recommendations for cultural sites, museums, historical landmarks, and authentic local experiences that showcase the destination's heritage.

### Evening Activities (required):
Add specific suggestions for dinner spots (restaurants, local cuisine) and nightlife options (bars, entertainment venues, evening attractions).

IMPORTANT FORMATTING REQUIREMENTS:
1. Use this exact format for each day's itinerary:
   
   ## Day X: [Theme/Area Name]
   
   **Morning:**
   - [Specific activity 1 with practical details]
   - [Specific activity 2 with timing/location tips]
   - [Optional: Breakfast/lunch recommendation if applicable]
   
   **Afternoon:**
   - [Cultural site or museum visit]
   - [Local experience or heritage activity]
   - [Additional afternoon activity or exploration]
   
   **Evening:**
   - [Dinner spot recommendation with cuisine type]
   - [Nightlife or evening entertainment option]
   - [Optional: Additional evening suggestion]

2. Include practical details like timing ("early to avoid crowds"), specific locations, transportation tips, and budget considerations.
3. Tailor recommendations to the {trip.category} travel style and budget constraints.
4. Prioritize authentic local experiences over generic tourist attractions.
5. Include estimated time allocations and practical travel tips between locations.

EXAMPLE OF EXPECTED OUTPUT FORMAT:
## Day 1: Exploring Tokyo
**Morning:**
- Visit Senso-ji Temple early to avoid crowds.
- Take a stroll around Nakamise Shopping Street.
- Have breakfast at a traditional local bakery nearby.

**Afternoon:**
- Experience a traditional Japanese tea ceremony.
- Explore the Tokyo National Museum to learn about local culture and history.

**Evening:**
- Enjoy dinner at an authentic Izakaya in Hoppy Street.
- Experience the vibrant local nightlife and city lights around Asakusa.

ADDITIONAL REQUIREMENTS:
- Include accommodation recommendations suitable for {trip.category} budget level.
- Provide transportation suggestions within {trip.destination}.
- Add money-saving tips and budget optimization strategies.
- Include cultural etiquette and local customs to be aware of.
- Suggest must-try local foods and where to find them.

Format your complete response as Markdown with headers (##) and bullet lists (-)."""
    
    return prompt


def generate_ai_recommendation(prompt: str) -> str:
    """
    Generate AI recommendation using AWS Bedrock.
    
    Args:
        prompt (str): The prompt to send to the AI model
        
    Returns:
        str: The AI-generated response
    """
    # Create the Bedrock Runtime client
    client = boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("AWS_REGION")
    )

    # Send the prompt using the Converse API
    response = client.converse(
        modelId=os.getenv("MODEL_ID"),
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    )

    # Extract the AI response
    ai_response = response["output"]["message"]["content"][0]["text"]
    return ai_response