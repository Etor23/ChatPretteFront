import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { User } from "../types";
import styles from "./EditUserProfile.module.css";

// Datos de ejemplo
const mockUser: User = {
  id: "1",
  name: "Juan Pérez",
  email: "juan.perez@example.com",
  avatar: "",
  status: "online",
  lastSeen: new Date(),
};

function EditUserProfile() {
  const navigate = useNavigate();
  const user = mockUser;

  const [username, setUsername] = useState(user.name || "");
  const [birthDate, setBirthDate] = useState<Date | null>(new Date("1998-03-15"));
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

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

  const handleSave = () => {
    // Aquí iría la lógica para guardar los cambios
    console.log("Cambios guardados:", { username, birthDate });
    navigate("/profile");
  };

  const handleCancel = () => {
    navigate("/profile");
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
                <div
                  className={styles.avatarWrapper}
                  onMouseEnter={() => setIsHoveringAvatar(true)}
                  onMouseLeave={() => setIsHoveringAvatar(false)}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "Usuario"}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {getInitials(username)}
                    </div>
                  )}
                  {isHoveringAvatar && (
                    <div className={styles.avatarOverlay}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        fill="white"
                        viewBox="0 0 16 16"
                      >
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
                      </svg>
                    </div>
                  )}
                  <span
                    className={`${styles.statusBadge} ${getStatusColor(
                      user.status
                    )}`}
                  ></span>
                </div>
              </div>

              {/* Información del usuario editable */}
              <div className={styles.profileBody}>
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
                          placeholderText="Selecciona tu fecha de nacimiento"
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
                  <button
                    className={`${styles.btn} ${styles.btnCancel}`}
                    onClick={handleCancel}
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
