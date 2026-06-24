import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as api from "../api/client";
import type { Rol } from "../types";

interface AuthState {
  usuario: string | null;
  rol: Rol | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<string | null>(
    localStorage.getItem("fastbite_usuario"),
  );
  const [rol, setRol] = useState<Rol | null>(
    (localStorage.getItem("fastbite_rol") as Rol | null) ?? null,
  );

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.login(username, password);
    localStorage.setItem("fastbite_access", data.access);
    localStorage.setItem("fastbite_refresh", data.refresh);
    localStorage.setItem("fastbite_usuario", data.usuario);
    localStorage.setItem("fastbite_rol", data.rol);
    setUsuario(data.usuario);
    setRol(data.rol);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fastbite_access");
    localStorage.removeItem("fastbite_refresh");
    localStorage.removeItem("fastbite_usuario");
    localStorage.removeItem("fastbite_rol");
    setUsuario(null);
    setRol(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ usuario, rol, isAuthenticated: !!usuario, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
