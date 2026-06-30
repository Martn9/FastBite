import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/client";
import type { CalificacionPromedio } from "../api/client";

function Estrellas({ promedio }: { promedio: number }) {
  const llenas = Math.round(promedio);
  return (
    <span style={{ fontSize: "1.8rem", letterSpacing: "0.08em" }}>
      {"★".repeat(llenas)}
      <span style={{ color: "#e2e8f0" }}>{"★".repeat(5 - llenas)}</span>
    </span>
  );
}

export default function PerfilRepartidor() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState<CalificacionPromedio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .obtenerCalificacionRepartidor()
      .then(setDatos)
      .catch(() => setError("No se pudo cargar tu calificación."))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Tu perfil</h1>
      <p className="page-subtitle">Tu desempeño como repartidor en FastBite</p>

      <div style={{ maxWidth: 480 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "rgba(255,94,58,0.04)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255,94,58,0.1)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--primary-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "1.4rem",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              flexShrink: 0,
            }}
          >
            {(usuario || "?")[0].toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem" }}>{usuario}</p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>🛵 Repartidor</p>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-canvas)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            boxShadow: "var(--shadow-md)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 700,
              margin: "0 0 1rem",
            }}
          >
            ⭐ Calificación promedio
          </p>

          {cargando && <p style={{ color: "var(--text-muted)" }}>Cargando...</p>}
          {error && <p className="form-error">{error}</p>}

          {!cargando && !error && datos && (
            <>
              {datos.total_calificaciones === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Todavía no tienes calificaciones de clientes.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0 0 0.3rem" }}>
                    {datos.promedio.toFixed(1)}
                  </p>
                  <Estrellas promedio={datos.promedio} />
                  <p style={{ marginTop: "0.8rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Basado en {datos.total_calificaciones} entrega
                    {datos.total_calificaciones !== 1 ? "s" : ""} calificada
                    {datos.total_calificaciones !== 1 ? "s" : ""}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}