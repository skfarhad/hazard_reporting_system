from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework_api_key.permissions import HasAPIKey
# from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.measure import D
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Incident, Provider
from .serializers import IncidentSerializer
from django.shortcuts import get_object_or_404
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging



logger = logging.getLogger(__name__)

class IncidentCreateView(APIView):
    permission_classes = [HasAPIKey]

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
    
    
@method_decorator(csrf_exempt, name='dispatch')
class SearchFilterIncidentAPIView(APIView):
    permission_classes = [HasAPIKey]
    
    def post(self, request):
        try:
            district = request.data.get('district')
            thana    = request.data.get('thana')
            address  = request.data.get('address')
            lat      = request.data.get('latitude')
            lon      = request.data.get('longitude')

            queryset = Incident.objects.all()

            if district:
                queryset = queryset.filter(thana__district__name__exact=district)
            if thana:
                queryset = queryset.filter(thana__name__exact=thana)

            if address:
                # Search by address using full-text search
                search_vector = SearchVector('address')
                search_query = SearchQuery(address)
                queryset = queryset.annotate(search=search_vector).filter(search=search_query)

            if lat and lon:
                # Search by latitude and longitude
                try:
                    latitude  = float(lat)
                    longitude = float(lon)
                    point = Point(longitude, latitude, srid=4326)
                    queryset = queryset.filter(location__distance_lte=(point, D(km=10)))  # example: within 10 km
                except ValueError:
                    return Response(
                        {"error": "Invalid latitude or longitude values."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            serializer = IncidentSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            return Response(
                {"error": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    
# class IncidentListSearch(generics.ListAPIView):
#     queryset = Incident.objects.all()
#     serializer_class = IncidentSerializer
#     filter_backends = [DjangoFilterBackend]
#     filterset_fields = ['thana__district', 'thana', 'address']