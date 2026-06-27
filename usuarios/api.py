from ninja import Router
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import PerfilUsuario

router = Router()


@router.post("/registro-cliente")
def registro_cliente(request, username: str, email: str, password: str):

    if User.objects.filter(username=username).exists():
        return {"error": "El usuario ya existe"}

    user = User.objects.create_user(username=username, email=email, password=password)

    PerfilUsuario.objects.create(user=user, rol="cliente")

    return {"mensaje": "Cliente creado correctamente"}


@router.post("/registro-repartidor")
def registro_repartidor(request, username: str, email: str, password: str):

    if User.objects.filter(username=username).exists():
        return {"error": "El usuario ya existe"}

    user = User.objects.create_user(username=username, email=email, password=password)

    PerfilUsuario.objects.create(user=user, rol="repartidor")

    return {"mensaje": "Repartidor creado correctamente"}


@router.post("/login")
def login(request, username: str, password: str):

    user = authenticate(username=username, password=password)

    if not user:
        return {"error": "Credenciales incorrectas"}

    refresh = RefreshToken.for_user(user)

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "usuario": user.username,
        "rol": user.perfil.rol,
    }


@router.post("/refresh")
def refresh_token(request, refresh: str):
    """
    Recibe un refresh token vigente y entrega un nuevo access token,
    permitiendo renovar la sesión sin volver a pedir credenciales.
    """
    try:
        token = RefreshToken(refresh)
        return {"access": str(token.access_token)}
    except TokenError:
        return {"error": "Refresh token inválido o expirado"}
