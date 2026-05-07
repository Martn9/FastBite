"""
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from catalogo.api import router as catalogo_router

api = NinjaAPI(
    title="FastBite API",
    description="API interna para la plataforma de Delivery",
    version="1.0.0"
)

api.add_router("/catalogo/", catalogo_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls), # <- ¡Esta es la línea clave que le avisa a Django que existe Swagger!
    
]