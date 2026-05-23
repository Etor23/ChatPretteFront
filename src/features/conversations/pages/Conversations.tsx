import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/apiService";
import { logoutUser } from "../../../services/authService";
import { createDM, getConversations } from "../api/conversationApi";
import { useConversationMessages } from "../hooks/useConversationMessages";
import type { Conversation, ConversationMember } from "../types";
import styles from "./Conversations.module.css";

// ── Local types ─────────────────────────────────────────────────────────────

type StoredUser = {
  id?: string;
  username?: string;
  avatar_url?: string;
  email?: string;
};

type SearchUser = {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
  birth_date?: string;
  created_at?: string;
  is_online?: boolean;
};

type SelectedUserProfile = {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
  is_online: boolean;
  birthDate?: Date;
  createdAt?: Date;
};

type ChatItem = {
  id: string;
  username: string;
  avatar_url?: string;
  is_online?: boolean;
  lastMessage: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function formatDate(date?: Date, onlyMonthYear?: boolean) {
  if (!date) return "No especificado";
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    ...(onlyMonthYear ? {} : { day: "numeric" }),
  });
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function UserAvatar({
  username,
  avatarUrl,
  isOnline,
  className,
  dotClass,
}: {
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
  className: string;
  dotClass?: string;
}) {
  return (
    <div className={styles.avatarWithStatus}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className={`${className} ${styles.avatarImg}`} />
      ) : (
        <div className={className}>{getInitials(username)}</div>
      )}
      {isOnline !== undefined && (
        <span
          className={`${styles.statusDotSm} ${isOnline ? styles.statusOnline : styles.statusOffline} ${dotClass ?? ""}`}
        />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function Conversations() {
  const navigate = useNavigate();

  // ── Core data ──────────────────────────────────────────────────────────────
  const [conversationsData, setConversationsData] = useState<Conversation[]>([]);
  const [conversations, setConversations] = useState<ChatItem[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState("");

  // ── Search ─────────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ── Right panel (user profile) ─────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<SelectedUserProfile | null>(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [selectedUserError, setSelectedUserError] = useState("");

  // ── Center panel (active conversation) ────────────────────────────────────
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationCreating, setConversationCreating] = useState(false);
  const [conversationError, setConversationError] = useState("");

  // ── Message input ──────────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Mobile navigation ──────────────────────────────────────────────────────
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // ── Messaging hook ─────────────────────────────────────────────────────────
  const { messages, historyLoading, wsConnected, sendMessage } =
    useConversationMessages(selectedConversation?.id ?? null);

  // ── Current user ──────────────────────────────────────────────────────────
  const currentUser = useMemo<StoredUser>(() => {
    const raw = localStorage.getItem("chatprett_user");
    if (!raw) return {};
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return {};
    }
  }, []);

  // ── Auto-scroll on new messages ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load conversations on mount ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setConversationsLoading(true);
      setConversationsError("");
      try {
        const data = await getConversations();
        const enriched = await enrichMembers(data, currentUser.id);
        setConversationsData(enriched);
        setConversations(buildChatItems(enriched, currentUser.id));
      } catch {
        setConversationsError("No se pudieron cargar los chats");
      } finally {
        setConversationsLoading(false);
      }
    };
    void load();
  }, [currentUser.id]);

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    const tid = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");
      try {
        const res = await api.get<SearchUser[]>("/users/search", {
          params: { q: normalized, limit: SEARCH_LIMIT },
          signal: controller.signal,
        });
        const users = Array.isArray(res.data) ? res.data : [];
        setSearchResults(users.filter((u) => u.id !== currentUser.id));
      } catch (err: any) {
        if (err?.code !== "ERR_CANCELED") {
          setSearchResults([]);
          setSearchError("No se pudo buscar usuarios.");
        }
      } finally {
        setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(tid);
      controller.abort();
    };
  }, [query, currentUser.id]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function buildChatItems(data: Conversation[], currentId?: string): ChatItem[] {
    return data.map((conv) => {
      const other = conv.members.find((m) => m.id !== currentId);
      return {
        id: conv.id,
        username: other?.username ?? conv.name ?? "Conversación",
        avatar_url: other?.avatar_url,
        is_online: other?.is_online,
        lastMessage: conv.last_message_preview ?? "Sin mensajes",
      };
    });
  }

  const loadUserProfile = async (base: SearchUser) => {
    setMobileShowChat(true);
    setSelectedUserLoading(true);
    setSelectedUserError("");
    setConversationError("");
    setSelectedUser(toSelectedProfile(base));
    setSelectedConversation(null);

    try {
      const res = await api.get<SearchUser>(`/users/get/${base.id}`);
      const merged = { ...base, ...(res.data || {}) };
      setSelectedUser(toSelectedProfile(merged));

      // check local list for an existing DM
      const existing = conversationsData.find(
        (c) => c.type === "dm" && c.members.some((m) => m.id === base.id)
      );
      setSelectedConversation(existing ?? null);
    } catch {
      setSelectedUserError("No se pudo cargar el perfil completo.");
    } finally {
      setSelectedUserLoading(false);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    const conv = conversationsData.find((c) => c.id === chatId);
    if (!conv) return;
    setMobileShowChat(true);
    setSelectedConversation(conv);
    setConversationError("");
    setQuery("");

    if (conv.type !== "dm") {
      setSelectedUser(null);
      return;
    }

    const other = conv.members.find((m) => m.id !== currentUser.id);
    if (!other) return;

    // Show partial data immediately, then fetch full profile
    setSelectedUser({
      id: other.id,
      username: other.username,
      avatar_url: other.avatar_url,
      is_online: other.is_online ?? false,
    });
    setSelectedUserLoading(true);
    setSelectedUserError("");

    try {
      const res = await api.get<SearchUser>(`/users/get/${other.id}`);
      setSelectedUser(toSelectedProfile({ ...other, ...res.data }));
    } catch {
    } finally {
      setSelectedUserLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser) return;
    setConversationCreating(true);
    setConversationError("");
    try {
      const newConv = await createDM(selectedUser.id);
      setConversationsData((prev) => [newConv, ...prev]);
      setConversations((prev) => [
        {
          id: newConv.id,
          username: selectedUser.username,
          avatar_url: selectedUser.avatar_url,
          is_online: selectedUser.is_online,
          lastMessage: "Sin mensajes",
        },
        ...prev,
      ]);
      setSelectedConversation(newConv);
    } catch {
      setConversationError("No se pudo crear la conversación.");
    } finally {
      setConversationCreating(false);
    }
  };

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || !wsConnected) return;
    sendMessage(content);
    setInputValue("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    navigate("/login", { replace: true });
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const hasEnoughChars = query.trim().length >= 2;

  const chatPartnerName = selectedConversation
    ? (selectedUser?.username ??
        conversationsData
          .find((c) => c.id === selectedConversation.id)
          ?.members.find((m) => m.id !== currentUser.id)?.username ??
        "Conversación")
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className={styles.page}>
      <div className={`${styles.layout}${mobileShowChat ? ` ${styles.mobileChatActive}` : ""}`}>
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Chats</h1>
            <div className={styles.searchBox}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar usuarios"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {!hasEnoughChars && query.trim().length > 0 && (
              <p className={styles.searchHint}>Escribe al menos 2 caracteres</p>
            )}
          </div>

          {hasEnoughChars ? (
            <div className={styles.searchResultsSection}>
              <h2 className={styles.searchResultsTitle}>Resultados</h2>

              {searchLoading && <p className={styles.searchState}>Buscando...</p>}

              {!searchLoading && searchError && (
                <p className={`${styles.searchState} ${styles.searchError}`}>{searchError}</p>
              )}

              {!searchLoading && !searchError && searchResults.length === 0 && (
                <p className={styles.searchState}>Sin resultados</p>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className={styles.searchResultsList}>
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      className={styles.searchRow}
                      type="button"
                      onClick={() => void loadUserProfile(user)}
                    >
                      <UserAvatar
                        username={user.username}
                        avatarUrl={user.avatar_url}
                        isOnline={user.is_online}
                        className={styles.chatAvatar}
                      />
                      <span className={styles.searchUserName}>{user.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.chatList}>
              <h2 className={styles.chatListTitle}>Tus chats</h2>

              {conversationsLoading && (
                <p className={styles.emptyMessage}>Cargando chats...</p>
              )}

              {!conversationsLoading && conversationsError && (
                <p className={styles.emptyMessage}>{conversationsError}</p>
              )}

              {!conversationsLoading && !conversationsError && conversations.length === 0 && (
                <p className={styles.emptyMessage}>Busca un usuario para iniciar un chat</p>
              )}

              {!conversationsLoading &&
                conversations.map((chat) => (
                  <button
                    key={chat.id}
                    className={`${styles.chatRow} ${selectedConversation?.id === chat.id ? styles.chatRowActive : ""}`}
                    type="button"
                    onClick={() => void handleSelectChat(chat.id)}
                  >
                    <UserAvatar
                      username={chat.username}
                      avatarUrl={chat.avatar_url}
                      isOnline={chat.is_online}
                      className={styles.chatAvatar}
                    />
                    <div className={styles.chatMeta}>
                      <span className={styles.chatName}>{chat.username}</span>
                      <span className={styles.chatPreview}>{chat.lastMessage}</span>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className={styles.sidebarFooter}>
            <button
              type="button"
              className={styles.currentUser}
              onClick={() => navigate("/profile", { state: { user: currentUser } })}
            >
              <UserAvatar
                username={currentUser.username ?? ""}
                avatarUrl={currentUser.avatar_url}
                className={styles.currentUserAvatar}
              />
              <div className={styles.currentUserInfo}>
                <span className={styles.currentUserName}>
                  {currentUser.username || "Usuario"}
                </span>
                <span className={styles.connectedStatus}>Conectado</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnLogout}`}
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M6.5 3A1.5 1.5 0 0 0 5 4.5v7A1.5 1.5 0 0 0 6.5 13h5A1.5 1.5 0 0 0 13 11.5v-7A1.5 1.5 0 0 0 11.5 3h-5zM6 4.5C6 4.224 6.224 4 6.5 4h5c.276 0 .5.224.5.5v7c0 .276-.224.5-.5.5h-5A.5.5 0 0 1 6 11.5v-7z"
                />
                <path
                  fillRule="evenodd"
                  d="M2.646 8.354a.5.5 0 0 1 0-.708L4.793 5.5a.5.5 0 1 1 .707.707L4.207 7.5H9.5a.5.5 0 0 1 0 1H4.207l1.293 1.293a.5.5 0 0 1-.707.707L2.646 8.354z"
                />
              </svg>
              <span style={{ marginLeft: 8 }}>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* ── Chat panel ───────────────────────────────────────────────────── */}
        <main
          className={`${styles.chatPanel} ${selectedConversation ? styles.chatPanelActive : ""}`}
        >
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className={styles.chatHeader}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setMobileShowChat(false)}
                  aria-label="Volver a chats"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {selectedUser && (
                  <UserAvatar
                    username={selectedUser.username}
                    avatarUrl={selectedUser.avatar_url}
                    isOnline={selectedUser.is_online}
                    className={styles.chatAvatarSm}
                  />
                )}
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatHeaderName}>{chatPartnerName}</span>
                  <span className={styles.chatHeaderStatus}>
                    {wsConnected ? "En línea" : "Conectando..."}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className={styles.chatMessages}>
                {historyLoading && (
                  <p className={styles.chatStateMsg}>Cargando mensajes...</p>
                )}

                {!historyLoading && messages.length === 0 && (
                  <p className={styles.chatStateMsg}>
                    Aún no hay mensajes. ¡Sé el primero en escribir!
                  </p>
                )}

                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.messageItem} ${isMe ? styles.mine : styles.theirs}`}
                    >
                      <div className={styles.messageBubble}>{msg.content}</div>
                      <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={styles.chatInputArea}>
                <textarea
                  className={styles.chatInput}
                  placeholder={wsConnected ? "Escribe un mensaje..." : "Conectando..."}
                  value={inputValue}
                  rows={1}
                  disabled={!wsConnected}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                />
                <button
                  type="button"
                  className={styles.sendBtn}
                  disabled={!wsConnected || !inputValue.trim()}
                  onClick={handleSend}
                >
                  Enviar
                </button>
              </div>
            </>
          ) : selectedUser ? (
            <div className={styles.placeholderBox}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setMobileShowChat(false)}
                aria-label="Volver a chats"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Volver
              </button>
              <h2>Inicia una conversación</h2>
              <p>No tienes un chat con {selectedUser.username} todavía.</p>
              {conversationError && (
                <p className={styles.errorText}>{conversationError}</p>
              )}
              <button
                type="button"
                className={`${styles.btn} ${styles.btnCreate}`}
                onClick={handleCreateConversation}
                disabled={conversationCreating}
              >
                {conversationCreating ? "Creando..." : "Iniciar chat"}
              </button>
            </div>
          ) : (
            <div className={styles.placeholderBox}>
              <h2>Selecciona un chat</h2>
              <p>El historial de mensajes aparecerá aquí.</p>
            </div>
          )}
        </main>

        {/* ── Details panel ────────────────────────────────────────────────── */}
        <section className={styles.detailsPanel}>
          <h3>Perfil</h3>

          {!selectedUser ? (
            <p className={styles.detailsEmpty}>
              Selecciona un perfil para ver sus datos.
            </p>
          ) : (
            <div className={styles.profileCard}>
              <div className={styles.profileHeader}>
                <div className={styles.headerPattern} />
              </div>

              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.username}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {getInitials(selectedUser.username)}
                    </div>
                  )}
                  <span
                    className={`${styles.statusBadge} ${
                      selectedUser.is_online ? styles.statusOnline : styles.statusOffline
                    }`}
                  />
                </div>
              </div>

              <div className={styles.profileBody}>
                <h4 className={styles.userName}>{selectedUser.username}</h4>

                <div className={styles.statusContainer}>
                  <div className={styles.statusItem}>
                    <span
                      className={`${styles.statusDot} ${
                        selectedUser.is_online ? styles.statusOnline : styles.statusOffline
                      }`}
                    />
                    <span className={styles.statusLabel}>
                      {selectedUser.is_online ? "En línea" : "Desconectado"}
                    </span>
                  </div>
                </div>

                {selectedUserLoading && (
                  <p className={styles.profileState}>Cargando información...</p>
                )}
                {!selectedUserLoading && selectedUserError && (
                  <p className={`${styles.profileState} ${styles.profileError}`}>
                    {selectedUserError}
                  </p>
                )}

                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <span className={styles.infoLabel}>Correo</span>
                    <span className={styles.infoValue}>
                      {selectedUser.email || "No especificado"}
                    </span>
                  </div>

                  <div className={styles.infoCard}>
                    <span className={styles.infoLabel}>Fecha de nacimiento</span>
                    <span className={styles.infoValue}>
                      {formatDate(selectedUser.birthDate)}
                    </span>
                  </div>

                  <div className={styles.infoCard}>
                    <span className={styles.infoLabel}>Miembro desde</span>
                    <span className={styles.infoValue}>
                      {formatDate(selectedUser.createdAt, true)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default Conversations;

// ── Util ──────────────────────────────────────────────────────────────────────

// When the backend returns members as string UIDs, fetch their profiles in parallel
// so the chat list can show real names and avatars.
async function enrichMembers(
  conversations: Conversation[],
  currentUserId?: string
): Promise<Conversation[]> {
  // Collect unique IDs of other members whose username is not yet populated
  const toFetch = new Set<string>();
  for (const conv of conversations) {
    for (const m of conv.members) {
      if (m.id && m.id !== currentUserId && !m.username) {
        toFetch.add(m.id);
      }
    }
  }

  if (toFetch.size === 0) return conversations;

  // Fetch all missing profiles in parallel, ignore failures
  const profileMap = new Map<string, ConversationMember>();
  await Promise.allSettled(
    Array.from(toFetch).map(async (id) => {
      try {
        const res = await api.get<any>(`/users/get/${id}`);
        profileMap.set(id, {
          id: res.data.id ?? id,
          username: res.data.username ?? id,
          avatar_url: res.data.avatar_url,
          is_online: res.data.is_online,
        });
      } catch {
        // Keep the stub { id, username: "" } — chat list will still show the ID
      }
    })
  );

  return conversations.map((conv) => ({
    ...conv,
    members: conv.members.map((m) => profileMap.get(m.id) ?? m),
  }));
}

function isZeroDate(d?: string | null) {
  return !d || d.startsWith("0001-01-01");
}

// Parse "YYYY-MM-DD" as local time to avoid UTC-midnight → previous-day shift
function parseLocalDate(d: string): Date {
  const parts = d.split("-").map(Number);
  // parts[0]=year, parts[1]=month(1-based), parts[2]=day
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

// Accepts raw API data (both snake_case and camelCase variants)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSelectedProfile(user: any): SelectedUserProfile {
  const rawBirth: string | undefined =
    user.birth_date ?? user.birthDate ?? user.birthdate;
  const rawCreated: string | undefined =
    user.created_at ?? user.createdAt;

  return {
    id: user.id,
    username: user.username,
    avatar_url: user.avatar_url ?? user.avatar,
    email: user.email,
    is_online: user.is_online ?? false,
    birthDate: isZeroDate(rawBirth) ? undefined : parseLocalDate(rawBirth!),
    createdAt: rawCreated ? new Date(rawCreated) : undefined,
  };
}

