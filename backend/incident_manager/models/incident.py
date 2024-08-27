from django.contrib.gis.db import models
from .provider import Provider


class Incident(models.Model):

    VALIDATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('validated', 'Validated'),
        ('rejected', 'Rejected'),
    ]

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
    additional_info = models.JSONField(
        default=dict
    )  # Set default to an empty dictionary
    status = models.CharField(max_length=50)
    address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(
        auto_now=True
    )  # Automatically set the field to now every time the object is saved
    validation_status = models.CharField(
        max_length=10,
        choices=VALIDATION_STATUS_CHOICES,
        default='pending'
    )
