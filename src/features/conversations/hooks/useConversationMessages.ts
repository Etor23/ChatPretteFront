import { useCallback, useEffect, useRef, useState } from "react";
import { AUTH_TOKEN_KEY } from "../../../services/apiService";
import { getMessages } from "../api/conversationApi";
import type { ChatMessage, Message } from "../../messages/types";

const WS_BASE =
  process.env.REACT_APP_WS_URL ||
  (process.env.REACT_APP_API_URL || "http://localhost:8080/api")
    .replace(/^http/, "ws")
    .replace(/\/api$/, "");

function toChat(m: Message): ChatMessage {
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.content,
    createdAt: m.created_at,
  };
}

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setWsConnected(false);
  }, []);

  const connectWs = useCallback((convId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    const ws = new WebSocket(
      `${WS_BASE}/ws/conversations/${convId}?token=${encodeURIComponent(token)}`
    );
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => {};

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string);
        if (raw.type === "message") {
          const msg: ChatMessage = {
            id: raw.id,
            conversationId: raw.conversationId,
            senderId: raw.senderId,
            content: raw.content,
            createdAt: raw.createdAt,
          };
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        // ignore malformed frames
      }
    };
  }, []);

  useEffect(() => {
    if (!conversationId) {
      disconnect();
      setMessages([]);
      return;
    }

    setMessages([]);
    setHistoryLoading(true);

    getMessages(conversationId, 50)
      .then((history) => setMessages(history.map(toChat)))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));

    connectWs(conversationId);

    return disconnect;
  }, [conversationId, connectWs, disconnect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
    }
  }, []);

  return { messages, historyLoading, wsConnected, sendMessage };
}
