# Patrón de Comportamiento: Strategy
#
# Cada clase implementa la misma interfaz (procesar) pero con una lógica
# distinta según el método de pago elegido por el cliente. Esto permite
# agregar nuevos métodos de pago en el futuro sin tocar el código que ya
# existe (Open/Closed Principle).
#
# IMPORTANTE: Este es un simulador de pasarela de pago con fines
# académicos. No se procesan pagos reales ni se almacenan datos
# sensibles de tarjetas (no se guarda el número completo, CVV, etc.).

import random
import string


def _generar_referencia():
    """Genera un código de referencia falso para el pago aprobado."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=10))


class ResultadoPago:
    """Resultado uniforme que devuelve cualquier estrategia de pago."""

    def __init__(self, aprobado: bool, mensaje: str, referencia: str = ""):
        self.aprobado = aprobado
        self.mensaje = mensaje
        self.referencia = referencia

    def to_dict(self):
        return {
            "aprobado": self.aprobado,
            "mensaje": self.mensaje,
            "referencia": self.referencia,
        }


class MetodoPagoStrategy:
    """Interfaz común que deben implementar todas las estrategias de pago."""

    def procesar(self, monto: int, datos: dict) -> ResultadoPago:
        raise NotImplementedError


class PagoTarjetaStrategy(MetodoPagoStrategy):
    """
    Simula el cobro con tarjeta. No valida el número con el algoritmo de
    Luhn ni contra ningún banco real: es solo una regla simple y
    predecible para poder demostrar tanto el caso de éxito como el de
    rechazo durante la presentación en vivo.

    Regla de demo: si el número de tarjeta termina en "0000", el pago
    se rechaza (simulando fondos insuficientes). Cualquier otro número
    se aprueba.
    """

    def procesar(self, monto: int, datos: dict) -> ResultadoPago:
        numero = (datos or {}).get("numero_tarjeta", "").replace(" ", "")

        if not numero:
            return ResultadoPago(False, "Debes ingresar el número de tarjeta")

        if numero.endswith("0000"):
            return ResultadoPago(False, "Pago rechazado: fondos insuficientes")

        return ResultadoPago(True, "Pago con tarjeta aprobado", _generar_referencia())


class PagoTransferenciaStrategy(MetodoPagoStrategy):
    """
    Simula una transferencia bancaria. Para simplificar el flujo de la
    demo, se confirma automáticamente en el momento (en un sistema real
    quedaría 'pendiente' hasta que el banco confirme el abono).
    """

    def procesar(self, monto: int, datos: dict) -> ResultadoPago:
        return ResultadoPago(True, "Transferencia confirmada", _generar_referencia())


class PagoEfectivoStrategy(MetodoPagoStrategy):
    """
    Pago en efectivo al momento de la entrega/retiro. No hay cobro
    inmediato: se aprueba a nivel de sistema para permitir crear el
    pedido, y el dinero se recibe físicamente después.
    """

    def procesar(self, monto: int, datos: dict) -> ResultadoPago:
        return ResultadoPago(True, "Pago al recibir confirmado")


# Mapa de estrategias disponibles, similar en espíritu a UsuarioFactory:
# centraliza la elección del método de pago en un solo lugar.
PAGO_STRATEGIES = {
    "tarjeta": PagoTarjetaStrategy(),
    "transferencia": PagoTransferenciaStrategy(),
    "efectivo": PagoEfectivoStrategy(),
}


def obtener_estrategia_pago(metodo: str) -> MetodoPagoStrategy:
    estrategia = PAGO_STRATEGIES.get(metodo)
    if estrategia is None:
        raise ValueError(f"Método de pago no soportado: {metodo}")
    return estrategia