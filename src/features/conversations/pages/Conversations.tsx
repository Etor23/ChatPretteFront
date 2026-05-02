import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/apiService";
import styles from "./Conversations.module.css";

type StoredUser = {
  id?: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  birthDate?: string;
  birthdate?: string;
  createdAt?: string;
  created_at?: string;
};

type SearchUser = {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
  birthDate?: string;
  birthdate?: string;
  createdAt?: string;
  created_at?: string;
  status?: "online" | "away" | "offline";
};

type SelectedUserProfile = {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
  status: "online" | "away" | "offline";
  birthDate?: Date;
  createdAt?: Date;
};

type ChatItem = {
  id: string;
  username: string;
  lastMessage: string;
  unread: number;
};

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LIMIT_DEFAULT = 10;
const SEARCH_LIMIT_MAX = 20;

function Conversations() {
  const navigate = useNavigate();
  const conversations: ChatItem[] = [];
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedUser, setSelectedUser] = useState<SelectedUserProfile | null>(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [selectedUserError, setSelectedUserError] = useState("");

  const currentUser = useMemo<StoredUser>(() => {
    const raw = localStorage.getItem("chatprett_user");
    if (!raw) return {};

    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return {};
    }
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const names = name.trim().split(" ").filter(Boolean);
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const mapToSelectedProfile = (user: SearchUser): SelectedUserProfile => {
    const rawBirth = user.birthDate || user.birthdate;
    const rawCreated = user.createdAt || user.created_at;

    return {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      email: user.email,
      status: user.status || "online",
      birthDate: rawBirth ? new Date(rawBirth) : undefined,
      createdAt: rawCreated ? new Date(rawCreated) : undefined,
    };
  };

  const formatDate = (date?: Date, onlyMonthYear?: boolean) => {
    if (!date) return "No especificado";

    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      ...(onlyMonthYear ? {} : { day: "numeric" }),
    });
  };

  const getStatusText = (status: "online" | "away" | "offline") => {
    switch (status) {
      case "online":
        return "En línea";
      case "away":
        return "Ausente";
      default:
        return "Desconectado";
    }
  };

  const getStatusClassName = (status: "online" | "away" | "offline") => {
    switch (status) {
      case "online":
        return styles.statusOnline;
      case "away":
        return styles.statusAway;
      default:
        return styles.statusOffline;
    }
  };

  const loadUserProfile = async (baseUser: SearchUser) => {
    setSelectedUserLoading(true);
    setSelectedUserError("");
    setSelectedUser(mapToSelectedProfile(baseUser));

    try {
      const response = await api.get<SearchUser>(`/users/${baseUser.id}`);
      const merged = {
        ...baseUser,
        ...(response.data || {}),
      };
      setSelectedUser(mapToSelectedProfile(merged));
    } catch {
      setSelectedUserError("No se pudo cargar toda la información del perfil.");
    } finally {
      setSelectedUserLoading(false);
    }
  };

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const limit = Math.min(SEARCH_LIMIT_DEFAULT, SEARCH_LIMIT_MAX);
        const response = await api.get<SearchUser[]>("/users/search", {
          params: {
            q: normalizedQuery,
            limit,
          },
          signal: controller.signal,
        });

        const users = Array.isArray(response.data) ? response.data : [];
        const filteredUsers = users.filter((user) => user.id !== currentUser.id);
        setSearchResults(filteredUsers);
      } catch (error: any) {
        if (error?.code === "ERR_CANCELED") {
          return;
        }

        setSearchResults([]);
        setSearchError("No se pudo buscar usuarios. Intenta de nuevo.");
      } finally {
        setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, currentUser.id]);

  const hasEnoughChars = query.trim().length >= 2;

  return (
    <section className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Chats</h1>
            <div className={styles.searchBox}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar usuarios"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {!hasEnoughChars && query.trim().length > 0 && (
              <p className={styles.searchHint}>Escribe al menos 2 caracteres</p>
            )}
          </div>

          {hasEnoughChars && (
            <div className={styles.searchResultsSection}>
              <h2 className={styles.searchResultsTitle}>Resultados</h2>

              {searchLoading && <p className={styles.searchState}>Buscando usuarios...</p>}

              {!searchLoading && searchError && (
                <p className={`${styles.searchState} ${styles.searchError}`}>{searchError}</p>
              )}

              {!searchLoading && !searchError && searchResults.length === 0 && (
                <p className={styles.searchState}>Sin resultados</p>
              )}

              {!searchLoading && !searchError && searchResults.length > 0 && (
                <div className={styles.searchResultsList}>
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      className={styles.searchRow}
                      type="button"
                      onClick={() => void loadUserProfile(user)}
                    >
                      <div className={styles.chatAvatar}>{getInitials(user.username)}</div>
                      <span className={styles.searchUserName}>{user.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.chatList}>
            <h2 className={styles.chatListTitle}>Tus chats</h2>
            {conversations.length === 0 ? (
              <p className={styles.emptyMessage}>
                Busca un usuario para iniciar un chat
              </p>
            ) : (
              conversations.map((chat) => (
                <button key={chat.id} className={styles.chatRow} type="button">
                  <div className={styles.chatAvatar}>{getInitials(chat.username)}</div>
                  <div className={styles.chatMeta}>
                    <span className={styles.chatName}>{chat.username}</span>
                    <span className={styles.chatPreview}>{chat.lastMessage}</span>
                  </div>
                  {chat.unread > 0 && (
                    <span className={styles.unreadBadge}>{chat.unread}</span>
                  )}
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            className={styles.currentUser}
            onClick={() => navigate("/profile", { state: { user: currentUser } })}
          >
            <div className={styles.currentUserAvatar}>
              {getInitials(currentUser.username)}
            </div>
            <div className={styles.currentUserInfo}>
              <span className={styles.currentUserName}>
                {currentUser.username || "Usuario"}
              </span>
              <span className={styles.connectedStatus}>Conectado</span>
            </div>
          </button>
        </aside>

        <main className={styles.chatPanel}>
          <div className={styles.placeholderBox}>
            <h2>Selecciona un chat</h2>
            <p>El historial de mensajes aparecerá en esta sección.</p>
          </div>
        </main>

        <section className={styles.detailsPanel}>
          <h3>Perfil</h3>

          {!selectedUser && (
            <p className={styles.detailsEmpty}>
              Selecciona un perfil para ver sus datos.
            </p>
          )}

          {selectedUser && (
            <div className={styles.profileCard}>
              <div className={styles.profileHeader}>
                <div className={styles.headerPattern}></div>
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
                    className={`${styles.statusBadge} ${getStatusClassName(
                      selectedUser.status
                    )}`}
                  ></span>
                </div>
              </div>

              <div className={styles.profileBody}>
                <h4 className={styles.userName}>{selectedUser.username}</h4>

                <div className={styles.statusContainer}>
                  <div className={styles.statusItem}>
                    <span
                      className={`${styles.statusDot} ${getStatusClassName(
                        selectedUser.status
                      )}`}
                    ></span>
                    <span className={styles.statusLabel}>
                      {getStatusText(selectedUser.status)}
                    </span>
                  </div>
                </div>

                {selectedUserLoading && (
                  <p className={styles.profileState}>Cargando información del perfil...</p>
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