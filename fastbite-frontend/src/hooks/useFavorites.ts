// Persiste restaurantes y productos favoritos en localStorage.
// No requiere cambios en el backend.

import { useState, useCallback } from "react";

const KEY_RESTAURANTES = "fastbite_fav_restaurantes";
const KEY_PRODUCTOS = "fastbite_fav_productos";

function readSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<number>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export function useFavoriteRestaurantes() {
  const [favs, setFavs] = useState<Set<number>>(() => readSet(KEY_RESTAURANTES));

  const toggle = useCallback((id: number) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      writeSet(KEY_RESTAURANTES, next);
      return next;
    });
  }, []);

  const isFav = useCallback((id: number) => favs.has(id), [favs]);

  return { favIds: favs, toggle, isFav };
}

export function useFavoriteProductos() {
  const [favs, setFavs] = useState<Set<number>>(() => readSet(KEY_PRODUCTOS));

  const toggle = useCallback((id: number) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      writeSet(KEY_PRODUCTOS, next);
      return next;
    });
  }, []);

  const isFav = useCallback((id: number) => favs.has(id), [favs]);

  return { favIds: favs, toggle, isFav };
}