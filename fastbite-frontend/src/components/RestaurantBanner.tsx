import { useState } from "react";

export const CATEGORIA_EMOJI: Record<string, string> = {
  Hamburguesas: "🍔",
  Pizzas: "🍕",
  Japonesa: "🍣",
  Mexicana: "🌮",
  Pollo: "🍗",
  Sushi: "🍱",
  China: "🥡",
  Italiana: "🍝",
  Ensaladas: "🥗",
  Postres: "🍰",
};

interface Props {
  imagenUrl: string;
  categoria: string;
}

/**
 * Banner de portada de un restaurante. Usa <img onError> en vez de
 * background-image en CSS, para poder caer automáticamente al emoji
 * de la categoría si la URL de la foto falla (link roto, 404, etc.)
 * en vez de quedar en blanco.
 */
export default function RestaurantBanner({ imagenUrl, categoria }: Props) {
  const [fallo, setFallo] = useState(false);
  const mostrarFallback = !imagenUrl || fallo;

  if (mostrarFallback) {
    return (
      <div className="card-banner card-banner-fallback">
        <span>{CATEGORIA_EMOJI[categoria] ?? "🍽️"}</span>
      </div>
    );
  }

  return (
    <div className="card-banner">
      <img
        src={imagenUrl}
        alt={categoria}
        className="card-banner-img"
        onError={() => setFallo(true)}
      />
      <span className="card-banner-overlay" />
    </div>
  );
}