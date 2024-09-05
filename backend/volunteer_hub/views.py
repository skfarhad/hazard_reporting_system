from rest_framework.views import APIView
from django.contrib.gis.db.models.functions import Distance
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.postgres.search import SearchVector
from django.db import models
from django.db.models import Q
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from .models import Volunteer, VolunteerTeam
from .serializers import VolunteerSerializer, VolunteerTeamSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class VolunteerListView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Retrieve a list of active volunteers with optional filtering and searching.",
        manual_parameters=[
            openapi.Parameter(
                'thana', openapi.IN_QUERY, description="Filter by Thana ID", type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                'district', openapi.IN_QUERY, description="Filter by District ID", type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                'address', openapi.IN_QUERY, description="Full-text search on address", type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'latitude', openapi.IN_QUERY, description="Latitude for geospatial search", type=openapi.TYPE_NUMBER
            ),
            openapi.Parameter(
                'longitude', openapi.IN_QUERY, description="Longitude for geospatial search", type=openapi.TYPE_NUMBER
            ),
        ],
        responses={200: VolunteerSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        volunteers = Volunteer.objects.filter(is_active=True)

        # Filtering by Thana and District
        thana_id = request.query_params.get('thana')
        district_id = request.query_params.get('district')

        if thana_id:
            volunteers = volunteers.filter(thana_id=thana_id)
        if district_id:
            volunteers = volunteers.filter(district_id=district_id)

        address_query = request.query_params.get('address')
        if address_query:
            volunteers = volunteers.filter(
                address__icontains=address_query
            ).distinct()

        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        if latitude and longitude:
            user_location = Point(float(longitude), float(latitude), srid=4326)
            volunteers = volunteers.filter(
                location__distance_lte=(user_location, D(km=10)))

        serializer = VolunteerSerializer(volunteers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class VolunteerTeamListView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Retrieve a list of volunteer Teams with optional filtering and searching.",
        manual_parameters=[
            openapi.Parameter(
                'thana', openapi.IN_QUERY, description="Filter by Thana ID", type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                'district', openapi.IN_QUERY, description="Filter by District ID", type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                'address', openapi.IN_QUERY, description="Full-text search on volunteer addresses", type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'latitude', openapi.IN_QUERY, description="Latitude for geospatial search", type=openapi.TYPE_NUMBER
            ),
            openapi.Parameter(
                'longitude', openapi.IN_QUERY, description="Longitude for geospatial search", type=openapi.TYPE_NUMBER
            )
        ],
        responses={200: VolunteerTeamSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        queryset = VolunteerTeam.objects.all()

        # Filtering by district and thana using members' data
        district_id = request.query_params.get('district')
        thana_id = request.query_params.get('thana')
        if district_id:
            queryset = queryset.filter(
                models.Q(members__district_id=district_id) |
                models.Q(team_leader__district_id=district_id)
            ).distinct()
        if thana_id:
            queryset = queryset.filter(
                members__thana_id=thana_id
            ).distinct()
            queryset = queryset.filter(
                models.Q(members__thana_id=thana_id) |
                models.Q(team_leader__thana_id=thana_id)
            ).distinct()

        # Full-text search on address for both team_leader and members
        address_query = request.query_params.get('address')
        if address_query:
            queryset = queryset.filter(
                models.Q(team_leader__address__icontains=address_query) |
                models.Q(members__address__icontains=address_query)
            ).distinct()

        # Geospatial search by latitude and longitude (for nearby team members)
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        if latitude and longitude:
            point = Point(float(longitude), float(latitude), srid=4326)
            queryset = queryset.filter(
                models.Q(team_leader__location__distance_lt=(point, D(km=10))) |
                models.Q(members__location__distance_lt=(point, D(km=10)))
            ).distinct()

        serializer = VolunteerTeamSerializer(queryset, many=True)
        return Response(serializer.data)
