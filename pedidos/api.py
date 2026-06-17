from ninja import Router
from .schemas import PedidoSchema, CrearPedidoSchema
from .auth import JWTAuth
from . import services

router = Router()
jwt_auth = JWTAuth()


@router.post("/pedidos", response=PedidoSchema, auth=jwt_auth)
def crear_pedido(request, data: CrearPedidoSchema):
    """
    Crea un nuevo pedido con sus items. Estado inicial: pendiente.
    Requiere autenticación JWT (Bearer token).
    """
    items = [item.dict() for item in data.items]
    pedido = services.crear_pedido(request.auth, items)
    return pedido


@router.get("/pedidos/{pedido_id}", response=PedidoSchema, auth=jwt_auth)
def obtener_pedido(request, pedido_id: int):
    """
    Obtiene el estado actual de un pedido.
    Requiere autenticación JWT (Bearer token).
    """
    return services.obtener_pedido(pedido_id)


@router.post("/pedidos/{pedido_id}/avanzar", response=PedidoSchema, auth=jwt_auth)
def avanzar_pedido(request, pedido_id: int):
    """
    Avanza el estado del pedido usando el patrón State.
    Pendiente -> Preparando -> En Camino -> Entregado
    Requiere autenticación JWT (Bearer token).
    """
    return services.avanzar_estado_pedido(pedido_id)
