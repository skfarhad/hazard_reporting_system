from rest_framework import serializers
from django.contrib.gis.geos import Point

from .models import Incident, NeedType
from .services.incidents import create_incident


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
        # New incidents always wait for staff review, whatever the provider sends.
        read_only_fields = ["provider", "validation_status", "location_latitude", "location_longitude"]

    def create(self, validated_data):
        latitude = validated_data.pop("latitude")
        longitude = validated_data.pop("longitude")
        return create_incident(location=Point(float(longitude), float(latitude), srid=4326), **validated_data)

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
        if not obj.event:
            return None
        hazard = obj.event.hazard
        return {
            "id": obj.event.id,
            "name": obj.event.name,
            "hazard": {"code": hazard.code, "label_en": hazard.label_en, "icon": hazard.icon, "colour": hazard.colour},
        }

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None


class IncidentDetailSerializer(IncidentListSerializer):
    """One incident for the operator details view: the list fields plus places, source and volunteer."""

    district = serializers.CharField(source="district.name", default=None, read_only=True)
    thana = serializers.CharField(source="thana.name", default=None, read_only=True)
    provider = serializers.CharField(source="provider.name", default=None, read_only=True)
    volunteer = serializers.SerializerMethodField()

    class Meta(IncidentListSerializer.Meta):
        fields = IncidentListSerializer.Meta.fields + ["district", "thana", "provider", "volunteer", "updated_at"]
        read_only_fields = fields

    def get_volunteer(self, obj):
        return {"id": obj.volunteer.id, "full_name": obj.volunteer.full_name} if obj.volunteer else None


class IncidentOperatorSerializer(serializers.ModelSerializer):
    """What operators may change on an incident. Responds with the list shape."""

    needs = serializers.SlugRelatedField(
        slug_field="code", many=True, allow_empty=False, queryset=NeedType.objects.filter(is_active=True),
    )

    class Meta:
        model = Incident
        fields = ["validation_status", "task_status", "needs", "life_threatening", "people_count", "event"]

    def to_representation(self, instance):
        return IncidentDetailSerializer(instance, context=self.context).data


class NeedTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NeedType
        fields = ["code", "label_en", "label_bn", "icon", "colour", "is_fallback"]
