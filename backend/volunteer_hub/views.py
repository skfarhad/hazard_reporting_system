from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
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
