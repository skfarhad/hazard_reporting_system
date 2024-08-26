from rest_framework import serializers
from .models import Volunteer


class VolunteerSerializer(serializers.ModelSerializer):
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = Volunteer
        fields = [
            "full_name",
            "latitude",
            "longitude",
            "assistance_type",
            "address",
        ]

    def get_latitude(self, obj):
        return obj.location.y

    def get_longitude(self, obj):
        return obj.location.x
