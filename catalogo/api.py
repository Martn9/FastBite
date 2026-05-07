from ninja import Router
from typing import List
from .schemas import RestauranteSchema, ProductoSchema
from . import services  # Importamos nuestra capa de lógica de negocio

router = Router()

@router.get("/restaurantes", response=List[RestauranteSchema])
def listar_restaurantes(request):
    """
    Endpoint limpio: Solo delega la petición a la capa de servicios.
    """
    restaurantes = services.obtener_todos_los_restaurantes()
    return restaurantes

@router.get("/restaurantes/{restaurante_id}/productos", response=List[ProductoSchema])
def listar_productos_por_restaurante(request, restaurante_id: int):
    """
    Endpoint limpio: Delega la validación y búsqueda a la capa de servicios.
    """
    productos = services.obtener_productos_de_restaurante(restaurante_id)
    return productos