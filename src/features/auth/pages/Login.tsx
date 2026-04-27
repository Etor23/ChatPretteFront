import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../../services/authService";
import styles from "./Login.module.css";

function Login() {
  const navigate = useNavigate();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setError("");

    if (emailError || passwordError) {
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(email, password);
      console.log("Login exitoso:", response.user.username);

      // Redirigir al chat o dashboard
      navigate("/");
    } catch (err: any) {
      console.error("Error en login:", err);

      // Errores de Firebase
      if (err.code === "auth/user-not-found") {
        setError("No existe una cuenta con ese correo");
      } else if (err.code === "auth/wrong-password") {
        setError("Contraseña incorrecta");
      } else if (err.code === "auth/invalid-credential") {
        setError("Credenciales inválidas");
      }
      // Errores del backend
      else if (err.response?.status === 404) {
        setError("Usuario no registrado. Crea tu cuenta primero.");
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.");
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
                  <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
                  <p className="text-white-50 mb-5">
                    Ingresa tu correo y contraseña!
                  </p>

                  {error && (
                    <div className="alert alert-danger py-2" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className={styles.floatingInputGroup}>
                      <input
                        type="email"
                        id="typeEmailX"
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
                        htmlFor="typeEmailX"
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
                        id="typePasswordX"
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
                        htmlFor="typePasswordX"
                      >
                        Contraseña
                      </label>
                      {(passwordTouched || submitted) && passwordError && (
                        <p className={styles.fieldError}>{passwordError}</p>
                      )}
                    </div>

                    <p className="small mb-5 pb-lg-2">
                      <a className="text-white-50" href="#!">
                        Olvidaste tu contraseña?
                      </a>
                    </p>

                    <button
                      className={`btn btn-lg px-5 ${styles.btnOutlineLight}`}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Ingresando..." : "Login"}
                    </button>
                  </form>
                </div>

                <div>
                  <p className="mb-0">
                    ¿No tienes cuenta?{" "}
                    <Link
                      to="/register"
                      className="text-white-50 fw-bold"
                      style={{ cursor: "pointer" }}
                    >
                      Regístrate
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

export default Login;