from typing import List
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


@router.get("/pedidos", response=List[PedidoSchema], auth=jwt_auth)
def listar_pedidos(request):
    """
    Listado general (pensado para el admin). Cliente/repartidor también
    pueden llamarlo, pero conviene que usen los endpoints específicos
    de abajo (/disponibles, /mis-pedidos, /rechazados).
    """
    return services.listar_pedidos(request.auth)


@router.get("/pedidos/disponibles", response=List[PedidoSchema], auth=jwt_auth)
def listar_disponibles(request):
    """
    Solo repartidor: pedidos sin asignar y que este repartidor no haya
    rechazado todavía.
    """
    return services.listar_disponibles(request.auth)


@router.get("/pedidos/mis-pedidos", response=List[PedidoSchema], auth=jwt_auth)
def listar_mis_pedidos(request):
    """
    Historial personal según el rol: pedidos propios (cliente) o
    pedidos aceptados (repartidor).
    """
    return services.listar_mis_pedidos(request.auth)


@router.get("/pedidos/rechazados", response=List[PedidoSchema], auth=jwt_auth)
def listar_rechazados(request):
    """
    Solo repartidor: historial de pedidos que él mismo rechazó.
    """
    return services.listar_rechazados(request.auth)


@router.post("/pedidos/{pedido_id}/rechazar", response=PedidoSchema, auth=jwt_auth)
def rechazar_pedido(request, pedido_id: int):
    """
    Un repartidor rechaza un pedido disponible. Sigue disponible para
    el resto, pero no se le vuelve a mostrar a este repartidor.
    """
    return services.rechazar_pedido(pedido_id, request.auth)


@router.get("/pedidos/{pedido_id}", response=PedidoSchema, auth=jwt_auth)
def obtener_pedido(request, pedido_id: int):
    """
    Obtiene el estado actual de un pedido.
    Requiere autenticación JWT (Bearer token).
    """
    return services.obtener_pedido(pedido_id)


@router.post("/pedidos/{pedido_id}/tomar", response=PedidoSchema, auth=jwt_auth)
def tomar_pedido(request, pedido_id: int):
    """
    Un repartidor toma un pedido disponible (sin repartidor asignado).
    A partir de este punto, solo él puede avanzar su estado.
    """
    return services.tomar_pedido(pedido_id, request.auth)


@router.post("/pedidos/{pedido_id}/avanzar", response=PedidoSchema, auth=jwt_auth)
def avanzar_pedido(request, pedido_id: int):
    """
    Avanza el estado del pedido usando el patrón State.
    Pendiente -> Preparando -> En Camino -> Entregado
    Solo el admin o el repartidor asignado pueden avanzarlo.
    """
    return services.avanzar_estado_pedido(pedido_id, request.auth)
