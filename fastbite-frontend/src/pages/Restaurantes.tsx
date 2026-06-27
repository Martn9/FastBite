import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import type { Restaurante } from "../types";
import { useAuth } from "../context/AuthContext";

const CATEGORIA_EMOJI: Record<string, string> = {
  Hamburguesas: "🍔",
  Pizzas: "🍕",
  Japonesa: "🍣",
  Mexicana: "🌮",
  Pollo: "🍗",
  Sushi: "🍱",
  China: "🥡",
  Italiana: "🍝",
  Ensaladas: "🥗",
  Postres: "🍰",
};

export default function Restaurantes() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { usuario, rol } = useAuth();

  useEffect(() => {
    api
      .listarRestaurantes()
      .then(setRestaurantes)
      .catch(() => setError("No se pudo conectar con la API de FastBite."))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">¿Qué quieres comer hoy?</h1>
      <p className="page-subtitle">Elige tu restaurante y haz tu pedido</p>
      
      {usuario && (
  <div className={`dashboard-banner ${rol ?? ""}`}>
    <span style={{ fontSize: "1.4rem" }}>
      {rol === "repartidor" ? "🛵" : rol === "admin" ? "⚙️" : "👋"}
    </span>
    <div>
      <strong>Hola, {usuario}</strong>
      <div style={{ fontSize: "0.85rem", fontWeight: 400 }}>
        {rol === "cliente" && "¿Qué se te antoja hoy?"}
        {rol === "repartidor" && "Revisa los pedidos disponibles para entregar."}
        {rol === "admin" && "Panel de administración activo."}
      </div>
    </div>
  </div>
)}

      {cargando && <p>Cargando restaurantes...</p>}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && restaurantes.length === 0 && (
        <div className="empty-state">
          Todavía no hay restaurantes cargados.
        </div>
      )}

      <div className="card-grid">
        {restaurantes.map((r) => (
          <Link key={r.id} to={`/restaurantes/${r.id}`} className="card">
            <div className="card-emoji">
              {CATEGORIA_EMOJI[r.categoria] ?? "🍽️"}
            </div>
            <span className="eyebrow">{r.categoria}</span>
            <h3>{r.nombre}</h3>
            <p>{r.descripcion}</p>
            <div className="card-footer">
              <span className="meta">🕐 {r.horario}</span>
              <span className="delivery-badge">🛵 {r.tiempo_entrega}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}