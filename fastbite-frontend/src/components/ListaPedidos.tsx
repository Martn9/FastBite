import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Pedido, ItemPedido } from "../types";
import { ApiError } from "../api/client";

const ESTADO_CONFIG: Record<
  string,
  { label: string; emoji: string; clase: string }
> = {
  pendiente:      { label: "Pendiente",           emoji: "🧾", clase: "badge-pendiente" },
  preparando:     { label: "Preparando",          emoji: "👨‍🍳", clase: "badge-preparando" },
  listo_despacho: { label: "Listo para despacho", emoji: "📦", clase: "badge-preparando" },
  listo_retiro:   { label: "Listo para retirar",  emoji: "📦", clase: "badge-preparando" },
  retirado:       { label: "Retirado",            emoji: "🏁", clase: "badge-entregado" },
  en_camino:      { label: "En camino",           emoji: "🛵", clase: "badge-en-camino" },
  entregado:      { label: "Entregado",           emoji: "✅", clase: "badge-entregado" },
};

interface Props {
  titulo: string;
  subtitulo: string;
  cargarPedidos: () => Promise<Pedido[]>;
  onTomar?: (id: number) => Promise<unknown>;
  onRechazar?: (id: number) => Promise<unknown>;
  onRenunciar?: (id: number) => Promise<unknown>;
  onAvanzar?: (id: number) => Promise<unknown>;
  mensajeVacio?: string;
}

function ResumenItems({ items }: { items: ItemPedido[] }) {
  const [expandido, setExpandido] = useState(false);

  if (!items || items.length === 0) return null;

  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);
  const totalPrecio = items.reduce(
    (acc, i) => acc + i.cantidad * Number(i.precio_unitario),
    0,
  );

  return (
    <div className="pedido-items-resumen">
      <button
        className="pedido-items-toggle"
        onClick={() => setExpandido((v) => !v)}
        type="button"
      >
        <span>
          🛍️ {totalItems} producto{totalItems !== 1 ? "s" : ""}
          {" · "}
          <strong>${totalPrecio.toLocaleString("es-CL")}</strong>
        </span>
        <span className="pedido-items-chevron">{expandido ? "▲" : "▼"}</span>
      </button>

      {expandido && (
        <ul className="pedido-items-lista">
          {items.map((item) => (
            <li key={item.id} className="pedido-item-row">
              <span className="pedido-item-qty">{item.cantidad}×</span>
              <span className="pedido-item-nombre">{item.nombre_producto}</span>
              <span className="pedido-item-precio">
                ${(item.cantidad * Number(item.precio_unitario)).toLocaleString("es-CL")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ListaPedidos({
  titulo,
  subtitulo,
  cargarPedidos,
  onTomar,
  onRechazar,
  onRenunciar,
  onAvanzar,
  mensajeVacio = "No hay pedidos por aquí todavía.",
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);

  const recargar = useCallback(() => {
    setCargando(true);
    cargarPedidos()
      .then(setPedidos)
      .catch(() => setError("No se pudieron cargar los pedidos."))
      .finally(() => setCargando(false));
  }, [cargarPedidos]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  async function manejarTomar(id: number) {
    if (!onTomar) return;
    setAccionEnCurso(id);
    try {
      await onTomar(id);
      // Si estamos en la lista de disponibles, dirigimos al repartidor a 'en curso'
      if (location.pathname === "/pedidos") {
        navigate("/pedidos/en-curso");
      } else {
        recargar();
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo tomar el pedido.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  }

  async function manejarAvanzar(id: number) {
    if (!onAvanzar) return;
    setAccionEnCurso(id);
    try {
      await onAvanzar(id);
      recargar();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo avanzar el pedido.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  }

  async function manejarRechazar(id: number) {
    if (!onRechazar) return;
    setAccionEnCurso(id);
    try {
      await onRechazar(id);
      recargar();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo rechazar el pedido.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  }

  async function manejarRenunciar(id: number) {
    if (!onRenunciar) return;
    setAccionEnCurso(id);
    try {
      await onRenunciar(id);
      recargar();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo renunciar al pedido.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  }

  const ocupado = (id: number) => accionEnCurso === id;

  return (
    <div className="page">
      <h1 className="page-title">{titulo}</h1>
      <p className="page-subtitle">{subtitulo}</p>

      {error && <p className="form-error">{error}</p>}

      {cargando && (
        <div className="empty-state">Cargando pedidos...</div>
      )}

      {!cargando && pedidos.length === 0 && (
        <div className="empty-state">{mensajeVacio}</div>
      )}

      {!cargando && pedidos.length > 0 && (
        <div className="pedidos-list">
          {pedidos.map((p) => {
            const cfg = ESTADO_CONFIG[p.estado] ?? {
              label: p.estado,
              emoji: "📦",
              clase: "",
            };

            return (
              <div className="pedido-card" key={p.id}>
                {/* ── Cabecera ─────────────────────────────────────── */}
                <div className="pedido-card__head">
                  <div>
                    <span className="pedido-card__num">Pedido #{p.id}</span>
                    <span className="pedido-card__restaurante">
                      {p.restaurante}
                    </span>
                  </div>
                  <span className={`estado-badge ${cfg.clase}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>

                {/* ── Resumen de items ──────────────────────────────── */}
                <ResumenItems items={p.items} />

                {/* ── Detalles ──────────────────────────────────────── */}
                <div className="pedido-card__meta">
                  <span>
                    👤 {p.cliente}
                    {p.cliente === usuario && (
                      <span className="pedido-badge pedido-badge--tu">Tu pedido</span>
                    )}
                  </span>
                    {p.repartidor && (
                    <span>🛵 {p.repartidor}</span>
                  )}
                  <span>
                    {p.tipo_entrega === "retiro" ? "🏪 Retiro" : "🛵 Delivery"}
                  </span>
                  {p.tipo_entrega === "retiro" && p.restaurante_tiempo_entrega && (
                    <span>⏱️ {p.restaurante_tiempo_entrega}</span>
                  )}
                  <span className="pedido-card__fecha">
                    🕐{" "}
                    {new Date(p.creado_en).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* ── Acciones ──────────────────────────────────────── */}
                <div className="pedido-card__actions">
                  {onAvanzar && (p.estado === "pendiente" || p.estado === "preparando") && (
                    <button
                      className="btn"
                      disabled={ocupado(p.id)}
                      onClick={() => manejarAvanzar(p.id)}
                    >
                      {ocupado(p.id) ? "..." : "Avanzar pedido"}
                    </button>
                  )}
                  {onTomar && (
                    <button
                      className="btn"
                      disabled={ocupado(p.id)}
                      onClick={() => manejarTomar(p.id)}
                    >
                      {ocupado(p.id) ? "..." : "🙋 Tomar"}
                    </button>
                  )}
                  {onRenunciar && (
                    <button
                      className="btn-ghost"
                      disabled={ocupado(p.id)}
                      onClick={() => manejarRenunciar(p.id)}
                    >
                      {ocupado(p.id) ? "..." : "✗ Renunciar"}
                    </button>
                  )}
                  {onRechazar && (
                    <button
                      className="btn-ghost"
                      disabled={ocupado(p.id)}
                      onClick={() => manejarRechazar(p.id)}
                    >
                      {ocupado(p.id) ? "..." : "✗ Rechazar"}
                    </button>
                  )}
                  <Link to={`/pedidos/${p.id}`} className="btn-ghost">
                    Ver detalle →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}