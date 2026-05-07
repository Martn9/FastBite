from ninja import ModelSchema
from .models import Restaurante, Producto

class RestauranteSchema(ModelSchema):
    class Meta:
        model = Restaurante
        fields = ['id', 'nombre', 'descripcion', 'categoria', 'horario', 'tiempo_entrega', 'imagen_url']

class ProductoSchema(ModelSchema):
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'categoria', 'disponible', 'imagen_url', 'restaurante']