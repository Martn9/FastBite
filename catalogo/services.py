from django.shortcuts import get_object_or_404
from .models import Restaurante, Producto


def obtener_todos_los_restaurantes():
    """
    Regla de negocio: Obtener el catálogo completo de restaurantes activos.
    En el futuro, aquí se podría agregar lógica para filtrar por restaurantes abiertos.
    """
    return Restaurante.objects.all()


def obtener_productos_de_restaurante(restaurante_id: int):

    restaurante = get_object_or_404(Restaurante, id=restaurante_id)

    return Producto.objects.filter(restaurante=restaurante, disponible=True)
