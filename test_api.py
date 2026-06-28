import urllib.request, urllib.error, json

# 1. Login
login_url = 'http://127.0.0.1:8000/api/usuarios/login?username=tutu&password=tutu1234'
req = urllib.request.Request(login_url, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        token = data.get('access')
        print(f'Token OK: {str(token)[:30]}...')
except urllib.error.HTTPError as e:
    print(f'Login error {e.code}: {e.read()}')
    exit()

# 2. Crear pedido
pedido_url = 'http://127.0.0.1:8000/api/pedidos/pedidos'
payload = json.dumps({
    'items': [{'producto_id': 1, 'cantidad': 1}],
    'tipo_entrega': 'delivery',
    'direccion_entrega': 'Av. Test 123'
}).encode()
req2 = urllib.request.Request(
    pedido_url,
    data=payload,
    method='POST',
    headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
)
try:
    with urllib.request.urlopen(req2) as resp:
        data = json.loads(resp.read())
        print('Pedido creado OK, id=' + str(data.get('id')))
        print('total_final=' + str(data.get('total_final')))
        print('descuento_aplicado=' + str(data.get('descuento_aplicado')))
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print('ERROR ' + str(e.code) + ': ' + body)
