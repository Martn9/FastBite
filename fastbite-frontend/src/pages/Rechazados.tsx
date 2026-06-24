import * as api from "../api/client";
import ListaPedidos from "../components/ListaPedidos";

export default function Rechazados() {
  return (
    <ListaPedidos
      titulo="Rechazados"
      subtitulo="Pedidos que decidiste no tomar"
      cargarPedidos={api.listarRechazados}
      mensajeVacio="No has rechazado ningún pedido."
    />
  );
}
