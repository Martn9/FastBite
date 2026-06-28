from ninja.errors import HttpError
from .models import Pedido, ItemPedido
from catalogo.models import Producto
from django.shortcuts import get_object_or_404


def crear_pedido(
    cliente, items: list, tipo_entrega: str = "delivery", direccion_entrega: str = None
):
    primer_producto = get_object_or_404(Producto, id=items[0]["producto_id"])
    restaurante = primer_producto.restaurante

    # Calculamos un pago al repartidor ficticio (ej. 1500 si es delivery, 0 si es retiro)
    pago = 1500 if tipo_entrega == "delivery" else 0

    pedido = Pedido.objects.create(
        cliente=cliente,
        restaurante=restaurante,
        tipo_entrega=tipo_entrega,
        direccion_entrega=direccion_entrega,
        pago_repartidor=pago,
    )

    for item in items:
        producto = get_object_or_404(Producto, id=item["producto_id"])
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
    rol = _rol(usuario)

    if rol == "repartidor":
        # AQUI LA SOLUCIÓN: Excluimos los entregados, para que solo vea los "En Curso"
        return (
            Pedido.objects.filter(repartidor=usuario)
            .exclude(estado="entregado")
            .order_by("-creado_en")
        )

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


def listar_entregados(usuario):
    """
    Solo para repartidores: historial de pedidos ya entregados.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor tiene historial de entregados")

    return Pedido.objects.filter(repartidor=usuario, estado="entregado").order_by(
        "-creado_en"
    )


def confirmar_entrega_cliente(pedido_id: int, usuario, calificacion: int):
    """
    El cliente confirma que recibió el pedido y le da una calificación al repartidor.
    """
    pedido = get_object_or_404(Pedido, id=pedido_id)

    if pedido.cliente.id != usuario.id:
        raise HttpError(403, "Solo el cliente que hizo el pedido puede confirmarlo")

    if pedido.estado != "entregado":
        raise HttpError(400, "El pedido aún no ha sido marcado como entregado")

    pedido.confirmado_cliente = True
    pedido.calificacion_repartidor = calificacion
    pedido.save(update_fields=["confirmado_cliente", "calificacion_repartidor"])

    return pedido
