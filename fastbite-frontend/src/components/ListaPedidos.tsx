import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Pedido } from "../types";
import { ApiError } from "../api/client";

const ESTADO_CONFIG: Record<
  string,
  { label: string; emoji: string; clase: string }
> = {
  pendiente:  { label: "Pendiente",   emoji: "🧾", clase: "badge-pendiente" },
  preparando: { label: "Preparando",  emoji: "👨‍🍳", clase: "badge-preparando" },
  en_camino:  { label: "En camino",   emoji: "🛵", clase: "badge-en-camino" },
  entregado:  { label: "Entregado",   emoji: "✅", clase: "badge-entregado" },
};

interface Props {
  titulo: string;
  subtitulo: string;
  cargarPedidos: () => Promise<Pedido[]>;
  onTomar?: (id: number) => Promise<unknown>;
  onRechazar?: (id: number) => Promise<unknown>;
  mensajeVacio?: string;
}

export default function ListaPedidos({
  titulo,
  subtitulo,
  cargarPedidos,
  onTomar,
  onRechazar,
  mensajeVacio = "No hay pedidos por aquí todavía.",
}: Props) {
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
      recargar();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo tomar el pedido.",
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

                {/* ── Detalles ──────────────────────────────────────── */}
                <div className="pedido-card__meta">
                  <span>
                    👤 {p.cliente}
                  </span>
                  <span>
                    {p.repartidor
                      ? `🛵 ${p.repartidor}`
                      : "🛵 Sin asignar"}
                  </span>
                  <span>
                    {p.tipo_entrega === "retiro" ? "🏪 Retiro" : "🛵 Delivery"}
                  </span>
                  <span className="pedido-card__fecha">
                    🕐 {new Date(p.creado_en).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* ── Acciones ──────────────────────────────────────── */}
                <div className="pedido-card__actions">
                  {onTomar && (
                    <button
                      className="btn"
                      disabled={ocupado(p.id)}
                      onClick={() => manejarTomar(p.id)}
                    >
                      {ocupado(p.id) ? "..." : "🙋 Tomar"}
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