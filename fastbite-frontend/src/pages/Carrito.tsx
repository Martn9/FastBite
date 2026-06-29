import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/client";
import { ApiError } from "../api/client";
import type { Restaurante } from "../types";

export default function Carrito() {
  const { items, agregar, quitar, vaciar, total, restauranteId } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Estado de pedido
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Tipo de entrega
  const [tipoEntrega, setTipoEntrega] = useState<"delivery" | "retiro">("delivery");
  const [direccion, setDireccion] = useState("");

  // Cupón
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cuponEstado, setCuponEstado] = useState<"idle" | "cargando" | "valido" | "invalido">("idle");
  const [cuponPorcentaje, setCuponPorcentaje] = useState(0);
  const [cuponMensaje, setCuponMensaje] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(false);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);

  // Cálculo de totales
  const costoEnvio = tipoEntrega === "delivery" ? 1500 : 0;
  const subtotal = total;
  const descuento = cuponAplicado ? Math.round((subtotal + costoEnvio) * (cuponPorcentaje / 100)) : 0;
  const totalFinal = subtotal + costoEnvio - descuento;

useEffect(() => {
  if (!direccion) {
    const raw = localStorage.getItem("fastbite_perfil");
    if (raw) {
      try {
        const perfil = JSON.parse(raw);
        if (perfil.direccionGuardada) setDireccion(perfil.direccionGuardada);
      } catch {}
    }
  }
}, []);

  async function aplicarCupon() {
    if (!codigoCupon.trim()) return;
    setCuponEstado("cargando");
    setCuponAplicado(false);
    try {
      const res = await api.validarCupon(codigoCupon.trim().toUpperCase());
      if (res.valido) {
        setCuponPorcentaje(res.porcentaje);
        setCuponMensaje(res.mensaje);
        setCuponEstado("valido");
        setCuponAplicado(true);
      } else {
        setCuponMensaje(res.mensaje);
        setCuponEstado("invalido");
        setCuponAplicado(false);
      }
    } catch {
      setCuponMensaje("Error al validar el cupón");
      setCuponEstado("invalido");
    }
  }

  function quitarCupon() {
    setCodigoCupon("");
    setCuponEstado("idle");
    setCuponAplicado(false);
    setCuponPorcentaje(0);
    setCuponMensaje("");
  }

  useEffect(() => {
    if (restauranteId === null) {
      setRestaurante(null);
      return;
    }

    let activo = true;
    api
      .listarRestaurantes()
      .then((restaurantes) => {
        if (!activo) return;
        setRestaurante(
          restaurantes.find((r) => r.id === restauranteId) ?? null,
        );
      })
      .catch(() => {
        if (activo) setRestaurante(null);
      });

    return () => {
      activo = false;
    };
  }, [restauranteId]);

  async function confirmarPedido() {
    setError(null);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (tipoEntrega === "delivery" && !direccion.trim()) {
      setError("Por favor ingresa tu dirección de entrega.");
      return;
    }

    setCargando(true);
    try {
      const pedido = await api.crearPedido(
        items.map((i) => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
        })),
        tipoEntrega,
        tipoEntrega === "delivery" ? direccion.trim() : undefined,
        cuponAplicado ? codigoCupon.trim().toUpperCase() : undefined,
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
        <div className="cart-empty-state">
          <div className="cart-empty-icon">🛒</div>
          <h1>Tu carrito está vacío</h1>
          <p>Agrega algunos productos deliciosos para comenzar tu pedido.</p>
          <Link to="/" className="btn">Explorar restaurantes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="cart-header">
        <h1 className="page-title">Tu Pedido</h1>
        <p className="page-subtitle">Revisa y personaliza antes de confirmar</p>
      </div>

      <div className="cart-layout">
        {/* Columna izquierda: items */}
        <div className="cart-main">
          <div className="cart-section-card">
            <div className="cart-section-title">
              <span className="cart-section-icon">🛍️</span>
              <h2>Productos</h2>
              <span className="cart-badge">{items.length}</span>
            </div>

            <div className="cart-items-list">
              {items.map((i) => (
                <div className="cart-item" key={i.producto.id}>
                  {i.producto.imagen_url && (
                    <img
                      src={i.producto.imagen_url}
                      alt={i.producto.nombre}
                      className="cart-item-img"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="cart-item-info">
                    <h4>{i.producto.nombre}</h4>
                    <span className="cart-item-price">
                      ${i.producto.precio.toLocaleString("es-CL")} c/u
                    </span>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      className="cart-qty-btn"
                      onClick={() => quitar(i.producto.id)}
                      aria-label="Quitar uno"
                    >−</button>
                    <span className="cart-qty">{i.cantidad}</span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => agregar(i.producto)}
                      aria-label="Agregar uno"
                    >+</button>
                  </div>
                  <div className="cart-item-subtotal">
                    ${(i.producto.precio * i.cantidad).toLocaleString("es-CL")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de entrega */}
          <div className="cart-section-card">
            <div className="cart-section-title">
              <span className="cart-section-icon">🚚</span>
              <h2>Tipo de entrega</h2>
            </div>

            <div className="delivery-toggle">
              <button
                className={`delivery-option ${tipoEntrega === "delivery" ? "active" : ""}`}
                onClick={() => setTipoEntrega("delivery")}
                id="opt-delivery"
              >
                <span className="delivery-option-icon">🛵</span>
                <div>
                  <strong>Delivery</strong>
                  <small>Te lo llevamos a tu puerta</small>
                </div>
                <span className="delivery-option-price">+$1.500</span>
              </button>

              <button
                className={`delivery-option ${tipoEntrega === "retiro" ? "active" : ""}`}
                onClick={() => setTipoEntrega("retiro")}
                id="opt-retiro"
              >
                <span className="delivery-option-icon">🏪</span>
                <div>
                  <strong>Retiro en tienda</strong>
                  <small>Retira tú mismo en el local</small>
                </div>
                <span className="delivery-option-price cart-gratis">Gratis</span>
              </button>
            </div>

            {tipoEntrega === "delivery" && (
              <div className="cart-address-wrap">
                <label className="form-label" htmlFor="direccion-entrega">
                  📍 Dirección de entrega <span className="required">*</span>
                </label>
                <input
                  id="direccion-entrega"
                  type="text"
                  className="form-input"
                  placeholder="Ej: Av. Providencia 1234, Depto 5B, Santiago"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Cupón de descuento */}
          <div className="cart-section-card">
            <div className="cart-section-title">
              <span className="cart-section-icon">🎟️</span>
              <h2>Código de descuento</h2>
            </div>

            {cuponAplicado ? (
              <div className="coupon-applied">
                <div className="coupon-applied-info">
                  <span className="coupon-applied-icon">✅</span>
                  <div>
                    <strong>{codigoCupon.toUpperCase()}</strong>
                    <small>{cuponPorcentaje}% de descuento aplicado</small>
                  </div>
                </div>
                <button className="btn-ghost coupon-remove" onClick={quitarCupon}>
                  Quitar
                </button>
              </div>
            ) : (
              <div className="coupon-input-row">
                <input
                  type="text"
                  className="form-input coupon-input"
                  placeholder="Ingresa tu código (ej: FAST20)"
                  value={codigoCupon}
                  onChange={(e) => {
                    setCodigoCupon(e.target.value.toUpperCase());
                    if (cuponEstado !== "idle") {
                      setCuponEstado("idle");
                      setCuponMensaje("");
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && aplicarCupon()}
                  id="input-cupon"
                />
                <button
                  className="btn btn-secondary coupon-btn"
                  onClick={aplicarCupon}
                  disabled={cuponEstado === "cargando" || !codigoCupon.trim()}
                >
                  {cuponEstado === "cargando" ? "..." : "Aplicar"}
                </button>
              </div>
            )}

            {cuponEstado === "invalido" && (
              <p className="coupon-msg coupon-error">❌ {cuponMensaje}</p>
            )}
            {cuponEstado === "valido" && (
              <p className="coupon-msg coupon-success">✅ {cuponMensaje}</p>
            )}

            <div className="coupon-hint">
              <small>💡 Códigos disponibles: FAST10 (10%), FAST20 (20%), MEGA40 (40%)</small>
            </div>
          </div>
        </div>

        {/* Columna derecha: resumen */}
        <div className="cart-sidebar">
          <div className="cart-summary-card">
            <h3 className="cart-summary-title">Resumen del pedido</h3>

            <div className="cart-summary-rows">
              <div className="cart-summary-row">
                <span>Subtotal ({items.length} producto{items.length !== 1 ? "s" : ""})</span>
                <span>${subtotal.toLocaleString("es-CL")}</span>
              </div>
              <div className="cart-summary-row">
                <span>Envío</span>
                <span className={costoEnvio === 0 ? "cart-gratis" : ""}>
                  {costoEnvio === 0 ? "Gratis" : `$${costoEnvio.toLocaleString("es-CL")}`}
                </span>
              </div>
              {tipoEntrega === "retiro" && restaurante?.tiempo_entrega && (
                <div className="cart-summary-row">
                  <span>⏱️ Retiro estimado</span>
                  <span>{restaurante.tiempo_entrega}</span>
                </div>
              )}
              {descuento > 0 && (
                <div className="cart-summary-row cart-descuento-row">
                  <span>🎟️ Descuento ({cuponPorcentaje}%)</span>
                  <span>−${descuento.toLocaleString("es-CL")}</span>
                </div>
              )}
            </div>

            <div className="cart-summary-total">
              <span>Total</span>
              <span className="cart-total-price">${totalFinal.toLocaleString("es-CL")}</span>
            </div>

            {tipoEntrega === "delivery" && (
              <div className="cart-delivery-badge">
                <span>📍</span>
                <span>{direccion || "Sin dirección ingresada"}</span>
              </div>
            )}
            {tipoEntrega === "retiro" && (
              <div className="cart-delivery-badge cart-retiro-badge">
                <span>🏪</span>
                <span>Retiro en el local</span>
              </div>
            )}

            {error && <p className="form-error" style={{ marginTop: "1rem" }}>{error}</p>}

            {!isAuthenticated && (
              <p className="form-hint">
                Debes <Link to="/login">iniciar sesión</Link> para confirmar.
              </p>
            )}

            <button
              className="btn btn-block cart-confirm-btn"
              onClick={confirmarPedido}
              disabled={cargando}
              id="btn-confirmar-pedido"
            >
              {cargando ? (
                <><span className="btn-spinner"></span> Procesando...</>
              ) : (
                "Confirmar pedido 🚀"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
