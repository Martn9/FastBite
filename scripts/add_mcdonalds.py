import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django

django.setup()

from catalogo.models import Restaurante, Producto


def run():
    rest, created = Restaurante.objects.get_or_create(
        nombre="McDonald's",
        defaults={
            "descripcion": "La cadena de comida rápida más reconocida del mundo: hamburguesas, papas y McFlurrys.",
            "categoria": "Hamburguesas",
            "horario": "10:00 - 23:59",
            "tiempo_entrega": "20 min",
            "imagen_url": "",
        },
    )
    if created:
        print(f"Restaurante creado: {rest.nombre} (id={rest.id})")
    else:
        print(f"Restaurante ya existía: {rest.nombre} (id={rest.id})")

    productos = [
        # --- Productos regulares ---
        {
            "nombre": "Big Mac",
            "descripcion": "Doble carne, salsa especial, lechuga, queso, pepinillos y cebolla en pan con ajonjolí.",
            "precio": "5200.00",
            "categoria": "Hamburguesas",
            "imagen_url": "https://images.unsplash.com/photo-1619881589316-9362dac6f4a8?w=400",
        },
        {
            "nombre": "McNífica",
            "descripcion": "Carne 100% de res a la parrilla, queso cheddar, lechuga, tomate y cebolla.",
            "precio": "4800.00",
            "categoria": "Hamburguesas",
            "imagen_url": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
        },
        {
            "nombre": "McPollo",
            "descripcion": "Filete de pollo crocante, lechuga y mayonesa en pan suave.",
            "precio": "4300.00",
            "categoria": "Hamburguesas",
            "imagen_url": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400",
        },
        {
            "nombre": "Papas Fritas Medianas",
            "descripcion": "Las clásicas papas fritas doradas y crocantes, con la sal justa.",
            "precio": "2200.00",
            "categoria": "Acompañamientos",
            "imagen_url": "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400",
        },
        {
            "nombre": "Nuggets de Pollo x10",
            "descripcion": "10 trocitos de pollo empanizados y crocantes, con tu salsa favorita.",
            "precio": "4100.00",
            "categoria": "Acompañamientos",
            "imagen_url": "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400",
        },
        {
            "nombre": "McFlurry Oreo",
            "descripcion": "Helado cremoso de vainilla mezclado con trocitos de galleta Oreo.",
            "precio": "2900.00",
            "categoria": "Postres",
            "imagen_url": "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=400",
        },
        {
            "nombre": "Bebida 500cc",
            "descripcion": "Coca-Cola, Fanta o Sprite bien helada.",
            "precio": "1200.00",
            "categoria": "Bebidas",
            "imagen_url": "https://images.unsplash.com/photo-1716800586014-fea19e9453fb?w=400",
        },
        # --- Promos SIN descuento (precio combo fijo, sin rebaja explícita) ---
        {
            "nombre": "Combo Big Mac",
            "descripcion": "Big Mac + papas medianas + bebida 500cc. Precio combo, todo en uno.",
            "precio": "7900.00",
            "categoria": "Promociones",
            "imagen_url": "https://images.unsplash.com/photo-1619881589316-9362dac6f4a8?w=400",
        },
        {
            "nombre": "Cajita Feliz",
            "descripcion": "4 nuggets de pollo + papas chicas + bebida + sorpresa de regalo.",
            "precio": "4500.00",
            "categoria": "Promociones",
            "imagen_url": "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400",
        },
        # --- Promos CON descuento explícito ---
        {
            "nombre": "PROMO 2x1 McNífica (20% OFF)",
            "descripcion": "Antes $9.600, ahora $7.680 por 2 McNíficas. ¡Ahorra 20% pidiendo de a dos!",
            "precio": "7680.00",
            "categoria": "Promociones",
            "imagen_url": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
        },
        {
            "nombre": "PROMO McFlurry + Papas (30% OFF)",
            "descripcion": "Antes $5.100, ahora $3.570 por McFlurry Oreo + papas medianas. 30% de descuento.",
            "precio": "3570.00",
            "categoria": "Promociones",
            "imagen_url": "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=400",
        },
    ]

    for p in productos:
        obj, creado = Producto.objects.get_or_create(
            restaurante=rest,
            nombre=p["nombre"],
            defaults={
                "descripcion": p["descripcion"],
                "precio": p["precio"],
                "categoria": p["categoria"],
                "disponible": True,
                "imagen_url": p["imagen_url"],
            },
        )
        print(("Creado" if creado else "Ya existía") + f": {obj.nombre} (${obj.precio})")

    print("\nListo. McDonald's cargado con", Producto.objects.filter(restaurante=rest).count(), "productos.")
    print("Corre ahora 'python scripts/seed_restaurant_users.py' para crear su usuario (rest_" + str(rest.id) + ").")


if __name__ == "__main__":
    run()