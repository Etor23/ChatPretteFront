import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AUTH_TOKEN_KEY } from "../../../services/apiService";
import { getMe, loginUser, loginWithGoogle, USER_KEY } from "../../../services/authService";
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
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifyStoredToken = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        if (!cancelled) {
          setCheckingSession(false);
        }
        return;
      }

      try {
        const user = await getMe();
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        if (!cancelled) {
          navigate("/chats", { replace: true, state: { user } });
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    };

    void verifyStoredToken();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const emailError =
    email.length > 0 && !emailRegex.test(email)
      ? "Ingresa un correo válido (ejemplo@dominio.com)"
      : "";

  const passwordError =
    password.length > 0 && password.length < 6
      ? "La contraseña debe tener al menos 6 caracteres"
      : "";

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await loginWithGoogle();
      navigate("/chats", { state: { user: response.user } });
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        // usuario cerró el popup, no mostrar error
      } else {
        setError("Error al iniciar sesión con Google. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

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
      navigate("/chats", { state: { user: response.user } });
    } catch (err: any) {
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
              <div className="card-body p-4 p-md-5 text-center">
                {checkingSession ? (
                  <div className="py-5 my-5">
                    <div className="text-white-50">Verificando sesión...</div>
                  </div>
                ) : (
                  <>
                    <div className="mb-md-5 mt-md-4 pb-4 pb-md-5">
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

                      <div className={styles.divider}>
                        <span>o</span>
                      </div>

                      <button
                        className={`btn btn-lg w-100 ${styles.btnGoogle}`}
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                      >
                        <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continuar con Google
                      </button>
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;