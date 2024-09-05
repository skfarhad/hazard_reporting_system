import json
from rest_framework import serializers
from django.contrib.gis.geos import Point
from rest_framework.exceptions import ValidationError


def execute_create(self, validated_data):
    try:
        instance = self.create(validated_data)
    except Exception as e:
        raise ValidationError(detail=str(e))
    return instance


def execute_update(self, instance, validated_data):
    try:
        instance = self.update(instance, validated_data)
    except Exception as e:
        raise ValidationError(detail=str(e))
    return instance


class GDPointField(serializers.Field):

    def to_representation(self, instance):
        point = getattr(instance, self.field_name, None)
        if point:
            point = {
                'lat': point.y,
                'lng': point.x
            }
        return point

    def to_internal_value(self, field):
        if field:
            field = json.loads(field)
            x = field.get('lng', False)
            y = field.get('lat', False)
            if not (x and y):
                return None
            point_geo = Point(x=x, y=y, srid=4326)
            set_data = {
                self.field_name: point_geo
            }
            return set_data
        return None


class CustomSerializer(serializers.ModelSerializer):

    class Meta:
        model = None
        fields = []

    def create_obj(self, validated_data):
        return execute_create(self, validated_data)

    def update_obj(self, instance, validated_data):
        return execute_update(self, instance, validated_data)
