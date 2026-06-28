import pytest
from django.contrib.auth.models import User
from ninja.errors import HttpError
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
    # En el nuevo flujo, preparar lleva a 'listo_despacho' para delivery
    assert pedido.estado == "listo_despacho"


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
def test_repartidor_puede_ver_solo_sus_pedidos_como_cliente(usuario, producto):
    from usuarios.models import PerfilUsuario

    repartidor_a = User.objects.create_user(username="repartidor_a", password="pass123")
    PerfilUsuario.objects.create(user=repartidor_a, rol="repartidor")
    repartidor_b = User.objects.create_user(username="repartidor_b", password="pass123")
    PerfilUsuario.objects.create(user=repartidor_b, rol="repartidor")

    items = [{"producto_id": producto.id, "cantidad": 1}]
    pedido_a = services.crear_pedido(repartidor_a, items)

    pedidos_a = services.listar_mis_pedidos(repartidor_a)
    assert pedido_a in pedidos_a

    pedidos_b = services.listar_mis_pedidos(repartidor_b)
    assert pedido_a not in pedidos_b


@pytest.mark.django_db
def test_repartidor_b_toma_pedido_de_repartidor_a_y_pedido_no_esta_en_disponibles_para_a(usuario, producto):
    from usuarios.models import PerfilUsuario

    repartidor_a = User.objects.create_user(username="repartidor_a", password="pass123")
    PerfilUsuario.objects.create(user=repartidor_a, rol="repartidor")
    repartidor_b = User.objects.create_user(username="repartidor_b", password="pass123")
    PerfilUsuario.objects.create(user=repartidor_b, rol="repartidor")

    items = [{"producto_id": producto.id, "cantidad": 1}]
    pedido_a = services.crear_pedido(repartidor_a, items)

    disponibles_para_a = services.listar_disponibles(repartidor_a)
    assert pedido_a not in disponibles_para_a

    disponibles_para_b = services.listar_disponibles(repartidor_b)
    assert pedido_a in disponibles_para_b

    with pytest.raises(HttpError):
        services.tomar_pedido(pedido_a.id, repartidor_a)

    pedido_tomado = services.tomar_pedido(pedido_a.id, repartidor_b)
    assert pedido_tomado.repartidor == repartidor_b

    en_curso_b = services.listar_en_curso(repartidor_b)
    assert any(p.id == pedido_tomado.id for p in en_curso_b)
    assert all(p.cliente != repartidor_a.username for p in en_curso_b if p.id != pedido_tomado.id)


@pytest.mark.django_db
def test_repartidor_b_renuncia_pedido_y_se_libera_para_otros(usuario, producto):
    from usuarios.models import PerfilUsuario

    repartidor_a = User.objects.create_user(username="repartidor_a", password="pass123")
    PerfilUsuario.objects.create(user=repartidor_a, rol="repartidor")
    repartidor_b = User.objects.create_user(username="repartidor_b", password="pass123")
    PerfilUsuario.objects.create(user=repartidor_b, rol="repartidor")

    items = [{"producto_id": producto.id, "cantidad": 1}]
    pedido_a = services.crear_pedido(repartidor_a, items)

    pedido_tomado = services.tomar_pedido(pedido_a.id, repartidor_b)
    assert pedido_tomado.repartidor == repartidor_b

    renunciado = services.renunciar_pedido(pedido_a.id, repartidor_b)
    assert renunciado.repartidor is None

    disponibles_para_b = services.listar_disponibles(repartidor_b)
    assert pedido_a not in disponibles_para_b

    disponibles_para_a = services.listar_disponibles(repartidor_a)
    assert pedido_a not in disponibles_para_a

    repartidor_c = User.objects.create_user(username="repartidor_c", password="pass123")
    PerfilUsuario.objects.create(user=repartidor_c, rol="repartidor")
    disponibles_para_c = services.listar_disponibles(repartidor_c)
    assert pedido_a in disponibles_para_c


@pytest.mark.django_db
def test_avanzar_estado_pedido(pedido):
    # 1. Importamos el modelo con el nombre correcto: PerfilUsuario
    from usuarios.models import PerfilUsuario

    # 2. Le creamos el perfil asignándole el rol de admin para saltar la seguridad
    perfil, created = PerfilUsuario.objects.get_or_create(user=pedido.cliente)
    perfil.rol = "admin"
    perfil.save()

    # 3. Ejecutamos la lógica de avance de estado ¡Pasando el usuario también!
    pedido_avanzado = services.avanzar_estado_pedido(pedido.id, pedido.cliente)

    # 4. Verificamos que el estado avanzó correctamente
    assert pedido_avanzado.estado == "preparando"


@pytest.mark.django_db
def test_obtener_pedido(pedido):
    # Usar la función centralizada para obtener el pedido como admin
    from usuarios.models import PerfilUsuario
    perfil, created = PerfilUsuario.objects.get_or_create(user=pedido.cliente)
    perfil.rol = "admin"
    perfil.save()

    resultado = services.obtener_pedido(pedido.id, pedido.cliente, purpose="view")
    assert resultado.id == pedido.id


@pytest.mark.django_db
def test_restaurante_ve_solo_sus_pedidos(usuario, restaurante, producto):
    # Crear dos restaurantes y usuarios asociados
    from django.contrib.auth.models import User
    from usuarios.models import PerfilUsuario

    rest_user_a = User.objects.create_user(username="rest_a", password="pass123")
    PerfilUsuario.objects.create(user=rest_user_a, rol="restaurante")
    rest_a = Restaurante.objects.create(
        nombre="Rest A",
        descripcion="A",
        categoria="X",
        horario="10-22",
        tiempo_entrega="20 min",
    )
    rest_a.user = rest_user_a
    rest_a.save()

    rest_user_b = User.objects.create_user(username="rest_b", password="pass123")
    PerfilUsuario.objects.create(user=rest_user_b, rol="restaurante")
    rest_b = Restaurante.objects.create(
        nombre="Rest B",
        descripcion="B",
        categoria="Y",
        horario="10-22",
        tiempo_entrega="25 min",
    )
    rest_b.user = rest_user_b
    rest_b.save()

    # Crear pedidos para cada restaurante
    cliente = usuario
    p1 = Pedido.objects.create(cliente=cliente, restaurante=rest_a, estado="pendiente")
    p2 = Pedido.objects.create(cliente=cliente, restaurante=rest_b, estado="pendiente")

    # rest_a debe ver solo p1
    pedidos_a = services.listar_pedidos(rest_user_a)
    assert any(p.id == p1.id for p in pedidos_a)
    assert all(p.restaurante_id == rest_a.id for p in pedidos_a)

    # rest_b debe ver solo p2
    pedidos_b = services.listar_pedidos(rest_user_b)
    assert any(p.id == p2.id for p in pedidos_b)
    assert all(p.restaurante_id == rest_b.id for p in pedidos_b)


@pytest.mark.django_db
def test_restaurante_no_accede_pedido_otro_restaurante(usuario, producto):
    from django.contrib.auth.models import User
    from usuarios.models import PerfilUsuario

    # Crear restaurantes y usuarios
    rest_user_a = User.objects.create_user(username="rest_a2", password="pass123")
    PerfilUsuario.objects.create(user=rest_user_a, rol="restaurante")
    rest_a = Restaurante.objects.create(
        nombre="Rest A2",
        descripcion="A",
        categoria="X",
        horario="10-22",
        tiempo_entrega="20 min",
    )
    rest_a.user = rest_user_a
    rest_a.save()

    rest_user_b = User.objects.create_user(username="rest_b2", password="pass123")
    PerfilUsuario.objects.create(user=rest_user_b, rol="restaurante")
    rest_b = Restaurante.objects.create(
        nombre="Rest B2",
        descripcion="B",
        categoria="Y",
        horario="10-22",
        tiempo_entrega="25 min",
    )
    rest_b.user = rest_user_b
    rest_b.save()

    # Pedido para rest_a
    pedido = Pedido.objects.create(cliente=usuario, restaurante=rest_a, estado="pendiente")

    # rest_b no puede obtener el pedido
    with pytest.raises(HttpError):
        services.obtener_pedido(pedido.id, rest_user_b, purpose="view")

    # rest_a sí puede
    p_ok = services.obtener_pedido(pedido.id, rest_user_a, purpose="view")
    assert p_ok.id == pedido.id


@pytest.mark.django_db
def test_repartidor_no_puede_avanzar_retiro(usuario, producto):
    from usuarios.models import PerfilUsuario

    repartidor = User.objects.create_user(username="rep_x", password="pass123")
    PerfilUsuario.objects.create(user=repartidor, rol="repartidor")

    # Crear pedido de retiro
    pedido = services.crear_pedido(usuario, [{"producto_id": producto.id, "cantidad": 1}], tipo_entrega="retiro")

    # Repartidor no puede avanzar estado (solo restaurante/admin)
    with pytest.raises(HttpError):
        services.avanzar_estado_pedido(pedido.id, repartidor)


@pytest.mark.django_db
def test_restaurante_no_puede_avanzar_pedido_otro_restaurante(usuario, restaurante):
    from django.contrib.auth.models import User
    from usuarios.models import PerfilUsuario

    # Crear dos restaurantes y usuarios
    rest_user_a = User.objects.create_user(username="rest_x", password="pass123")
    PerfilUsuario.objects.create(user=rest_user_a, rol="restaurante")
    rest_a = Restaurante.objects.create(
        nombre="Rest X",
        descripcion="X",
        categoria="C",
        horario="10-22",
        tiempo_entrega="20 min",
    )
    rest_a.user = rest_user_a
    rest_a.save()

    rest_user_b = User.objects.create_user(username="rest_y", password="pass123")
    PerfilUsuario.objects.create(user=rest_user_b, rol="restaurante")
    rest_b = Restaurante.objects.create(
        nombre="Rest Y",
        descripcion="Y",
        categoria="D",
        horario="10-22",
        tiempo_entrega="25 min",
    )
    rest_b.user = rest_user_b
    rest_b.save()

    # Pedido pertenece a rest_a
    pedido = Pedido.objects.create(cliente=usuario, restaurante=rest_a, estado="pendiente")

    # rest_b no puede avanzar el pedido de rest_a
    with pytest.raises(HttpError):
        services.avanzar_estado_pedido(pedido.id, rest_user_b)


@pytest.mark.django_db
def test_repartidor_no_puede_tomar_retiro(usuario, producto):
    from usuarios.models import PerfilUsuario

    repartidor = User.objects.create_user(username="rep_test", password="pass123")
    PerfilUsuario.objects.create(user=repartidor, rol="repartidor")

    # Crear pedido de tipo retiro
    pedido = services.crear_pedido(usuario, [{"producto_id": producto.id, "cantidad": 1}], tipo_entrega="retiro")

    with pytest.raises(HttpError):
        services.tomar_pedido(pedido.id, repartidor)


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
