import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Restaurantes from "./pages/Restaurantes";
import RestauranteDetalle from "./pages/RestauranteDetalle";
import Carrito from "./pages/Carrito";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Pedido from "./pages/Pedido";
import PedidosDisponibles from "./pages/PedidosDisponibles";
import PedidosEnCurso from "./pages/PedidosEnCurso";
import MisPedidos from "./pages/MisPedidos";
import Rechazados from "./pages/Rechazados";
import Perfil from "./pages/Perfil";
import RestaurantePanel from "./pages/RestaurantePanel";

export default function App() {
  const { rol } = useAuth();
  const location = useLocation();

  const isRestaurantUser = rol === "restaurante";
  const isRepartidor = rol === "repartidor";

  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            isRestaurantUser ? (
              <Navigate to="/restaurante" replace />
            ) : isRepartidor ? (
              <Navigate to="/pedidos" replace />
            ) : (
              <Restaurantes />
            )
          }
        />
        <Route
          path="/restaurantes/:id"
          element={isRepartidor ? <Navigate to="/pedidos" replace /> : <RestauranteDetalle />}
        />
        <Route
          path="/carrito"
          element={isRepartidor ? <Navigate to="/pedidos" replace /> : <Carrito />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/pedidos" element={<PedidosDisponibles />} />
        <Route path="/pedidos/en-curso" element={<PedidosEnCurso />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/rechazados" element={<Rechazados />} />
        <Route path="/restaurante" element={<RestaurantePanel />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/pedidos/:id" element={<Pedido />} />
      </Routes>
    </div>
  );
}