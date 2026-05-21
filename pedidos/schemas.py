from ninja import Schema, ModelSchema
from typing import List
from .models import Pedido, ItemPedido


class ItemPedidoSchema(ModelSchema):
    class Meta:
        model = ItemPedido
        fields = ['id', 'producto', 'cantidad', 'precio_unitario']


class PedidoSchema(ModelSchema):
    class Meta:
        model = Pedido
        fields = ['id', 'cliente', 'estado', 'creado_en']


class CrearItemSchema(Schema):
    producto_id: int
    cantidad: int


class CrearPedidoSchema(Schema):
    items: List[CrearItemSchema]