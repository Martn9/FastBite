import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Tema = "claro" | "oscuro";

interface ThemeContextValue {
  tema: Tema;
  toggleTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function temaInicial(): Tema {
  const guardado = localStorage.getItem("fastbite_tema");
  if (guardado === "claro" || guardado === "oscuro") return guardado;
  // Si el usuario no eligió nada, respeta la preferencia del sistema operativo.
  const prefiereOscuro = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefiereOscuro ? "oscuro" : "claro";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.setAttribute("data-tema", tema);
    localStorage.setItem("fastbite_tema", tema);
  }, [tema]);

  function toggleTema() {
    setTema((t) => (t === "claro" ? "oscuro" : "claro"));
  }

  return (
    <ThemeContext.Provider value={{ tema, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}