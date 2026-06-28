# Generated migration – agregar campo pin_entrega a Pedido

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("pedidos", "0006_pedido_calificacion_repartidor_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="pedido",
            name="pin_entrega",
            field=models.CharField(
                max_length=4,
                blank=True,
                default="",
                help_text="PIN de 4 dígitos que el cliente recibe y el repartidor debe ingresar para confirmar la entrega.",
            ),
        ),
    ]
