import pytest
from django.http import Http404
from catalogo.models import Restaurante, Producto
from catalogo import services

# ─── Importaciones del Patrón Decorator ────────────────────
from catalogo.patterns.decorators.descuento_decorator import (
    PedidoBase,
    DescuentoPorcentajeDecorator,
    DescuentoFijoDecorator,
    EnvioGratisDecorator,
)

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


# ─── Tests del Patrón Decorator ────────────────────────────


def test_descuento_decorator_porcentual():
    # Se crea un pedido base con 10.000 de subtotal y 2.000 de envío (Total = 12.000)
    pedido_base = PedidoBase(subtotal=10000, costo_envio=2000)

    # Se aplica un 10% de descuento al TOTAL (12.000 - 1.200 = 10.800)
    pedido_con_descuento = DescuentoPorcentajeDecorator(pedido_base, porcentaje=10)

    assert pedido_con_descuento.calcular_total() == 10800


def test_descuento_decorator_fijo():
    # Se crea un pedido base con 10.000 de subtotal y 2.000 de envío (Total = 12.000)
    pedido_base = PedidoBase(subtotal=10000, costo_envio=2000)

    # Se aplica un descuento fijo de 3.000 pesos al TOTAL (12.000 - 3.000 = 9.000)
    pedido_con_descuento = DescuentoFijoDecorator(pedido_base, monto=3000)

    assert pedido_con_descuento.calcular_total() == 9000


def test_descuento_decorator_envio_gratis():
    # Se crea un pedido base con 10.000 de subtotal y 2.000 de envío (Total = 12.000)
    pedido_base = PedidoBase(subtotal=10000, costo_envio=2000)

    # Se aplica envío gratis que resta los 2000 del costo de envío (12.000 - 2.000 = 10.000)
    pedido_con_descuento = EnvioGratisDecorator(pedido_base)

    assert pedido_con_descuento.calcular_total() == 10000
