import * as api from "../api/client";
import ListaPedidos from "../components/ListaPedidos";
import type { Pedido } from "../types";

const ESTADOS_FINALIZADOS = ["entregado", "retirado", "cancelado"];

/** Filtra solo los pedidos del restaurante que siguen activos
 * (todavía no fueron entregados, retirados ni cancelados). */
async function cargarEnCurso(): Promise<Pedido[]> {
  const pedidos = await api.listarPedidos();
  return pedidos.filter((p) => !ESTADOS_FINALIZADOS.includes(p.estado));
}

export default function RestauranteEnCurso() {
  return (
    <ListaPedidos
      titulo="Pedido en curso"
      subtitulo="Lo que tu restaurante está preparando o despachando ahora mismo"
      cargarPedidos={cargarEnCurso}
      onAvanzar={api.avanzarPedido}
      mensajeVacio="No tienes pedidos en curso en este momento."
    />
  );
}