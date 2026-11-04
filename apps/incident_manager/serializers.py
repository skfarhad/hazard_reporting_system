from rest_framework import serializers
from django.contrib.gis.geos import Point
from apps.events.models import Event
from apps.events.services import attach_event

from .models import District, Incident, NeedType, Thana
from .services.report_parser import parse_report


class IncidentSerializer(serializers.ModelSerializer):
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, write_only=True)
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, write_only=True
    )
    location_latitude = serializers.SerializerMethodField()
    location_longitude = serializers.SerializerMethodField()
    needs = serializers.SlugRelatedField(
        slug_field="code", many=True, required=False, allow_empty=False,
        queryset=NeedType.objects.filter(is_active=True),
        help_text="Need type codes. If omitted, they are read from SMS keywords in the description.",
    )

    class Meta:
        model = Incident
        fields = [
            "contact_number",
            "latitude",
            "longitude",
            "description",
            "additional_info",
            "validation_status",
            "address",
            "needs",
            "life_threatening",
            "people_count",
            "location_latitude",
            "location_longitude",
        ]
        read_only_fields = ["provider", "location_latitude", "location_longitude"]

    def create(self, validated_data):
        latitude = validated_data.pop("latitude")
        longitude = validated_data.pop("longitude")
        location = Point(
            float(longitude), float(latitude), srid=4326
        )  # Create a Point object

        needs = validated_data.pop("needs", None)
        report = parse_report(
            validated_data.get("description", ""), NeedType.keyword_map(), fallback=NeedType.fallback_code(),
        )
        district = District.objects.filter(name__iexact=report.district).first() if report.district else None
        thana = (
            Thana.objects.filter(name__iexact=report.thana, district=district).first()
            if district and report.thana else None
        )
        incident = Incident.objects.create(location=location, district=district, thana=thana, **validated_data)
        incident.needs.set(needs or NeedType.objects.filter(code__in=report.need_codes))
        attach_event(incident)
        return incident

    def get_location_latitude(self, obj):
        return obj.location.y

    def get_location_longitude(self, obj):
        return obj.location.x


class IncidentListSerializer(serializers.ModelSerializer):
    """Read-only view of an incident for the dashboard map and tables."""

    needs = serializers.SlugRelatedField(slug_field="code", many=True, read_only=True)
    event = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = [
            "id",
            "contact_number",
            "description",
            "address",
            "validation_status",
            "task_status",
            "needs",
            "life_threatening",
            "people_count",
            "event",
            "latitude",
            "longitude",
            "created_at",
        ]
        read_only_fields = fields

    def get_event(self, obj):
        return {"id": obj.event.id, "name": obj.event.name} if obj.event else None

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None


class IncidentOperatorSerializer(serializers.ModelSerializer):
    """What operators may change on an incident. Responds with the list shape."""

    needs = serializers.SlugRelatedField(
        slug_field="code", many=True, allow_empty=False, queryset=NeedType.objects.filter(is_active=True),
    )

    class Meta:
        model = Incident
        fields = ["validation_status", "task_status", "needs", "life_threatening", "people_count", "event"]

    def to_representation(self, instance):
        return IncidentListSerializer(instance, context=self.context).data


class NeedTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NeedType
        fields = ["code", "label_en", "label_bn", "icon", "colour", "is_fallback"]
