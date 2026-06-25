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
        tiempo_entrega="20 min"
    )
    
    producto = Producto.objects.create(
        restaurante=restaurante,
        nombre="Promo E2E Burger",
        descripcion="Hamburguesa con papas",
        precio=6000,
        categoria="Promociones",
        disponible=True
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
    
    # ESTRUCTURA CORREGIDA: Envolvemos en un diccionario con la llave "items"
    payload_pedido = {
        "items": [
            {"producto_id": producto.id, "cantidad": 2}
        ]
    }
    
    response_pedido = client.post(
        url_crear_pedido,
        data=json.dumps(payload_pedido),
        content_type="application/json",
        **headers
    )
    
    assert response_pedido.status_code == 200, f"Error en creación pedido: {response_pedido.content}"
    
    datos_pedido = response_pedido.json()
    pedido_id = datos_pedido.get("id")
    
    # ─── 5. FLUJO DE ESTADOS (Patrón State) ──────────
    url_avanzar = f"/api/pedidos/pedidos/{pedido_id}/avanzar"
    
    for estado_esperado in ["preparando", "en_camino", "entregado"]:
        res = client.post(url_avanzar, **headers)
        assert res.status_code == 200
        assert res.json().get("estado") == estado_esperado

    # ─── 6. VERIFICACIÓN FINAL ───────────────────────
    pedido_db = Pedido.objects.get(id=pedido_id)
    assert pedido_db.estado == "entregado"