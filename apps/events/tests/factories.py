from django.utils import timezone

from apps.events.models import Event, HazardType
from apps.incident_manager.models import District, Division


def district(name):
    division, _ = Division.objects.get_or_create(name="Chattogram")
    return District.objects.create(name=name, division=division)


def event(name, districts=(), started_days_ago=1, ended_days_ago=None, hazard_code="flood"):
    now = timezone.now()
    ended_at = now - timezone.timedelta(days=ended_days_ago) if ended_days_ago is not None else None
    e = Event.objects.create(
        name=name, hazard=HazardType.objects.get(code=hazard_code),
        started_at=now - timezone.timedelta(days=started_days_ago), ended_at=ended_at,
    )
    e.districts.set(districts)
    return e
