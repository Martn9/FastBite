import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as api from "../api/client";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Rol } from "../types";

export default function Registro() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Extract<Rol, "cliente" | "repartidor">>("cliente");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const respuesta =
        rol === "cliente"
          ? await api.registrarCliente(username, email, password)
          : await api.registrarRepartidor(username, email, password);

      if (respuesta.error) {
        setError(respuesta.error);
        return;
      }

      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo crear la cuenta",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-header">
          <div className="logo">🍔 FastBite</div>
          <p>Únete y pide en minutos</p>
        </div>

        <div className="auth-divider" />

        <h2>Crear cuenta</h2>

        <form onSubmit={handleSubmit}>
          <label>🎭 Tipo de cuenta</label>
          <div className="rol-selector">
            <button
              type="button"
              className={`rol-btn ${rol === "cliente" ? "active" : ""}`}
              onClick={() => setRol("cliente")}
            >
              🛍️ Cliente
            </button>
            <button
              type="button"
              className={`rol-btn ${rol === "repartidor" ? "active" : ""}`}
              onClick={() => setRol("repartidor")}
            >
              🛵 Repartidor
            </button>
          </div>

          <label htmlFor="username">👤 Usuario</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Elige un nombre de usuario"
            required
          />

          <label htmlFor="email">📧 Correo</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
          />

          <label htmlFor="password">🔒 Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-block"
            style={{ marginTop: "1.4rem", padding: "0.8rem", fontSize: "1rem" }}
            disabled={cargando}
          >
            {cargando ? "Creando cuenta..." : "Crear cuenta →"}
          </button>
        </form>

        <p className="form-hint" style={{ textAlign: "center", marginTop: "1.2rem" }}>
          ¿Ya tienes cuenta? <Link to="/login">Ingresa aquí</Link>
        </p>
      </div>
    </div>
  );
}