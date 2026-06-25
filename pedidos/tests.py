import pytest
from django.contrib.auth.models import User
from catalogo.models import Restaurante, Producto
from pedidos.models import Pedido
from pedidos import services
from pedidos.states import (
    EstadoPendiente,
    EstadoPreparando,
    EstadoEnCamino,
    EstadoEntregado,
)

# ─── Fixtures ────────────────────────────────────────────


@pytest.fixture
def usuario(db):
    return User.objects.create_user(username="testuser", password="testpass123")


@pytest.fixture
def restaurante(db):
    return Restaurante.objects.create(
        nombre="Restaurante Test",
        descripcion="Descripción test",
        categoria="Comida rápida",
        horario="12:00 - 22:00",
        tiempo_entrega="30 min",
    )


@pytest.fixture
def producto(restaurante):
    return Producto.objects.create(
        restaurante=restaurante,
        nombre="Hamburguesa Test",
        descripcion="Una hamburguesa de prueba",
        precio=5000,
        categoria="Principal",
        disponible=True,
    )


@pytest.fixture
def pedido(usuario, restaurante):
    return Pedido.objects.create(
        cliente=usuario,
        restaurante=restaurante,
        estado="pendiente",
    )


# ─── Tests del patrón State ───────────────────────────────


@pytest.mark.django_db
def test_pendiente_avanza_a_preparando(pedido):
    EstadoPendiente().avanzar(pedido)
    pedido.refresh_from_db()
    assert pedido.estado == "preparando"


@pytest.mark.django_db
def test_preparando_avanza_a_en_camino(pedido):
    pedido.estado = "preparando"
    pedido.save()
    EstadoPreparando().avanzar(pedido)
    pedido.refresh_from_db()
    assert pedido.estado == "en_camino"


@pytest.mark.django_db
def test_en_camino_avanza_a_entregado(pedido):
    pedido.estado = "en_camino"
    pedido.save()
    EstadoEnCamino().avanzar(pedido)
    pedido.refresh_from_db()
    assert pedido.estado == "entregado"


@pytest.mark.django_db
def test_entregado_no_puede_avanzar(pedido):
    pedido.estado = "entregado"
    pedido.save()
    with pytest.raises(ValueError, match="ya fue entregado"):
        EstadoEntregado().avanzar(pedido)


# ─── Tests de Services ────────────────────────────────────


@pytest.mark.django_db
def test_crear_pedido_exitoso(usuario, producto):
    items = [{"producto_id": producto.id, "cantidad": 2}]
    pedido = services.crear_pedido(usuario, items)
    assert pedido.cliente == usuario
    assert pedido.restaurante == producto.restaurante
    assert pedido.estado == "pendiente"
    assert pedido.items.count() == 1


@pytest.mark.django_db
def test_crear_pedido_precio_y_cantidad_correctos(usuario, producto):
    items = [{"producto_id": producto.id, "cantidad": 3}]
    pedido = services.crear_pedido(usuario, items)
    item = pedido.items.first()
    assert item.cantidad == 3
    assert item.precio_unitario == producto.precio


@pytest.mark.django_db
def test_crear_pedido_productos_distintos_restaurantes_falla(usuario, producto):
    restaurante2 = Restaurante.objects.create(
        nombre="Otro Restaurante",
        descripcion="Otro",
        categoria="Pizza",
        horario="12:00 - 22:00",
        tiempo_entrega="45 min",
    )
    producto2 = Producto.objects.create(
        restaurante=restaurante2,
        nombre="Pizza Test",
        descripcion="Una pizza",
        precio=8000,
        categoria="Principal",
        disponible=True,
    )
    items = [
        {"producto_id": producto.id, "cantidad": 1},
        {"producto_id": producto2.id, "cantidad": 1},
    ]
    with pytest.raises(ValueError, match="mismo restaurante"):
        services.crear_pedido(usuario, items)


@pytest.mark.django_db
def test_avanzar_estado_pedido(pedido):
    # 1. Le damos el pase VIP de admin al usuario de prueba temporalmente
    pedido.cliente.perfil.rol = "admin"
    pedido.cliente.perfil.save()

    # 2. Ejecutamos la función para avanzar el pedido (¡la que se había borrado!)
    pedido_avanzado = services.avanzar_estado_pedido(pedido.id, pedido.cliente)

    # 3. Verificamos que el estado avanzó correctamente
    assert pedido_avanzado.estado == "preparando"


@pytest.mark.django_db
def test_obtener_pedido(pedido):
    resultado = services.obtener_pedido(pedido.id)
    assert resultado.id == pedido.id


# ─── Tests de nombre() en States ─────────────────────────


def test_nombre_estado_pendiente():
    assert EstadoPendiente().nombre() == "pendiente"


def test_nombre_estado_preparando():
    assert EstadoPreparando().nombre() == "preparando"


def test_nombre_estado_en_camino():
    assert EstadoEnCamino().nombre() == "en_camino"


def test_nombre_estado_entregado():
    assert EstadoEntregado().nombre() == "entregado"


# ─── Tests de __str__ y subtotal en Models ───────────────


@pytest.mark.django_db
def test_str_pedido(pedido):
    expected = f"Pedido #{pedido.id} - testuser - pendiente"
    assert str(pedido) == expected


@pytest.mark.django_db
def test_subtotal_item_pedido(usuario, producto):
    items = [{"producto_id": producto.id, "cantidad": 3}]
    pedido = services.crear_pedido(usuario, items)
    item = pedido.items.first()
    assert item.subtotal() == 3 * producto.precio


@pytest.mark.django_db
def test_str_item_pedido(usuario, producto):
    items = [{"producto_id": producto.id, "cantidad": 2}]
    pedido = services.crear_pedido(usuario, items)
    item = pedido.items.first()
    assert str(item) == f"2x {producto.nombre}"
