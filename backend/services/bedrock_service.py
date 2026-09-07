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


def summarize_message_history(messages: list) -> str:
    """
    Build a concise summary representation of older conversation messages.
    Extracts key user requests and assistant responses into bullet points.
    """
    entries = []
    for msg in messages:
        if hasattr(msg, "role") and hasattr(msg, "content"):
            role = str(msg.role).lower()
            text = str(msg.content or "").strip()
        elif isinstance(msg, dict):
            role = str(msg.get("role", "user")).lower()
            content_val = msg.get("content", "")
            if isinstance(content_val, list) and content_val and isinstance(content_val[0], dict):
                text = str(content_val[0].get("text", "")).strip()
            else:
                text = str(content_val or "").strip()
        else:
            role = "user"
            text = str(msg).strip()

        if not text:
            continue

        normalized_role = "Assistant" if role in ("assistant", "ai", "bot") else "User"
        snippet = text if len(text) <= 150 else text[:147] + "..."
        entries.append(f"{normalized_role}: {snippet}")

    if not entries:
        return "No prior content."

    # If the history of older messages is long, preserve the start and tail with an omission marker
    if len(entries) > 40:
        head = entries[:15]
        tail = entries[-15:]
        omitted_count = len(entries) - 30
        condensed = head + [f"... [{omitted_count} intermediate exchanges summarized] ..."] + tail
        return "\n".join(condensed)

    return "\n".join(entries)


def compress_older_messages(
    messages: list,
    threshold: int = 500,
    keep_recent: int = 100,
) -> list:
    """
    If there are more than `threshold` (default 500) messages in a conversation,
    compress older messages into a single summary message, preserving the
    most recent `keep_recent` messages intact.
    """
    if len(messages) <= threshold:
        return messages

    older_messages = messages[:-keep_recent]
    recent_messages = messages[-keep_recent:]

    summary_text = summarize_message_history(older_messages)
    summary_message = {
        "role": "user",
        "content": f"[Summary of earlier conversation ({len(older_messages)} older messages):\n{summary_text}]",
    }

    return [summary_message] + list(recent_messages)


def format_messages_for_bedrock(
    messages: list,
    threshold: int = 500,
    keep_recent: int = 100,
) -> list:
    """
    Format database messages or raw message objects/dicts into the structured format
    required by Amazon Bedrock Converse API:
    [{"role": "user"|"assistant", "content": [{"text": "..."}]}]

    If there are more than 500 messages in a conversation, compresses older messages
    into a summary message during prompt building.

    Ensures that:
    1. Roles are mapped to 'user' or 'assistant'.
    2. Consecutive messages with identical roles are merged to prevent Bedrock ValidationException.
    3. The first message starts with the 'user' role.
    4. Text content is stripped and non-empty.
    """
    if len(messages) > threshold:
        messages = compress_older_messages(messages, threshold=threshold, keep_recent=keep_recent)

    formatted = []
    for msg in messages:
        if hasattr(msg, "role") and hasattr(msg, "content"):
            role = str(msg.role).lower()
            text = str(msg.content or "").strip()
        elif isinstance(msg, dict):
            role = str(msg.get("role", "user")).lower()
            content_val = msg.get("content", "")
            if isinstance(content_val, list) and content_val and isinstance(content_val[0], dict):
                text = str(content_val[0].get("text", "")).strip()
            else:
                text = str(content_val or "").strip()
        else:
            role = "user"
            text = str(msg).strip()

        if not text:
            continue

        normalized_role = "assistant" if role in ("assistant", "ai", "bot") else "user"

        if formatted and formatted[-1]["role"] == normalized_role:
            formatted[-1]["content"][0]["text"] += f"\n\n{text}"
        else:
            formatted.append({
                "role": normalized_role,
                "content": [{"text": text}]
            })

    # Ensure conversation starts with 'user' role for Bedrock Converse API
    if formatted and formatted[0]["role"] != "user":
        formatted.insert(0, {
            "role": "user",
            "content": [{"text": "Hello"}]
        })

    return formatted


def generate_chat_response(messages: list) -> str:
    """
    Generate conversational AI response using AWS Bedrock Converse API.

    Args:
        messages (list): Formatted list of message dicts for Bedrock Converse API,
                         or message objects to be formatted.

    Returns:
        str: Raw text output generated by the AI assistant.
    """
    if not messages or not isinstance(messages[0], dict) or "content" not in messages[0] or not isinstance(messages[0]["content"], list):
        formatted_messages = format_messages_for_bedrock(messages)
    else:
        formatted_messages = messages

    client = boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("AWS_REGION")
    )

    response = client.converse(
        modelId=os.getenv("MODEL_ID"),
        messages=formatted_messages
    )

    raw_text = response["output"]["message"]["content"][0]["text"]
    return raw_text

