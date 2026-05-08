# FastBite

Repositorio oficial del proyecto FastBite para la asignatura de Diseño de Software.

---

## División de Tareas del Equipo

### 1. Martin: Arquitectura, APIs y Base del Código
* **Código:** Configurar el repositorio en GitHub, inicializar el proyecto en Django y la base de datos SQLite.
* **Código:** Implementar el CRUD básico del catálogo (restaurantes y productos).
* **Código:** Construir y exponer al menos una API interna (ej. para que el cliente consuma el listado de productos) para cumplir la integración de APIs.
* **Informe:** Redactar la sección que explica y justifica la **Arquitectura** del sistema y las decisiones técnicas.
* **Informe:** Redactar la justificación del diseño y uso de la **API** creada.

### 2. Cristoper: Lógica de Negocio y Patrón de Comportamiento
* **Código:** Programar la lógica funcional del carrito de compras y la creación del pedido.
* **Código:** Codificar en el sistema 1 **Patrón de Comportamiento** (ej. *State*) para gestionar la evolución del estado del pedido (desde Pendiente hasta Entregado).
* **Informe:** Redactar la descripción del **Problema**.
* **Informe:** Redactar los **Requerimientos y reglas de negocio**, asegurando incluir al nuevo actor (Repartidor).
* **Informe:** Generar el diagrama UML del patrón de comportamiento implementado.

### 3. Gerlac: Patrones Creacionales/Estructurales y Diagramas Generales
* **Código:** Codificar en el sistema 1 **Patrón Creacional** (ej. *Factory* para instanciar tipos de usuarios).
* **Código:** Codificar en el sistema 1 **Patrón Estructural** (ej. *Decorator* para procesar los cupones de descuento dinámicamente).
* **Informe:** Generar los diagramas UML de los patrones creacional y estructural implementados.
* **Informe:** Diseñar el Diagrama de Clases general, conectando a todos los actores (Cliente, Admin, Repartidor) y entidades (Pedido, Restaurante, Producto).

### 4. Martina: Calidad SOLID, Evolución, Backlog y Defensa Final
* **Código:** Auditar y refactorizar el código generado por el equipo para evidenciar explícitamente el cumplimiento de los 5 **Principios SOLID** (SRP, OCP, LSP, ISP, DIP).
* **Informe:** Generar los diagramas que demuestren la aplicación de SOLID.
* **Informe:** Redactar el **Avance del proyecto** y la **Evolución del sistema**, detallando el estado inicial, cambios (como añadir al Repartidor), y mejoras incorporadas.
* **Informe:** Documentar el **Backlog y participación del equipo**, extrayendo las capturas de las tarjetas de Trello.
* **Presentación:** Armar el PPT (Problema, Arquitectura, SOLID, Patrones, Evolución).
* **Presentación:** Configurar los datos de prueba y ensayar la **Demostración en vivo** para asegurar que la ejecución fluya frente al profesor.

## Patrones utlizados 

*Diseñamos el backend como una API independiente para que el sistema sea escalable. Si quisiéramos lanzar FastBite como una aplicación móvil para iOS o Android, no tendríamos que tocar ni una sola línea de nuestro código en Python. La nueva app móvil simplemente consumiría esta misma API que ya tenemos lista.

---

## Implementación realizada por Gerlac Reyes

Durante esta entrega se implementaron dos patrones de diseño dentro del sistema FastBite con el objetivo de mejorar la organización, reutilización y extensibilidad del proyecto.

### Patrón Creacional – Factory

Se implementó el patrón Factory en el archivo:

catalogo/patterns/factories/usuario_factory.py

Se creó una fábrica de usuarios llamada `UsuarioFactory`, encargada de generar automáticamente distintos tipos de usuarios según el rol solicitado dentro del sistema.

Actualmente permite crear:

- Cliente
- Administrador
- Repartidor

Cada tipo de usuario hereda de una clase base llamada `Usuario`.

La finalidad de este patrón es centralizar la creación de objetos y evitar crear usuarios manualmente en distintas partes del sistema. Además, permite agregar nuevos tipos de usuarios en el futuro sin modificar la lógica principal del sistema.

Ejemplo de uso:

```python
cliente = UsuarioFactory.crear_usuario(
    "cliente",
    "Gerlac Reyes",
    "gerlac@fastbite.cl"
)
```

### Patrón Estructural – Decorator

Se implementó el patrón Decorator en el archivo:

catalogo/patterns/decorators/descuento_decorator.py

Se creó una clase base llamada `PedidoBase`, que representa un pedido con subtotal y costo de envío. Sobre esa clase se aplican decoradores para modificar el total final sin cambiar directamente la clase principal.

Actualmente se implementaron:

- Descuento porcentual
- Descuento fijo
- Envío gratis

El objetivo de este patrón es permitir agregar descuentos y promociones de forma dinámica, reutilizable y fácil de extender.

Ejemplo de uso:

```python
pedido = PedidoBase(subtotal=10000, costo_envio=2000)

pedido = DescuentoPorcentajeDecorator(pedido, 10)
pedido = EnvioGratisDecorator(pedido)

total = pedido.calcular_total()
```

### Objetivo general

Con esta implementación, mi parte del proyecto aporta una base para manejar roles de usuario mediante Factory y aplicar promociones sobre pedidos mediante Decorator. Esto ayuda a mantener el código más organizado, con menor acoplamiento y preparado para futuras extensiones del sistema.

## Implementación realizada por Cristoper

Durante esta entrega se implementó el patrón de comportamiento State y la lógica del carrito de pedidos dentro del sistema FastBite.

### Patrón de Comportamiento – State

Se implementó el patrón State en el archivo:

pedidos/states.py

Se crearon clases independientes para cada estado del pedido dentro del sistema:

- EstadoPendiente
- EstadoPreparando
- EstadoEnCamino
- EstadoEntregado

Cada clase sabe cómo avanzar al siguiente estado. El modelo `Pedido` delega la transición a su estado actual mediante `avanzar_estado()`, sin necesidad de usar bloques `if/else`.

Ejemplo de uso:

```python
pedido = Pedido.objects.get(id=1)
pedido.avanzar_estado()  # Pendiente -> Preparando
pedido.avanzar_estado()  # Preparando -> En Camino
pedido.avanzar_estado()  # En Camino -> Entregado
```

### Lógica del carrito y pedidos

Se creó la app `pedidos` con los siguientes archivos:

- `pedidos/models.py` — Modelos Pedido e ItemPedido
- `pedidos/services.py` — Lógica de creación del pedido y avance de estado
- `pedidos/api.py` — Endpoints REST del módulo de pedidos

Endpoints implementados:

- `POST /api/pedidos/pedidos` — Crear un nuevo pedido
- `GET /api/pedidos/pedidos/{id}` — Consultar estado del pedido
- `POST /api/pedidos/pedidos/{id}/avanzar` — Avanzar al siguiente estado

### Objetivo general

Con esta implementación se incorpora la lógica transaccional del carrito y un manejo limpio de los estados del pedido mediante el patrón State, eliminando condicionales dispersos y facilitando agregar nuevos estados en el futuro.
