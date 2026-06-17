class Usuario:
    def __init__(self, nombre, correo):
        self.nombre = nombre
        self.correo = correo

    def obtener_rol(self):
        return "Usuario"


class Cliente(Usuario):

    def obtener_rol(self):
        return "Cliente"


class Administrador(Usuario):

    def obtener_rol(self):
        return "Administrador"


class Repartidor(Usuario):

    def obtener_rol(self):
        return "Repartidor"


class UsuarioFactory:

    @staticmethod
    def crear_usuario(tipo, nombre, correo):

        if tipo.lower() == "cliente":
            return Cliente(nombre, correo)

        elif tipo.lower() == "admin":
            return Administrador(nombre, correo)

        elif tipo.lower() == "repartidor":
            return Repartidor(nombre, correo)

        else:
            raise ValueError("Tipo de usuario no válido")
