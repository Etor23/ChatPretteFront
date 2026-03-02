import { useState } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./Login.module.css";

function Register() {
  const [birthDate, setBirthDate] = useState<Date | null>(null);

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

                  <form>
                    <div className={styles.floatingInputGroup}>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className={`form-control form-control-lg ${styles.floatingInput}`}
                        placeholder=" "
                        required
                      />
                      <label className={styles.floatingLabelCustom} htmlFor="username">
                        Usuario
                      </label>
                    </div>

                    <div className={`${styles.floatingInputGroup} ${birthDate ? styles.hasValue : ''}`}>
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
                      />
                      <label className={styles.floatingLabelCustom} htmlFor="birthDate">
                        Fecha de Nacimiento
                      </label>
                    </div>

                    <div className={styles.floatingInputGroup}>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-control form-control-lg ${styles.floatingInput}`}
                        placeholder=" "
                        required
                      />
                      <label className={styles.floatingLabelCustom} htmlFor="email">
                        Correo
                      </label>
                    </div>

                    <div className={styles.floatingInputGroup}>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        className={`form-control form-control-lg ${styles.floatingInput}`}
                        placeholder=" "
                        required
                      />
                      <label className={styles.floatingLabelCustom} htmlFor="password">
                        Contraseña
                      </label>
                    </div>

                    <div className={styles.floatingInputGroup}>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        className={`form-control form-control-lg ${styles.floatingInput}`}
                        placeholder=" "
                        required
                      />
                      <label className={styles.floatingLabelCustom} htmlFor="confirmPassword">
                        Confirmar Contraseña
                      </label>
                    </div>

                    <button
                      className={`btn btn-lg px-5 ${styles.btnOutlineLight}`}
                      type="submit"
                    >
                      Registrarse
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