from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session
from botocore.exceptions import (
    ClientError,
    ConnectTimeoutError,
    EndpointConnectionError,
    ReadTimeoutError,
)

from services.dependencies import get_current_user, get_db
from models.conversation import Conversation, Message
from models.user import User
from services.bedrock_service import (
    format_messages_for_bedrock,
    generate_chat_response,
)

router = APIRouter(prefix="/api/v1/conversations", tags=["conversations"])


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=100)


class ConversationUpdateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="New conversation title")


class ConversationCreateResponse(BaseModel):
    id: int


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: Optional[str] = None
    created_at: datetime


class MessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Message content")


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime


@router.post(
    "",
    response_model=ConversationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    request: Optional[ConversationCreateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new conversation record in the database linked to the authenticated user.
    
    Returns HTTP 201 Created with the newly generated conversation id.
    """
    title = None
    if request and request.title is not None:
        title = request.title.strip() if request.title.strip() else None

    conversation = Conversation(
        user_id=current_user.id,
        title=title,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return {"id": conversation.id}


@router.get(
    "",
    response_model=List[ConversationResponse],
    status_code=status.HTTP_200_OK,
)
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch all previous conversations belonging to the authenticated user.
    Ordered descending by creation date (newest first).
    
    Returns HTTP 200 OK with an array of conversation objects.
    """
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )
    return conversations


@router.patch(
    "/{id}",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
)
def update_conversation(
    id: int,
    request: ConversationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the title of an existing conversation (rename conversation).
    
    Requirements & Flow:
    1. Validation: Ensure the title field is a non-empty string and enforce max length 100.
       Return 400 Bad Request if invalid.
    2. Security: Verify that conversation {id} exists and belongs to the authenticated user.
       Return 404 Not Found if not found, or 403 Forbidden if not owned by user.
    3. Database Operation: Update the title field of the specified conversation in the database.
    4. Response: Return HTTP 200 OK containing the updated conversation object.
    """
    cleaned_title = request.title.strip()
    if not cleaned_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot be empty or contain only whitespace",
        )
    if len(cleaned_title) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot exceed 100 characters",
        )

    # Verify conversation exists
    conversation = db.query(Conversation).filter(Conversation.id == id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with id {id} not found",
        )

    # Verify ownership
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only update your own conversations",
        )

    # Update database record
    conversation.title = cleaned_title
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get(
    "/{id}/messages",
    response_model=List[MessageResponse],
    status_code=status.HTTP_200_OK,
)
def get_conversation_messages(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch all previous messages for a specific conversation belonging to the authenticated user.
    Ordered ascending by creation date.
    
    Returns HTTP 200 OK with an array of message objects.
    """
    # Verify conversation exists
    conversation = db.query(Conversation).filter(Conversation.id == id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with id {id} not found",
        )

    # Verify ownership
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only view your own conversations",
        )

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )
    return messages


@router.post(
    "/{id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
def send_message(
    id: int,
    request: MessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to an existing conversation and receive an AI-generated reply.
    
    Flow:
    1. Validation: Verify non-empty content and that conversation {id} exists and belongs to current_user.
    2. Save User Input: Persist user message to DB.
    3. Load Context: Retrieve full message history for this conversation.
    4. Format Prompt: Convert DB message history to Bedrock Converse format.
    5. Invoke LLM: Call Bedrock Converse API with formatted messages.
    6. Save AI Output: Persist AI response message to DB.
    7. Return Response: Return HTTP 200 OK with the AI message payload.
    """
    content = request.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty",
        )

    # Verify conversation exists and belongs to authenticated user
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with id {id} not found",
        )

    # Save User Input
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=content,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Load Context: Retrieve message history
    history_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    # Format Prompt for Bedrock Converse API
    formatted_prompt = format_messages_for_bedrock(history_messages)

    # Invoke LLM with error handling
    try:
        ai_reply = generate_chat_response(formatted_prompt)
    except (EndpointConnectionError, ConnectTimeoutError, ReadTimeoutError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bedrock service connection error or timeout: {str(e)}",
        )
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if "Timeout" in error_code or "ServiceUnavailable" in error_code or "Throttling" in error_code:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Bedrock service unavailable or throttled: {str(e)}",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bedrock invocation failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI response: {str(e)}",
        )

    # Save AI Output
    ai_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_reply,
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)

    # Return HTTP 200 OK containing the AI's message payload
    return ai_message
