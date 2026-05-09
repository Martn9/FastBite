from ninja import Router
from .schemas import PedidoSchema, CrearPedidoSchema
from . import services

router = Router()

@router.post("/pedidos", response=PedidoSchema)
def crear_pedido(request, data: CrearPedidoSchema):
    """
    Crea un nuevo pedido con sus items. Estado inicial: pendiente.
    """
    items = [item.dict() for item in data.items]
    pedido = services.crear_pedido(data.cliente_nombre, items)
    return pedido


@router.get("/pedidos/{pedido_id}", response=PedidoSchema)
def obtener_pedido(request, pedido_id: int):
    """
    Obtiene el estado actual de un pedido.
    """
    return services.obtener_pedido(pedido_id)


@router.post("/pedidos/{pedido_id}/avanzar", response=PedidoSchema)
def avanzar_pedido(request, pedido_id: int):
    """
    Avanza el estado del pedido usando el patrón State.
    Pendiente -> Preparando -> En Camino -> Entregado
    """
    return services.avanzar_estado_pedido(pedido_id)