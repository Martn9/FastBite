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
  const [rol, setRol] = useState<Extract<Rol, "cliente" | "repartidor">>(
    "cliente",
  );
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

      // Auto-login: evita que alguien crea que ya quedó adentro justo
      // después de registrarse, cuando en realidad falta este paso.
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
    <div className="page" style={{ display: "flex", justifyContent: "center" }}>
      <form className="form-card" onSubmit={handleSubmit}>
        <h2 className="page-title" style={{ fontSize: "1.4rem" }}>
          Crear cuenta
        </h2>

        <label htmlFor="rol">Tipo de cuenta</label>
        <select
          id="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value as typeof rol)}
        >
          <option value="cliente">Cliente</option>
          <option value="repartidor">Repartidor</option>
        </select>

        <label htmlFor="username">Usuario</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error && <p className="form-error">{error}</p>}
        <button
          type="submit"
          className="btn btn-block"
          style={{ marginTop: "1.4rem" }}
          disabled={cargando}
        >
          {cargando ? "Creando..." : "Crear cuenta"}
        </button>
        <p className="form-hint">
          ¿Ya tienes cuenta? <Link to="/login">Ingresa aquí</Link>
        </p>
      </form>
    </div>
  );
}
