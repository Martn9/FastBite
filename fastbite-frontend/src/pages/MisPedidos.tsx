import * as api from "../api/client";
import ListaPedidos from "../components/ListaPedidos";
import { useAuth } from "../context/AuthContext";

export default function MisPedidos() {
  const { rol } = useAuth();

  const subtitulo =
    rol === "admin"
      ? "Vista general de todos los pedidos"
      : "El historial de todo lo que has pedido";

  return (
    <ListaPedidos
      titulo="Mis pedidos"
      subtitulo={subtitulo}
      cargarPedidos={api.listarMisPedidos}
      mensajeVacio="Todavía no tienes pedidos aquí."
    />
  );
}
