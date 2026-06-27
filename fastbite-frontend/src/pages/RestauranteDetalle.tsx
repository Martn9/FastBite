import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as api from "../api/client";
import type { Producto } from "../types";
import { useCart } from "../context/CartContext";

export default function RestauranteDetalle() {
  const { id } = useParams<{ id: string }>();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agregar } = useCart();

  useEffect(() => {
    if (!id) return;
    api
      .listarProductos(Number(id))
      .then(setProductos)
      .catch(() => setError("No se pudo cargar el menú de este restaurante."))
      .finally(() => setCargando(false));
  }, [id]);

  // Agrupar productos por categoría
  const categorias = productos.reduce<Record<string, Producto[]>>((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p);
    return acc;
  }, {});

  // Promociones primero, luego el resto alfabético
  const ordenCategorias = Object.keys(categorias).sort((a, b) => {
    if (a === "Promociones") return -1;
    if (b === "Promociones") return 1;
    return a.localeCompare(b);
  });

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

      {ordenCategorias.map((categoria) => (
        <div key={categoria}>
          <p className="product-section-title">
            {categoria === "Promociones" ? "🔥 " : ""}{categoria}
          </p>
          {categorias[categoria].map((p) => (
            <div
              className={`product-row ${categoria === "Promociones" ? "promo-row" : ""}`}
              key={p.id}
            >
              <div className="info">
                <h4>
                  {p.nombre}
                  {categoria === "Promociones" && (
                    <span className="promo-badge">promo</span>
                  )}
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