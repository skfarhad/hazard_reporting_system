from django.contrib.gis.db import models
from apps.incident_manager.models.address import District, Thana


class Volunteer(models.Model):
    full_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15)
    location = models.PointField(
        geography=True, null=True, blank=True
    )  # Using GeoDjango for geo fields
    address = models.CharField(max_length=255)
    thana = models.ForeignKey(
        Thana,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="volunteers",
    )
    district = models.ForeignKey(  # Adding the foreign key for district
        District,
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
