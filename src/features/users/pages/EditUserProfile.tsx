import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { User } from "../types";
import { USER_KEY, updateMe, uploadAvatar } from "../../../services/authService";
import styles from "./EditUserProfile.module.css";

function EditUserProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedForBirthdate = location.state?.requireBirthdate === true ||
    (() => {
      const json = localStorage.getItem(USER_KEY) || localStorage.getItem("chatprett_user");
      if (!json) return false;
      const u = JSON.parse(json);
      const raw: string | undefined = u?.birth_date ?? u?.birthDate ?? u?.birthdate;
      return !raw || raw.startsWith("0001-01-01");
    })();

  // Try to load persisted user from localStorage
  const storedJson = localStorage.getItem(USER_KEY) || localStorage.getItem("chatprett_user");
  const storedUser = storedJson ? JSON.parse(storedJson) : null;

  const initialUsername: string = storedUser?.username || storedUser?.name || "";

  const rawBirth: string | undefined =
    storedUser?.birth_date ?? storedUser?.birthDate ?? storedUser?.birthdate;
  const initialBirth: Date | null =
    !rawBirth || rawBirth.startsWith("0001-01-01")
      ? null
      : (() => {
          // "YYYY-MM-DD" → local midnight to avoid UTC offset shifting the day
          const parts = rawBirth.split("-").map(Number);
          return new Date(parts[0], parts[1] - 1, parts[2]);
        })();

  const [username, setUsername] = useState(initialUsername);
  const [birthDate, setBirthDate] = useState<Date | null>(initialBirth);
  const [error, setError] = useState("");

  // Build a minimal `user` object for display (avatar, status, etc.)
  const user: User = {
    id: storedUser?.id || "",
    name: initialUsername || "",
    email: storedUser?.email || "",
    avatar: storedUser?.avatar_url || storedUser?.avatar || "",
    status: storedUser?.status || "online",
    lastSeen: storedUser?.lastSeen ? new Date(storedUser.lastSeen) : new Date(),
    birthDate: initialBirth || undefined,
  };
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatar || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    avatarFileRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
    if (avatarFileRef.current) avatarFileRef.current.value = "";
  };

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


  const getInitials = (name?: string) => {
    if (!name) return "?";
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSave = () => {
    setError("");
    const doSave = async () => {
      setSaving(true);
      try {
        if (avatarFile) {
          await uploadAvatar(user.id, avatarFile);
        }
        await updateMe({
          username,
          birthDate: birthDate ? birthDate.toISOString().split("T")[0] : null,
        });
        navigate("/profile");
      } catch (err: any) {
        if (err.response?.status === 409) {
          setError("Ya existe un usuario con este nombre de usuario.");
        } else {
          setError("No se pudo actualizar el perfil.");
        }
      } finally {
        setSaving(false);
      }
    };
    void doSave();
  };

  const handleCancel = () => {
    navigate(redirectedForBirthdate ? "/chats" : "/profile");
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
                <div className={styles.headerPattern}></div>
              </div>

              {/* Avatar y estado */}
              <div className={styles.avatarSection}>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
                <div
                  className={styles.avatarWrapper}
                  style={{ cursor: "pointer" }}
                  onClick={handleAvatarClick}
                  onMouseEnter={() => setIsHoveringAvatar(true)}
                  onMouseLeave={() => setIsHoveringAvatar(false)}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={username || "Usuario"}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {getInitials(username)}
                    </div>
                  )}
                  {isHoveringAvatar && (
                    <div className={styles.avatarOverlay}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                      </svg>
                    </div>
                  )}
                  <span className={`${styles.statusBadge} ${getStatusColor(user.status)}`}></span>
                </div>
              </div>

              {/* Información del usuario editable */}
              <div className={styles.profileBody}>
                {/* Banner: fecha de nacimiento requerida */}
                {redirectedForBirthdate && (
                  <div className={styles.requiredBanner}>
                    <span className={styles.requiredBannerIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                      </svg>
                    </span>
                    <div className={styles.requiredBannerText}>
                      <span className={styles.requiredBannerTitle}>Fecha de nacimiento requerida</span>
                      <span className={styles.requiredBannerBody}>
                        Debes asignar tu fecha de nacimiento para poder usar la aplicación.
                      </span>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Usuario (input editable) */}
                <div className={styles.editableField}>
                  <label className={styles.fieldLabel}>Usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.fieldInput}
                    placeholder="Ingresa tu nombre de usuario"
                  />
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
                        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
                      </svg>
                    </div>
                    <div className={styles.infoContent}>
                      <label className={styles.infoLabel}>Fecha de Nacimiento</label>
                      <div className={styles.datePickerContainer}>
                        <DatePicker
                          selected={birthDate}
                          onChange={(date: Date | null) => setBirthDate(date)}
                          dateFormat="dd/MM/yyyy"
                          className={styles.datePickerInput}
                          showYearDropdown
                          scrollableYearDropdown
                          yearDropdownItemNumber={100}
                          maxDate={new Date()}
                          placeholderText="No especificada"
                          popperPlacement="bottom-start"
                          popperProps={{ strategy: "fixed" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.btn} ${styles.btnSave}`}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.017 1.052L7.88 12.414a.75.75 0 1 1-1.060-1.06l5.646-5.646a.75.75 0 0 1 .066-.092z" />
                      <path d="M11.85.298a.75.75 0 0 0-1.061 0L3.12 8.162A6.5 6.5 0 1 0 14.88 3.12a.75.75 0 0 0-1.061-1.061l-.512.512a5 5 0 1 1-7.07-7.07l.512-.512z" />
                    </svg>
                    Guardar Cambios
                  </button>
                  {!redirectedForBirthdate && (
                    <button
                      className={`${styles.btn} ${styles.btnCancel}`}
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                      </svg>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EditUserProfile;
