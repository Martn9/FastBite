from django.contrib import admin
from .models import Pedido, ItemPedido


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ["id", "cliente", "restaurante", "estado", "creado_en"]
    list_filter = ["estado", "restaurante"]
    search_fields = ["cliente__username"]
    ordering = ["-creado_en"]


@admin.register(ItemPedido)
class ItemPedidoAdmin(admin.ModelAdmin):
    list_display = ["id", "pedido", "producto", "cantidad", "precio_unitario"]
    search_fields = ["pedido__id", "producto__nombre"]
