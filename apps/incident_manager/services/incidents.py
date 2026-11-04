"""Creating incidents. Every source (SMS providers, the web app) goes through here."""
from apps.events.services import attach_event
from apps.incident_manager.constants import IncidentSource, IncidentStatus
from apps.incident_manager.models import District, Incident, NeedType, Thana
from apps.incident_manager.services.report_parser import parse_report


def create_incident(*, description, address, contact_number, location, needs=None, district=None, thana=None,
                    source=IncidentSource.PROVIDER.value, **fields):
    """Create a pending incident.

    Needs are the ones given, else read from SMS keywords in the description (else the fallback
    need). District and thana are the ones given, else the names in the SMS report, else the
    boundaries containing the location. The incident is attached to the active event covering its
    district.
    """
    report = parse_report(description, NeedType.keyword_map(), fallback=NeedType.fallback_code())
    if district is None and report.district:
        district = District.objects.filter(name__iexact=report.district).first()
    if thana is None and district and report.thana:
        thana = Thana.objects.filter(name__iexact=report.thana, district=district).first()
    # Last resort: the boundaries that contain the reported point (once boundary shapes are loaded).
    if district is None and location is not None:
        district = District.objects.filter(polygon__contains=location).first()
    if thana is None and location is not None:
        thanas = Thana.objects.filter(polygon__contains=location)
        thana = (thanas.filter(district=district) if district else thanas).first()

    incident = Incident.objects.create(
        description=description, address=address, contact_number=contact_number, location=location,
        district=district, thana=thana, source=source, validation_status=IncidentStatus.PENDING.value, **fields,
    )
    incident.needs.set(needs or NeedType.objects.filter(code__in=report.need_codes))
    attach_event(incident)
    return incident
