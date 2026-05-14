/**
 * Tipi per Chat. Match con app/schemas/chat.py
 */


export type MessageRole = "user" | "assistant" | "system" | "tool";


export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  tool_calls: Record<string, unknown> | null;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
}


export interface ChatSendResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}


export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
}


export interface ChatMessageCreatePayload {
  content: string;
}