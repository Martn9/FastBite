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
    restaurante_tiempo_entrega: Optional[str] = None

    # Totales y descuentos
    descuento_aplicado: int
    total_final: int

    # Pago (Strategy de métodos de pago)
    metodo_pago: Optional[str] = None
    estado_pago: Optional[str] = None
    referencia_pago: Optional[str] = None

    # Confirmación y calificación del cliente
    confirmado_cliente: bool
    calificacion_repartidor: Optional[int] = None
    calificacion_restaurante: Optional[int] = None

    # Cancelación
    cancelado_por: Optional[str] = None
    cancelado_razon: Optional[str] = None

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
    def resolve_restaurante_tiempo_entrega(obj):
        return obj.restaurante.tiempo_entrega

    @staticmethod
    def resolve_items(obj):
        return list(obj.items.select_related("producto").all())

    @staticmethod
    def resolve_cancelado_por(obj):
        return obj.cancelado_por.username if obj.cancelado_por else None

    @staticmethod
    def resolve_cancelado_razon(obj):
        return obj.cancelado_razon or None

    @staticmethod
    def resolve_metodo_pago(obj):
        pago = getattr(obj, "pago", None)
        return pago.metodo if pago else None

    @staticmethod
    def resolve_estado_pago(obj):
        pago = getattr(obj, "pago", None)
        return pago.estado if pago else None

    @staticmethod
    def resolve_referencia_pago(obj):
        pago = getattr(obj, "pago", None)
        return pago.referencia if pago else None


class CrearItemSchema(Schema):
    producto_id: int
    cantidad: int


class DatosPagoSchema(Schema):
    """
    Datos del formulario de pago. Se usan solo para la simulación
    (ver pedidos/patterns/strategies/pago_strategy.py) y nunca se
    almacenan en la base de datos.
    """

    numero_tarjeta: Optional[str] = None
    nombre_titular: Optional[str] = None
    vencimiento: Optional[str] = None
    cvv: Optional[str] = None


class CrearPedidoSchema(Schema):
    items: List[CrearItemSchema]
    tipo_entrega: str = "delivery"
    direccion_entrega: Optional[str] = None
    codigo_cupon: Optional[str] = None
    metodo_pago: str = "efectivo"
    datos_pago: Optional[DatosPagoSchema] = None


class ConfirmarEntregaRepartidorSchema(Schema):
    """El repartidor ingresa el PIN del cliente para confirmar la entrega."""

    pin: str


class ConfirmarRetiroSchema(Schema):
    """El restaurante ingresa el PIN para confirmar la entrega de retiro."""

    pin: Optional[str] = None


class CancelarPedidoSchema(Schema):
    """El cliente o restaurante cancela un pedido."""

    razon: Optional[str] = None


class CalificarPedidoSchema(Schema):
    """El cliente califica al repartidor tras confirmar la recepción."""

    calificacion: int


class CalificarRestauranteSchema(Schema):
    """El cliente califica al restaurante después de retirar o recibir el pedido."""

    calificacion: int