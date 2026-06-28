from typing import List
from ninja import Schema, Router
from ninja.errors import HttpError
from .schemas import (
    PedidoSchema,
    CrearPedidoSchema,
    CalificarPedidoSchema,
    ConfirmarEntregaRepartidorSchema,
    ConfirmarRetiroSchema,
    CancelarPedidoSchema,
    CalificarRestauranteSchema,
)
from .auth import JWTAuth
from . import services

router = Router()
jwt_auth = JWTAuth()

class ValidarCuponSchema(Schema):
    codigo: str

class RespuestaCuponSchema(Schema):
    valido: bool
    porcentaje: int = 0
    mensaje: str = ""

@router.post("/cupones/validar", response=RespuestaCuponSchema)
def validar_cupon(request, data: ValidarCuponSchema):
    """Valida un código de cupón de descuento."""
    from .models import CuponDescuento
    try:
        cupon = CuponDescuento.objects.get(codigo=data.codigo, activo=True)
        return {"valido": True, "porcentaje": cupon.porcentaje, "mensaje": "Cupón aplicado exitosamente"}
    except CuponDescuento.DoesNotExist:
        return {"valido": False, "porcentaje": 0, "mensaje": "Cupón inválido o inactivo"}


def _con_pin(pedido, request):
    """
    Devuelve el pedido tal cual; el PIN solo se incluye si el usuario autenticado
    es el cliente dueño del pedido. Para el repartidor y admin se omite.
    """
    usuario = request.auth
    rol = getattr(getattr(usuario, "perfil", None), "rol", None)
    # No mostramos PIN para pedidos de tipo 'retiro' en ningún caso.
    if pedido.tipo_entrega == "retiro":
        pedido.pin_entrega = None
        return pedido

    if rol != "cliente" or pedido.cliente_id != usuario.id:
        pedido.pin_entrega = None
    return pedido


@router.post("/pedidos", response=PedidoSchema, auth=jwt_auth)
def crear_pedido(request, data: CrearPedidoSchema):
    """Crea un nuevo pedido con sus items y tipo de entrega."""
    items = [item.dict() for item in data.items]
    pedido = services.crear_pedido(
        request.auth,
        items,
        tipo_entrega=data.tipo_entrega,
        direccion_entrega=data.direccion_entrega,
        codigo_cupon=data.codigo_cupon,
    )
    # El cliente siempre ve su propio PIN al crear el pedido
    return pedido


@router.get("/pedidos", response=List[PedidoSchema], auth=jwt_auth)
def listar_pedidos(request):
    """Listado general (pensado para el admin)."""
    pedidos = services.listar_pedidos(request.auth)
    return [_con_pin(p, request) for p in pedidos]


# ─── Rutas estáticas ANTES de /{pedido_id} ───────────────────────────────────


@router.get("/pedidos/disponibles", response=List[PedidoSchema], auth=jwt_auth)
def listar_disponibles(request):
    """Solo repartidor: pedidos sin asignar que este repartidor no haya rechazado."""
    pedidos = services.listar_disponibles(request.auth)
    # El repartidor NO ve el PIN en la lista (solo lo ingresa in situ)
    for p in pedidos:
        p.pin_entrega = None
    return list(pedidos)


@router.get("/pedidos/mis-pedidos", response=List[PedidoSchema], auth=jwt_auth)
def listar_mis_pedidos(request):
    """Historial personal según el rol."""
    pedidos = services.listar_mis_pedidos(request.auth)
    return [_con_pin(p, request) for p in pedidos]


@router.get("/pedidos/rechazados", response=List[PedidoSchema], auth=jwt_auth)
def listar_rechazados(request):
    """Solo repartidor: historial de pedidos que él mismo rechazó."""
    pedidos = services.listar_rechazados(request.auth)
    for p in pedidos:
        p.pin_entrega = None
    return list(pedidos)


@router.get("/pedidos/en-curso", response=List[PedidoSchema], auth=jwt_auth)
def listar_en_curso(request):
    """Solo repartidor: pedidos asignados que están en curso (no entregados)."""
    pedidos = services.listar_en_curso(request.auth)
    # El repartidor no debe ver el PIN en la lista
    for p in pedidos:
        p.pin_entrega = None
    return list(pedidos)


@router.post("/pedidos/{pedido_id}/renunciar", response=PedidoSchema, auth=jwt_auth)
def renunciar_pedido(request, pedido_id: int):
    """Un repartidor renuncia a un pedido que ya tiene asignado."""
    pedido = services.renunciar_pedido(pedido_id, request.auth)
    pedido.pin_entrega = None
    return pedido


@router.get("/pedidos/entregados", response=List[PedidoSchema], auth=jwt_auth)
def listar_entregados(request):
    """Solo repartidor: historial de pedidos ya entregados."""
    pedidos = services.listar_entregados(request.auth)
    for p in pedidos:
        p.pin_entrega = None
    return list(pedidos)


# ─── Rutas dinámicas con {pedido_id} ─────────────────────────────────────────


@router.get("/pedidos/{pedido_id}", response=PedidoSchema, auth=jwt_auth)
def obtener_pedido(request, pedido_id: int):
    """Obtiene el estado actual de un pedido. El PIN solo se devuelve al cliente."""
    # Usar la función centralizada de acceso que aplica validaciones por rol.
    pedido = services.obtener_pedido(pedido_id, request.auth, purpose="view")
    return _con_pin(pedido, request)


@router.post("/pedidos/{pedido_id}/tomar", response=PedidoSchema, auth=jwt_auth)
def tomar_pedido(request, pedido_id: int):
    """Un repartidor toma un pedido disponible."""
    pedido = services.tomar_pedido(pedido_id, request.auth)
    pedido.pin_entrega = None
    return pedido


@router.post("/pedidos/{pedido_id}/rechazar", response=PedidoSchema, auth=jwt_auth)
def rechazar_pedido(request, pedido_id: int):
    """Un repartidor rechaza un pedido disponible."""
    pedido = services.rechazar_pedido(pedido_id, request.auth)
    pedido.pin_entrega = None
    return pedido


@router.post("/pedidos/{pedido_id}/avanzar", response=PedidoSchema, auth=jwt_auth)
def avanzar_pedido(request, pedido_id: int):
    """
    Avanza el estado (Pendiente→Preparando→En Camino).
    El paso final (En Camino→Entregado) usa /entregar con PIN.
    """
    pedido = services.avanzar_estado_pedido(pedido_id, request.auth)
    return _con_pin(pedido, request)


@router.post("/pedidos/{pedido_id}/entregar", response=PedidoSchema, auth=jwt_auth)
def entregar_con_pin(request, pedido_id: int, data: ConfirmarEntregaRepartidorSchema):
    """
    El repartidor ingresa el PIN del cliente para confirmar la entrega física.
    Transiciona el pedido de 'en_camino' a 'entregado'.
    """
    pedido = services.confirmar_entrega_con_pin(pedido_id, request.auth, data.pin)
    pedido.pin_entrega = None  # no devolver el PIN al repartidor
    return pedido


@router.post("/pedidos/{pedido_id}/confirmar", response=PedidoSchema, auth=jwt_auth)
def confirmar_recepcion(request, pedido_id: int, data: CalificarPedidoSchema):
    """El cliente confirma que recibió el pedido y califica al repartidor (1–5)."""
    pedido = services.confirmar_recepcion_cliente(
        pedido_id, request.auth, data.calificacion
    )
    return _con_pin(pedido, request)


@router.post("/pedidos/{pedido_id}/retirar", response=PedidoSchema, auth=jwt_auth)
def retirar_pedido(request, pedido_id: int, data: ConfirmarRetiroSchema):
    """El cliente (o restaurante) marca un pedido de tipo 'retiro' como retirado.
    El restaurante debe ingresar el PIN para confirmar el retiro; el cliente
    puede marcarlo sin PIN desde su vista.
    """
    pedido = services.confirmar_retiro(pedido_id, request.auth, pin=data.pin)
    pedido.pin_entrega = None
    return _con_pin(pedido, request)


@router.post("/pedidos/{pedido_id}/cancelar", response=PedidoSchema, auth=jwt_auth)
def cancelar_pedido(request, pedido_id: int, data: CancelarPedidoSchema):
    """Cliente o restaurante cancelan un pedido (con razón opcional)."""
    pedido = services.cancelar_pedido(pedido_id, request.auth, razon=(data.razon or ""))
    return _con_pin(pedido, request)


@router.post("/pedidos/{pedido_id}/calificar-restaurante", response=PedidoSchema, auth=jwt_auth)
def calificar_restaurante(request, pedido_id: int, data: CalificarRestauranteSchema):
    """El cliente califica al restaurante tras recibir o retirar el pedido."""
    pedido = services.calificar_restaurante(pedido_id, request.auth, data.calificacion)
    return _con_pin(pedido, request)
