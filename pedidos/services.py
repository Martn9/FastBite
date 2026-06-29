from datetime import datetime
from django.db import transaction
from ninja.errors import HttpError
from .models import Pedido, ItemPedido, Pago
from catalogo.models import Producto
from django.shortcuts import get_object_or_404

ERROR_PERMISO = "No tienes permiso para ver este pedido"


def crear_pedido(
    cliente,
    items: list,
    tipo_entrega: str = "delivery",
    direccion_entrega: str = None,
    codigo_cupon: str = None,
    metodo_pago: str = "efectivo",
    datos_pago: dict = None,
):
    from .models import _generar_pin, CuponDescuento
    from catalogo.patterns.decorators.descuento_decorator import PedidoBase, DescuentoPorcentajeDecorator
    from .patterns.strategies.pago_strategy import obtener_estrategia_pago

    primer_producto = get_object_or_404(Producto, id=items[0]["producto_id"])
    restaurante = primer_producto.restaurante

    pago_repartidor = 1500 if tipo_entrega == "delivery" else 0

    subtotal = 0
    for item in items:
        producto = get_object_or_404(Producto, id=item["producto_id"])
        subtotal += producto.precio * item["cantidad"]

    pedido_base = PedidoBase(subtotal=subtotal, costo_envio=pago_repartidor)
    cupon_obj = None
    descuento_aplicado = 0

    if codigo_cupon:
        try:
            cupon_obj = CuponDescuento.objects.get(codigo=codigo_cupon, activo=True)
            pedido_decorado = DescuentoPorcentajeDecorator(pedido_base, cupon_obj.porcentaje)
            total_final = pedido_decorado.calcular_total()
            descuento_aplicado = pedido_base.calcular_total() - total_final
        except CuponDescuento.DoesNotExist:
            raise HttpError(400, "Cupón inválido o inactivo")
    else:
        total_final = pedido_base.calcular_total()

    # Patron Strategy: procesar el pago segun el metodo elegido.
    # Solo si el pago es aprobado se continua con la creacion del pedido.
    try:
        estrategia = obtener_estrategia_pago(metodo_pago)
    except ValueError:
        raise HttpError(400, f"Metodo de pago no soportado: {metodo_pago}")

    resultado_pago = estrategia.procesar(int(total_final), datos_pago or {})

    if not resultado_pago.aprobado:
        raise HttpError(400, resultado_pago.mensaje)

    # Creacion atomica: pedido + items + pago, todo o nada.
    with transaction.atomic():
        pedido = Pedido.objects.create(
            cliente=cliente,
            restaurante=restaurante,
            tipo_entrega=tipo_entrega,
            direccion_entrega=direccion_entrega,
            pago_repartidor=pago_repartidor,
            cupon=cupon_obj,
            descuento_aplicado=descuento_aplicado,
            total_final=total_final,
            pin_entrega=_generar_pin(),
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

        Pago.objects.create(
            pedido=pedido,
            metodo=metodo_pago,
            estado="aprobado",
            monto=int(total_final),
            mensaje=resultado_pago.mensaje,
            referencia=resultado_pago.referencia,
        )

    return pedido


def _rol(usuario):
    return getattr(getattr(usuario, "perfil", None), "rol", None)


def _restaurante_for_user(usuario):
    """Retorna la instancia Restaurante asociada al `usuario`.

    Busca primero por `user` FK y, si no existe, usa la convencion antigua
    `Restaurante.nombre == usuario.username` para compatibilidad.
    """
    from catalogo.models import Restaurante

    restaurante = Restaurante.objects.filter(user=usuario).first()
    if not restaurante:
        restaurante = Restaurante.objects.filter(nombre=usuario.username).first()
    return restaurante


def listar_pedidos(usuario):
    """
    Listado general (lo usa el admin para ver todo el negocio).
    - admin: ve todos los pedidos.
    - repartidor: ve los pedidos disponibles (sin repartidor asignado)
      mas los que el ya tomo.
    - cliente: ve solo sus propios pedidos.
    """
    rol = _rol(usuario)

    if rol == "admin":
        return Pedido.objects.all().order_by("-creado_en")

    if rol == "restaurante":
        restaurante = _restaurante_for_user(usuario)

        if restaurante:
            return Pedido.objects.filter(restaurante=restaurante).order_by("-creado_en")
        return Pedido.objects.none()

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
        Pedido.objects.filter(
            repartidor__isnull=True,
            tipo_entrega="delivery",
        )
        .filter(estado__in=["pendiente", "listo_despacho"])
        .exclude(rechazado_por=usuario)
        .exclude(cliente=usuario)
        .prefetch_related("items__producto")
        .order_by("-creado_en")
    )


def listar_mis_pedidos(usuario):
    rol = _rol(usuario)
    if rol == "admin":
        return (
            Pedido.objects.all().prefetch_related("items__producto").order_by("-creado_en")
        )

    return (
        Pedido.objects.filter(cliente=usuario)
        .prefetch_related("items__producto")
        .order_by("-creado_en")
    )


def listar_en_curso(usuario):
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor puede ver sus pedidos en curso")

    return (
        Pedido.objects.filter(repartidor=usuario)
        .exclude(estado="entregado")
        .exclude(cliente=usuario)
        .prefetch_related("items__producto")
        .order_by("-creado_en")
    )


def listar_rechazados(usuario):
    """
    Solo para repartidores: historial de pedidos que este repartidor rechazo.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor tiene pedidos rechazados")

    return (
        usuario.pedidos_rechazados.all()
        .prefetch_related("items__producto")
        .order_by("-creado_en")
    )


def rechazar_pedido(pedido_id: int, usuario):
    """
    Un repartidor rechaza un pedido disponible.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor puede rechazar un pedido")

    pedido = obtener_pedido(pedido_id, usuario, purpose="take")

    if pedido.repartidor is not None:
        raise HttpError(400, "Este pedido ya fue tomado, no se puede rechazar")

    pedido.rechazado_por.add(usuario)
    return pedido


def renunciar_pedido(pedido_id: int, usuario):
    """
    Un repartidor renuncia a un pedido que ya tiene asignado.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor puede renunciar a un pedido")

    pedido = obtener_pedido(pedido_id, usuario, purpose="view")

    if pedido.repartidor_id != usuario.id:
        raise HttpError(403, "Solo el repartidor asignado puede renunciar a este pedido")

    if pedido.estado == "entregado":
        raise HttpError(400, "No puedes renunciar a un pedido ya entregado")

    pedido.repartidor = None
    pedido.estado = "listo_despacho"
    pedido.save(update_fields=["repartidor", "estado"])
    pedido.rechazado_por.add(usuario)
    return pedido


def tomar_pedido(pedido_id: int, usuario):
    """
    Un repartidor toma un pedido disponible.
    """
    if _rol(usuario) != "repartidor":
        raise HttpError(403, "Solo un repartidor puede tomar un pedido")

    pedido = obtener_pedido(pedido_id, usuario, purpose="take")

    if pedido.repartidor is not None:
        raise HttpError(400, "Este pedido ya fue tomado por otro repartidor")

    if pedido.cliente_id == usuario.id:
        raise HttpError(403, "No puedes tomar un pedido que tu mismo realizaste")

    if pedido.tipo_entrega == "retiro":
        raise HttpError(400, "Los pedidos para retiro en tienda no pueden ser tomados por repartidores")

    if pedido.estado not in ("pendiente", "listo_despacho"):
        raise HttpError(400, "Este pedido no esta listo para despacho")

    pedido.repartidor = usuario
    pedido.estado = "en_camino"
    pedido.save(update_fields=["repartidor", "estado"])
    return pedido


def avanzar_estado_pedido(pedido_id: int, usuario):
    """
    Usa el patron State para avanzar al siguiente estado del pedido.
    """
    pedido = obtener_pedido(pedido_id, usuario, purpose="manage")
    rol = _rol(usuario)

    if rol == "admin":
        pass
    elif rol == "restaurante":
        restaurante = _restaurante_for_user(usuario)

        if not restaurante or pedido.restaurante_id != restaurante.id:
            raise HttpError(403, "No tienes permiso para avanzar pedidos de otro restaurante")
    else:
        raise HttpError(403, "Solo el restaurante o admin pueden avanzar el estado de preparacion")

    if pedido.estado == "en_camino":
        raise HttpError(400, "Para marcar como entregado debes ingresar el PIN del cliente.")

    pedido.avanzar_estado()
    return pedido


def confirmar_entrega_con_pin(pedido_id: int, usuario, pin: str):
    """
    El repartidor ingresa el PIN del cliente para confirmar la entrega.
    Transiciona el pedido de 'en_camino' a 'entregado'.
    """
    pedido = obtener_pedido(pedido_id, usuario, purpose="view")
    rol = _rol(usuario)

    if rol not in ("repartidor", "admin"):
        raise HttpError(403, "Solo el repartidor o admin puede confirmar la entrega")

    if rol == "repartidor" and pedido.repartidor_id != usuario.id:
        raise HttpError(403, "Solo el repartidor asignado puede confirmar la entrega")

    if pedido.estado != "en_camino":
        raise HttpError(
            400, f"El pedido esta en estado '{pedido.estado}', no en camino."
        )

    if pedido.pin_entrega != pin.strip():
        raise HttpError(400, "PIN incorrecto. Pideselo al cliente.")

    pedido.estado = "entregado"
    pedido.save(update_fields=["estado"])
    return pedido


def confirmar_retiro(pedido_id: int, usuario, pin: str | None = None):
    pedido = obtener_pedido(pedido_id, usuario, purpose="view")

    if pedido.tipo_entrega != "retiro":
        raise HttpError(400, "Este endpoint es solo para pedidos de retiro")

    if pedido.estado != "listo_retiro":
        raise HttpError(400, "El pedido no esta listo para retirar")

    rol = _rol(usuario)

    if pedido.cliente_id == usuario.id:
        pedido.estado = "retirado"
        pedido.pin_entrega = ""
        pedido.save(update_fields=["estado", "pin_entrega"])
        return pedido

    if rol == "restaurante":
        restaurante = _restaurante_for_user(usuario)
        if restaurante and pedido.restaurante_id == restaurante.id:
            if not pin or pin.strip() != (pedido.pin_entrega or ""):
                raise HttpError(400, "PIN incorrecto. Proporcionalo para confirmar el retiro.")

            pedido.estado = "retirado"
            pedido.pin_entrega = ""
            pedido.save(update_fields=["estado", "pin_entrega"])
            return pedido

    raise HttpError(403, ERROR_PERMISO)


def cancelar_pedido(pedido_id: int, usuario, razon: str = ""):
    pedido = obtener_pedido(pedido_id, usuario, purpose="view")

    if pedido.estado in ("entregado", "retirado", "cancelado"):
        raise HttpError(400, "No se puede cancelar un pedido que ya termino")

    rol = _rol(usuario)

    if rol == "cliente" and pedido.cliente_id != usuario.id:
        raise HttpError(403, ERROR_PERMISO)
    elif rol == "restaurante":
        restaurante = _restaurante_for_user(usuario)
        if not restaurante or pedido.restaurante_id != restaurante.id:
            raise HttpError(403, "No tienes permiso para cancelar este pedido")
    elif rol not in ("cliente", "restaurante", "admin"):
        raise HttpError(403, ERROR_PERMISO)

    pedido.estado = "cancelado"
    pedido.cancelado_por = usuario
    pedido.cancelado_en = datetime.now()
    pedido.cancelado_razon = razon[:255]
    pedido.save(update_fields=["estado", "cancelado_por", "cancelado_en", "cancelado_razon"])
    return pedido


def calificar_restaurante(pedido_id: int, usuario, calificacion: int):
    pedido = obtener_pedido(pedido_id, usuario, purpose="view")

    if pedido.cliente_id != usuario.id:
        raise HttpError(403, "Solo el cliente que hizo el pedido puede calificar el restaurante")

    if pedido.estado not in ("entregado", "retirado"):
        raise HttpError(400, "El pedido debe estar completado para calificar al restaurante")

    if pedido.calificacion_restaurante is not None:
        raise HttpError(400, "Ya calificaste a este restaurante")

    if not 1 <= calificacion <= 5:
        raise HttpError(400, "La calificacion debe ser entre 1 y 5")

    pedido.calificacion_restaurante = calificacion
    pedido.save(update_fields=["calificacion_restaurante"])
    return pedido


def confirmar_recepcion_cliente(pedido_id: int, usuario, calificacion: int):
    """
    El cliente confirma que recibio el pedido y le da una calificacion al repartidor.
    """
    pedido = obtener_pedido(pedido_id, usuario, purpose="view")

    if pedido.cliente.id != usuario.id:
        raise HttpError(403, "Solo el cliente que hizo el pedido puede confirmarlo")

    if pedido.estado != "entregado":
        raise HttpError(400, "El pedido aun no ha sido marcado como entregado")

    if pedido.confirmado_cliente:
        raise HttpError(400, "El pedido ya fue confirmado")

    if not 1 <= calificacion <= 5:
        raise HttpError(400, "La calificacion debe ser entre 1 y 5")

    pedido.confirmado_cliente = True
    pedido.calificacion_repartidor = calificacion
    pedido.save(update_fields=["confirmado_cliente", "calificacion_repartidor"])

    return pedido


def _check_view_permissions(pedido, usuario, rol):
    if rol == "admin":
        return True
    if rol == "restaurante":
        restaurante = _restaurante_for_user(usuario)
        return restaurante and pedido.restaurante_id == restaurante.id
    if rol == "repartidor":
        return pedido.repartidor_id == usuario.id
    return pedido.cliente_id == usuario.id


def obtener_pedido(pedido_id: int, usuario, purpose: str = "view"):
    pedido = get_object_or_404(
        Pedido.objects.prefetch_related("items__producto").select_related("pago"),
        id=pedido_id,
    )
    rol = _rol(usuario)

    if purpose == "view":
        if not _check_view_permissions(pedido, usuario, rol):
            raise HttpError(403, ERROR_PERMISO)
        return pedido

    if purpose == "take":
        if rol in ["admin", "repartidor"]:
            return pedido
        return obtener_pedido(pedido_id, usuario, purpose="view")

    if purpose == "manage":
        if rol == "admin":
            return pedido
        if rol == "restaurante":
            restaurante = _restaurante_for_user(usuario)
            if restaurante and pedido.restaurante_id == restaurante.id:
                return pedido
        raise HttpError(403, "No tienes permiso para gestionar este pedido")

    raise ValueError("purpose desconocido")