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
        {rol === "restaurante" ? (
        <Link to="/restaurante">Mi panel</Link>
      ) : rol !== "repartidor" ? (
        <Link to="/">Restaurantes</Link>
      ) : null}
      {rol === "repartidor" && (
        <>
          <Link to="/pedidos">Disponibles</Link>
          <Link to="/pedidos/en-curso">En curso</Link>
          <Link to="/rechazados">Rechazados</Link>
        </>
      )}
      {rol === "cliente" && (
        <Link to="/carrito" className="cart-pill" style={{ animation: "popBounce 0.3s ease" }}>
          Carrito · {cantidadTotal}
        </Link>
      )}
      {isAuthenticated && rol !== null && rol !== "restaurante" && (
        <Link to="/mis-pedidos">
          {rol === "admin" ? "Todos los pedidos" : "Mis pedidos"}
        </Link>
      )}
        {isAuthenticated ? (
          <>
            {rol === "cliente" && <Link to="/perfil">Mi perfil</Link>}
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