import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django

django.setup()

from catalogo.models import Restaurante, Producto

# Por nombre de restaurante: promos nuevas a agregar (sin tocar las que ya existían)
PROMOS_POR_RESTAURANTE = {
    "La Burger Clásica": [
        {
            "nombre": "PROMO 2 Burgers Clásicas (25% OFF)",
            "descripcion": "Antes $11.800, ahora $8.850 por 2 Burger Clásica. 25% de descuento pidiendo de a dos.",
            "precio": "8850.00",
            "imagen_url": "https://images.unsplash.com/photo-1508736793122-f516e3ba5569?w=400",
        },
        {
            "nombre": "Combo Pollo BBQ",
            "descripcion": "Burger Pollo BBQ + papas fritas + bebida 500cc. Precio combo fijo.",
            "precio": "8900.00",
            "imagen_url": "https://images.unsplash.com/photo-1520073201527-6b044ba2ca9f?w=400",
        },
    ],
    "Pizza Nostra": [
        {
            "nombre": "PROMO Pizza Pepperoni (20% OFF)",
            "descripcion": "Antes $9.500, ahora $7.600 por Pizza Pepperoni. 20% de descuento solo por hoy.",
            "precio": "7600.00",
            "imagen_url": "https://plus.unsplash.com/premium_photo-1733259709671-9dbf22bf02cc?w=400",
        },
        {
            "nombre": "Combo Calzone Jamón",
            "descripcion": "Calzone Jamón + bebida 500cc. Precio combo fijo.",
            "precio": "10200.00",
            "imagen_url": "https://images.unsplash.com/photo-1628824851008-ec3ab4b45527?w=400",
        },
    ],
    "Sushi Zen": [
        {
            "nombre": "PROMO Sashimi Mix (15% OFF)",
            "descripcion": "Antes $11.900, ahora $10.115 por Sashimi Mix x12. 15% de descuento.",
            "precio": "10115.00",
            "imagen_url": "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400",
        },
        {
            "nombre": "Combo Roll California + Té",
            "descripcion": "Roll California + Té Verde. Precio combo fijo.",
            "precio": "7900.00",
            "imagen_url": "https://plus.unsplash.com/premium_photo-1667545168921-34f756495d7b?w=400",
        },
    ],
    "Taco Loco": [
        {
            "nombre": "PROMO Burrito + Nachos (30% OFF)",
            "descripcion": "Antes $11.300, ahora $7.910 por Burrito Completo + Nachos con Queso. 30% de descuento.",
            "precio": "7910.00",
            "imagen_url": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
        },
        {
            "nombre": "Combo Taco Doble",
            "descripcion": "Taco de Carne + Taco de Pollo + Agua de Jamaica. Precio combo fijo.",
            "precio": "6400.00",
            "imagen_url": "https://images.unsplash.com/photo-1599488400918-5f5f96b3f463?w=400",
        },
    ],
    "Pollo Express": [
        {
            "nombre": "PROMO Alitas BBQ (20% OFF)",
            "descripcion": "Antes $5.900, ahora $4.720 por Alitas BBQ x8. 20% de descuento.",
            "precio": "4720.00",
            "imagen_url": "https://images.unsplash.com/photo-1624153064067-566cae78993d?w=400",
        },
        {
            "nombre": "Combo Pollo Asado",
            "descripcion": "Pollo Asado 1/2 + Papas Grandes + Bebida 500cc. Precio combo fijo.",
            "precio": "9800.00",
            "imagen_url": "https://images.unsplash.com/photo-1597652096872-658bf24731ec?w=400",
        },
    ],
}


def run():
    for nombre_rest, promos in PROMOS_POR_RESTAURANTE.items():
        try:
            rest = Restaurante.objects.get(nombre=nombre_rest)
        except Restaurante.DoesNotExist:
            print(f"AVISO: no existe el restaurante '{nombre_rest}', se omite.")
            continue

        for p in promos:
            obj, creado = Producto.objects.get_or_create(
                restaurante=rest,
                nombre=p["nombre"],
                defaults={
                    "descripcion": p["descripcion"],
                    "precio": p["precio"],
                    "categoria": "Promociones",
                    "disponible": True,
                    "imagen_url": p["imagen_url"],
                },
            )
            estado = "Creada" if creado else "Ya existía"
            print(f"{estado}: {rest.nombre} -> {obj.nombre} (${obj.precio})")

    print("\nListo.")


if __name__ == "__main__":
    run()