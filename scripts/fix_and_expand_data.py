import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django

django.setup()

from django.contrib.auth.models import User
from catalogo.models import Restaurante, Producto

# Foto de portada (banner ancho) por restaurante. Para McDonald's se usa una
# imagen temática de combo/papas en vez del logo real, ya que el logo oficial
# es una marca registrada y no debe reproducirse.
BANNERS = {
    "La Burger Clásica": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80",
    "Pizza Nostra": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80",
    "Sushi Zen": "https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80",
    "Taco Loco": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80",
    "Pollo Express": "https://images.unsplash.com/photo-1626082927389-6cd097cee6a6?w=1200&q=80",
    "McDonald's": "https://images.unsplash.com/photo-1619881589316-9362dac6f4a8?w=1200&q=80",
}

# Promo (con descuento real) y postre propios por restaurante, para reemplazar
# el "Promo 20% - Combo Especial" / "Postre Premium" genéricos que se repetían
# igual en los 5 restaurantes (venían de seed_data.py).
PROMO_Y_POSTRE = {
    "La Burger Clásica": {
        "promo": {
            "nombre": "PROMO Burger Doble (20% OFF)",
            "descripcion": "Antes $7.900, ahora $6.320 por Burger Doble. 20% de descuento.",
            "precio": "6320.00",
            "imagen_url": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400",
        },
        "postre": {
            "nombre": "Brownie con Helado",
            "descripcion": "Brownie de chocolate tibio con una bocha de helado de vainilla.",
            "precio": "3200.00",
            "imagen_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
        },
    },
    "Pizza Nostra": {
        "promo": {
            "nombre": "PROMO Pizza 4 Quesos (20% OFF)",
            "descripcion": "Antes $10.500, ahora $8.400 por Pizza 4 Quesos. 20% de descuento.",
            "precio": "8400.00",
            "imagen_url": "https://images.unsplash.com/photo-1732223229355-95a1433404bf?w=400",
        },
        "postre": {
            "nombre": "Tiramisú Clásico",
            "descripcion": "Tiramisú italiano con capas de café, mascarpone y cacao.",
            "precio": "3400.00",
            "imagen_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
        },
    },
    "Sushi Zen": {
        "promo": {
            "nombre": "PROMO Roll Spicy Tuna (20% OFF)",
            "descripcion": "Antes $7.500, ahora $6.000 por Roll Spicy Tuna. 20% de descuento.",
            "precio": "6000.00",
            "imagen_url": "https://plus.unsplash.com/premium_photo-1695304029736-811040353a2e?w=400",
        },
        "postre": {
            "nombre": "Mochi Helado x3",
            "descripcion": "3 mochis japoneses rellenos de helado, sabores surtidos.",
            "precio": "3600.00",
            "imagen_url": "https://images.unsplash.com/photo-1582716401301-b2407dc7563d?w=400",
        },
    },
    "Taco Loco": {
        "promo": {
            "nombre": "PROMO Burrito Completo (20% OFF)",
            "descripcion": "Antes $6.800, ahora $5.440 por Burrito Completo. 20% de descuento.",
            "precio": "5440.00",
            "imagen_url": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
        },
        "postre": {
            "nombre": "Churros con Cajeta",
            "descripcion": "Churros crocantes bañados en azúcar y cajeta dulce de leche mexicana.",
            "precio": "2900.00",
            "imagen_url": "https://images.unsplash.com/photo-1624471392453-b75d2052d57b?w=400",
        },
    },
    "Pollo Express": {
        "promo": {
            "nombre": "PROMO Pollo Broaster 1/4 (20% OFF)",
            "descripcion": "Antes $4.900, ahora $3.920 por Pollo Broaster 1/4. 20% de descuento.",
            "precio": "3920.00",
            "imagen_url": "https://images.unsplash.com/photo-1562967914-608f82629710?w=400",
        },
        "postre": {
            "nombre": "Torta de Chocolate",
            "descripcion": "Porción de torta de chocolate húmeda con ganache.",
            "precio": "3000.00",
            "imagen_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
        },
    },
}

# Productos extra por restaurante (variedad), nombres únicos para que
# get_or_create no duplique si ya existían.
PRODUCTOS_EXTRA = {
    "La Burger Clásica": [
        {
            "nombre": "Burger Vegetariana",
            "descripcion": "Hamburguesa de lentejas y vegetales, lechuga, tomate y mayo de la casa.",
            "precio": "6200.00",
            "categoria": "Hamburguesas",
            "imagen_url": "https://images.unsplash.com/photo-1525059696034-4967a729002e?w=400",
        },
        {
            "nombre": "Aros de Cebolla",
            "descripcion": "Aros de cebolla crocantes empanizados, porción para compartir.",
            "precio": "2800.00",
            "categoria": "Acompañamientos",
            "imagen_url": "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400",
        },
    ],
    "Pizza Nostra": [
        {
            "nombre": "Pizza Vegetariana",
            "descripcion": "Pimentón, champiñones, cebolla morada, aceitunas y mozzarella.",
            "precio": "9200.00",
            "categoria": "Pizzas",
            "imagen_url": "https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400",
        },
        {
            "nombre": "Pan de Ajo",
            "descripcion": "Pan artesanal con mantequilla de ajo y hierbas al horno.",
            "precio": "2400.00",
            "categoria": "Entradas",
            "imagen_url": "https://images.unsplash.com/photo-1619985632461-f33748ef8d3d?w=400",
        },
    ],
    "Sushi Zen": [
        {
            "nombre": "Roll Philadelphia",
            "descripcion": "Salmón, queso crema, palta y cebollín.",
            "precio": "7200.00",
            "categoria": "Rolls",
            "imagen_url": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400",
        },
        {
            "nombre": "Edamame",
            "descripcion": "Vainas de soya al vapor con sal marina.",
            "precio": "2900.00",
            "categoria": "Entradas",
            "imagen_url": "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=400",
        },
    ],
    "Taco Loco": [
        {
            "nombre": "Quesadilla de Queso",
            "descripcion": "Tortilla de harina rellena de queso fundido, servida con guacamole.",
            "precio": "4200.00",
            "categoria": "Entradas",
            "imagen_url": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400",
        },
        {
            "nombre": "Taco de Pescado",
            "descripcion": "Pescado apanado, repollo morado y salsa chipotle.",
            "precio": "3200.00",
            "categoria": "Tacos",
            "imagen_url": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
        },
    ],
    "Pollo Express": [
        {
            "nombre": "Pollo Broaster 1/2",
            "descripcion": "Medio pollo broaster crocante con papas y ensalada.",
            "precio": "7900.00",
            "categoria": "Pollo",
            "imagen_url": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400",
        },
        {
            "nombre": "Maíz Asado",
            "descripcion": "Choclo asado con mantequilla y especias.",
            "precio": "1900.00",
            "categoria": "Acompañamientos",
            "imagen_url": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400",
        },
    ],
}


def run():
    # 1) Reparar vínculos Restaurante.user (deben apuntar a rest_<id>, no a
    #    usuarios random que quedaron asignados por error desde el admin).
    print("== Reparando vínculos restaurante -> usuario ==")
    for rest in Restaurante.objects.all():
        username = f"rest_{rest.id}"
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            print(f"AVISO: no existe el usuario '{username}' para '{rest.nombre}', se omite.")
            continue
        if rest.user_id != user.id:
            print(f"Corrigiendo '{rest.nombre}': {rest.user} -> {username}")
            rest.user = user
            rest.save(update_fields=["user"])
        else:
            print(f"OK: '{rest.nombre}' ya apunta a {username}")

    # 2) Poner banner ancho por restaurante.
    print("\n== Asignando banners ==")
    for rest in Restaurante.objects.all():
        banner = BANNERS.get(rest.nombre)
        if banner and rest.imagen_url != banner:
            rest.imagen_url = banner
            rest.save(update_fields=["imagen_url"])
            print(f"Banner asignado a '{rest.nombre}'")

    # 3) Borrar la promo y el postre genéricos duplicados (mismo nombre en
    #    los 5 restaurantes) y reemplazarlos por uno único por restaurante.
    print("\n== Reemplazando promo y postre genéricos duplicados ==")
    borrados = Producto.objects.filter(
        nombre__in=["Promo 20% - Combo Especial", "Postre Premium"]
    ).delete()
    print(f"Eliminados: {borrados}")

    for nombre_rest, datos in PROMO_Y_POSTRE.items():
        try:
            rest = Restaurante.objects.get(nombre=nombre_rest)
        except Restaurante.DoesNotExist:
            continue
        for tipo, categoria in (("promo", "Promociones"), ("postre", "Postres")):
            p = datos[tipo]
            obj, creado = Producto.objects.get_or_create(
                restaurante=rest,
                nombre=p["nombre"],
                defaults={
                    "descripcion": p["descripcion"],
                    "precio": p["precio"],
                    "categoria": categoria,
                    "disponible": True,
                    "imagen_url": p["imagen_url"],
                },
            )
            print(f"{'Creado' if creado else 'Ya existía'}: {rest.nombre} -> {obj.nombre}")

    # 4) Agregar productos extra de variedad a los 5 restaurantes originales.
    print("\n== Agregando productos extra ==")
    for nombre_rest, productos in PRODUCTOS_EXTRA.items():
        try:
            rest = Restaurante.objects.get(nombre=nombre_rest)
        except Restaurante.DoesNotExist:
            continue
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
            print(f"{'Creado' if creado else 'Ya existía'}: {rest.nombre} -> {obj.nombre}")

    print("\nListo.")


if __name__ == "__main__":
    run()