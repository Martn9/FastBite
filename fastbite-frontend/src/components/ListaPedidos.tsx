import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Pedido } from "../types";
import { ApiError } from "../api/client";

const ETIQUETAS: Record<string, string> = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  en_camino: "En camino",
  entregado: "Entregado",
};

interface Props {
  titulo: string;
  subtitulo: string;
  cargarPedidos: () => Promise<Pedido[]>;
  // Si se pasan, se muestran botones "Tomar" / "Rechazar" en cada fila.
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
      setError(err instanceof ApiError ? err.message : "No se pudo tomar el pedido.");
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
        err instanceof ApiError ? err.message : "No se pudo rechazar el pedido.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">{titulo}</h1>
      <p className="page-subtitle">{subtitulo}</p>

      {cargando && <p>Cargando...</p>}
      {error && <p className="form-error">{error}</p>}

      {!cargando && pedidos.length === 0 && (
        <div className="empty-state">{mensajeVacio}</div>
      )}

      <div className="form-card" style={{ maxWidth: "620px" }}>
        {pedidos.map((p) => (
          <div className="product-row" key={p.id}>
            <div className="info">
              <h4>
                Pedido #{p.id} · {p.restaurante}
              </h4>
              <p>
                {ETIQUETAS[p.estado] ?? p.estado} ·{" "}
                {p.repartidor ? `Repartidor: ${p.repartidor}` : "Sin asignar"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {onTomar && (
                <button
                  className="btn"
                  disabled={accionEnCurso === p.id}
                  onClick={() => manejarTomar(p.id)}
                >
                  Tomar
                </button>
              )}
              {onRechazar && (
                <button
                  className="btn-ghost"
                  disabled={accionEnCurso === p.id}
                  onClick={() => manejarRechazar(p.id)}
                >
                  Rechazar
                </button>
              )}
              <Link to={`/pedidos/${p.id}`} className="btn-ghost">
                Ver
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
