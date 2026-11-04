from django.db.models import Count, Q
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import VolunteerFilter
from .models import Volunteer
from .serializers import VolunteerSerializer

FILTER_PARAMS = [
    openapi.Parameter("active", openapi.IN_QUERY, type=openapi.TYPE_BOOLEAN),
    openapi.Parameter("district", openapi.IN_QUERY, type=openapi.TYPE_INTEGER),
    openapi.Parameter("thana", openapi.IN_QUERY, type=openapi.TYPE_INTEGER),
    openapi.Parameter("q", openapi.IN_QUERY, type=openapi.TYPE_STRING, description="Name, phone, address or area"),
]


class VolunteerListView(generics.ListAPIView):
    """Volunteers for operators (staff accounts): active and inactive, by name, or nearest first with ?near=lat,lng.

    Contains volunteers' phone numbers, so only operators may read it.
    """

    permission_classes = [IsAdminUser]
    serializer_class = VolunteerSerializer
    filterset_class = VolunteerFilter
    pagination_class = None
    queryset = (
        Volunteer.objects.select_related("district", "thana")
        .prefetch_related("skills")
        .annotate(assigned_incident_count=Count("assigned_incidents", distinct=True))
        .order_by("full_name", "id")
    )

    @swagger_auto_schema(
        operation_description="List volunteers (operators only)",
        manual_parameters=FILTER_PARAMS + [
            openapi.Parameter("near", openapi.IN_QUERY, type=openapi.TYPE_STRING,
                              description="lat,lng: nearest first, adds distance_km"),
        ],
        responses={200: VolunteerSerializer(many=True), 400: "Bad filter", 403: "Not an operator"},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class VolunteerSummaryView(APIView):
    """Active / Inactive / Total counts for the dashboard cards. The active filter is ignored."""

    permission_classes = [IsAdminUser]

    @swagger_auto_schema(
        operation_description="Counts of active, inactive and all volunteers (operators only)",
        manual_parameters=FILTER_PARAMS[1:],
        responses={200: "{active, inactive, total}", 400: "Bad filter", 403: "Not an operator"},
    )
    def get(self, request, *args, **kwargs):
        params = request.query_params.copy()
        for name in ("active", "near"):
            params.pop(name, None)
        volunteers = VolunteerFilter(params, queryset=Volunteer.objects.all())
        if not volunteers.is_valid():
            raise ValidationError(volunteers.errors)
        return Response(volunteers.qs.aggregate(
            active=Count("id", filter=Q(is_active=True)),
            inactive=Count("id", filter=Q(is_active=False)),
            total=Count("id"),
        ))
