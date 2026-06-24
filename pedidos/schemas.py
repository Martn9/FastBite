from ninja import Schema, ModelSchema
from typing import List, Optional
from datetime import datetime
from .models import Pedido, ItemPedido


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
