from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Incident, NeedType


class IncidentSerializer(serializers.ModelSerializer):
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, write_only=True)
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, write_only=True
    )
    location_latitude = serializers.SerializerMethodField()
    location_longitude = serializers.SerializerMethodField()

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

        incident = Incident.objects.create(location=location, **validated_data)
        return incident

    def get_location_latitude(self, obj):
        return obj.location.y

    def get_location_longitude(self, obj):
        return obj.location.x


class IncidentListSerializer(serializers.ModelSerializer):
    """Read-only view of an incident for the dashboard map and tables."""

    needs = serializers.SlugRelatedField(slug_field="code", many=True, read_only=True)
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
            "latitude",
            "longitude",
            "created_at",
        ]
        read_only_fields = fields

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
        fields = ["validation_status", "task_status", "needs", "life_threatening", "people_count"]

    def to_representation(self, instance):
        return IncidentListSerializer(instance, context=self.context).data


class NeedTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NeedType
        fields = ["code", "label_en", "label_bn", "icon", "colour", "is_fallback"]
