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
        pedido.estado = "en_camino"
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
    "entregado": EstadoEntregado(),
}
