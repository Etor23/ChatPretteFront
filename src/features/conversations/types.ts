// Conversations types
export interface Conversation {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
}
