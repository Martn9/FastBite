from .models import Pedido, ItemPedido
from catalogo.models import Producto
from django.shortcuts import get_object_or_404


def crear_pedido(cliente, items: list):
    """
    Lógica transaccional del carrito:
    crea el pedido y sus items.
    """

    primer_producto = get_object_or_404(Producto, id=items[0]["producto_id"])

    restaurante = primer_producto.restaurante

    pedido = Pedido.objects.create(cliente=cliente, restaurante=restaurante)

    for item in items:

        producto = get_object_or_404(Producto, id=item["producto_id"])

        # Validar que todos los productos
        # pertenezcan al mismo restaurante
        if producto.restaurante.id != restaurante.id:
            raise ValueError(
                "Todos los productos deben pertenecer al mismo restaurante"
            )

        ItemPedido.objects.create(
            pedido=pedido,
            producto=producto,
            cantidad=item["cantidad"],
            precio_unitario=producto.precio,
        )

    return pedido


def avanzar_estado_pedido(pedido_id: int):
    """
    Usa el patrón State para avanzar
    al siguiente estado del pedido.
    """

    pedido = get_object_or_404(Pedido, id=pedido_id)
    pedido.avanzar_estado()

    return pedido


def obtener_pedido(pedido_id: int):
    return get_object_or_404(Pedido, id=pedido_id)
