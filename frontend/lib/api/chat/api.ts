import { apiFetch } from "@/lib/api/client";
import type {
  ChatHistoryResponse,
  ChatMessageCreatePayload,
  ChatSendResponse,
} from "./types";


export async function getChatHistory(): Promise<ChatHistoryResponse> {
  return apiFetch<ChatHistoryResponse>("/chat/messages");
}


export async function sendChatMessage(
  payload: ChatMessageCreatePayload
): Promise<ChatSendResponse> {
  return apiFetch<ChatSendResponse>("/chat/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}