// Messages types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface MessageState {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
}
