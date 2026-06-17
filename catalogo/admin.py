from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Restaurante, Producto

admin.site.register(Restaurante)
admin.site.register(Producto)
