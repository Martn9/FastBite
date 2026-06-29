from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0010_add_cancel_and_rating_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pago',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('metodo', models.CharField(choices=[('tarjeta', 'Tarjeta'), ('transferencia', 'Transferencia'), ('efectivo', 'Efectivo al recibir')], max_length=20)),
                ('estado', models.CharField(choices=[('aprobado', 'Aprobado'), ('rechazado', 'Rechazado')], default='aprobado', max_length=20)),
                ('monto', models.IntegerField()),
                ('mensaje', models.CharField(blank=True, default='', max_length=255)),
                ('referencia', models.CharField(blank=True, default='', max_length=20)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('pedido', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='pago', to='pedidos.pedido')),
            ],
        ),
    ]