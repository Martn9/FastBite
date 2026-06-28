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

const LABEL_AVANZAR: Record<EstadoPedido, string> = {
  pendiente:  "Iniciar preparación →",
  preparando: "Salir a entregar 🛵",
  en_camino:  "",   // este paso usa el flujo de PIN
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

// ─── Subcomponente: PIN del cliente ───────────────────────────────────────────

function PinEntrega({ pin }: { pin: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="pin-card">
      <p className="pin-titulo">🔐 Tu PIN de entrega</p>
      <p className="pin-descripcion">
        Cuando el repartidor llegue, dile este código para confirmar que recibiste tu pedido.
      </p>
      <div className="pin-display">
        {visible ? (
          <span className="pin-digits">{pin}</span>
        ) : (
          <span className="pin-oculto">••••</span>
        )}
        <button
          type="button"
          className="pin-toggle"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </div>
  );
}

// ─── Subcomponente: ingreso de PIN por el repartidor ─────────────────────────

function FormularioPinRepartidor({
  onConfirmar,
  cargando,
  error,
}: {
  onConfirmar: (pin: string) => void;
  cargando: boolean;
  error: string | null;
}) {
  const [pin, setPin] = useState("");

  function handleSubmit() {
    if (pin.length === 4) onConfirmar(pin);
  }

  return (
    <div className="pin-card pin-card--repartidor">
      <p className="pin-titulo">🔑 Confirmar entrega</p>
      <p className="pin-descripcion">
        Pídele al cliente su PIN de 4 dígitos e ingrésalo para marcar el pedido como entregado.
      </p>
      <div className="pin-input-row">
        <input
          className="pin-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="0000"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          className="btn"
          disabled={pin.length !== 4 || cargando}
          onClick={handleSubmit}
        >
          {cargando ? "Verificando..." : "Confirmar ✓"}
        </button>
      </div>
      {error && <p className="form-error" style={{ marginTop: "0.6rem" }}>{error}</p>}
    </div>
  );
}

// ─── Subcomponente: resumen de items del pedido ────────────────────────────────

function ItemsPedido({ pedido }: { pedido: PedidoType }) {
  if (!pedido.items || pedido.items.length === 0) return null;

  const total = pedido.items.reduce(
    (acc, i) => acc + i.cantidad * Number(i.precio_unitario),
    0,
  );

  return (
    <div className="pedido-items-detalle">
      <p className="pedido-items-titulo">🛍️ Contenido del pedido</p>
      {pedido.items.map((item) => (
        <div key={item.id} className="pedido-item-detalle-row">
          <span className="pedido-item-qty-badge">{item.cantidad}×</span>
          <span className="pedido-item-nombre-full">{item.nombre_producto}</span>
          <span className="pedido-item-precio-full">
            ${(item.cantidad * Number(item.precio_unitario)).toLocaleString("es-CL")}
          </span>
        </div>
      ))}
      <div className="pedido-items-total">
        <span>Total productos</span>
        <strong>${total.toLocaleString("es-CL")}</strong>
      </div>
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
  const [errorPin, setErrorPin] = useState<string | null>(null);
  const [cargandoPin, setCargandoPin] = useState(false);

  // Confirmación del cliente
  const [calificacion, setCalificacion] = useState(5);
  const [confirmando, setConfirmando] = useState(false);
  const [errorConfirmar, setErrorConfirmar] = useState<string | null>(null);

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

  async function handleEntregarConPin(pin: string) {
    if (!id) return;
    setCargandoPin(true);
    setErrorPin(null);
    try {
      const actualizado = await api.entregarConPin(Number(id), pin);
      setPedido(actualizado);
    } catch (err) {
      setErrorPin(
        err instanceof ApiError ? err.message : "No se pudo confirmar la entrega.",
      );
    } finally {
      setCargandoPin(false);
    }
  }

  async function handleConfirmarRecepcion() {
    if (!id) return;
    setConfirmando(true);
    setErrorConfirmar(null);
    try {
      const actualizado = await api.confirmarRecepcion(Number(id), calificacion);
      setPedido(actualizado);
    } catch (err) {
      setErrorConfirmar(
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

  // ─── Lógica de permisos ────────────────────────────────────────────────────

  const indiceActual = ETAPAS.findIndex((e) => e.clave === pedido.estado);
  const esEntregado  = pedido.estado === "entregado";
  const esEnCamino   = pedido.estado === "en_camino";

  const esRepartidorAsignado =
    rol === "repartidor" && pedido.repartidor === usuario;

  // "Avanzar" solo aplica para pendiente→preparando y preparando→en_camino
  const puedeAvanzar =
    !esEntregado &&
    !esEnCamino &&
    (rol === "admin" || esRepartidorAsignado);

  const puedeTomar =
    rol === "repartidor" && pedido.repartidor === null && !esEntregado;

  // El formulario de PIN aparece cuando el repartidor llega al último paso
  const puedeIngresarPin =
    esEnCamino && (rol === "admin" || esRepartidorAsignado);

  // El cliente ve su PIN mientras el pedido no está entregado
  const verPin =
    rol === "cliente" &&
    pedido.cliente === usuario &&
    pedido.pin_entrega !== null &&
    !esEntregado;

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

        {/* ── Contenido del pedido ─────────────────────────────────────── */}
        <ItemsPedido pedido={pedido} />

        <hr className="pedido-divider" />

        {/* ── Info de entrega ───────────────────────────────────────────── */}
        {pedido.tipo_entrega === "delivery" && pedido.direccion_entrega && (
          <div className="pedido-info-row">
            <span className="pedido-info-label">📍 Dirección</span>
            <span>{pedido.direccion_entrega}</span>
          </div>
        )}

        <div className="pedido-info-row">
          <span className="pedido-info-label">🛵 Repartidor</span>
          <span>
            {pedido.repartidor ?? (
              <em style={{ color: "#b4ab9a" }}>Sin asignar aún</em>
            )}
          </span>
        </div>

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
            const done    = i < indiceActual;
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

        {errorAccion && (
          <p className="form-error" style={{ marginTop: "1rem" }}>{errorAccion}</p>
        )}

        {/* Tomar pedido */}
        {puedeTomar && (
          <button
            className="btn btn-block accion-btn"
            onClick={handleTomar}
            disabled={cargandoAccion}
          >
            {cargandoAccion ? "Tomando..." : "🙋 Tomar este pedido"}
          </button>
        )}

        {/* Avanzar estado (excepto el último paso) */}
        {puedeAvanzar && (
          <button
            className="btn btn-block accion-btn"
            onClick={handleAvanzar}
            disabled={cargandoAccion}
          >
            {cargandoAccion ? "Actualizando..." : LABEL_AVANZAR[pedido.estado]}
          </button>
        )}

        {/* ── PIN del cliente (visible solo para el cliente dueño) ──────── */}
        {verPin && pedido.pin_entrega && (
          <PinEntrega pin={pedido.pin_entrega} />
        )}

        {/* ── Formulario de PIN para el repartidor ─────────────────────── */}
        {puedeIngresarPin && (
          <FormularioPinRepartidor
            onConfirmar={handleEntregarConPin}
            cargando={cargandoPin}
            error={errorPin}
          />
        )}

        {/* ── Confirmación del cliente ──────────────────────────────────── */}
        {puedeConfirmar && (
          <div className="confirmacion-card">
            <p className="confirmacion-titulo">¿Recibiste tu pedido? 🎉</p>
            <p className="confirmacion-sub">
              Califica a tu repartidor
              {pedido.repartidor ? ` ${pedido.repartidor}` : ""}
            </p>
            <StarRating value={calificacion} onChange={setCalificacion} />
            {errorConfirmar && (
              <p className="form-error" style={{ marginTop: "0.6rem" }}>{errorConfirmar}</p>
            )}
            <button
              className="btn btn-block"
              style={{ marginTop: "0.9rem" }}
              onClick={handleConfirmarRecepcion}
              disabled={confirmando}
            >
              {confirmando ? "Confirmando..." : "Sí, lo recibí ✓"}
            </button>
          </div>
        )}

        {/* ── Pedido ya confirmado ──────────────────────────────────────── */}
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