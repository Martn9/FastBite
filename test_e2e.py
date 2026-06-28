import pytest
import json
from django.contrib.auth.models import User
from catalogo.models import Restaurante, Producto
from pedidos.models import Pedido


@pytest.mark.django_db
def test_e2e_flujo_completo_fastbite(client):
    # ─── 1. PREPARACIÓN DE DATOS ───────────────────
    restaurante = Restaurante.objects.create(
        nombre="FastBite E2E",
        descripcion="Local para pruebas automatizadas",
        categoria="General",
        horario="10:00 - 22:00",
        tiempo_entrega="20 min",
    )

    producto = Producto.objects.create(
        restaurante=restaurante,
        nombre="Promo E2E Burger",
        descripcion="Hamburguesa con papas",
        precio=6000,
        categoria="Promociones",
        disponible=True,
    )

    # ─── 2. REGISTRO DE USUARIO ────────────────────
    url_registro = "/api/usuarios/registro-cliente?username=cliente_e2e&email=e2e@mail.com&password=Fuerte123"
    response_registro = client.post(url_registro)
    assert response_registro.status_code == 200, "Error en registro E2E"

    # ─── 3. LOGIN & OBTENCIÓN DE JWT ───────────────
    url_login = "/api/usuarios/login?username=cliente_e2e&password=Fuerte123"
    response_login = client.post(url_login)
    assert response_login.status_code == 200, "Error en login E2E"

    token = response_login.json().get("access")
    headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    # ─── 4. TRANSACCIÓN DEL CARRITO (Creación del pedido) ─────────────
    url_crear_pedido = "/api/pedidos/pedidos"

    payload_pedido = {"items": [{"producto_id": producto.id, "cantidad": 2}]}

    response_pedido = client.post(
        url_crear_pedido,
        data=json.dumps(payload_pedido),
        content_type="application/json",
        **headers,
    )

    assert (
        response_pedido.status_code == 200
    ), f"Error en creación pedido: {response_pedido.content}"

    datos_pedido = response_pedido.json()
    pedido_id = datos_pedido.get("id")

    # ─── 5. CREAR USUARIOS: uno admin para avanzar y otro repartidor para tomar/entregar ─────
    # Usuario admin (simula staff/admin que puede avanzar estados)
    url_registro_admin = "/api/usuarios/registro-cliente?username=admin_e2e&email=admin@mail.com&password=Fuerte123"
    client.post(url_registro_admin)
    admin = User.objects.get(username="admin_e2e")
    admin.perfil.rol = "admin"
    admin.perfil.save()
    url_login_admin = "/api/usuarios/login?username=admin_e2e&password=Fuerte123"
    res_login_admin = client.post(url_login_admin)
    token_admin = res_login_admin.json().get("access")
    headers_admin = {"HTTP_AUTHORIZATION": f"Bearer {token_admin}"}

    # Usuario repartidor real
    url_registro_rep = "/api/usuarios/registro-cliente?username=repartidor_e2e&email=rep@mail.com&password=Fuerte123"
    client.post(url_registro_rep)
    repartidor = User.objects.get(username="repartidor_e2e")
    repartidor.perfil.rol = "repartidor"
    repartidor.perfil.save()
    url_login_rep = "/api/usuarios/login?username=repartidor_e2e&password=Fuerte123"
    res_login_rep = client.post(url_login_rep)
    token_rep = res_login_rep.json().get("access")
    headers_repartidor = {"HTTP_AUTHORIZATION": f"Bearer {token_rep}"}

    # ─── 6. FLUJO DE ESTADOS (Patrón State) ──────────
    url_avanzar = f"/api/pedidos/pedidos/{pedido_id}/avanzar"

    # pendiente → preparando (lo hace el admin/restaurante)
    res = client.post(url_avanzar, **headers_admin)
    assert res.status_code == 200, "Fallo al avanzar estado a preparando"
    assert res.json().get("estado") == "preparando"

    # preparando → listo_despacho (nuevo flujo: el restaurante/admin marca listo)
    res = client.post(url_avanzar, **headers_admin)
    assert res.status_code == 200, "Fallo al avanzar estado a listo_despacho"
    assert res.json().get("estado") == "listo_despacho"

    # Un repartidor toma el pedido -> pasa a en_camino
    url_tomar = f"/api/pedidos/pedidos/{pedido_id}/tomar"
    res = client.post(url_tomar, **headers_repartidor)
    assert res.status_code == 200, "Fallo al tomar el pedido"
    assert res.json().get("estado") == "en_camino"

    # en_camino → entregado (requiere PIN)
    pedido_db = Pedido.objects.get(id=pedido_id)
    pin = pedido_db.pin_entrega

    url_entregar = f"/api/pedidos/pedidos/{pedido_id}/entregar"
    res = client.post(
        url_entregar,
        data=json.dumps({"pin": pin}),
        content_type="application/json",
        **headers_repartidor,
    )
    assert res.status_code == 200, f"Fallo al entregar con PIN: {res.content}"
    assert res.json().get("estado") == "entregado"

    # ─── 7. VERIFICACIÓN FINAL ───────────────────────
    pedido_db.refresh_from_db()
    assert pedido_db.estado == "entregado"