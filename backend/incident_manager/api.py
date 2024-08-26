from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_api_key.permissions import HasAPIKey
from .models import Incident, Provider
from .serializers import IncidentSerializer
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


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
        # Extract API key from Authorization header
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Api-Key "):
            api_key = auth_header.split("Api-Key ")[1]
        else:
            return Response(
                {"detail": "Invalid API key format."}, status=status.HTTP_403_FORBIDDEN
            )

        # Find the provider associated with the API key
        provider = get_object_or_404(Provider, api_key=api_key)

        # Deserialize the incoming data
        serializer = IncidentSerializer(data=request.data)
        if serializer.is_valid():
            # Save the incident with the associated provider
            serializer.save(provider=provider)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
