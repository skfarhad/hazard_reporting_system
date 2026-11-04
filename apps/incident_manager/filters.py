import django_filters
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from .constants import IncidentStatus
from .models import Incident, NeedType


class IncidentFilter(django_filters.FilterSet):
    """Query-string filters for the operator incident list. Bad values give 400."""

    needs = django_filters.CharFilter(method="filter_needs")
    status = django_filters.ChoiceFilter(field_name="validation_status", choices=IncidentStatus.choices())
    event = django_filters.CharFilter(method="filter_event")
    hazard = django_filters.CharFilter(field_name="event__hazard__code")
    life_threatening = django_filters.BooleanFilter()
    q = django_filters.CharFilter(method="search")

    class Meta:
        model = Incident
        fields = []

    def filter_needs(self, queryset, name, value):
        codes = {code.strip().lower() for code in value.split(",") if code.strip()}
        if not codes:
            return queryset
        unknown = codes - set(NeedType.objects.filter(code__in=codes).values_list("code", flat=True))
        if unknown:
            raise ValidationError({"needs": [f"Unknown need type: {', '.join(sorted(unknown))}"]})
        # An incident with several matching needs would otherwise appear once per need.
        return queryset.filter(needs__code__in=codes).distinct()

    SEARCH_FIELDS = ("description", "address", "contact_number", "district__name", "thana__name", "event__name")

    def search(self, queryset, name, value):
        text = value.strip()
        if not text:
            return queryset
        match = Q()
        for field in self.SEARCH_FIELDS:
            match |= Q(**{f"{field}__icontains": text})
        return queryset.filter(match)

    def filter_event(self, queryset, name, value):
        if value == "none":
            return queryset.filter(event__isnull=True)
        if value.isdigit():
            return queryset.filter(event_id=int(value))
        raise ValidationError({"event": ["Use an event id or 'none'."]})
