from dotenv import load_dotenv
import boto3
import json
import os
import re

# Load environment variables from .env
load_dotenv()


def build_trip_prompt(trip):
    """
    Build a prompt for AI trip recommendations based on trip details.

    Args:
        trip: Trip object containing destination, days, budget, category, etc.

    Returns:
        str: Formatted prompt string requesting a structured JSON response
    """
    prompt = f"""You are a professional travel planner. Create a detailed {trip.days}-day trip itinerary for {trip.destination}.

Traveler profile:
- Budget style: {trip.category}
- Total budget: ${trip.budget:.2f}
- Daily budget: ${trip.daily_budget:.2f}

IMPORTANT: You MUST respond with ONLY a valid JSON array. Do NOT include any markdown, code fences, or extra text before or after the JSON.

Return a JSON array where each element represents one day and has this exact structure:
{{
  "day": <integer>,
  "title": "<Day X: Theme or area name>",
  "travel_tips": [
    "<tip 1: specific transport, timing, or cultural advice>",
    "<tip 2>",
    "<tip 3>"
  ],
  "local_food": [
    "<food/restaurant recommendation 1 with description>",
    "<food/restaurant recommendation 2>",
    "<food/restaurant recommendation 3>"
  ],
  "budget_breakdown": {{
    "accommodation": "<estimated cost and suggestion>",
    "food": "<estimated daily food cost>",
    "transport": "<estimated transport cost>",
    "activities": "<estimated activities/entrance fee cost>",
    "total": "<total estimated daily spend>"
  }}
}}

Requirements:
- Tailor all suggestions to a {trip.category} traveler with a ${trip.daily_budget:.2f}/day budget.
- travel_tips: practical advice (best time to visit, transport between spots, etiquette, how to avoid crowds).
- local_food: specific restaurants, street food stalls, or dishes with context about why they are worth trying.
- budget_breakdown: realistic cost estimates in USD for the {trip.destination} context.
- Provide exactly {trip.days} day objects in the array.
- Respond with ONLY the JSON array, no other text."""

    return prompt


def generate_ai_recommendation(prompt: str) -> list:
    """
    Generate AI recommendation using AWS Bedrock and return parsed JSON.

    Args:
        prompt (str): The prompt to send to the AI model

    Returns:
        list: Parsed list of day objects, each containing travel_tips,
              local_food, and budget_breakdown fields.
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

    # Extract the raw text response
    raw_text = response["output"]["message"]["content"][0]["text"]

    # Strip markdown code fences if the model wraps the JSON anyway
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    # Parse and return the JSON list
    return json.loads(cleaned)
