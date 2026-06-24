import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../api/client";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Pedido as PedidoType, EstadoPedido } from "../types";

const ETAPAS: { clave: EstadoPedido; etiqueta: string }[] = [
  { clave: "pendiente", etiqueta: "Pendiente" },
  { clave: "preparando", etiqueta: "Preparando" },
  { clave: "en_camino", etiqueta: "En camino" },
  { clave: "entregado", etiqueta: "Entregado" },
];

export default function Pedido() {
  const { id } = useParams<{ id: string }>();
  const { rol, usuario } = useAuth();
  const [pedido, setPedido] = useState<PedidoType | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const cargar = useCallback(() => {
    if (!id) return;
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

  async function handleAvanzar() {
    if (!id) return;
    setCargandoAccion(true);
    setErrorAccion(null);
    try {
      const actualizado = await api.avanzarPedido(Number(id));
      setPedido(actualizado);
    } catch (err) {
      setErrorAccion(
        err instanceof ApiError ? err.message : "No se pudo avanzar el estado",
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
        err instanceof ApiError ? err.message : "No se pudo tomar el pedido",
      );
    } finally {
      setCargandoAccion(false);
    }
  }

  if (errorCarga) {
    return (
      <div className="page">
        <p className="form-error">{errorCarga}</p>
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

  const indiceActual = ETAPAS.findIndex((e) => e.clave === pedido.estado);
  const esEntregado = pedido.estado === "entregado";

  // El pedido lo puede avanzar: un admin siempre, o el repartidor que
  // ya lo tomó (comparamos por username, que es lo que guarda el backend).
  const puedeAvanzar =
    rol === "admin" || (rol === "repartidor" && pedido.repartidor === usuario);

  const puedeTomar = rol === "repartidor" && pedido.repartidor === null;

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center" }}>
      <div className="receipt">
        <h2>Pedido #{pedido.id}</h2>
        <p className="order-id">
          {new Date(pedido.creado_en).toLocaleString("es-CL")} ·{" "}
          {pedido.restaurante}
        </p>
        <p className="order-id" style={{ marginTop: "-0.8rem" }}>
          {pedido.repartidor
            ? `Repartidor: ${pedido.repartidor}`
            : "Sin repartidor asignado"}
        </p>

        {ETAPAS.map((etapa, i) => (
          <div
            key={etapa.clave}
            className={
              "stamp-row " +
              (i < indiceActual
                ? "done"
                : i === indiceActual
                ? "current"
                : "")
            }
          >
            <span className="dot" />
            <span>{etapa.etiqueta}</span>
          </div>
        ))}

        {puedeTomar && (
          <button
            className="btn btn-block"
            style={{ marginTop: "1.4rem" }}
            onClick={handleTomar}
            disabled={cargandoAccion}
          >
            {cargandoAccion ? "Tomando..." : "Tomar este pedido"}
          </button>
        )}

        {puedeAvanzar && !esEntregado && (
          <button
            className="btn btn-block"
            style={{ marginTop: "1.4rem" }}
            onClick={handleAvanzar}
            disabled={cargandoAccion}
          >
            {cargandoAccion ? "Avanzando..." : "Avanzar estado →"}
          </button>
        )}

        {errorAccion && <p className="form-error">{errorAccion}</p>}

        {rol === "repartidor" && (
          <p className="form-hint">
            <Link to="/pedidos">← Ver pedidos disponibles</Link>
          </p>
        )}
        {rol === "admin" && (
          <p className="form-hint">
            <Link to="/mis-pedidos">← Ver todos los pedidos</Link>
          </p>
        )}
      </div>
    </div>
  );
}
