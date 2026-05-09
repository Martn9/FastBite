from .models import Pedido, ItemPedido
from catalogo.models import Producto
from django.shortcuts import get_object_or_404

def crear_pedido(cliente_nombre: str, items: list):
    """
    Lógica transaccional del carrito: crea el pedido y sus items.
    El estado inicial siempre es 'pendiente'.
    """
    pedido = Pedido.objects.create(cliente_nombre=cliente_nombre)

    for item in items:
        producto = get_object_or_404(Producto, id=item['producto_id'])
        ItemPedido.objects.create(
            pedido=pedido,
            producto=producto,
            cantidad=item['cantidad'],
            precio_unitario=producto.precio,
        )

    return pedido


def avanzar_estado_pedido(pedido_id: int):
    """
    Usa el patrón State para avanzar al siguiente estado del pedido.
    """
    pedido = get_object_or_404(Pedido, id=pedido_id)
    pedido.avanzar_estado()
    return pedido


def obtener_pedido(pedido_id: int):
    return get_object_or_404(Pedido, id=pedido_id)
