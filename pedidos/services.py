from ninja.errors import HttpError
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


def _rol(usuario):
    return getattr(getattr(usuario, "perfil", None), "rol", None)


def listar_pedidos(usuario):
    """
    Listado general (lo usa el admin para ver todo el negocio).
    - admin: ve todos los pedidos.
    - repartidor: ve los pedidos disponibles (sin repartidor asignado)
      más los que él ya tomó.
    - cliente: ve solo sus propios pedidos.
    """
    rol = _rol(usuario)

    if rol == "admin":
        return Pedido.objects.all().order_by("-creado_en")

    if rol == "repartidor":
        from django.db.models import Q

        return Pedido.objects.filter(
            Q(repartidor__isnull=True) | Q(repartidor=usuario)
        ).order_by("-creado_en")

    return Pedido.objects.filter(cliente=usuario).order_by("-creado_en")


def listar_disponibles(usuario):
    """
    Solo para repartidores: pedidos sin repartidor asignado y que este
    repartidor en particular no haya rechazado antes.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor puede ver pedidos disponibles")

    return (
        Pedido.objects.filter(repartidor__isnull=True)
        .exclude(rechazado_por=usuario)
        .order_by("-creado_en")
    )


def listar_mis_pedidos(usuario):
    """
    El historial personal de cada rol:
    - cliente: los pedidos que él mismo hizo.
    - repartidor: los pedidos que él aceptó (en curso o ya entregados).
    - admin: todos (para tener una vista equivalente).
    """
    rol = _rol(usuario)

    if rol == "repartidor":
        return Pedido.objects.filter(repartidor=usuario).order_by("-creado_en")

    if rol == "admin":
        return Pedido.objects.all().order_by("-creado_en")

    return Pedido.objects.filter(cliente=usuario).order_by("-creado_en")


def listar_rechazados(usuario):
    """
    Solo para repartidores: historial de pedidos que este repartidor
    rechazó en algún momento.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor tiene pedidos rechazados")

    return usuario.pedidos_rechazados.all().order_by("-creado_en")


def rechazar_pedido(pedido_id: int, usuario):
    """
    Un repartidor rechaza un pedido disponible. Queda registrado para que
    no se le vuelva a ofrecer a él, pero sigue disponible para los demás.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor puede rechazar un pedido")

    pedido = get_object_or_404(Pedido, id=pedido_id)

    if pedido.repartidor is not None:
        raise HttpError(400, "Este pedido ya fue tomado, no se puede rechazar")

    pedido.rechazado_por.add(usuario)
    return pedido


def tomar_pedido(pedido_id: int, usuario):
    """
    Un repartidor toma un pedido disponible. Una vez tomado, queda
    asignado exclusivamente a él hasta que se entregue.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor puede tomar un pedido")

    pedido = get_object_or_404(Pedido, id=pedido_id)

    if pedido.repartidor is not None:
        raise HttpError(400, "Este pedido ya fue tomado por otro repartidor")

    pedido.repartidor = usuario
    pedido.save(update_fields=["repartidor"])
    return pedido


def avanzar_estado_pedido(pedido_id: int, usuario):
    """
    Usa el patrón State para avanzar al siguiente estado del pedido.
    Permisos:
    - admin: puede avanzar cualquier pedido.
    - repartidor: solo puede avanzar el pedido que él mismo tomó.
    - cliente: nunca puede avanzar un pedido.
    """
    pedido = get_object_or_404(Pedido, id=pedido_id)
    rol = _rol(usuario)

    if rol == "admin":
        pass
    elif rol == "repartidor" and pedido.repartidor_id == usuario.id:
        pass
    else:
        raise HttpError(403, "No tienes permiso para avanzar este pedido")

    pedido.avanzar_estado()
    return pedido


def obtener_pedido(pedido_id: int):
    return get_object_or_404(Pedido, id=pedido_id)
