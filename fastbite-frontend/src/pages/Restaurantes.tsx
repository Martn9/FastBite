import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import type { Restaurante, Producto } from "../types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

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

type PromoConRestaurante = Producto & { restauranteNombre: string };

function parseDescuento(p: Producto) {
  const texto = `${p.nombre} ${p.descripcion}`;
  const porcentajeMatch = texto.match(/(\d+)\s*%\s*(OFF|de descuento|dcto)/i);
  const antesMatch = p.descripcion.match(/Antes\s*\$?\s*([\d.,]+)/i);
  const precioOriginal = antesMatch
    ? Number(antesMatch[1].replace(/\./g, "").replace(",", "."))
    : undefined;
  return {
    porcentaje: porcentajeMatch ? Number(porcentajeMatch[1]) : undefined,
    precioOriginal,
  };
}

export default function Restaurantes() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [promos, setPromos] = useState<PromoConRestaurante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoPromos, setCargandoPromos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const { usuario, rol } = useAuth();
  const { agregar } = useCart();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 30);

    api
      .listarRestaurantes()
      .then(async (lista) => {
        setRestaurantes(lista);
        setCargando(false);

        // Trae las promos de los 6 restaurantes en paralelo para la
        // vitrina destacada de la página principal.
        const porRestaurante = await Promise.all(
          lista.map((r) =>
            api
              .listarProductos(r.id)
              .then((productos) =>
                productos
                  .filter((p) => p.categoria === "Promociones")
                  .map((p) => ({ ...p, restauranteNombre: r.nombre })),
              )
              .catch(() => [] as PromoConRestaurante[]),
          ),
        );
        setPromos(porRestaurante.flat());
        setCargandoPromos(false);
      })
      .catch(() => {
        setError("No se pudo conectar con la API de FastBite.");
        setCargando(false);
        setCargandoPromos(false);
      });

    return () => clearTimeout(t);
  }, []);

  return (
    <div className="page">
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
            </div>
          </div>
        )}
      </div>

      {/* Vitrina de promociones de todos los restaurantes */}
      {!cargandoPromos && promos.length > 0 && (
        <div className="promo-section">
          <p className="product-section-title">🔥 Promociones destacadas</p>
          <div className="promo-carousel">
            {promos.map((p, i) => {
              const { porcentaje, precioOriginal } = parseDescuento(p);
              return (
                <div
                  className="promo-card card-enter"
                  key={`${p.restauranteNombre}-${p.id}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {porcentaje && (
                    <span className="promo-discount-badge">-{porcentaje}%</span>
                  )}
                  {p.imagen_url && (
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      className="promo-card-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="promo-card-body">
                    <span className="promo-restaurant-tag">{p.restauranteNombre}</span>
                    <h4>{p.nombre}</h4>
                    <p>{p.descripcion}</p>
                    <div className="promo-card-footer">
                      <div className="promo-price-group">
                        {precioOriginal && (
                          <span className="promo-price-original">
                            ${precioOriginal.toLocaleString("es-CL")}
                          </span>
                        )}
                        <span className="price">${p.precio.toLocaleString("es-CL")}</span>
                      </div>
                      <button
                        className="btn"
                        disabled={!p.disponible}
                        onClick={() => agregar(p)}
                      >
                        {p.disponible ? "Agregar" : "Sin stock"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cargando && (
        <div className="card-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card card-skeleton" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="skeleton-block skeleton-banner" />
              <div className="skeleton-block skeleton-line short" />
              <div className="skeleton-block skeleton-line long" />
              <div className="skeleton-block skeleton-line" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && restaurantes.length === 0 && (
        <div className="empty-state">
          Todavía no hay restaurantes cargados.
        </div>
      )}

      {!cargando && !error && restaurantes.length > 0 && (
        <div className="card-grid">
          {restaurantes.map((r, i) => (
            <Link
              key={r.id}
              to={`/restaurantes/${r.id}`}
              className="card card-enter card-with-banner"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              {r.imagen_url ? (
                <div
                  className="card-banner"
                  style={{ backgroundImage: `url(${r.imagen_url})` }}
                >
                  <span className="card-banner-overlay" />
                </div>
              ) : (
                <div className="card-banner card-banner-fallback">
                  <span>{CATEGORIA_EMOJI[r.categoria] ?? "🍽️"}</span>
                </div>
              )}
              <div className="card-body">
                <span className="eyebrow">{r.categoria}</span>
                <h3>{r.nombre}</h3>
                <p>{r.descripcion}</p>
                <div className="card-footer">
                  <span className="meta">🕐 {r.horario}</span>
                  <span className="delivery-badge">🛵 {r.tiempo_entrega}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}