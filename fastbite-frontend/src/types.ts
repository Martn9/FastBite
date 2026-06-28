// Estos tipos están calcados de los Schema reales en catalogo/schemas.py,
// pedidos/schemas.py y las respuestas de usuarios/api.py.
// Si alguien cambia un schema en el backend, hay que actualizar esto también.

export type Rol = "cliente" | "admin" | "repartidor";

export interface Restaurante {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  horario: string;
  tiempo_entrega: string;
  imagen_url: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  imagen_url: string;
  restaurante: number;
}

export type EstadoPedido =
  | "pendiente"
  | "preparando"
  | "en_camino"
  | "entregado";

export interface ItemPedido {
  id: number;
  producto: number;
  cantidad: number;
  precio_unitario: number;
  nombre_producto: string;
  imagen_url: string;
}

export interface Pedido {
  id: number;
  cliente: string;
  repartidor: string | null;
  restaurante: string;
  estado: EstadoPedido;
  creado_en: string;
  items: ItemPedido[];
  // Entrega y pago
  tipo_entrega: string;
  direccion_entrega: string | null;
  pago_repartidor: number;
  // Confirmación y calificación del cliente
  confirmado_cliente: boolean;
  calificacion_repartidor: number | null;
  // PIN solo visible para el cliente dueño del pedido
  pin_entrega: string | null;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  usuario: string;
  rol: Rol;
}

export interface MensajeResponse {
  mensaje?: string;
  error?: string;
}