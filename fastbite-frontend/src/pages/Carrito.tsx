import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/client";
import { ApiError } from "../api/client";

export default function Carrito() {
  const { items, agregar, quitar, vaciar, total } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function confirmarPedido() {
    setError(null);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setCargando(true);
    try {
      const pedido = await api.crearPedido(
        items.map((i) => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
        })),
      );
      vaciar();
      navigate(`/pedidos/${pedido.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo crear el pedido. Intenta de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">Carrito</h1>
        <div className="empty-state">
          Tu carrito está vacío. <Link to="/">Ve al catálogo</Link> y agrega
          algo rico.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Carrito</h1>
      <p className="page-subtitle">Revisa tu pedido antes de confirmar</p>

      <div className="form-card" style={{ maxWidth: "480px" }}>
        {items.map((i) => (
          <div className="product-row" key={i.producto.id}>
            <div className="info">
              <h4>{i.producto.nombre}</h4>
              <p>
                {i.cantidad} × ${i.producto.precio.toLocaleString("es-CL")}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button className="btn-ghost" onClick={() => quitar(i.producto.id)}>
                −
              </button>
              <button className="btn-ghost" onClick={() => agregar(i.producto)}>
                +
              </button>
            </div>
          </div>
        ))}

        <div
          className="product-row"
          style={{ borderBottom: "none", fontWeight: 700 }}
        >
          <span>Total</span>
          <span className="price">${total.toLocaleString("es-CL")}</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        {!isAuthenticated && (
          <p className="form-hint">
            Tienes que <Link to="/login">iniciar sesión</Link> para confirmar
            el pedido.
          </p>
        )}

        <button
          className="btn btn-block"
          style={{ marginTop: "1rem" }}
          onClick={confirmarPedido}
          disabled={cargando}
        >
          {cargando ? "Confirmando..." : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
