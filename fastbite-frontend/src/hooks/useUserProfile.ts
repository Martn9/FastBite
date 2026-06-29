// Perfil editable del usuario (nombre a mostrar, dirección guardada).
// Todo persiste en localStorage; no requiere backend.

import { useState, useCallback } from "react";

const KEY = "fastbite_perfil";

interface PerfilLocal {
  nombreMostrar: string;
  direccionGuardada: string;
}

const DEFAULTS: PerfilLocal = {
  nombreMostrar: "",
  direccionGuardada: "",
};

function leer(): PerfilLocal {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function useUserProfile() {
  const [perfil, setPerfil] = useState<PerfilLocal>(leer);

  const guardar = useCallback((cambios: Partial<PerfilLocal>) => {
    setPerfil((prev) => {
      const next = { ...prev, ...cambios };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { perfil, guardar };
}