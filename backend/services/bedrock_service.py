from dotenv import load_dotenv
import boto3
import os

# Load environment variables from .env
load_dotenv()

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