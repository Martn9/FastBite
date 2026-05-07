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