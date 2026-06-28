# Patrón de Comportamiento: State
# Cada clase representa un estado del pedido y define qué transición es válida


class EstadoPedido:
    def avanzar(self, pedido):
        raise NotImplementedError

    def nombre(self):
        raise NotImplementedError


class EstadoPendiente(EstadoPedido):
    def avanzar(self, pedido):
        pedido.estado = "preparando"
        pedido.save()

    def nombre(self):
        return "pendiente"


class EstadoPreparando(EstadoPedido):
    def avanzar(self, pedido):
        # Para pedidos de tipo 'retiro' la siguiente etapa no es 'en_camino'
        # Para pedidos de tipo 'retiro' la siguiente etapa es 'listo_retiro'.
        # Para delivery, el restaurante marca 'listo_despacho' (no 'en_camino').
        if getattr(pedido, "tipo_entrega", "delivery") == "retiro":
            pedido.estado = "listo_retiro"
        else:
            pedido.estado = "listo_despacho"
        pedido.save()

    def nombre(self):
        return "preparando"


class EstadoEnCamino(EstadoPedido):
    def avanzar(self, pedido):
        pedido.estado = "entregado"
        pedido.save()

    def nombre(self):
        return "en_camino"


class EstadoEntregado(EstadoPedido):
    def avanzar(self, pedido):
        raise ValueError("El pedido ya fue entregado, no puede avanzar más.")

    def nombre(self):
        return "entregado"


# Mapa para obtener el objeto estado según el string guardado en BD
ESTADOS = {
    "pendiente": EstadoPendiente(),
    "preparando": EstadoPreparando(),
    "en_camino": EstadoEnCamino(),
    # Estados nuevos para los flujos
    "listo_despacho": None,
    # flujo de RETIRO en tienda
    "listo_retiro": None,  # se asigna abajo para evitar referencia antes de definir
    "retirado": None,
    "entregado": EstadoEntregado(),
    "cancelado": None,
}


class EstadoListoRetiro(EstadoPedido):
    def avanzar(self, pedido):
        # Transiciona a 'retirado' cuando el pedido fue retirado en tienda
        pedido.estado = "retirado"
        pedido.save()

    def nombre(self):
        return "listo_retiro"


class EstadoRetirado(EstadoPedido):
    def avanzar(self, pedido):
        raise ValueError("El pedido ya fue retirado, no puede avanzar más.")

    def nombre(self):
        return "retirado"


# Asignar instancias de los nuevos estados al mapa
ESTADOS["listo_retiro"] = EstadoListoRetiro()
ESTADOS["retirado"] = EstadoRetirado()


class EstadoListoDespacho(EstadoPedido):
    def avanzar(self, pedido):
        # Este estado no avanza automáticamente: debe ser tomado por un repartidor
        raise ValueError("Los pedidos listos para despacho deben ser tomados por un repartidor")

    def nombre(self):
        return "listo_despacho"


class EstadoCancelado(EstadoPedido):
    def avanzar(self, pedido):
        raise ValueError("El pedido fue cancelado y no puede avanzar más.")

    def nombre(self):
        return "cancelado"


ESTADOS["listo_despacho"] = EstadoListoDespacho()
ESTADOS["cancelado"] = EstadoCancelado()
