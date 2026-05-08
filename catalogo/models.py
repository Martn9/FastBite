from django.db import models

# Create your models here.
from django.db import models

class Restaurante(models.Model): 
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    categoria = models.CharField(max_length=50)
    horario = models.CharField(max_length=100)
    tiempo_entrega = models.CharField(max_length=50)
    # Para el MVP, usaremos una URL de imagen simple    
    imagen_url = models.URLField(blank=True) 

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE, related_name='productos')
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.CharField(max_length=50)
    disponible = models.BooleanField(default=True)
    imagen_url = models.URLField(blank=True)

    def __str__(self):
        return f"{self.nombre} - {self.restaurante.nombre}"