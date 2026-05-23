// Conversations types
export interface ConversationMember {
  id: string;
  username: string;
  avatar_url?: string;
  is_online?: boolean;
}

export interface Conversation {
  id: string;
  type: string;
  name?: string;
  members: ConversationMember[];
  created_by: string;
  last_message_preview?: string;
  last_message_at: string | null;
  created_at: string;
}
