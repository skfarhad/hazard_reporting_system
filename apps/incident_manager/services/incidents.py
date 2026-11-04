"""Creating incidents. Every source (SMS providers, the web app) goes through here."""
from apps.events.services import attach_event
from apps.incident_manager.constants import IncidentSource, IncidentStatus
from apps.incident_manager.models import District, Incident, NeedType, Thana, Union
from apps.incident_manager.services.boundaries import official_name
from apps.incident_manager.services.report_parser import parse_report


def create_incident(*, description, address, contact_number, location, needs=None, district=None, thana=None,
                    source=IncidentSource.PROVIDER.value, **fields):
    """Create a pending incident.

    Needs are the ones given, else read from SMS keywords in the description (else the fallback
    need). District and thana are the ones given, else the names in the SMS report (old spellings
    such as "Comilla" accepted), else the boundaries containing the location. The union is the one
    containing the location, inside the thana when known. The incident is attached to the active
    event covering its district.
    """
    fields.pop("validation_status", None)  # every new incident waits for staff review
    report = parse_report(description, NeedType.keyword_map(), fallback=NeedType.fallback_code())
    if district is None and report.district:
        district = District.objects.filter(name__iexact=official_name(report.district)).first()
    if thana is None and district and report.thana:
        thana = Thana.objects.filter(name__iexact=official_name(report.thana), district=district).first()
    # Last resort: the boundaries that contain the reported point (once boundary shapes are loaded).
    if district is None and location is not None:
        district = District.objects.filter(polygon__contains=location).first()
    if thana is None and location is not None:
        thanas = Thana.objects.filter(polygon__contains=location)
        thana = (thanas.filter(district=district) if district else thanas).first()
    union = None
    if location is not None:
        unions = Union.objects.filter(polygon__contains=location)
        union = (unions.filter(thana=thana) if thana else unions).first()

    incident = Incident.objects.create(
        description=description, address=address, contact_number=contact_number, location=location,
        district=district, thana=thana, union=union, source=source, validation_status=IncidentStatus.PENDING.value,
        **fields,
    )
    incident.needs.set(needs or NeedType.objects.filter(code__in=report.need_codes))
    attach_event(incident)
    return incident
