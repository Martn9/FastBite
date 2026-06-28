import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

from django.contrib.auth.models import User
from usuarios.models import PerfilUsuario
from catalogo.models import Restaurante


def run():
    password = os.environ.get("RESTAURANT_PASSWORD")
    if not password:
        print("Environment variable RESTAURANT_PASSWORD not set. Creating users with unusable password.")

    for rest in Restaurante.objects.all():
        if rest.user:
            print(f"Restaurante '{rest.nombre}' ya tiene usuario asignado: {rest.user.username}")
            continue

        username = f"rest_{rest.id}"
        user, created = User.objects.get_or_create(username=username)
        if created:
            if password:
                user.set_password(password)
            else:
                user.set_unusable_password()
            user.save()
            PerfilUsuario.objects.create(user=user, rol="restaurante")
            rest.user = user
            rest.save(update_fields=["user"])
            print(f"Creado usuario para restaurante '{rest.nombre}': {username}")
        else:
            # Ensure perfil exists
            PerfilUsuario.objects.get_or_create(user=user, defaults={"rol": "restaurante"})
            rest.user = user
            rest.save(update_fields=["user"])
            print(f"Asignado usuario existente '{username}' a restaurante '{rest.nombre}'")


if __name__ == "__main__":
    run()
