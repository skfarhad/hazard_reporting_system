from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_api_key.permissions import HasAPIKey
from .models import Incident, Provider
from .serializers import IncidentSerializer
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class IncidentApiView(APIView):
    def get(request, id=None):
        if id:
            try:
                incident = Incident.objects.get(id=id)
                serializer = IncidentSerializer(incident)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Incident.DoesNotExist:
                return Response({'error': 'Incident not found'}, status=status.HTTP_400_BAD_REQUEST)
        incidents = Incident.objects.all()
        serializer = IncidentSerializer(incidents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
