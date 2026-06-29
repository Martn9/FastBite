// Corazón toggle que se puede poner en cualquier tarjeta.
// Uso:
//   <FavButton isFav={isFav(r.id)} onToggle={() => toggle(r.id)} />

interface Props {
  isFav: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  label?: string;
}

export default function FavButton({ isFav, onToggle, size = "md", label }: Props) {
  const dim = size === "sm" ? "1.1rem" : "1.35rem";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();   // evita navegar si está dentro de un <Link>
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0.25rem",
        lineHeight: 1,
        fontSize: dim,
        color: isFav ? "#ff3b50" : "#94a3b8",
        transition: "color 0.2s ease, transform 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
      }}
    >
      {isFav ? "♥" : "♡"}
      {label && (
        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{label}</span>
      )}
    </button>
  );
}