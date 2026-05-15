import { apiFetch } from "@/lib/api/client";
import type {
  ChatHistoryResponse,
  ChatMessageCreatePayload,
  ChatSendResponse,
  ProposalConfirmationResponse 
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

export async function confirmProposal(
  messageId: string
): Promise<ProposalConfirmationResponse> {
  return apiFetch<ProposalConfirmationResponse>(
    `/chat/messages/${messageId}/confirm`,
    { method: "POST" }
  );
}


export async function rejectProposal(
  messageId: string
): Promise<ProposalConfirmationResponse> {
  return apiFetch<ProposalConfirmationResponse>(
    `/chat/messages/${messageId}/reject`,
    { method: "POST" }
  );
}