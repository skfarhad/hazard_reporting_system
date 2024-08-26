# Generated by Django 3.2.25 on 2024-08-25 17:17

import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Provider',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('api_key', models.CharField(blank=True, max_length=50, unique=True)),
                ('website_link', models.URLField(blank=True, max_length=255, null=True)),
                ('logo_url', models.URLField(blank=True, max_length=255, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Incident',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('contact_number', models.CharField(max_length=15)),
                ('location', django.contrib.gis.db.models.fields.PointField(default=None, geography=True, null=True, srid=4326)),
                ('description', models.TextField()),
                ('additional_info', models.JSONField()),
                ('status', models.CharField(max_length=50)),
                ('address', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('provider', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incidents', to='incident_manager.provider')),
            ],
        ),
    ]