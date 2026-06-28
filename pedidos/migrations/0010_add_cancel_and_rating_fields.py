from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0009_alter_pedido_estado'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='calificacion_restaurante',
            field=models.PositiveSmallIntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='pedido',
            name='cancelado_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pedidos_cancelados', to='auth.user'),
        ),
        migrations.AddField(
            model_name='pedido',
            name='cancelado_en',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='pedido',
            name='cancelado_razon',
            field=models.CharField(default='', max_length=255, blank=True),
        ),
        migrations.AlterField(
            model_name='pedido',
            name='estado',
            field=models.CharField(choices=[('pendiente', 'Pendiente'), ('preparando', 'Preparando'), ('en_camino', 'En Camino'), ('listo_despacho', 'Listo para despacho'), ('listo_retiro', 'Listo para retirar'), ('retirado', 'Retirado'), ('entregado', 'Entregado'), ('cancelado', 'Cancelado')], default='pendiente', max_length=20),
        ),
    ]
