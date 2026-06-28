import ListaPedidos from "../components/ListaPedidos";
import * as api from "../api/client";

export default function RestaurantePanel() {
  return (
    <ListaPedidos
      titulo="Panel del Restaurante"
      subtitulo="Pedidos actuales de tu restaurante"
      cargarPedidos={api.listarPedidos}
      onAvanzar={api.avanzarPedido}
      mensajeVacio="No hay pedidos para tu restaurante en este momento."
    />
  );
}
