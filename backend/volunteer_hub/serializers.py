from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Volunteer


class VolunteerSerializer(serializers.ModelSerializer):
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = Volunteer
        fields = [
            "full_name",
            "contact_number",
            "latitude",
            "longitude",
            "assistance_type",
            "address",
        ]

    def get_latitude(self, obj):
        return obj.location.y

    def get_longitude(self, obj):
        return obj.location.x

    def create(self, validated_data):
        # Extract latitude and longitude from the initial data
        latitude = self.initial_data.get('latitude')
        longitude = self.initial_data.get('longitude')

        # Check if latitude and longitude are provided
        if latitude is not None and longitude is not None:
            validated_data['location'] = Point(
                float(longitude), float(latitude))

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Extract latitude and longitude from the initial data
        latitude = self.initial_data.get('latitude')
        longitude = self.initial_data.get('longitude')

        # Check if latitude and longitude are provided
        if latitude is not None and longitude is not None:
            instance.location = Point(float(longitude), float(latitude))

        return super().update(instance, validated_data)
