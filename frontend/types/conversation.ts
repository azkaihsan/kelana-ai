export interface Conversation {
  id: number;
  user_id: number;
  title: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface CreateConversationResponse {
  id: number;
}

export interface SendMessagePayload {
  content: string;
}
