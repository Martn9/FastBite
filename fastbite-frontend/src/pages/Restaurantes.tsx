import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import type { Restaurante } from "../types";

export default function Restaurantes() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listarRestaurantes()
      .then(setRestaurantes)
      .catch(() => setError("No se pudo conectar con la API de FastBite."))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Restaurantes</h1>
      <p className="page-subtitle">Elige dónde quieres pedir hoy</p>

      {cargando && <p>Cargando restaurantes...</p>}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && restaurantes.length === 0 && (
        <div className="empty-state">
          Todavía no hay restaurantes cargados. Agrégalos desde el admin de
          Django.
        </div>
      )}

      <div className="card-grid">
        {restaurantes.map((r) => (
          <Link key={r.id} to={`/restaurantes/${r.id}`} className="card">
            <span className="eyebrow">{r.categoria}</span>
            <h3>{r.nombre}</h3>
            <p>{r.descripcion}</p>
            <span className="meta">
              {r.horario} · llega en {r.tiempo_entrega}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
