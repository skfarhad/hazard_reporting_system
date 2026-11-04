from rest_framework import serializers

from .models import Volunteer


def place(obj):
    return {"id": obj.id, "name": obj.name} if obj else None


class VolunteerSerializer(serializers.ModelSerializer):
    """A volunteer for the operator dashboard and Volunteers page."""

    skills = serializers.SlugRelatedField(slug_field="code", many=True, read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    district = serializers.SerializerMethodField()
    thana = serializers.SerializerMethodField()
    # Annotated by the view.
    assigned_incident_count = serializers.IntegerField(default=0, read_only=True)

    class Meta:
        model = Volunteer
        fields = [
            "id",
            "full_name",
            "contact_number",
            "is_active",
            "photo",
            "latitude",
            "longitude",
            "district",
            "thana",
            "address",
            "skills",
            "assistance_type",
            "assigned_incident_count",
        ]
        read_only_fields = fields

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None

    def get_district(self, obj):
        return place(obj.district)

    def get_thana(self, obj):
        return place(obj.thana)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Only when listed nearest-first (?near=lat,lng); None for volunteers without a location.
        if hasattr(instance, "distance"):
            data["distance_km"] = round(instance.distance.km, 2) if instance.distance is not None else None
        return data
