// Perfil editable del usuario: nombre a mostrar, dirección guardada,
// favoritos y calificaciones dadas. Todo en localStorage.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { useFavoriteRestaurantes, useFavoriteProductos } from "../hooks/useFavorites";
import * as api from "../api/client";
import type { Pedido, Restaurante, Producto } from "../types";

// ─── Subcomponente: campo editable inline ──────────────────────────────────────

function EditableField({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleSave() {
    onSave(draft.trim());
    setEditing(false);
  }

  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-muted)",
          margin: "0 0 0.3rem",
        }}
      >
        {label}
      </p>
      {editing ? (
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <input
            autoFocus
            className="form-input"
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
            style={{ flex: 1 }}
          />
          <button className="btn" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }} onClick={handleSave}>
            Guardar
          </button>
          <button className="btn-ghost" style={{ padding: "0.55rem 0.8rem", fontSize: "0.85rem" }} onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.65rem 1rem",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid rgba(148,163,184,0.2)",
            background: "#f8fafc",
            cursor: "pointer",
            gap: "1rem",
          }}
          onClick={() => { setDraft(value); setEditing(true); }}
        >
          <span style={{ fontSize: "0.95rem", color: value ? "var(--text-main)" : "var(--text-muted)" }}>
            {value || placeholder}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--primary-color)", fontWeight: 600, flexShrink: 0 }}>
            Editar
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponente: tarjeta de sección ────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-canvas)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        boxShadow: "var(--shadow-md)",
        marginBottom: "1.25rem",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1rem",
          fontWeight: 700,
          margin: "0 0 1.2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>{icon}</span> {title}
      </p>
      {children}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Perfil() {
  const { usuario } = useAuth();
  const { perfil, guardar } = useUserProfile();
  const { favIds: favRestIds } = useFavoriteRestaurantes();
  const { favIds: favProdIds } = useFavoriteProductos();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [productosFav, setProductosFav] = useState<Producto[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);

  useEffect(() => {
    api
      .listarMisPedidos()
      .then(setPedidos)
      .finally(() => setCargandoPedidos(false));
    api.listarRestaurantes().then(setRestaurantes);
  }, []);

  // Cargar productos favoritos desde todos los restaurantes con favs
  useEffect(() => {
    if (favRestIds.size === 0 && favProdIds.size === 0) return;
    if (restaurantes.length === 0) return;

    // Para cada restaurante con productos favoritos, cargamos sus productos
    const idsConFavs = restaurantes
      .filter((r) => favRestIds.has(r.id))
      .map((r) => r.id);

    // También necesitamos cargar productos de restaurantes sin fav pero con producto fav
    // Simplificación: cargamos todos y filtramos
    Promise.all(restaurantes.map((r) => api.listarProductos(r.id)))
      .then((grupos) => grupos.flat())
      .then((todos) => setProductosFav(todos.filter((p) => favProdIds.has(p.id))))
      .catch(() => {});

    void idsConFavs; // usado más abajo solo para evitar lint
  }, [restaurantes, favRestIds, favProdIds]);

  const restaurantesFav = restaurantes.filter((r) => favRestIds.has(r.id));

  // Pedidos con calificación dada al repartidor
  const calificados = pedidos.filter((p) => p.calificacion_repartidor !== null);

  return (
    <div className="page">
      <h1 className="page-title">Tu perfil</h1>
      <p className="page-subtitle">Personaliza tu experiencia en FastBite</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0", maxWidth: 760 }}>

        {/* ── Datos personales ─────────────────────────────────────── */}
        <SectionCard title="Datos personales" icon="👤">
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
              {(perfil.nombreMostrar || usuario || "?")[0].toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem" }}>
                {perfil.nombreMostrar || usuario}
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                @{usuario}
              </p>
            </div>
          </div>

          <EditableField
            label="Nombre a mostrar"
            value={perfil.nombreMostrar}
            placeholder="Tu nombre o apodo"
            onSave={(v) => guardar({ nombreMostrar: v })}
          />
          <EditableField
            label="Dirección guardada"
            value={perfil.direccionGuardada}
            placeholder="Ej: Av. Providencia 1234, Santiago"
            onSave={(v) => guardar({ direccionGuardada: v })}
          />
          {perfil.direccionGuardada && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.4rem 0 0" }}>
              💡 Esta dirección se cargará automáticamente al hacer delivery.
            </p>
          )}
        </SectionCard>

        {/* ── Restaurantes favoritos ────────────────────────────────── */}
        <SectionCard title={`Restaurantes favoritos (${restaurantesFav.length})`} icon="❤️">
          {restaurantesFav.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "1.8rem" }}>🍽️</p>
              Aún no tienes favoritos.{" "}
              <Link to="/" style={{ color: "var(--primary-color)", fontWeight: 600 }}>
                Explora restaurantes
              </Link>{" "}
              y toca ♡ para guardarlos.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {restaurantesFav.map((r) => (
                <Link
                  key={r.id}
                  to={`/restaurantes/${r.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.7rem 0.9rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(148,163,184,0.15)",
                    background: "#f8fafc",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                >
                  <span style={{ fontSize: "1.4rem" }}>🏪</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem" }}>{r.nombre}</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {r.categoria} · {r.tiempo_entrega}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>→</span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Productos favoritos ───────────────────────────────────── */}
        {productosFav.length > 0 && (
          <SectionCard title={`Productos favoritos (${productosFav.length})`} icon="⭐">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {productosFav.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.7rem 0.9rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(148,163,184,0.15)",
                    background: "#f8fafc",
                  }}
                >
                  {p.imagen_url && (
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem" }}>{p.nombre}</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      ${p.precio.toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Calificaciones dadas ─────────────────────────────────── */}
        <SectionCard title={`Calificaciones dadas (${calificados.length})`} icon="⭐">
          {cargandoPedidos ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Cargando...</p>
          ) : calificados.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1rem 0" }}>
              Aún no has calificado ningún pedido.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {calificados.map((p) => (
                <Link
                  key={p.id}
                  to={`/pedidos/${p.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.7rem 0.9rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(148,163,184,0.15)",
                    background: "#f8fafc",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>
                      Pedido #{p.id} · {p.restaurante}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Repartidor: {p.repartidor ?? "—"}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "1rem", letterSpacing: "0.05em" }}>
                      {"★".repeat(p.calificacion_repartidor ?? 0)}
                      <span style={{ color: "#e2e8f0" }}>
                        {"★".repeat(5 - (p.calificacion_repartidor ?? 0))}
                      </span>
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {new Date(p.creado_en).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}