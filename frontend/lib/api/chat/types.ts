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
  assistant_messages: ChatMessage[];
}


// ============================================================
// PROPOSAL TYPES (tool calls)
// ============================================================

export interface TransactionProposalArgs {
  direction: "income" | "expense";
  amount: string;
  description: string;
  merchant: string | null;
  account_id: string;
  category_id: string | null;
  occurred_at: string;
}


export interface TransactionProposal {
  type: "transaction_proposal";
  status: "pending" | "confirmed" | "rejected";
  args: TransactionProposalArgs;
  transaction_id?: string;
  confirmed_at?: string;
  rejected_at?: string;
}


/**
 * Type guard: verifica se un messaggio è una proposta di transazione pending.
 */
export function isPendingProposal(
  msg: { tool_calls: Record<string, unknown> | null }
): boolean {
  if (!msg.tool_calls) return false;
  const tc = msg.tool_calls as { type?: string; status?: string };
  return tc.type === "transaction_proposal" && tc.status === "pending";
}


/**
 * Type guard generico per qualsiasi proposta (qualsiasi status).
 */
export function isTransactionProposal(
  msg: { tool_calls: Record<string, unknown> | null }
): boolean {
  if (!msg.tool_calls) return false;
  return (msg.tool_calls as { type?: string }).type === "transaction_proposal";
}


export interface ProposalConfirmationResponse {
  updated_message: ChatMessage;
  new_message: ChatMessage;
}


export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
}


export interface ChatMessageCreatePayload {
  content: string;
}