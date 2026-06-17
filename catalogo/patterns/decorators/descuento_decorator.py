class PedidoBase:
    def __init__(self, subtotal, costo_envio=2000):
        self.subtotal = subtotal
        self.costo_envio = costo_envio

    def calcular_total(self):
        return self.subtotal + self.costo_envio

    def descripcion(self):
        return "Pedido base"


class PedidoDecorator:
    def __init__(self, pedido):
        self.pedido = pedido

    def calcular_total(self):
        return self.pedido.calcular_total()

    def descripcion(self):
        return self.pedido.descripcion()


class DescuentoPorcentajeDecorator(PedidoDecorator):
    def __init__(self, pedido, porcentaje):
        super().__init__(pedido)
        self.porcentaje = porcentaje

    def calcular_total(self):
        total = self.pedido.calcular_total()
        descuento = total * (self.porcentaje / 100)
        return total - descuento

    def descripcion(self):
        return self.pedido.descripcion() + f" + {self.porcentaje}% de descuento"


class DescuentoFijoDecorator(PedidoDecorator):
    def __init__(self, pedido, monto):
        super().__init__(pedido)
        self.monto = monto

    def calcular_total(self):
        total = self.pedido.calcular_total()
        return max(total - self.monto, 0)

    def descripcion(self):
        return self.pedido.descripcion() + f" + descuento fijo de ${self.monto}"


class EnvioGratisDecorator(PedidoDecorator):
    def calcular_total(self):
        return self.pedido.calcular_total() - 2000

    def descripcion(self):
        return self.pedido.descripcion() + " + envío gratis"
