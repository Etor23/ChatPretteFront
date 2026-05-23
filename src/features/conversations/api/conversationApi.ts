import api from "../../../services/apiService";
import { Conversation } from "../types";
import { Message } from "../../messages/types";

export async function createDM(otherUserId: string): Promise<Conversation> {
  const response = await api.post<Conversation>("/conversations/dm", {
    other_user_id: otherUserId,
  });
  return response.data;
}

// alias kept for any existing callers
export const createConversation = createDM;

export async function getConversations(): Promise<Conversation[]> {
  const response = await api.get<any[]>("/conversations");
  const raw = Array.isArray(response.data) ? response.data : [];
  // Normalize: backend may return members as string UIDs instead of objects
  return raw.map((conv) => ({
    ...conv,
    members: (conv.members ?? []).map((m: any) =>
      typeof m === "string" ? { id: m, username: "" } : m
    ),
  })) as Conversation[];
}

export async function getConversationById(id: string): Promise<Conversation> {
  const response = await api.get<Conversation>(`/conversations/get/${id}`);
  return response.data;
}

export async function getMessages(
  conversationId: string,
  limit = 50,
  before?: string
): Promise<Message[]> {
  const params: Record<string, unknown> = { limit };
  if (before) params.before = before;
  const response = await api.get<Message[]>(
    `/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
}
