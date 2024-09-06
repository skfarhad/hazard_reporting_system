from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import User
from apps.common.apis import CustomViewSet
from apps.common.serializers import get_paginated_serializer
from .serializers import ProfileSerializer


class ProfileViewSet(CustomViewSet):
    permission_classes = (IsAuthenticated,)
    ObjModel = User
    ObjSerializer = ProfileSerializer

    @swagger_auto_schema(
        operation_description="Get a User",
        responses={
            200: openapi.Response(
                description="", schema=ProfileSerializer
            ),
            400: "Bad Request - Invalid data",
        },
    )
    def retrieve(self, request, pk, format=None):
        return super().retrieve(request, pk, format=None)

    @swagger_auto_schema(
        operation_description="Get a list of Users",
        responses={
            200: openapi.Response(
                description="", schema=ProfileSerializer
            ),
            400: "Bad Request - Invalid data",
            403: "Forbidden - Invalid or missing API key",
        },
    )
    def list(self, request, format=None):
        return super().list(request, format=None)

    @swagger_auto_schema(
        operation_description="Create a new User",
        request_body=ProfileSerializer,
        responses={
            201: openapi.Response(
                description="User successfully created", schema=ProfileSerializer
            ),
            400: "Bad Request - Invalid data",
            403: "Forbidden - Invalid or missing API key",
        },
    )
    def create(self, request, format=None):
        return super().create(request, format=None)

    @swagger_auto_schema(
        operation_description="Update a User",
        request_body=ProfileSerializer,
        responses={
            200: openapi.Response(
                description="User successfully updated", schema=ProfileSerializer
            ),
            400: "Bad Request - Invalid data",
            403: "Forbidden - Invalid or missing API key",
        },
    )
    def partial_update(self, request, pk, format=None):
        return super().partial_update(request, pk, format=None)

    @swagger_auto_schema(
        operation_description="Delete a User",
        request_body=ProfileSerializer,
        responses={
            200: openapi.Response(
                description="User successfully deleted", schema=ProfileSerializer
            ),
            400: "Bad Request - Invalid data",
            403: "Forbidden - Invalid or missing API key",
        },
    )
    def destroy(self, request, pk, format=None):
        return super().destroy(request, pk, format=None)

    @swagger_auto_schema(
        operation_description="Get paginated user list",
        responses={
            201: openapi.Response(
                description="", schema=get_paginated_serializer(ProfileSerializer)
            ),
            400: "Bad Request - Invalid data",
            403: "Forbidden - Invalid or missing API key",
        },
    )
    @action(methods=['get'], detail=False)
    def paginated(self, request):
        return super().paginated(request)
