from rest_framework import serializers
from .models import Volunteer, VolunteerTeam


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


class VolunteerTeamSerializer(serializers.ModelSerializer):
    team_leader = VolunteerSerializer()
    members = VolunteerSerializer(many=True)

    class Meta:
        model = VolunteerTeam
        fields = ['id', 'name', 'team_leader', 'members']
