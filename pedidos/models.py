import random
from django.db import models
from catalogo.models import Producto, Restaurante
from django.contrib.auth.models import User


def _generar_pin():
    """Genera un PIN numérico de 4 dígitos como string con ceros a la izquierda."""
    return f"{random.randint(0, 9999):04d}"


class CuponDescuento(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    porcentaje = models.PositiveIntegerField(help_text="Descuento en porcentaje (ej: 20 para 20%)")
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.codigo} ({self.porcentaje}%)"


class Pedido(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("preparando", "Preparando"),
        ("en_camino", "En Camino"),
        ("listo_despacho", "Listo para despacho"),
        # Flujo alternativo para pedidos de retiro en tienda
        ("listo_retiro", "Listo para retirar"),
        ("retirado", "Retirado"),
        ("entregado", "Entregado"),
        ("cancelado", "Cancelado"),
    ]

    TIPO_ENTREGA_CHOICES = [
        ("delivery", "Delivery"),
        ("retiro", "Retiro en Tienda"),
    ]

    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pedidos")

    restaurante = models.ForeignKey(
        Restaurante, on_delete=models.CASCADE, related_name="pedidos"
    )

    # El repartidor queda null mientras el pedido está "disponible para tomar".
    # Una vez que un repartidor lo toma, queda asignado y solo él (o un admin)
    # puede seguir avanzando su estado.
    repartidor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entregas",
    )

    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")

    # --- Campos de entrega, pago y calificación ---
    tipo_entrega = models.CharField(
        max_length=20, choices=TIPO_ENTREGA_CHOICES, default="delivery"
    )
    direccion_entrega = models.CharField(max_length=255, blank=True)
    pago_repartidor = models.IntegerField(default=0)

    # Campos de totales y descuento
    cupon = models.ForeignKey(CuponDescuento, on_delete=models.SET_NULL, null=True, blank=True)
    descuento_aplicado = models.IntegerField(default=0)
    total_final = models.IntegerField(default=0)

    confirmado_cliente = models.BooleanField(default=False)
    calificacion_repartidor = models.PositiveSmallIntegerField(null=True, blank=True)
    calificacion_restaurante = models.PositiveSmallIntegerField(null=True, blank=True)

    cancelado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pedidos_cancelados",
    )
    cancelado_en = models.DateTimeField(null=True, blank=True)
    cancelado_razon = models.CharField(max_length=255, blank=True, default="")

    # PIN de 4 dígitos que se genera al crear el pedido.
    # El cliente lo recibe en la vista de detalle y solo lo comparte al repartidor
    # cuando tiene el pedido en mano. El repartidor debe ingresarlo para marcar
    # el pedido como "entregado".
    pin_entrega = models.CharField(
        max_length=4,
        blank=True,
        default="",
        help_text="PIN de 4 dígitos para verificar la entrega presencial.",
    )

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    # Cada vez que un repartidor rechaza este pedido, queda registrado aquí.
    rechazado_por = models.ManyToManyField(
        User, related_name="pedidos_rechazados", blank=True
    )

    def get_estado(self):
        from .states import ESTADOS

        return ESTADOS[self.estado]

    def avanzar_estado(self):
        self.get_estado().avanzar(self)

    def __str__(self):
        return f"Pedido #{self.id} - {self.cliente.username} - {self.estado}"


class ItemPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre}"


class Pago(models.Model):
    """
    Registro del pago asociado a un pedido. Es un simulador con fines
    académicos: no almacena datos sensibles de tarjetas (número completo,
    CVV, fecha de vencimiento), solo el resultado del procesamiento
    (patrón Strategy, ver pedidos/patterns/strategies/pago_strategy.py).
    """

    METODOS = [
        ("tarjeta", "Tarjeta"),
        ("transferencia", "Transferencia"),
        ("efectivo", "Efectivo al recibir"),
    ]

    ESTADOS_PAGO = [
        ("aprobado", "Aprobado"),
        ("rechazado", "Rechazado"),
    ]

    pedido = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name="pago")
    metodo = models.CharField(max_length=20, choices=METODOS)
    estado = models.CharField(max_length=20, choices=ESTADOS_PAGO, default="aprobado")
    monto = models.IntegerField()
    mensaje = models.CharField(max_length=255, blank=True, default="")
    referencia = models.CharField(max_length=20, blank=True, default="")
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pago #{self.id} - Pedido #{self.pedido_id} - {self.metodo} - {self.estado}"