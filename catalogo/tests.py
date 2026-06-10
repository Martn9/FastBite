import pytest
from django.http import Http404
from catalogo.models import Restaurante, Producto
from catalogo import services


# ─── Fixtures ────────────────────────────────────────────

@pytest.fixture
def restaurante(db):
    return Restaurante.objects.create(
        nombre="Test Burger",
        descripcion="Descripción de prueba",
        categoria="Comida rápida",
        horario="12:00 - 22:00",
        tiempo_entrega="30 min",
    )


@pytest.fixture
def producto_disponible(restaurante):
    return Producto.objects.create(
        restaurante=restaurante,
        nombre="Hamburguesa",
        descripcion="Rica hamburguesa",
        precio=5000,
        categoria="Principal",
        disponible=True,
    )


@pytest.fixture
def producto_no_disponible(restaurante):
    return Producto.objects.create(
        restaurante=restaurante,
        nombre="Pizza",
        descripcion="Pizza especial",
        precio=8000,
        categoria="Principal",
        disponible=False,
    )


# ─── Tests de Model ───────────────────────────────────────

@pytest.mark.django_db
def test_crear_restaurante(restaurante):
    assert restaurante.nombre == "Test Burger"
    assert Restaurante.objects.count() == 1


# ─── Tests de Services ────────────────────────────────────

@pytest.mark.django_db
def test_obtener_todos_los_restaurantes(restaurante):
    resultado = services.obtener_todos_los_restaurantes()
    assert resultado.count() == 1
    assert resultado.first().nombre == "Test Burger"


@pytest.mark.django_db
def test_obtener_productos_solo_devuelve_disponibles(
    restaurante, producto_disponible, producto_no_disponible
):
    productos = services.obtener_productos_de_restaurante(restaurante.id)
    assert productos.count() == 1
    assert productos.first().nombre == "Hamburguesa"


@pytest.mark.django_db
def test_obtener_productos_restaurante_inexistente():
    with pytest.raises(Http404):
        services.obtener_productos_de_restaurante(9999)