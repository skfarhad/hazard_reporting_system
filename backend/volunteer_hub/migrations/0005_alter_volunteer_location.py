# Generated by Django 4.2.15 on 2024-08-31 08:45

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('volunteer_hub', '0004_volunteerteam'),
    ]

    operations = [
        migrations.AlterField(
            model_name='volunteer',
            name='location',
            field=django.contrib.gis.db.models.fields.PointField(blank=True, geography=True, null=True, srid=4326),
        ),
    ]