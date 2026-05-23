import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerUser } from "../../../services/authService";
import styles from "./Login.module.css";

function Register() {
  const navigate = useNavigate();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailError =
    email.length > 0 && !emailRegex.test(email)
      ? "Ingresa un correo válido (ejemplo@dominio.com)"
      : "";

  const passwordError =
    password.length > 0 && password.length < 6
      ? "La contraseña debe tener al menos 6 caracteres"
      : "";

  const confirmPasswordError =
    confirmPassword.length > 0 && password !== confirmPassword
      ? "Las contraseñas no coinciden"
      : "";

  const validateForm = (): string | null => {
    if (username.length < 3) {
      return "El usuario debe tener al menos 3 caracteres";
    }
    if (!birthDate) {
      return "Selecciona tu fecha de nacimiento";
    }
    // Validar edad mínima (13 años, como Discord)
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      return "Debes tener al menos 13 años";
    }
    if (emailError) {
      return emailError;
    }
    if (passwordError) {
      return passwordError;
    }
    if (password !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setError("");

    // Validaciones locales
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser(email, password, username, birthDate);
      navigate("/");
    } catch (err: any) {
      // Errores de Firebase
      if (err.code === "auth/email-already-in-use") {
        setError("Ya existe una cuenta con ese correo");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña es muy débil");
      } else if (err.code === "auth/invalid-email") {
        setError("El correo no es válido");
      }
      // Errores del backend
      else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Error al crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`min-vh-100 ${styles.gradientCustom}`}>
      <div className="container py-5 min-vh-100 d-flex align-items-center">
        <div className="row d-flex justify-content-center align-items-center w-100">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div
              className={`${styles.card} text-white`}
              style={{ borderRadius: "1rem" }}
            >
              <div className="card-body p-5 text-center">
                <div className="mb-md-5 mt-md-4 pb-5">
                  <h2 className="fw-bold mb-2 text-uppercase">Registro</h2>
                  <p className="text-white-50 mb-5">¡Crea tu cuenta ahora!</p>

                  {error && (
                    <div className="alert alert-danger py-2" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className={styles.floatingInputGroup}>
                      <input
                        type="text"
                        id="username"
                        className={`form-control form-control-lg ${styles.floatingInput}`}
                        placeholder=" "
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <label
                        className={styles.floatingLabelCustom}
                        htmlFor="username"
                      >
                        Usuario
                      </label>
                    </div>

                    <div
                      className={`${styles.floatingInputGroup} ${
                        birthDate ? styles.hasValue : ""
                      }`}
                    >
                      <DatePicker
                        id="birthDate"
                        selected={birthDate}
                        onChange={(date: Date | null) => setBirthDate(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText=" "
                        className={`form-control form-control-lg ${styles.floatingInput}`}
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                        maxDate={new Date()}
                        required
                        disabled={loading}
                      />
                      <label
                        className={styles.floatingLabelCustom}
                        htmlFor="birthDate"
                      >
                        Fecha de Nacimiento
                      </label>
                    </div>

                    <div className={styles.floatingInputGroup}>
                      <input
                        type="email"
                        id="email"
                        className={`form-control form-control-lg ${styles.floatingInput} ${(emailTouched || submitted) && emailError ? styles.invalidInput : ""}`}
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        required
                        disabled={loading}
                      />
                      <label
                        className={styles.floatingLabelCustom}
                        htmlFor="email"
                      >
                        Correo
                      </label>
                      {(emailTouched || submitted) && emailError && (
                        <p className={styles.fieldError}>{emailError}</p>
                      )}
                    </div>

                    <div className={styles.floatingInputGroup}>
                      <input
                        type="password"
                        id="password"
                        className={`form-control form-control-lg ${styles.floatingInput} ${(passwordTouched || submitted) && passwordError ? styles.invalidInput : ""}`}
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        required
                        disabled={loading}
                      />
                      <label
                        className={styles.floatingLabelCustom}
                        htmlFor="password"
                      >
                        Contraseña
                      </label>
                      {(passwordTouched || submitted) && passwordError && (
                        <p className={styles.fieldError}>{passwordError}</p>
                      )}
                    </div>

                    <div className={styles.floatingInputGroup}>
                      <input
                        type="password"
                        id="confirmPassword"
                        className={`form-control form-control-lg ${styles.floatingInput} ${(confirmPasswordTouched || submitted) && confirmPasswordError ? styles.invalidInput : ""}`}
                        placeholder=" "
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        required
                        disabled={loading}
                      />
                      <label
                        className={styles.floatingLabelCustom}
                        htmlFor="confirmPassword"
                      >
                        Confirmar Contraseña
                      </label>
                      {(confirmPasswordTouched || submitted) &&
                        confirmPasswordError && (
                          <p className={styles.fieldError}>
                            {confirmPasswordError}
                          </p>
                        )}
                    </div>

                    <button
                      className={`btn btn-lg px-5 ${styles.btnOutlineLight}`}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Creando cuenta..." : "Registrarse"}
                    </button>
                  </form>
                </div>

                <div>
                  <p className="mb-0">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                      to="/login"
                      className="text-white-50 fw-bold"
                      style={{ cursor: "pointer" }}
                    >
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;