import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Restaurantes from "./pages/Restaurantes";
import RestauranteDetalle from "./pages/RestauranteDetalle";
import Carrito from "./pages/Carrito";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Pedido from "./pages/Pedido";
import PedidosDisponibles from "./pages/PedidosDisponibles";
import MisPedidos from "./pages/MisPedidos";
import Rechazados from "./pages/Rechazados";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Restaurantes />} />
        <Route path="/restaurantes/:id" element={<RestauranteDetalle />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/pedidos" element={<PedidosDisponibles />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/rechazados" element={<Rechazados />} />
        <Route path="/pedidos/:id" element={<Pedido />} />
      </Routes>
    </div>
  );
}
