import django_filters
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.db.models import F, Q
from rest_framework.exceptions import ValidationError

from .models import Volunteer


def parse_near(value):
    """'lat,lng' -> Point(lng, lat). Bad input gives 400."""
    try:
        lat_text, lng_text = value.split(",")
        lat, lng = float(lat_text), float(lng_text)
    except ValueError:
        raise ValidationError({"near": ["Use 'latitude,longitude', e.g. 23.21,91.43."]})
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise ValidationError({"near": ["Latitude must be -90..90 and longitude -180..180."]})
    return Point(lng, lat, srid=4326)


class VolunteerFilter(django_filters.FilterSet):
    """Query-string filters for the operator volunteer list. Bad values give 400."""

    active = django_filters.BooleanFilter(field_name="is_active")
    district = django_filters.NumberFilter(field_name="district_id")
    thana = django_filters.NumberFilter(field_name="thana_id")
    q = django_filters.CharFilter(method="search")
    near = django_filters.CharFilter(method="nearest_first")

    class Meta:
        model = Volunteer
        fields = []

    SEARCH_FIELDS = ("full_name", "contact_number", "address", "district__name", "thana__name")

    def search(self, queryset, name, value):
        text = value.strip()
        if not text:
            return queryset
        match = Q()
        for field in self.SEARCH_FIELDS:
            match |= Q(**{f"{field}__icontains": text})
        return queryset.filter(match)

    def nearest_first(self, queryset, name, value):
        # Volunteers without a location come last.
        return queryset.annotate(distance=Distance("location", parse_near(value))).order_by(
            F("distance").asc(nulls_last=True), "full_name", "id",
        )
