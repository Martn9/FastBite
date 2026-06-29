// Cambia respecto al original:
// 1. Importa useFavoriteRestaurantes y FavButton
// 2. Agrega el botón ♡/♥ en cada tarjeta
// 3. Agrega una sección "Tus favoritos" arriba del listado completo

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import type { Restaurante } from "../types";
import { useAuth } from "../context/AuthContext";
import { useFavoriteRestaurantes } from "../hooks/useFavorites";
import FavButton from "../components/FavButton";

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
  const [heroVisible, setHeroVisible] = useState(false);
  const { usuario, rol } = useAuth();
  const { isFav, toggle } = useFavoriteRestaurantes();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 30);
    api
      .listarRestaurantes()
      .then(setRestaurantes)
      .catch(() => setError("No se pudo conectar con la API de FastBite."))
      .finally(() => setCargando(false));
    return () => clearTimeout(t);
  }, []);

  const favoritos = restaurantes.filter((r) => isFav(r.id));

  return (
    <div className="page">
<<<<<<< Updated upstream
      <div className={`hero-intro ${heroVisible ? "hero-visible" : ""}`}>
        <h1 className="page-title">¿Qué quieres comer hoy?</h1>
        <p className="page-subtitle">Elige tu restaurante y haz tu pedido</p>

        {usuario && (
          <div className={`dashboard-banner ${rol ?? ""}`}>
            <span className="banner-emoji">
              {rol === "repartidor" ? "🛵" : rol === "admin" ? "⚙️" : "👋"}
            </span>
            <div className="banner-content">
              <strong className="banner-title">Hola, {usuario}</strong>
              <div className="banner-subtitle">
                {rol === "cliente" && "¿Qué se te antoja hoy?"}
                {rol === "repartidor" && "Revisa los pedidos disponibles para entregar."}
                {rol === "admin" && "Panel de administración activo."}
              </div>
=======
      <h1 className="page-title">¿Qué quieres comer hoy?</h1>
      <p className="page-subtitle">Elige tu restaurante y haz tu pedido</p>

      {usuario && (
        <div className={`dashboard-banner ${rol ?? ""}`}>
          <span className="banner-emoji">
            {rol === "repartidor" ? "🛵" : rol === "admin" ? "⚙️" : "👋"}
          </span>
          <div className="banner-content">
            <strong className="banner-title">Hola, {usuario}</strong>
            <div className="banner-subtitle">
              {rol === "cliente" && "¿Qué se te antoja hoy?"}
              {rol === "repartidor" && "Revisa los pedidos disponibles para entregar."}
              {rol === "admin" && "Panel de administración activo."}
>>>>>>> Stashed changes
            </div>
          </div>
        )}
      </div>

      {cargando && (
        <div className="card-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card card-skeleton" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="skeleton-block skeleton-emoji" />
              <div className="skeleton-block skeleton-line short" />
              <div className="skeleton-block skeleton-line long" />
              <div className="skeleton-block skeleton-line" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && restaurantes.length === 0 && (
        <div className="empty-state">Todavía no hay restaurantes cargados.</div>
      )}

      {/* ── Sección de favoritos ── */}
      {favoritos.length > 0 && (
        <>
          <p className="product-section-title">❤️ Tus favoritos</p>
          <div className="card-grid" style={{ marginBottom: "2rem" }}>
            {favoritos.map((r) => (
              <RestauranteCard key={r.id} r={r} isFav={true} onToggleFav={() => toggle(r.id)} />
            ))}
          </div>
          <p className="product-section-title">🍽️ Todos los restaurantes</p>
        </>
      )}

<<<<<<< Updated upstream
      {!cargando && !error && restaurantes.length > 0 && (
        <div className="card-grid">
          {restaurantes.map((r, i) => (
            <Link
              key={r.id}
              to={`/restaurantes/${r.id}`}
              className="card card-enter"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
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
      )}
=======
      <div className="card-grid">
        {restaurantes.map((r) => (
          <RestauranteCard key={r.id} r={r} isFav={isFav(r.id)} onToggleFav={() => toggle(r.id)} />
        ))}
      </div>
>>>>>>> Stashed changes
    </div>
  );
}

// ─── Subcomponente tarjeta de restaurante ─────────────────────────────────────

function RestauranteCard({
  r,
  isFav,
  onToggleFav,
}: {
  r: Restaurante;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <Link to={`/restaurantes/${r.id}`} className="card">
        <div className="card-emoji">
          {(CATEGORIA_EMOJI[r.categoria] as string | undefined) ?? "🍽️"}
        </div>
        <span className="eyebrow">{r.categoria}</span>
        <h3>{r.nombre}</h3>
        <p>{r.descripcion}</p>
        <div className="card-footer">
          <span className="meta">🕐 {r.horario}</span>
          <span className="delivery-badge">🛵 {r.tiempo_entrega}</span>
        </div>
      </Link>
      {/* El botón va fuera del <Link> para evitar navegación al hacer clic */}
      <div
        style={{
          position: "absolute",
          top: "0.8rem",
          right: "0.8rem",
          zIndex: 10,
          background: "rgba(255,255,255,0.9)",
          borderRadius: "50%",
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <FavButton isFav={isFav} onToggle={onToggleFav} size="sm" />
      </div>
    </div>
  );
}