import * as api from "../api/client";
import ListaPedidos from "../components/ListaPedidos";

export default function PedidosDisponibles() {
  return (
    <ListaPedidos
      titulo="Pedidos disponibles"
      subtitulo="Elige cuáles quieres llevar"
      cargarPedidos={api.listarDisponibles}
      onTomar={api.tomarPedido}
      onRechazar={api.rechazarPedido}
      mensajeVacio="No hay pedidos disponibles por ahora."
    />
  );
}
