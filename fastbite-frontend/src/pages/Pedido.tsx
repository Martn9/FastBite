import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../api/client";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Pedido as PedidoType, EstadoPedido } from "../types";

// ─── Configuración de etapas ─────────────────────────────────────────────────

const ETAPAS: { clave: EstadoPedido; etiqueta: string; emoji: string }[] = [
  { clave: "pendiente",  etiqueta: "Pedido recibido",  emoji: "🧾" },
  { clave: "preparando", etiqueta: "En preparación",   emoji: "👨‍🍳" },
  { clave: "en_camino",  etiqueta: "En camino",        emoji: "🛵" },
  { clave: "entregado",  etiqueta: "Entregado",        emoji: "✅" },
];

/** Texto del botón de avance según el estado actual del pedido. */
const LABEL_AVANZAR: Record<EstadoPedido, string> = {
  pendiente:  "Iniciar preparación →",
  preparando: "Salir a entregar 🛵",
  en_camino:  "Confirmar entrega ✓",
  entregado:  "",
};

// ─── Subcomponente: estrellas de calificación ─────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= (hover || value) ? "active" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Pedido() {
  const { id } = useParams<{ id: string }>();
  const { rol, usuario } = useAuth();

  const [pedido, setPedido] = useState<PedidoType | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [cargandoAccion, setCargandoAccion] = useState(false);

  // Estado para la confirmación del cliente
  const [calificacion, setCalificacion] = useState(5);
  const [confirmando, setConfirmando] = useState(false);

  const cargar = useCallback(() => {
    if (!id) return;
    setErrorCarga(null);
    api
      .obtenerPedido(Number(id))
      .then(setPedido)
      .catch(() =>
        setErrorCarga("No se pudo cargar el pedido. ¿Iniciaste sesión?"),
      );
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleAvanzar() {
    if (!id) return;
    setCargandoAccion(true);
    setErrorAccion(null);
    try {
      const actualizado = await api.avanzarPedido(Number(id));
      setPedido(actualizado);
    } catch (err) {
      setErrorAccion(
        err instanceof ApiError ? err.message : "No se pudo avanzar el estado.",
      );
    } finally {
      setCargandoAccion(false);
    }
  }

  async function handleTomar() {
    if (!id) return;
    setCargandoAccion(true);
    setErrorAccion(null);
    try {
      const actualizado = await api.tomarPedido(Number(id));
      setPedido(actualizado);
    } catch (err) {
      setErrorAccion(
        err instanceof ApiError ? err.message : "No se pudo tomar el pedido.",
      );
    } finally {
      setCargandoAccion(false);
    }
  }

  async function handleConfirmar() {
    if (!id) return;
    setConfirmando(true);
    setErrorAccion(null);
    try {
      const actualizado = await api.confirmarEntrega(Number(id), calificacion);
      setPedido(actualizado);
    } catch (err) {
      setErrorAccion(
        err instanceof ApiError ? err.message : "No se pudo confirmar el pedido.",
      );
    } finally {
      setConfirmando(false);
    }
  }

  // ─── Loading / Error states ────────────────────────────────────────────────

  if (errorCarga) {
    return (
      <div className="page">
        <p className="form-error">{errorCarga}</p>
        <Link to="/" className="btn-ghost" style={{ display: "inline-block", marginTop: "1rem" }}>
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="page">
        <p>Cargando pedido...</p>
      </div>
    );
  }

  // ─── Permisos ──────────────────────────────────────────────────────────────

  const indiceActual = ETAPAS.findIndex((e) => e.clave === pedido.estado);
  const esEntregado = pedido.estado === "entregado";

  const puedeAvanzar =
    !esEntregado &&
    (rol === "admin" ||
      (rol === "repartidor" && pedido.repartidor === usuario));

  const puedeTomar = rol === "repartidor" && pedido.repartidor === null && !esEntregado;

  const puedeConfirmar =
    rol === "cliente" && esEntregado && !pedido.confirmado_cliente;

  const yaConfirmo = rol === "cliente" && pedido.confirmado_cliente;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center" }}>
      <div className="pedido-detalle">

        {/* ── Encabezado ───────────────────────────────────────────────── */}
        <div className="pedido-header">
          <div>
            <span className="pedido-eyebrow">{pedido.restaurante}</span>
            <h2 className="pedido-titulo">Pedido #{pedido.id}</h2>
            <p className="pedido-meta">
              {new Date(pedido.creado_en).toLocaleString("es-CL")}
            </p>
          </div>
          <div className="pedido-tipo-badge">
            {pedido.tipo_entrega === "retiro" ? "🏪 Retiro" : "🛵 Delivery"}
          </div>
        </div>

        {/* ── Dirección (si aplica) ─────────────────────────────────────── */}
        {pedido.tipo_entrega === "delivery" && pedido.direccion_entrega && (
          <div className="pedido-info-row">
            <span className="pedido-info-label">📍 Dirección</span>
            <span>{pedido.direccion_entrega}</span>
          </div>
        )}

        {/* ── Repartidor ────────────────────────────────────────────────── */}
        <div className="pedido-info-row">
          <span className="pedido-info-label">🛵 Repartidor</span>
          <span>
            {pedido.repartidor ?? (
              <em style={{ color: "#b4ab9a" }}>Sin asignar aún</em>
            )}
          </span>
        </div>

        {/* ── Pago al repartidor (visible para repartidor/admin) ─────────── */}
        {(rol === "repartidor" || rol === "admin") && pedido.pago_repartidor > 0 && (
          <div className="pedido-info-row">
            <span className="pedido-info-label">💰 Tu pago</span>
            <strong style={{ color: "var(--olive)" }}>
              ${pedido.pago_repartidor.toLocaleString("es-CL")}
            </strong>
          </div>
        )}

        <hr className="pedido-divider" />

        {/* ── Tracker de estados ────────────────────────────────────────── */}
        <div className="estado-tracker">
          {ETAPAS.map((etapa, i) => {
            const done = i < indiceActual;
            const current = i === indiceActual;
            return (
              <div
                key={etapa.clave}
                className={`estado-step ${done ? "done" : ""} ${current ? "current" : ""}`}
              >
                <div className="estado-dot">
                  {done ? "✓" : current ? etapa.emoji : "·"}
                </div>
                <div className="estado-info">
                  <span className="estado-label">{etapa.etiqueta}</span>
                  {current && (
                    <span className="estado-sublabel">Estado actual</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Acciones ──────────────────────────────────────────────────── */}

        {errorAccion && <p className="form-error" style={{ marginTop: "1rem" }}>{errorAccion}</p>}

        {/* Tomar pedido (repartidor, sin asignar) */}
        {puedeTomar && (
          <button
            className="btn btn-block accion-btn"
            onClick={handleTomar}
            disabled={cargandoAccion}
          >
            {cargandoAccion ? "Tomando..." : "🙋 Tomar este pedido"}
          </button>
        )}

        {/* Avanzar estado (admin o repartidor asignado) */}
        {puedeAvanzar && (
          <button
            className="btn btn-block accion-btn"
            onClick={handleAvanzar}
            disabled={cargandoAccion}
          >
            {cargandoAccion
              ? "Actualizando..."
              : LABEL_AVANZAR[pedido.estado]}
          </button>
        )}

        {/* Confirmación del cliente: pedido entregado, sin confirmar aún */}
        {puedeConfirmar && (
          <div className="confirmacion-card">
            <p className="confirmacion-titulo">¿Recibiste tu pedido?</p>
            <p className="confirmacion-sub">
              Califica a tu repartidor{pedido.repartidor ? ` ${pedido.repartidor}` : ""}
            </p>
            <StarRating value={calificacion} onChange={setCalificacion} />
            <button
              className="btn btn-block"
              style={{ marginTop: "0.9rem" }}
              onClick={handleConfirmar}
              disabled={confirmando}
            >
              {confirmando ? "Confirmando..." : "Confirmar recepción ✓"}
            </button>
          </div>
        )}

        {/* Pedido ya confirmado por el cliente */}
        {yaConfirmo && pedido.calificacion_repartidor !== null && (
          <div className="confirmacion-card confirmacion-card--ok">
            <p className="confirmacion-titulo">¡Gracias por confirmar!</p>
            <p className="confirmacion-sub">
              Le diste{" "}
              <strong>
                {"★".repeat(pedido.calificacion_repartidor)}
                {"☆".repeat(5 - pedido.calificacion_repartidor)}
              </strong>{" "}
              a tu repartidor.
            </p>
          </div>
        )}

        {/* ── Navegación ────────────────────────────────────────────────── */}
        <div style={{ marginTop: "1.5rem" }}>
          {rol === "repartidor" && (
            <Link to="/pedidos" className="btn-ghost">
              ← Pedidos disponibles
            </Link>
          )}
          {rol === "admin" && (
            <Link to="/mis-pedidos" className="btn-ghost">
              ← Todos los pedidos
            </Link>
          )}
          {rol === "cliente" && (
            <Link to="/mis-pedidos" className="btn-ghost">
              ← Mis pedidos
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}