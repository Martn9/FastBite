from ninja import Schema, ModelSchema
from typing import List, Optional
from datetime import datetime
from .models import ItemPedido


class ItemPedidoSchema(ModelSchema):
    class Meta:
        model = ItemPedido
        fields = ["id", "producto", "cantidad", "precio_unitario"]


class PedidoSchema(Schema):
    id: int
    cliente: str
    repartidor: Optional[str] = None
    restaurante: str
    estado: str
    creado_en: datetime

    # --- NUEVOS CAMPOS PARA DEVOLVER AL FRONTEND ---
    tipo_entrega: str
    direccion_entrega: Optional[str] = None
    pago_repartidor: int
    confirmado_cliente: bool
    calificacion_repartidor: Optional[int] = None
    # -----------------------------------------------

    @staticmethod
    def resolve_cliente(obj):
        return obj.cliente.username

    @staticmethod
    def resolve_repartidor(obj):
        return obj.repartidor.username if obj.repartidor else None

    @staticmethod
    def resolve_restaurante(obj):
        return obj.restaurante.nombre


class CrearItemSchema(Schema):
    producto_id: int
    cantidad: int


class CrearPedidoSchema(Schema):
    items: List[CrearItemSchema]
    # --- NUEVOS CAMPOS AL CREAR ---
    tipo_entrega: str = "delivery"
    direccion_entrega: Optional[str] = None


# --- NUEVO ESQUEMA PARA CALIFICAR ---
class CalificarPedidoSchema(Schema):
    calificacion: int
