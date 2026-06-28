from django.db import models
from django.contrib.auth.models import User


class PerfilUsuario(models.Model):
    ROLES = [
        ("cliente", "Cliente"),
        ("admin", "Administrador"),
        ("repartidor", "Repartidor"),
        ("restaurante", "Restaurante"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil")
    rol = models.CharField(max_length=20, choices=ROLES)

    def __str__(self):
        return f"{self.user.username} - {self.rol}"
