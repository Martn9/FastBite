import pytest
from django.contrib.auth.models import User
from ninja.testing import TestClient
from usuarios.api import router
from usuarios.models import PerfilUsuario

# Ajuste de ruta según el README del repositorio
from catalogo.patterns.factories.usuario_factory import UsuarioFactory 

client = TestClient(router)


# ─── Tests de Registro ────────────────────────────────────

@pytest.mark.django_db
def test_registro_cliente_exitoso():
    response = client.post(
        "/registro-cliente?username=nuevo&email=nuevo@test.com&password=pass123"
    )
    assert response.status_code == 200
    assert "mensaje" in response.json()
    assert User.objects.filter(username="nuevo").exists()


@pytest.mark.django_db
def test_registro_cliente_usuario_duplicado():
    User.objects.create_user(
        username="existente",
        email="e@test.com",
        password="pass123"
    )
    response = client.post(
        "/registro-cliente?username=existente&email=e@test.com&password=pass123"
    )
    assert response.status_code == 200
    assert "error" in response.json()


@pytest.mark.django_db
def test_registro_repartidor_exitoso():
    response = client.post(
        "/registro-repartidor?username=repartidor1&email=rep@test.com&password=pass123"
    )
    assert response.status_code == 200
    assert "mensaje" in response.json()
    assert User.objects.filter(username="repartidor1").exists()


# ─── Tests de Login ───────────────────────────────────────

@pytest.mark.django_db
def test_login_exitoso():
    user = User.objects.create_user(
        username="loginuser",
        password="pass123"
    )
    PerfilUsuario.objects.create(user=user, rol="cliente")
    response = client.post(
        "/login?username=loginuser&password=pass123"
    )
    assert response.status_code == 200
    data = response.json()
    assert "access" in data
    assert "refresh" in data
    assert data["usuario"] == "loginuser"
    assert data["rol"] == "cliente"


@pytest.mark.django_db
def test_login_credenciales_incorrectas():
    response = client.post(
        "/login?username=noexiste&password=wrongpass"
    )
    assert response.status_code == 200
    assert "error" in response.json()


# ─── Tests del Patrón Factory ──────────────────────────────

@pytest.mark.django_db
def test_usuario_factory_crea_cliente():
    user = UsuarioFactory.crear_usuario(tipo="cliente", username="cli1", email="cli1@test.com", password="123")
    assert user.perfil.rol == "cliente"

@pytest.mark.django_db
def test_usuario_factory_crea_repartidor():
    user = UsuarioFactory.crear_usuario(tipo="repartidor", username="rep1", email="rep1@test.com", password="123")
    assert user.perfil.rol == "repartidor"