# FastBite - Entrega 2

## Cambios realizados

En esta etapa se mejoró el backend de FastBite, manteniendo el enfoque en una API REST desarrollada con Django y Django Ninja.

Cambios principales:

- Migración de SQLite a PostgreSQL.
- Configuración de entorno virtual.
- Instalación de dependencias necesarias.
- Implementación de usuarios con roles.
- Roles disponibles:
  - Cliente
  - Administrador
  - Repartidor
- Implementación de login con JWT.
- Registro de clientes y repartidores mediante API.
- Asociación de pedidos al usuario autenticado.
- Asociación de pedidos al restaurante correspondiente.
- Creación de pedidos con múltiples productos.
- Validación para evitar mezclar productos de distintos restaurantes en un mismo pedido.
- Pruebas realizadas desde Swagger.

## Requisitos

Antes de ejecutar el proyecto se necesita tener instalado:

- Python
- PostgreSQL
- Git

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/Martn9/FastBite.git
cd FastBite
```

Crear entorno virtual:

```bash
python -m venv venv
```

Activar entorno virtual en Windows:

```bash
.\venv\Scripts\Activate
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

## Configuración de PostgreSQL

Crear una base de datos en PostgreSQL llamada:

```txt
fastbite_db
```

En el archivo `core/settings.py`, configurar la conexión:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'fastbite_db',
        'USER': 'postgres',
        'PASSWORD': 'TU_PASSWORD',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Migraciones

Ejecutar:

```bash
python manage.py makemigrations
python manage.py migrate
```