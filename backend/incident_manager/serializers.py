from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Incident


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
            "image",
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
