from rest_framework.views import APIView
from rest_framework import viewsets, filters
from rest_framework_gis.filters import DistanceToPointFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, SAFE_METHODS
from django.contrib.postgres.search import SearchVector
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from .models import Volunteer
from .serializers import VolunteerSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class VolunteerListView(APIView):
    permission_classes = [AllowAny]  # Allow any user to access this view

    @swagger_auto_schema(
        operation_description="Retrieve a list of active volunteers",
        responses={200: VolunteerSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        volunteers = Volunteer.objects.filter(is_active=True)
        serializer = VolunteerSerializer(volunteers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class VolunteerViewSet(viewsets.ModelViewSet):
    queryset = Volunteer.objects.all()
    serializer_class = VolunteerSerializer
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, DistanceToPointFilter]
    # Assuming thana__district is the relation to District
    filterset_fields = ['thana', 'thana__district']

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Full-text search on address
        address_query = self.request.query_params.get('address', None)
        if address_query:
            queryset = queryset.annotate(search=SearchVector(
                'address')).filter(search=address_query)

        # Geo-spatial filtering based on lat/lon
        lat = self.request.query_params.get('latitude', None)
        lon = self.request.query_params.get('longitude', None)
        if lat and lon:
            point = Point(float(lon), float(lat))
            print(point)
            queryset = queryset.filter(location__distance_lte=(
                point, D(km=1)))  # Filter within 1km radius

        return queryset
