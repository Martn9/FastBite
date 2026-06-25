import pytest
import json
from django.contrib.auth.models import User
from catalogo.models import Restaurante, Producto
from pedidos.models import Pedido

@pytest.mark.django_db
def test_e2e_flujo_completo_fastbite(client):
    """
    Prueba End-to-End (E2E) que simula el flujo funcional ininterrumpido:
    1. Registro de un cliente nuevo.
    2. Login del cliente y obtención del Token JWT.
    3. Creación de un pedido usando cabeceras HTTP de autorización.
    4. Ciclo completo de transición de estados usando el Patrón State.
    """
    
    # ─── 1. PREPARACIÓN DE DATOS (Catálogo inicial) ───────────────────
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

    # ─── 2. REGISTRO DE USUARIO ───────────────────────────────────────
    url_registro = "/api/usuarios/registro-cliente?username=cliente_e2e&email=e2e@mail.com&password=Fuerte123"
    response_registro = client.post(url_registro)
    
    assert response_registro.status_code == 200, f"Error en registro E2E. Revisa la ruta: {url_registro}"
    assert User.objects.filter(username="cliente_e2e").exists()

    # ─── 3. LOGIN & OBTENCIÓN DE JWT ──────────────────────────────────
    url_login = "/api/usuarios/login?username=cliente_e2e&password=Fuerte123"
    response_login = client.post(url_login)
    
    assert response_login.status_code == 200, "Error crítico en el flujo: Falló el login E2E"
    
    datos_login = response_login.json()
    token = datos_login.get("access")
    assert token is not None, "El payload del login no retornó la propiedad 'access' con el JWT"

    # Configuramos la cabecera simulando al Frontend
    headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    # ─── 4. TRANSACCIÓN DEL CARRITO (Creación del pedido) ─────────────
    url_crear_pedido = "/api/pedidos/pedidos"
    
    # ¡AQUÍ ESTÁ LA MAGIA! Envolvemos la lista en el diccionario "items"
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
    
    assert response_pedido.status_code == 200, f"Error al crear pedido. Código: {response_pedido.status_code}"
    datos_pedido = response_pedido.json()
    pedido_id = datos_pedido.get("id")
    
    assert pedido_id is not None, "La respuesta no retornó el ID del pedido"
    assert datos_pedido.get("estado") == "pendiente", "El pedido no nació en estado pendiente"

    # ─── 5. FLUJO DE TRABAJO AUTOMATIZADO (Patrón State) ──────────────
    url_avanzar = f"/api/pedidos/pedidos/{pedido_id}/avanzar"
    
    # Transición I: De Pendiente ──> Preparando
    res_preparando = client.post(url_avanzar, **headers)
    assert res_preparando.status_code == 200
    assert res_preparando.json().get("estado") == "preparando"

    # Transición II: De Preparando ──> En Camino
    res_encamino = client.post(url_avanzar, **headers)
    assert res_encamino.status_code == 200
    assert res_encamino.json().get("estado") == "en_camino"

    # Transición III: De En Camino ──> Entregado
    res_entregado = client.post(url_avanzar, **headers)
    assert res_entregado.status_code == 200
    assert res_entregado.json().get("estado") == "entregado"

    # ─── 6. COMPROBACIÓN ABSOLUTA EN BASE DE DATOS ────────────────────
    pedido_db = Pedido.objects.get(id=pedido_id)
    assert pedido_db.estado == "entregado", "El ciclo de vida del pedido E2E no culminó en BD"