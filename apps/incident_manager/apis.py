from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.volunteer_hub.models import Volunteer

from .constants import IncidentStatus, TaskStatus
from .filters import IncidentFilter
from .models import District, Incident, NeedType, Provider, Thana
from .pagination import IncidentPagination
from .serializers import (
    DistrictOptionSerializer, IncidentDetailSerializer, IncidentListSerializer, IncidentOperatorSerializer,
    IncidentReportSerializer, IncidentSerializer, NeedTypeSerializer, VolunteerAssignmentSerializer,
)


class IncidentCreateView(APIView):
    permission_classes = [HasAPIKey]
    authentication_classes = []

    @swagger_auto_schema(
        operation_description="Create a new incident",
        request_body=IncidentSerializer,
        responses={
            201: openapi.Response(
                description="Incident successfully created", schema=IncidentSerializer
            ),
            400: "Bad Request - Invalid data",
            403: "Forbidden - Invalid or missing API key",
        },
        security=[{"Api-Key": []}],
        manual_parameters=[
            openapi.Parameter(
                "Authorization",
                openapi.IN_HEADER,
                description="API key in the format: 'Api-Key <your_api_key>'",
                type=openapi.TYPE_STRING,
                required=True,
            )
        ],
    )
    def post(self, request, *args, **kwargs):
        """
        Create a new incident associated with the provider.

        This endpoint allows a provider to create a new incident in the system. The provider must
        be authenticated using an API key, which should be included in the Authorization header
        in the format 'Api-Key <your_api_key>'.

        **Request Body Parameters:**

        - `contact_number`: The contact number for the incident.
        - `latitude`: Latitude of the incident location.
        - `longitude`: Longitude of the incident location.
        - `description`: A brief description of the incident.
        - `additional_info`: Any additional information in JSON format.
        - `status`: The current status of the incident.
        - `address`: The address where the incident occurred.

        **Responses:**

        - `201`: Incident successfully created.
        - `400`: Invalid data provided.
        - `403`: Invalid or missing API key.
        """
        api_key = self.get_api_key(request)
        if not api_key:
            return Response(
                {"detail": "Invalid API key format."}, status=status.HTTP_403_FORBIDDEN
            )

        provider = get_object_or_404(Provider, api_key=api_key)
        serializer = IncidentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(provider=provider)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_api_key(self, request):
        """
        Extracts the API key from the Authorization header.

        Returns:
            str or None: The API key if present and valid, else None.
        """
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Api-Key "):
            return auth_header.split("Api-Key ")[1]
        return None


class IncidentReportThrottle(UserRateThrottle):
    """Limits web reports per account (rate `incident_report`); operators logging calls are exempt."""

    scope = "incident_report"

    def allow_request(self, request, view):
        if request.user and request.user.is_staff:
            return True
        return super().allow_request(request, view)


class IncidentReportView(generics.CreateAPIView):
    """Anyone signed in reports an incident from the web app. It waits for staff review (pending)."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [IncidentReportThrottle]
    serializer_class = IncidentReportSerializer

    @swagger_auto_schema(
        operation_description="Report an incident from the web app (any signed-in user). Always created as pending.",
        request_body=IncidentReportSerializer,
        responses={201: "{id, validation_status, created_at}", 400: "Invalid data", 401: "Not signed in",
                   429: "Too many reports (non-operators)"},
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class IncidentListView(generics.ListAPIView):
    """Incidents for operators (staff accounts), newest first, 25 per page. Contains reporters' phone numbers."""

    permission_classes = [IsAdminUser]
    serializer_class = IncidentListSerializer
    pagination_class = IncidentPagination
    filterset_class = IncidentFilter
    queryset = (
        Incident.objects.select_related("event__hazard", "district", "thana")
        .prefetch_related("needs")
        .annotate(volunteer_count=Count("volunteers", distinct=True))
        .order_by("-created_at", "-id")
    )

    @swagger_auto_schema(
        operation_description="List incidents, newest first, paginated (page, page_size up to 500)",
        responses={200: IncidentListSerializer(many=True), 401: "Not signed in", 403: "Not an operator"},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class IncidentSummaryView(APIView):
    """Pending / Resolved / Total counts for the dashboard cards, over the list's filters.

    The status filters are ignored, so each card keeps its own count whichever card is selected.
    """

    permission_classes = [IsAdminUser]
    IGNORED_FILTERS = ("status", "task_status")

    @swagger_auto_schema(
        operation_description="Counts of pending, resolved (task closed) and all incidents for the given filters",
        responses={200: "{pending, resolved, total}", 400: "Bad filter", 403: "Not an operator"},
    )
    def get(self, request, *args, **kwargs):
        params = request.query_params.copy()
        for name in self.IGNORED_FILTERS:
            params.pop(name, None)
        incidents = IncidentFilter(params, queryset=Incident.objects.all())
        if not incidents.is_valid():
            raise ValidationError(incidents.errors)
        return Response(incidents.qs.aggregate(
            pending=Count("id", filter=Q(validation_status=IncidentStatus.PENDING.value)),
            resolved=Count("id", filter=Q(task_status=TaskStatus.CLOSED.value)),
            total=Count("id"),
        ))


def incident_details(request, pk):
    """The details shape for one incident, with its volunteers (by name) and their count."""
    incident = get_object_or_404(
        Incident.objects.select_related("event__hazard", "district", "thana", "provider", "reported_by")
        .prefetch_related("needs", Prefetch("volunteers", queryset=Volunteer.objects.order_by("full_name", "id")))
        .annotate(volunteer_count=Count("volunteers", distinct=True)),
        pk=pk,
    )
    return IncidentDetailSerializer(incident, context={"request": request}).data


class IncidentDetailView(APIView):
    """Operators read one incident, and validate, reject or update it.

    Saves through the model instance so the pre_save signal still queues the SMS task
    when an incident becomes validated.
    """

    permission_classes = [IsAdminUser]

    @swagger_auto_schema(
        operation_description="One incident with its needs, event, places, provider and volunteers (operators only)",
        responses={200: IncidentDetailSerializer, 403: "Not an operator", 404: "Not found"},
    )
    def get(self, request, pk, *args, **kwargs):
        return Response(incident_details(request, pk))

    @swagger_auto_schema(
        operation_description="Update an incident's validation or task status (operators only)",
        request_body=IncidentOperatorSerializer,
        responses={200: IncidentDetailSerializer, 400: "Invalid data", 403: "Not an operator", 404: "Not found"},
    )
    def patch(self, request, pk, *args, **kwargs):
        incident = get_object_or_404(Incident, pk=pk)
        serializer = IncidentOperatorSerializer(incident, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(incident_details(request, pk))


class IncidentVolunteersView(APIView):
    """Operators assign one more volunteer to an incident. Assigning someone twice changes nothing."""

    permission_classes = [IsAdminUser]

    @swagger_auto_schema(
        request_body=VolunteerAssignmentSerializer,
        responses={200: "{volunteer_count}", 400: "Unknown volunteer", 403: "Not an operator", 404: "Not found"},
    )
    def post(self, request, pk, *args, **kwargs):
        incident = get_object_or_404(Incident, pk=pk)
        serializer = VolunteerAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incident.volunteers.add(serializer.validated_data["volunteer"])
        return Response({"volunteer_count": incident.volunteers.count()})


class IncidentVolunteerView(APIView):
    """Operators unassign one volunteer from an incident."""

    permission_classes = [IsAdminUser]

    @swagger_auto_schema(responses={204: "Unassigned", 403: "Not an operator", 404: "Not assigned"})
    def delete(self, request, pk, volunteer_id, *args, **kwargs):
        incident = get_object_or_404(Incident, pk=pk)
        assigned = get_object_or_404(incident.volunteers, pk=volunteer_id)
        incident.volunteers.remove(assigned)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NeedTypeListView(APIView):
    """Active need types, with labels in both languages. Any signed-in user (the report form uses them)."""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="List active need types (any signed-in user)",
        responses={200: NeedTypeSerializer(many=True), 401: "Not signed in"},
    )
    def get(self, request, *args, **kwargs):
        return Response(NeedTypeSerializer(NeedType.objects.filter(is_active=True), many=True).data)


class PlaceListView(APIView):
    """Districts with their thanas, by name, for the report form (any signed-in user)."""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Districts with their thanas, for the report form",
        responses={200: DistrictOptionSerializer(many=True), 401: "Not signed in"},
    )
    def get(self, request, *args, **kwargs):
        districts = District.objects.order_by("name").prefetch_related(
            Prefetch("thanas", queryset=Thana.objects.order_by("name").only("id", "name", "district_id")),
        ).only("id", "name")
        return Response(DistrictOptionSerializer(districts, many=True).data)
