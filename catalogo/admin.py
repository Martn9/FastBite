from django.contrib import admin

from .models import Restaurante, Producto


@admin.register(Restaurante)
class RestauranteAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "categoria", "user")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = db_field.related_model.objects.filter(
                perfil__rol="restaurante"
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


admin.site.register(Producto)