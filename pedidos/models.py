from django.db import models
from catalogo.models import Producto

class Pedido(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('preparando', 'Preparando'),
        ('en_camino', 'En Camino'),
        ('entregado', 'Entregado'),
    ]

    cliente_nombre = models.CharField(max_length=100)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def get_estado(self):
        from .states import ESTADOS
        return ESTADOS[self.estado]

    def avanzar_estado(self):
        self.get_estado().avanzar(self)

    def __str__(self):
        return f"Pedido #{self.id} - {self.cliente_nombre} - {self.estado}"


class ItemPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre}"