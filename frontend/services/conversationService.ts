import { authenticatedFetch } from "@/lib/apiClient";
import type {
  Conversation,
  Message,
  CreateConversationResponse,
} from "@/types/conversation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: string = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) {
        if (typeof body.detail === "string") {
          detail = body.detail;
        } else if (Array.isArray(body.detail)) {
          detail = body.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ");
        } else {
          detail = JSON.stringify(body.detail);
        }
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch all conversations belonging to the authenticated user.
 * Ordered descending by created_at.
 */
export async function listConversations(): Promise<Conversation[]> {
  const res = await authenticatedFetch(`${API_BASE}/conversations`, {
    cache: "no-store",
  });
  return handleResponse<Conversation[]>(res);
}

/**
 * Create a new conversation.
 */
export async function createConversation(
  title?: string
): Promise<CreateConversationResponse> {
  const res = await authenticatedFetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(title ? { title } : {}),
  });
  return handleResponse<CreateConversationResponse>(res);
}

/**
 * Rename an existing conversation.
 */
export async function updateConversation(
  id: number,
  title: string
): Promise<Conversation> {
  const res = await authenticatedFetch(`${API_BASE}/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return handleResponse<Conversation>(res);
}

/**
 * Fetch all messages for a specific conversation.
 * Ordered ascending by created_at.
 */
export async function getConversationMessages(id: number): Promise<Message[]> {
  const res = await authenticatedFetch(`${API_BASE}/conversations/${id}/messages`, {
    cache: "no-store",
  });
  return handleResponse<Message[]>(res);
}

/**
 * Send a message to an active conversation thread and receive the AI-generated reply.
 */
export async function sendMessage(
  id: number,
  content: string
): Promise<Message> {
  const res = await authenticatedFetch(`${API_BASE}/conversations/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return handleResponse<Message>(res);
}

/**
 * Format timestamp into the mockup design format (e.g. "Jul 2, 14:22").
 */
export function formatConversationDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const month = date.toLocaleString("en-US", { month: "short" });
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month} ${day}, ${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/**
 * Format timestamp into a readable 12-hour message time format (e.g. "10:45 AM").
 */
export function formatMessageTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

