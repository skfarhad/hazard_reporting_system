from django.contrib.gis.db import models
from incident_manager.models.address import Thana


class Volunteer(models.Model):
    full_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15)
    email = models.EmailField(max_length=255, unique=True) # Email field for better communication
    location = models.PointField(geography=True)  # Using GeoDjango for geo fields
    address = models.CharField(max_length=255)
    thana = models.ForeignKey(
        Thana,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="volunteers",
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField()
    assistance_type = models.CharField(
        max_length=50
    )  # e.g., 'food', 'doctor', 'logistics', etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
