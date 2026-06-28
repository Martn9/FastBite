import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from catalogo.models import Restaurante, Producto
from pedidos.models import CuponDescuento

def run():
    print("Creando cupones...")
    CuponDescuento.objects.get_or_create(codigo="FAST10", defaults={"porcentaje": 10})
    CuponDescuento.objects.get_or_create(codigo="FAST20", defaults={"porcentaje": 20})
    CuponDescuento.objects.get_or_create(codigo="MEGA40", defaults={"porcentaje": 40})
    
    print("Añadiendo promos y productos...")
    restaurantes = Restaurante.objects.all()
    if not restaurantes.exists():
        print("No hay restaurantes. Ejecute un seed de restaurantes primero.")
        return
        
    for rest in restaurantes:
        Producto.objects.get_or_create(
            restaurante=rest,
            nombre=f"Promo 20% - Combo Especial",
            defaults={
                "descripcion": "Combo en promoción especial con descuento directo en el precio.",
                "precio": 8000.00,
                "categoria": "Promociones",
                "disponible": True,
                "imagen_url": "https://images.unsplash.com/photo-1594212848518-7858c256f6c2?auto=format&fit=crop&q=80&w=400"
            }
        )
        Producto.objects.get_or_create(
            restaurante=rest,
            nombre=f"Postre Premium",
            defaults={
                "descripcion": "Postre de la casa para acompañar tu pedido.",
                "precio": 3500.00,
                "categoria": "Postres",
                "disponible": True,
                "imagen_url": "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=400"
            }
        )

    print("Completado.")

if __name__ == "__main__":
    run()
