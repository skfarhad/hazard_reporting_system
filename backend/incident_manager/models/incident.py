from django.contrib.gis.db import models
from .provider import Provider


class Incident(models.Model):
    contact_number = models.CharField(max_length=15)
    provider = models.ForeignKey(
        Provider,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="incidents",
    )
    location = models.PointField(
        geography=True, null=True, default=None
    )  # Using GeoDjango for geo fields
    description = models.TextField()
    additional_info = models.JSONField()  # Requires PostgreSQL 9.4+
    status = models.CharField(max_length=50)
    address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(
        auto_now=True
    )  # Automatically set the field to now every time the object is saved
