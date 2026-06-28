import * as api from "../api/client";
import ListaPedidos from "../components/ListaPedidos";

export default function PedidosEnCurso() {
  return (
    <ListaPedidos
      titulo="Pedidos en curso"
      subtitulo="Pedidos que estás llevando actualmente"
      cargarPedidos={api.listarEnCurso}
      onRenunciar={api.renunciarPedido}
      mensajeVacio="No tienes pedidos en curso."
    />
  );
}
