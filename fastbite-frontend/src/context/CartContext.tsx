import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Producto, ItemCarrito } from "../types";

interface CartState {
  items: ItemCarrito[];
  restauranteId: number | null;
  agregar: (producto: Producto) => void;
  quitar: (productoId: number) => void;
  vaciar: () => void;
  total: number;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [restauranteId, setRestauranteId] = useState<number | null>(null);

  const agregar = useCallback((producto: Producto) => {
    setItems((prev) => {
      // El backend valida que no se mezclen productos de distintos
      // restaurantes en un mismo pedido (ver README2.md), así que si
      // cambian de restaurante, vaciamos el carrito antes de agregar.
      const esOtroRestaurante = prev.length > 0 && prev[0].producto.restaurante !== producto.restaurante;
      const base = esOtroRestaurante ? [] : prev;

      const existente = base.find((i) => i.producto.id === producto.id);
      if (existente) {
        return base.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        );
      }
      return [...base, { producto, cantidad: 1 }];
    });
    setRestauranteId(producto.restaurante);
  }, []);

  const quitar = useCallback((productoId: number) => {
    setItems((prev) => {
      const next = prev
        .map((i) =>
          i.producto.id === productoId ? { ...i, cantidad: i.cantidad - 1 } : i,
        )
        .filter((i) => i.cantidad > 0);
      if (next.length === 0) setRestauranteId(null);
      return next;
    });
  }, []);

  const vaciar = useCallback(() => {
    setItems([]);
    setRestauranteId(null);
  }, []);

  const total = items.reduce(
    (acc, i) => acc + i.producto.precio * i.cantidad,
    0,
  );

  return (
    <CartContext.Provider
      value={{ items, restauranteId, agregar, quitar, vaciar, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
