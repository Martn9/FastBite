// 1. Botón ♡/♥ en cada producto
// 2. Pasa la dirección guardada del perfil al CartContext no existe aún,
//    pero sí la exponemos como prop al Carrito via localStorage

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as api from "../api/client";
import type { Producto } from "../types";
import { useCart } from "../context/CartContext";
import { useFavoriteProductos } from "../hooks/useFavorites";
import FavButton from "../components/FavButton";

// Detecta si una promo trae descuento explícito ("Antes $X" + "N% OFF")
// para mostrar el badge y el precio tachado; si no, es un combo a precio fijo.
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

export default function RestauranteDetalle() {
  const { id } = useParams<{ id: string }>();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agregar } = useCart();
  const { isFav, toggle } = useFavoriteProductos();

  useEffect(() => {
    if (!id) return;
    api
      .listarProductos(Number(id))
      .then(setProductos)
      .catch(() => setError("No se pudo cargar el menú de este restaurante."))
      .finally(() => setCargando(false));
  }, [id]);

  const promos = productos.filter((p) => p.categoria === "Promociones");
  const resto = productos.filter((p) => p.categoria !== "Promociones");

  const categorias = resto.reduce<Record<string, Producto[]>>((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p);
    return acc;
  }, {});

  const ordenCategorias = Object.keys(categorias).sort((a, b) => a.localeCompare(b));

  return (
    <div className="page">
      <h1 className="page-title">Menú</h1>
      <p className="page-subtitle">Agrega productos al carrito</p>

      {cargando && <p>Cargando productos...</p>}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && productos.length === 0 && (
        <div className="empty-state">
          Este restaurante todavía no tiene productos cargados.
        </div>
      )}

      {promos.length > 0 && (
        <div className="promo-section">
          <p className="product-section-title">🔥 Promociones</p>
          <div className="promo-carousel">
            {promos.map((p, i) => {
              const { porcentaje, precioOriginal } = parseDescuento(p);
              return (
                <div
                  className="promo-card card-enter"
                  key={p.id}
                  style={{ animationDelay: `${i * 0.07}s` }}
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

      {ordenCategorias.map((categoria) => (
        <div key={categoria}>
          <p className="product-section-title">{categoria}</p>
          {categorias[categoria].map((p) => (
            <div className="product-row" key={p.id}>
              {p.imagen_url && (
                <img
                  src={p.imagen_url}
                  alt={p.nombre}
                  className="product-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="info" style={{ flex: 1 }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {p.nombre}
                  {categoria === "Promociones" && (
                    <span className="promo-badge">promo</span>
                  )}
                  {/* Botón de favorito inline junto al nombre */}
                  <FavButton
                    isFav={isFav(p.id)}
                    onToggle={() => toggle(p.id)}
                    size="sm"
                  />
                </h4>
                <p>{p.descripcion}</p>
              </div>
              <span className="price">${p.precio.toLocaleString("es-CL")}</span>
              <button
                className="btn"
                disabled={!p.disponible}
                onClick={() => agregar(p)}
              >
                {p.disponible ? "Agregar" : "Sin stock"}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}