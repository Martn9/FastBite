// Dado un Pedido del historial, busca los productos del catálogo
// y los agrega al CartContext.
// No requiere backend: usa la API de catálogo que ya existe.

import { useCallback, useState } from "react";
import { useCart } from "../context/CartContext";
import * as api from "../api/client";
import type { Pedido } from "../types";

export function useRepeatOrder() {
  const { vaciar, agregar } = useCart();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repetir = useCallback(
    async (pedido: Pedido) => {
      if (!pedido.items || pedido.items.length === 0) return;
      setCargando(true);
      setError(null);

      try {
        // Necesitamos el restaurante_id. En el schema el campo items[].producto
        // es el id del producto. Usamos el primer item para saber el restaurante.
        // La API devuelve Producto.restaurante (FK number) así que llamamos
        // listarProductos con el restaurante del pedido.
        //
        // Obtenemos el restaurante_id a través de la lista de restaurantes
        // (ya está en caché en muchos casos).
        const restaurantes = await api.listarRestaurantes();
        const restaurante = restaurantes.find((r) => r.nombre === pedido.restaurante);

        if (!restaurante) {
          setError("No se encontró el restaurante de este pedido.");
          return;
        }

        const productos = await api.listarProductos(restaurante.id);

        vaciar();

        for (const item of pedido.items) {
          const producto = productos.find((p) => p.id === item.producto);
          if (!producto) continue;
          if (!producto.disponible) continue;

          // agregar() incrementa de uno en uno, así que lo llamamos N veces
          for (let i = 0; i < item.cantidad; i++) {
            agregar(producto);
          }
        }
      } catch {
        setError("No se pudo repetir el pedido. Intenta de nuevo.");
      } finally {
        setCargando(false);
      }
    },
    [vaciar, agregar],
  );

  return { repetir, cargando, error };
}