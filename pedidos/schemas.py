from ninja import Schema, ModelSchema
from typing import List, Optional
from datetime import datetime
from .models import ItemPedido


class ItemPedidoSchema(ModelSchema):
    nombre_producto: str = ""
    imagen_url: str = ""

    class Meta:
        model = ItemPedido
        fields = ["id", "producto", "cantidad", "precio_unitario"]

    @staticmethod
    def resolve_nombre_producto(obj):
        return obj.producto.nombre

    @staticmethod
    def resolve_imagen_url(obj):
        return obj.producto.imagen_url or ""


class PedidoSchema(Schema):
    id: int
    cliente: str
    repartidor: Optional[str] = None
    restaurante: str
    estado: str
    creado_en: datetime
    items: List[ItemPedidoSchema] = []

    # Entrega y pago
    tipo_entrega: str
    direccion_entrega: Optional[str] = None
    pago_repartidor: int

    # Confirmación y calificación del cliente
    confirmado_cliente: bool
    calificacion_repartidor: Optional[int] = None

    # PIN solo visible para el cliente dueño del pedido
    # (el filtrado de quién lo ve se hace en el endpoint)
    pin_entrega: Optional[str] = None

    @staticmethod
    def resolve_cliente(obj):
        return obj.cliente.username

    @staticmethod
    def resolve_repartidor(obj):
        return obj.repartidor.username if obj.repartidor else None

    @staticmethod
    def resolve_restaurante(obj):
        return obj.restaurante.nombre

    @staticmethod
    def resolve_items(obj):
        return list(obj.items.select_related("producto").all())


class CrearItemSchema(Schema):
    producto_id: int
    cantidad: int


class CrearPedidoSchema(Schema):
    items: List[CrearItemSchema]
    tipo_entrega: str = "delivery"
    direccion_entrega: Optional[str] = None


class ConfirmarEntregaRepartidorSchema(Schema):
    """El repartidor ingresa el PIN del cliente para confirmar la entrega."""

    pin: str


class CalificarPedidoSchema(Schema):
    """El cliente califica al repartidor tras confirmar la recepción."""

    calificacion: int
