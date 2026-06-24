import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { usuario, rol, isAuthenticated, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        FastBite
      </Link>
      <nav>
        <Link to="/">Restaurantes</Link>
        {rol === "repartidor" && (
          <>
            <Link to="/pedidos">Disponibles</Link>
            <Link to="/rechazados">Rechazados</Link>
          </>
        )}
        {isAuthenticated && rol !== null && (
          <Link to="/mis-pedidos">
            {rol === "admin" ? "Todos los pedidos" : "Mis pedidos"}
          </Link>
        )}
        <Link to="/carrito" className="cart-pill">
          Carrito · {cantidadTotal}
        </Link>
        {isAuthenticated ? (
          <>
            <span className="role-tag">
              {usuario} · {rol}
            </span>
            <button onClick={handleLogout}>Salir</button>
          </>
        ) : (
          <Link to="/login">Ingresar</Link>
        )}
      </nav>
    </header>
  );
}
