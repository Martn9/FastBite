import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo iniciar sesión",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center" }}>
      <form className="form-card" onSubmit={handleSubmit}>
        <h2 className="page-title" style={{ fontSize: "1.4rem" }}>
          Ingresar
        </h2>
        <label htmlFor="username">Usuario</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button
          type="submit"
          className="btn btn-block"
          style={{ marginTop: "1.4rem" }}
          disabled={cargando}
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
        <p className="form-hint">
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </form>
    </div>
  );
}
