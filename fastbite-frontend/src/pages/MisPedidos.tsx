// Cambios respecto al original:
// 1. Usa useRepeatOrder para rellenar el carrito con un pedido anterior
// 2. Muestra un botón "Repetir" en cada tarjeta del historial (solo para cliente)
// 3. Si el perfil tiene dirección guardada, el Carrito la pre-rellena al montar

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api/client";
import ListaPedidos from "../components/ListaPedidos";
import { useAuth } from "../context/AuthContext";
import { useRepeatOrder } from "../hooks/useRepeatOrder";
import type { Pedido } from "../types";

export default function MisPedidos() {
  const { rol } = useAuth();
  const navigate = useNavigate();
  const { repetir, cargando: repCargando, error: repError } = useRepeatOrder();
  const [repetiendo, setRepitiendo] = useState<number | null>(null);

  const subtitulo =
    rol === "admin"
      ? "Vista general de todos los pedidos"
      : "El historial de todo lo que has pedido";

  // Callback que ListaPedidos puede llamar por cada pedido.
  // ListaPedidos ya admite onTomar/onAvanzar; aquí aprovechamos onTomar
  // como acción genérica de "repetir" en la vista de cliente.
  const handleRepetir = useCallback(
    async (id: number, pedido: Pedido) => {
      setRepitiendo(id);
      await repetir(pedido);
      setRepitiendo(null);
      navigate("/carrito");
    },
    [repetir, navigate],
  );

  // Solo pasamos la acción de repetir si el rol es "cliente"
  // Para eso necesitamos pasar el pedido completo, no solo el id.
  // Usamos un componente wrapper que recibe los pedidos ya cargados.
  return (
    <>
      {repError && (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p className="form-error" style={{ marginBottom: "0.5rem" }}>{repError}</p>
        </div>
      )}
      <ListaPedidosConRepetir
        rol={rol}
        subtitulo={subtitulo}
        onRepetir={rol === "cliente" ? handleRepetir : undefined}
        repetiendo={repetiendo}
        repCargando={repCargando}
      />
    </>
  );
}

// ─── Wrapper que carga los pedidos y agrega el botón "Repetir" ───────────────

function ListaPedidosConRepetir({
  rol,
  subtitulo,
  onRepetir,
  repetiendo,
  repCargando,
}: {
  rol: string | null;
  subtitulo: string;
  onRepetir?: (id: number, pedido: Pedido) => void;
  repetiendo: number | null;
  repCargando: boolean;
}) {
  // ListaPedidos recibe una función cargarPedidos y callbacks opcionales.
  // Internamente gestiona la lista. Para poder pasar el objeto Pedido completo
  // al callback de repetir, necesitamos un mini-wrapper del componente.
  // La forma más limpia sin refactorizar ListaPedidos es pasar onRepetir
  // mapeado como acción extra.
  //
  // Alternativa: como ListaPedidos no acepta un callback (pedido) => void,
  // mostramos el botón "Repetir" añadiéndolo via CSS/DOM no es posible.
  // La solución limpia es crear una nueva versión de ListaPedidos que acepte
  // `onRepetir?: (pedido: Pedido) => void`.
  //
  // Por ahora, renderizamos un ListaPedidos estándar + una sección aparte
  // con el botón de repetir en el historial propio.

  return (
    <ListaPedidosConBotonRepetir
      titulo="Mis pedidos"
      subtitulo={subtitulo}
      cargarPedidos={api.listarMisPedidos}
      onRepetir={onRepetir}
      repetiendo={repetiendo}
      repCargando={repCargando}
      rol={rol}
    />
  );
}

// ─── Versión extendida de ListaPedidos que agrega un botón "Repetir" ─────────
// Reproduce la lógica mínima de ListaPedidos para no romper nada.

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";

const ESTADO_CONFIG: Record<string, { label: string; emoji: string; clase: string }> = {
  pendiente:      { label: "Pendiente",           emoji: "🧾", clase: "badge-pendiente" },
  preparando:     { label: "Preparando",          emoji: "👨‍🍳", clase: "badge-preparando" },
  listo_despacho: { label: "Listo para despacho", emoji: "📦", clase: "badge-preparando" },
  listo_retiro:   { label: "Listo para retirar",  emoji: "📦", clase: "badge-preparando" },
  retirado:       { label: "Retirado",            emoji: "🏁", clase: "badge-entregado" },
  en_camino:      { label: "En camino",           emoji: "🛵", clase: "badge-en-camino" },
  entregado:      { label: "Entregado",           emoji: "✅", clase: "badge-entregado" },
  cancelado:      { label: "Cancelado",           emoji: "❌", clase: "badge-pendiente" },
};

function ListaPedidosConBotonRepetir({
  titulo,
  subtitulo,
  cargarPedidos,
  onRepetir,
  repetiendo,
  repCargando,
  rol,
}: {
  titulo: string;
  subtitulo: string;
  cargarPedidos: () => Promise<Pedido[]>;
  onRepetir?: (id: number, pedido: Pedido) => void;
  repetiendo: number | null;
  repCargando: boolean;
  rol: string | null;
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    cargarPedidos()
      .then(setPedidos)
      .catch(() => setError("No se pudieron cargar los pedidos."))
      .finally(() => setCargando(false));
  }, [cargarPedidos]);

  return (
    <div className="page">
      <h1 className="page-title">{titulo}</h1>
      <p className="page-subtitle">{subtitulo}</p>

      {error && <p className="form-error">{error}</p>}
      {cargando && <div className="empty-state">Cargando pedidos...</div>}
      {!cargando && pedidos.length === 0 && (
        <div className="empty-state">Todavía no tienes pedidos aquí.</div>
      )}

      {!cargando && pedidos.length > 0 && (
        <div className="pedidos-list">
          {pedidos.map((p) => {
            const cfg = ESTADO_CONFIG[p.estado] ?? { label: p.estado, emoji: "📦", clase: "" };
            const totalItems = p.items?.reduce((acc, i) => acc + i.cantidad, 0) ?? 0;
            const totalPrecio = p.items?.reduce(
              (acc, i) => acc + i.cantidad * Number(i.precio_unitario), 0,
            ) ?? 0;
            const puedeRepetir =
              rol === "cliente" &&
              !!onRepetir &&
              ["entregado", "retirado"].includes(p.estado);

            return (
              <div className="pedido-card" key={p.id}>
                <div className="pedido-card__head">
                  <div>
                    <span className="pedido-card__num">Pedido #{p.id}</span>
                    <span className="pedido-card__restaurante">{p.restaurante}</span>
                  </div>
                  <span className={`estado-badge ${cfg.clase}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>

                {/* Resumen items */}
                {totalItems > 0 && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.3rem 0 0.6rem" }}>
                    🛍️ {totalItems} producto{totalItems !== 1 ? "s" : ""} · ${totalPrecio.toLocaleString("es-CL")}
                    {p.descuento_aplicado > 0 && (
                      <span style={{ color: "#16a34a", marginLeft: "0.5rem" }}>
                        🎟️ −${p.descuento_aplicado.toLocaleString("es-CL")}
                      </span>
                    )}
                  </p>
                )}

                <div className="pedido-card__meta">
                  <span>👤 {p.cliente}</span>
                  <span>{p.tipo_entrega === "retiro" ? "🏪 Retiro" : "🛵 Delivery"}</span>
                  <span className="pedido-card__fecha">
                    🕐 {new Date(p.creado_en).toLocaleString("es-CL", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="pedido-card__actions">
                  <Link to={`/pedidos/${p.id}`} className="btn-ghost">
                    Ver detalle →
                  </Link>
                  {puedeRepetir && (
                    <button
                      className="btn"
                      disabled={repCargando && repetiendo === p.id}
                      onClick={() => onRepetir!(p.id, p)}
                      title="Vuelve a pedir lo mismo"
                      style={{
                        background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)",
                        boxShadow: "0 4px 14px rgba(99,102,241,0.2)",
                      }}
                    >
                      {repCargando && repetiendo === p.id ? "Cargando..." : "🔁 Repetir pedido"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}