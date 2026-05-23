import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { getMe } from "../../../services/authService";
import type { UserResponse } from "../../types";
import { User } from "../types";
import styles from "./UserProfile.module.css";

type ProfileLocationState = {
  user?: UserResponse;
};

// "0001-01-01" is Go's zero time for unset dates
function isZeroDate(d?: string | null) {
  return !d || d.startsWith("0001-01-01");
}

// "YYYY-MM-DD" → local midnight (avoids UTC-offset day shift)
function parseLocalDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

const mapUserResponseToProfile = (user: any): User => {
  const rawBirth: string | undefined =
    user.birth_date ?? user.birthDate ?? user.birthdate;
  const rawCreated: string | undefined =
    user.created_at ?? user.createdAt;
  return {
    id: user.id,
    name: user.username,
    email: user.email,
    avatar: user.avatar_url ?? user.avatar,
    status: "online",
    birthDate: isZeroDate(rawBirth) ? undefined : parseLocalDate(rawBirth!),
    createdAt: rawCreated ? new Date(rawCreated) : undefined,
  };
};

function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialUserFromState = (location.state as ProfileLocationState | null)?.user;
  const storedUserJson = localStorage.getItem("chatprett_user");
  const initialUser = initialUserFromState || (storedUserJson ? JSON.parse(storedUserJson) : undefined);

  const [user, setUser] = useState<User | null>(
    initialUser ? mapUserResponseToProfile(initialUser) : null
  );
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState("");

  useEffect(() => {
    // Si ya tenemos ambos campos de fecha en el usuario inicial (localStorage o navigation state),
    // no hacemos la petición a /auth/me y usamos esos datos directamente.
    let cancelled = false;

    // Skip the API call only when we already have created_at (birth_date is optional)
    const hasCreatedAt = (u: any) => !!(u?.created_at || u?.createdAt);

    if (initialUser && hasCreatedAt(initialUser)) {
      setUser(mapUserResponseToProfile(initialUser));
      setLoading(false);
      return () => { cancelled = true; };
    }

    const loadProfile = async () => {
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(mapUserResponseToProfile(me));
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar el perfil. Vuelve a iniciar sesión.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
    // initialUser se deriva de location.state y localStorage en cada render,
    // la dependencia vacía es intencional para ejecutar solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <section className={`min-vh-100 ${styles.gradientBg}`}>
        <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
          <div className="text-center text-white">Cargando perfil...</div>
        </div>
      </section>
    );
  }

  if (error || !user) {
    return (
      <section className={`min-vh-100 ${styles.gradientBg}`}>
        <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
          <div className="alert alert-danger text-center">{error}</div>
        </div>
      </section>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return styles.statusOnline;
      case "away":
        return styles.statusAway;
      case "offline":
        return styles.statusOffline;
      default:
        return styles.statusOffline;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "online":
        return "En línea";
      case "away":
        return "Ausente";
      case "offline":
        return "Desconectado";
      default:
        return "Desconectado";
    }
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return "Hace mucho tiempo";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Ahora mismo";
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
    return `Hace ${days} día${days > 1 ? "s" : ""}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <section className={`min-vh-100 ${styles.gradientBg}`}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-6">
            {/* Card principal */}
            <div className={styles.profileCard}>
              {/* Header con gradiente */}
              <div className={styles.profileHeader}>
                <div className={styles.headerActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary} ${styles.backButton}`}
                    onClick={() => navigate("/chats")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.854 4.646a.5.5 0 0 1 0 .708L3.707 7.5H14.5a.5.5 0 0 1 0 1H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0z" />
                    </svg>
                    Volver
                  </button>
                </div>
                <div className={styles.headerPattern}></div>
              </div>

              {/* Avatar y estado */}
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "Usuario"}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span
                    className={`${styles.statusBadge} ${getStatusColor(
                      user.status
                    )}`}
                  ></span>
                </div>
              </div>

              {/* Información del usuario */}
              <div className={styles.profileBody}>
                <h2 className={styles.userName}>{user.name || "Usuario"}</h2>

                {/* Estado y actividad */}
                <div className={styles.statusContainer}>
                  <div className={styles.statusItem}>
                    <span
                      className={`${styles.statusDot} ${getStatusColor(
                        user.status
                      )}`}
                    ></span>
                    <span className={styles.statusLabel}>
                      {getStatusText(user.status)}
                    </span>
                  </div>
                  {user.status !== "online" && (
                    <div className={styles.lastSeen}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                      </svg>
                      <span>{formatLastSeen(user.lastSeen)}</span>
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M4 4a.5.5 0 0 0 0 1h8a.5.5 0 0 0 0-1H4zm0 5a.5.5 0 0 0 0 1h8a.5.5 0 0 0 0-1H4zm0 5a.5.5 0 0 0 0 1h8a.5.5 0 0 0 0-1H4z" />
                        <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.71l-5.223 2.206A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z" />
                      </svg>
                    </div>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Correo</span>
                      <span className={styles.infoValue}>{user.email}</span>
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
                      </svg>
                    </div>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Fecha de Nacimiento</span>
                      <span className={styles.infoValue}>
                        {user.birthDate
                          ? user.birthDate.toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "No especificada"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
                      </svg>
                    </div>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Miembro desde</span>
                      <span className={styles.infoValue}>
                        {user.createdAt
                          ? user.createdAt.toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                            })
                          : "No especificado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className={styles.actionButtons}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => navigate("/edit-profile")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
                    </svg>
                    Editar Perfil
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnSecondary}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                    </svg>
                    Configuración
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserProfile;
