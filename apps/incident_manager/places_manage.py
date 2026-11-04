"""Operators manage districts and thanas (Location tab): names, division and an optional GeoJSON boundary.

Boundaries are stored in the existing `polygon` fields, which web reports use to detect their area.
"""
import json

from django.contrib.gis.gdal.error import GDALException
from django.contrib.gis.geos import GEOSException, GEOSGeometry, MultiPolygon, Polygon
from django.db.models import Count, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.volunteer_hub.models import Volunteer

from .models import District, Division, Incident, Thana
from .services.places import BD_LATITUDE, BD_LONGITUDE

BANGLADESH_BOX = Polygon.from_bbox((BD_LONGITUDE[0], BD_LATITUDE[0], BD_LONGITUDE[1], BD_LATITUDE[1]))
BANGLADESH_BOX.srid = 4326
BOUNDARY_HELP = "Upload a GeoJSON Polygon or MultiPolygon."


class BoundaryField(serializers.Field):
    """A GeoJSON Polygon or MultiPolygon in, a GeoJSON MultiPolygon out. Must be valid and touch Bangladesh."""

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise ValidationError(BOUNDARY_HELP)
        try:
            shape = GEOSGeometry(json.dumps(data))
        except (GEOSException, GDALException, ValueError, TypeError):
            raise ValidationError(BOUNDARY_HELP)
        if shape.geom_type == "Polygon":
            shape = MultiPolygon(shape)
        if shape.geom_type != "MultiPolygon":
            raise ValidationError(BOUNDARY_HELP)
        shape.srid = 4326
        if not shape.valid:
            raise ValidationError(f"The boundary is not a valid shape: {shape.valid_reason}.")
        if not shape.intersects(BANGLADESH_BOX):
            raise ValidationError("The boundary must be in Bangladesh.")
        return shape

    def to_representation(self, value):
        return json.loads(value.geojson) if value else None


def nested(obj):
    return {"id": obj.id, "name": obj.name}


def count_of(model, **match):
    """A subquery counting `model` rows that point at the outer row (avoids multiplying joins)."""
    rows = model.objects.filter(**match).order_by().values(next(iter(match))).annotate(n=Count("id")).values("n")
    return Coalesce(Subquery(rows, output_field=IntegerField()), 0)


def check_name_free(serializer, attrs, parent_field, label):
    """Names repeat across Bangladesh, but not (ignoring case) within one parent: say so instead of a DB error."""
    instance = serializer.instance
    name = attrs.get("name", instance.name if instance else None)
    parent = attrs.get(parent_field, getattr(instance, parent_field, None))
    if name is None or parent is None:
        return attrs
    taken = type(serializer).Meta.model.objects.filter(**{parent_field: parent, "name__iexact": name})
    if instance is not None:
        taken = taken.exclude(pk=instance.pk)
    if taken.exists():
        raise ValidationError({"name": [f"{parent.name} already has a {label} called {name}."]})
    return attrs


class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ["id", "name"]


class DistrictSerializer(serializers.ModelSerializer):
    division = serializers.PrimaryKeyRelatedField(queryset=Division.objects.all())
    boundary = BoundaryField(source="polygon", required=False, allow_null=True)

    class Meta:
        model = District
        fields = ["id", "name", "code", "division", "boundary"]
        read_only_fields = ["code"]  # area codes come from the boundary import

    def validate(self, attrs):
        return check_name_free(self, attrs, "division", "district")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["division"] = nested(instance.division)
        return data


class DistrictRowSerializer(serializers.ModelSerializer):
    """A district in the Location list: counts and whether a boundary is set, but not the shape itself."""

    division = serializers.SerializerMethodField()
    has_boundary = serializers.BooleanField()
    thana_count = serializers.IntegerField()
    incident_count = serializers.IntegerField()
    volunteer_count = serializers.IntegerField()

    class Meta:
        model = District
        fields = ["id", "name", "code", "division", "has_boundary", "thana_count", "incident_count", "volunteer_count"]

    def get_division(self, obj):
        return nested(obj.division)


class ThanaSerializer(serializers.ModelSerializer):
    district = serializers.PrimaryKeyRelatedField(queryset=District.objects.all())
    boundary = BoundaryField(source="polygon", required=False, allow_null=True)

    class Meta:
        model = Thana
        fields = ["id", "name", "code", "district", "boundary"]
        read_only_fields = ["code"]  # area codes come from the boundary import

    def validate(self, attrs):
        return check_name_free(self, attrs, "district", "thana")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["district"] = nested(instance.district)
        return data


class ThanaRowSerializer(serializers.ModelSerializer):
    district = serializers.SerializerMethodField()
    has_boundary = serializers.BooleanField()
    incident_count = serializers.IntegerField()
    volunteer_count = serializers.IntegerField()

    class Meta:
        model = Thana
        fields = ["id", "name", "code", "district", "has_boundary", "incident_count", "volunteer_count"]

    def get_district(self, obj):
        return nested(obj.district)


def with_boundary_flag(queryset):
    return queryset.defer("polygon").annotate(
        has_boundary=Count("id", filter=Q(polygon__isnull=False)),
    )


def district_in_use(district):
    return (
        Incident.objects.filter(Q(district=district) | Q(thana__district=district)).exists()
        or Volunteer.objects.filter(Q(district=district) | Q(thana__district=district)).exists()
        or district.events.exists()
    )


def thana_in_use(thana):
    return Incident.objects.filter(thana=thana).exists() or Volunteer.objects.filter(thana=thana).exists()


class DivisionListView(generics.ListAPIView):
    """Divisions, for the add-district form (operators only)."""

    permission_classes = [IsAdminUser]
    serializer_class = DivisionSerializer
    pagination_class = None
    queryset = Division.objects.order_by("name")


class DistrictListView(generics.ListCreateAPIView):
    """Districts with their counts; operators add new ones (optionally with a boundary)."""

    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        return with_boundary_flag(District.objects.select_related("division")).annotate(
            thana_count=count_of(Thana, district=OuterRef("pk")),
            incident_count=count_of(Incident, district=OuterRef("pk")),
            volunteer_count=count_of(Volunteer, district=OuterRef("pk")),
        ).order_by("name")

    def get_serializer_class(self):
        return DistrictRowSerializer if self.request.method == "GET" else DistrictSerializer

    @swagger_auto_schema(request_body=DistrictSerializer, responses={201: DistrictSerializer, 400: "Invalid"})
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class DistrictDetailView(generics.RetrieveUpdateDestroyAPIView):
    """One district with its boundary. Deleting is refused (409) while incidents, volunteers or events use it."""

    permission_classes = [IsAdminUser]
    serializer_class = DistrictSerializer
    queryset = District.objects.select_related("division")
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def destroy(self, request, *args, **kwargs):
        district = self.get_object()
        if district_in_use(district):
            return Response(
                {"detail": f"{district.name} is used by incidents, volunteers or events, so it can't be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
        district.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ThanaListView(generics.ListCreateAPIView):
    """Thanas (optionally of one district, ?district=id) with their counts; operators add new ones."""

    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        thanas = with_boundary_flag(Thana.objects.select_related("district")).annotate(
            incident_count=count_of(Incident, thana=OuterRef("pk")),
            volunteer_count=count_of(Volunteer, thana=OuterRef("pk")),
        ).order_by("name")
        district = self.request.query_params.get("district")
        if district is None:
            return thanas
        if not district.isdigit():
            raise ValidationError({"district": ["Use a district id."]})
        return thanas.filter(district_id=int(district))

    def get_serializer_class(self):
        return ThanaRowSerializer if self.request.method == "GET" else ThanaSerializer

    @swagger_auto_schema(request_body=ThanaSerializer, responses={201: ThanaSerializer, 400: "Invalid"})
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ThanaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """One thana with its boundary. Deleting is refused (409) while incidents or volunteers use it."""

    permission_classes = [IsAdminUser]
    serializer_class = ThanaSerializer
    queryset = Thana.objects.select_related("district")
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def destroy(self, request, *args, **kwargs):
        thana = self.get_object()
        if thana_in_use(thana):
            return Response(
                {"detail": f"{thana.name} is used by incidents or volunteers, so it can't be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
        thana.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
