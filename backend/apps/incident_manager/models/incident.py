from django.contrib.gis.db import models

from apps.volunteer_hub.models.volunteer import Volunteer
from apps.incident_manager.constants import IncidentStatus, TaskStatus
from .provider import Provider
from .address import District, Thana


class Incident(models.Model):
    contact_number = models.CharField(max_length=15)
    provider = models.ForeignKey(
        Provider,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="incidents",
    )
    thana = models.ForeignKey(
        Thana,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="incidents",
    )
    district = models.ForeignKey(
        District,
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
    validation_status = models.CharField(
        max_length=50,
        choices=IncidentStatus.choices(),
        default=IncidentStatus.PENDING.value,
    )
    task_status = models.CharField(
        max_length=50,
        choices=TaskStatus.choices(),
        default=TaskStatus.OPEN.value,
    )
    volunteer = models.ForeignKey(
        Volunteer,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="incidents",
    )
    address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(
        auto_now=True
    )  # Automatically set the field to now every time the object is saved

    def __str__(self):
        return f"Incident {self.id} - {self.status}"
