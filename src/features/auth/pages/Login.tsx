import { Link } from "react-router-dom";
import styles from "./Login.module.css";

function Login() {
  return (
    <>
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

                    <div className={styles.floatingInputGroup}>
                      <input
                        type="email"
                        id="typeEmailX"
                        className={`form-control form-control-lg ${styles.floatingInput}`}
                        placeholder=" "
                        required
                      />
                      <label className={styles.floatingLabelCustom} htmlFor="typeEmailX">
                        Correo
                      </label>
                    </div>

                    <div className={styles.floatingInputGroup}>
                      <input
                        type="password"
                        id="typePasswordX"
                        className={`form-control form-control-lg ${styles.floatingInput}`}
                        placeholder=" "
                        required
                      />
                      <label className={styles.floatingLabelCustom} htmlFor="typePasswordX">
                        Contraseña
                      </label>
                    </div>

                    <p className="small mb-5 pb-lg-2">
                      <a className="text-white-50" href="#!">
                        Olvidaste tu contraseña?
                      </a>
                    </p>

                    <button
                      className={`btn btn-lg px-5 ${styles.btnOutlineLight}`}
                      type="submit"
                    >
                      Login
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
                    <p className="mb-0 mt-2">
                      <Link
                        to="/profile"
                        className="text-white-50"
                        style={{ cursor: "pointer", fontSize: "0.9rem" }}
                      >
                        Ver perfil de ejemplo
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
  
}
export default Login;
