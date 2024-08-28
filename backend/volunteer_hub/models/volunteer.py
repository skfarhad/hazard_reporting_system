from django.contrib.gis.db import models


class Volunteer(models.Model):
    full_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15)
    # Using GeoDjango for geo fields
    location = models.PointField(geography=True)
    address = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    notes = models.TextField()
    assistance_type = models.CharField(
        max_length=50
    )  # e.g., 'food', 'doctor', 'logistics', etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
