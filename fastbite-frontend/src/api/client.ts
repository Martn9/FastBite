import type {
  Restaurante,
  Producto,
  Pedido,
  LoginResponse,
  MensajeResponse,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("fastbite_access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.error ?? data?.detail ?? "Error en la solicitud";
    throw new ApiError(
      typeof detail === "string" ? detail : JSON.stringify(detail),
      res.status,
    );
  }
  return data;
}

// IMPORTANTE: registro y login en el backend (django-ninja) reciben los
// parámetros como QUERY STRING, no como JSON body, porque las funciones
// de usuarios/api.py no usan un Schema de Pydantic para esos endpoints.
function withQuery(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return `${BASE_URL}${path}?${qs}`;
}

// ─── Autenticación ────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(
    withQuery("/usuarios/login", { username, password }),
    { method: "POST" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data?.error ?? "Error en la solicitud", res.status);
  }
  if (data.error) {
    throw new ApiError("Usuario o contraseña incorrectos", 401);
  }
  return data;
}

export async function registrarCliente(
  username: string,
  email: string,
  password: string,
): Promise<MensajeResponse> {
  const res = await fetch(
    withQuery("/usuarios/registro-cliente", { username, email, password }),
    { method: "POST" },
  );
  return parseOrThrow(res);
}

export async function registrarRepartidor(
  username: string,
  email: string,
  password: string,
): Promise<MensajeResponse> {
  const res = await fetch(
    withQuery("/usuarios/registro-repartidor", { username, email, password }),
    { method: "POST" },
  );
  return parseOrThrow(res);
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────

export async function listarRestaurantes(): Promise<Restaurante[]> {
  const res = await fetch(`${BASE_URL}/catalogo/restaurantes`);
  return parseOrThrow(res);
}

export async function listarProductos(
  restauranteId: number,
): Promise<Producto[]> {
  const res = await fetch(
    `${BASE_URL}/catalogo/restaurantes/${restauranteId}/productos`,
  );
  return parseOrThrow(res);
}

// ─── Pedidos – cliente ────────────────────────────────────────────────────────

export async function crearPedido(
  items: { producto_id: number; cantidad: number }[],
): Promise<Pedido> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ items }),
  });
  return parseOrThrow(res);
}

export async function obtenerPedido(id: number): Promise<Pedido> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/${id}`, {
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

export async function listarMisPedidos(): Promise<Pedido[]> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/mis-pedidos`, {
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

/** El cliente confirma la recepción del pedido y califica al repartidor (1–5). */
export async function confirmarEntrega(
  id: number,
  calificacion: number,
): Promise<Pedido> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/${id}/confirmar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ calificacion }),
  });
  return parseOrThrow(res);
}

// ─── Pedidos – repartidor ─────────────────────────────────────────────────────

export async function listarDisponibles(): Promise<Pedido[]> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/disponibles`, {
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

export async function listarRechazados(): Promise<Pedido[]> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/rechazados`, {
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

export async function listarEntregados(): Promise<Pedido[]> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/entregados`, {
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

export async function tomarPedido(id: number): Promise<Pedido> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/${id}/tomar`, {
    method: "POST",
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

export async function rechazarPedido(id: number): Promise<Pedido> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/${id}/rechazar`, {
    method: "POST",
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

export async function avanzarPedido(id: number): Promise<Pedido> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos/${id}/avanzar`, {
    method: "POST",
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

// ─── Pedidos – admin ──────────────────────────────────────────────────────────

export async function listarPedidos(): Promise<Pedido[]> {
  const res = await fetch(`${BASE_URL}/pedidos/pedidos`, {
    headers: authHeader(),
  });
  return parseOrThrow(res);
}

export { ApiError };