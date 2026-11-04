from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.common.models import TypeBase


class HazardType(TypeBase):
    """What is happening (flood, cyclone, fire, ...), grouped like EM-DAT / the Common Alerting Protocol."""

    class Group(models.TextChoices):
        WATER_WEATHER = "water_weather", "Water & weather"
        GEOLOGICAL = "geological", "Geological"
        FIRE_STRUCTURAL = "fire_structural", "Fire & structural"
        TRANSPORT = "transport", "Transport"
        BIOLOGICAL = "biological", "Biological"
        OTHER = "other", "Other"

    group = models.CharField(max_length=20, choices=Group.choices)


class EventQuerySet(models.QuerySet):
    def active(self, at=None):
        at = at or timezone.now()
        return self.filter(started_at__lte=at).filter(Q(ended_at__isnull=True) | Q(ended_at__gt=at))


class Event(models.Model):
    """An emergency that operators activate, e.g. "Sylhet Flood, June 2027". Incidents attach to it."""

    name = models.CharField(max_length=150)
    hazard = models.ForeignKey(HazardType, on_delete=models.PROTECT, related_name="events")
    districts = models.ManyToManyField(
        "incident_manager.District", related_name="events", blank=True, help_text="The affected area.",
    )
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True, help_text="Leave empty while the response is ongoing.")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = EventQuerySet.as_manager()

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return self.name
