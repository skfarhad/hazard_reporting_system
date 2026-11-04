from .models import Event


def attach_event(incident):
    """Attach the incident to the newest active event covering its district, if any. Returns the event."""
    if incident.district_id is None:
        return None
    event = Event.objects.active().filter(districts=incident.district_id).order_by("-started_at").first()
    if event is not None:
        incident.event = event
        incident.save(update_fields=["event"])
    return event
