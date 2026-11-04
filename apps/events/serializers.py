from rest_framework import serializers

from .models import Event, HazardType


class HazardTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HazardType
        fields = ["code", "label_en", "label_bn", "icon", "colour"]


class EventSerializer(serializers.ModelSerializer):
    hazard = HazardTypeSerializer(read_only=True)
    district_ids = serializers.PrimaryKeyRelatedField(source="districts", many=True, read_only=True)

    class Meta:
        model = Event
        fields = ["id", "name", "hazard", "started_at", "ended_at", "district_ids"]
