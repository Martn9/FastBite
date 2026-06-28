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

    # ESTRUCTURA CORREGIDA: Envolvemos en un diccionario con la llave "items"
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

    # ─── 5. LOGIN DE STAFF/REPARTIDOR PARA AVANZAR ESTADOS ─────
    # Registramos al empleado por la API para que se genere su Perfil automático
    url_registro_rep = "/api/usuarios/registro-cliente?username=repartidor_e2e&email=rep@mail.com&password=Fuerte123"
    client.post(url_registro_rep)

    # Truco: Lo buscamos en la base de datos y le damos poder de repartidor
    from django.contrib.auth.models import User

    repartidor = User.objects.get(username="repartidor_e2e")
    repartidor.perfil.rol = "admin"
    repartidor.perfil.save()

    # Ahora sí, iniciamos sesión como Repartidor
    url_login_rep = "/api/usuarios/login?username=repartidor_e2e&password=Fuerte123"
    res_login_rep = client.post(url_login_rep)

    token_rep = res_login_rep.json().get("access")
    headers_repartidor = {"HTTP_AUTHORIZATION": f"Bearer {token_rep}"}

    # ─── 6. FLUJO DE ESTADOS (Patrón State) ──────────
    url_avanzar = f"/api/pedidos/pedidos/{pedido_id}/avanzar"

    # 1. Avanzar a "preparando"
    res_prep = client.post(url_avanzar, **headers_repartidor)
    assert res_prep.status_code == 200, "Fallo al avanzar estado a preparando"

    # 2. Avanzar a "en_camino"
    res_camino = client.post(url_avanzar, **headers_repartidor)
    assert res_camino.status_code == 200, "Fallo al avanzar estado a en_camino"

    # 3. Avanzar a "entregado" (¡AHORA REQUIERE PIN!)
    from pedidos.models import Pedido
    import json
    
    # Vamos a la base de datos a leer el PIN secreto que se generó para este pedido
    pedido_actual = Pedido.objects.get(id=pedido_id)
    pin_secreto = pedido_actual.pin_entrega 
    
    # Se lo enviamos a la API en formato JSON
    # (Si en tu schemas.py le pusiste solo "pin", cambia la llave abajo a "pin")
    payload_entregado = {
        "pin_entrega": pin_secreto,
        "pin": pin_secreto  # Enviamos ambas por si acaso para asegurar el test
    }
    
    res_entregado = client.post(
        url_avanzar,
        data=json.dumps(payload_entregado),
        content_type="application/json",
        **headers_repartidor
    )
    assert res_entregado.status_code == 200, f"Fallo al avanzar a entregado. API dice: {res_entregado.content}"
    # ─── 7. VERIFICACIÓN FINAL ───────────────────────
    pedido_db = Pedido.objects.get(id=pedido_id)
    assert pedido_db.estado == "entregado"
